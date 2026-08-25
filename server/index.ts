import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import 'dotenv/config';
import express, { type Request, type Response } from 'express';

import { wrapWithGate } from '../src/gate';
import { escapeHtml } from '../src/generator/escape';
import { generateMicrosite } from '../src/generator';
import { createPasswordGate } from '../src/generator/passwordGate';
import { extractThemeFromHtml } from '../src/generator/theme';
import type { MicrositeInput, PasswordGate } from '../src/generator/types';
import { renderIntakeApp } from '../src/intake';
import type { IntakeSubmission } from '../src/intake';
import { generateFastMicrosite, type LlmProvider } from './fastGenerate';
import { buildResearchPrompt } from './prompt';

const PORT = Number(process.env.PORT || 3001);
const DEVIN_API_BASE_URL = (process.env.DEVIN_API_BASE_URL || 'https://api.devin.ai/v3').replace(/\/$/, '');
const DEVIN_API_KEY = process.env.DEVIN_API_KEY;
const DEVIN_ORG_ID = process.env.DEVIN_ORG_ID;
const MAX_ACU_LIMIT = Number(process.env.DEVIN_MAX_ACU_LIMIT || 5);
const MAX_WAIT_SECONDS = Number(process.env.MAX_WAIT_SECONDS || 900);
const DEMO_MODE = process.env.DEMO_MODE === '1';
const DEMO_DELAY_MS = Number(process.env.DEMO_DELAY_MS || 20000);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL;
/** Fast path: one LLM call instead of a Devin session. Seconds, not minutes. */
const FAST_MODE = process.env.FAST_MODE === '1';

const llmCredentials = (): { provider: LlmProvider; apiKey: string } | null => {
  if (GEMINI_API_KEY) return { provider: 'gemini', apiKey: GEMINI_API_KEY };
  if (ANTHROPIC_API_KEY) return { provider: 'anthropic', apiKey: ANTHROPIC_API_KEY };
  return null;
};

const HTML_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    html: {
      type: 'string',
      description: 'The complete, self-contained HTML document.',
    },
  },
  required: ['html'],
  additionalProperties: false,
};

interface DevinResponse {
  session_id?: string;
  status?: string;
  status_detail?: string | null;
  url?: string | null;
  structured_output?: {
    html?: unknown;
  };
}

interface SessionRecord {
  companyName: string;
  websiteUrl: string;
  passwordGate: PasswordGate;
  html: string | null;
  sessionUrl: string | null;
  createdAt: number;
  demoReadyAt?: number;
  status?: string;
  statusDetail?: string | null;
  /** Generated locally (fast path), so polling must not call the Devin API. */
  local?: boolean;
  error?: string;
}

const sessions = new Map<string, SessionRecord>();

const withPrefix = (sessionId: string): string =>
  sessionId.startsWith('devin-') ? sessionId : `devin-${sessionId}`;

const routeParam = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] || '' : value;

const devinFetch = async (path: string, init: RequestInit = {}): Promise<DevinResponse> => {
  const res = await fetch(`${DEVIN_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${DEVIN_API_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body: DevinResponse = {};
  try {
    body = text ? (JSON.parse(text) as DevinResponse) : {};
  } catch {
    body = {};
  }
  if (!res.ok) {
    const error = new Error(`Devin API ${res.status}: ${text.slice(0, 500)}`) as Error & {
      status?: number;
    };
    error.status = res.status;
    throw error;
  }
  return body;
};

const missingConfig = (): string | null => {
  if (FAST_MODE) {
    return llmCredentials() ? null : 'FAST_MODE needs GEMINI_API_KEY or ANTHROPIC_API_KEY.';
  }
  if (!DEVIN_API_KEY) return 'DEVIN_API_KEY is not configured on the server.';
  if (!DEVIN_ORG_ID) return 'DEVIN_ORG_ID is not configured on the server.';
  return null;
};

function validateSubmission(body: unknown): { submission?: IntakeSubmission; error?: string } {
  if (!body || typeof body !== 'object') return { error: 'Request body must be an object.' };
  const value = body as Record<string, unknown>;
  if (typeof value.companyName !== 'string' || !value.companyName.trim()) {
    return { error: 'companyName is required.' };
  }
  if (typeof value.websiteUrl !== 'string' || !value.websiteUrl.trim()) {
    return { error: 'websiteUrl is required.' };
  }
  let website: URL;
  try {
    website = new URL(value.websiteUrl);
  } catch {
    return { error: 'websiteUrl must be a valid http(s) URL.' };
  }
  if (website.protocol !== 'http:' && website.protocol !== 'https:') {
    return { error: 'websiteUrl must be a valid http(s) URL.' };
  }
  const gate = value.passwordGate;
  if (
    !gate ||
    typeof gate !== 'object' ||
    typeof (gate as Record<string, unknown>).salt !== 'string' ||
    typeof (gate as Record<string, unknown>).hash !== 'string' ||
    !/^[0-9a-f]+$/i.test((gate as Record<string, string>).salt) ||
    !/^[0-9a-f]+$/i.test((gate as Record<string, string>).hash)
  ) {
    return { error: 'passwordGate.salt and passwordGate.hash must be hexadecimal strings.' };
  }
  if ((gate as Record<string, string>).hash.length !== 64) {
    return { error: 'passwordGate.hash must be a 64-character SHA-256 digest.' };
  }

  return {
    submission: {
      companyName: value.companyName.trim(),
      websiteUrl: website.toString(),
      role: typeof value.role === 'string' && value.role.trim() ? value.role.trim() : undefined,
      useCase:
        typeof value.useCase === 'string' && value.useCase.trim() ? value.useCase.trim() : undefined,
      passwordGate: gate as PasswordGate,
      submittedAt: typeof value.submittedAt === 'string' ? value.submittedAt : new Date().toISOString(),
    },
  };
}

const ferrariPages: { gated: string | null; ungated: string | null } = {
  gated: null,
  ungated: null,
};

function getFerrariPage(gated: boolean): string {
  const cached = gated ? ferrariPages.gated : ferrariPages.ungated;
  if (cached) return cached;
  const root = fileURLToPath(new URL('..', import.meta.url));
  const input = JSON.parse(
    readFileSync(`${root}/examples/ferrari-input.json`, 'utf8'),
  ) as MicrositeInput;
  if (gated) input.passwordGate = createPasswordGate(process.env.DEMO_PASSWORD || 'ferrari123');
  input.theme = extractThemeFromHtml(
    readFileSync(`${root}/examples/ferrari-homepage.html`, 'utf8'),
    input.company.websiteUrl,
  );
  const page = generateMicrosite(input);
  if (gated) ferrariPages.gated = page;
  else ferrariPages.ungated = page;
  return page;
}

function sendError(res: Response, error: unknown): void {
  const status = typeof error === 'object' && error && 'status' in error
    ? Number((error as { status?: number }).status) || 500
    : 500;
  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  res.status(status).json({ error: message });
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.type('html').send(
    renderIntakeApp({
      endpoint: '/api/generate',
      statusEndpoint: '/api/sessions',
      maxWaitSeconds: MAX_WAIT_SECONDS,
    }),
  );
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: DEMO_MODE || !missingConfig(),
    mode: DEMO_MODE ? 'demo' : FAST_MODE ? 'fast' : 'devin',
    llmProvider: FAST_MODE ? llmCredentials()?.provider ?? null : null,
    baseUrl: DEVIN_API_BASE_URL,
    orgId: DEVIN_ORG_ID ?? null,
  });
});

app.post('/api/generate', async (req: Request, res: Response) => {
  const validation = validateSubmission(req.body);
  if (validation.error || !validation.submission) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const submission = validation.submission;
  const createdAt = Date.now();

  try {
    if (DEMO_MODE) {
      const sessionId = randomUUID();
      sessions.set(sessionId, {
        companyName: submission.companyName,
        websiteUrl: submission.websiteUrl,
        passwordGate: submission.passwordGate,
        html: getFerrariPage(false),
        sessionUrl: null,
        createdAt,
        demoReadyAt: createdAt + DEMO_DELAY_MS,
        status: 'working',
      });
      res.json({ sessionId, sessionUrl: null });
      return;
    }

    const configError = missingConfig();
    if (configError) {
      res.status(500).json({ error: configError });
      return;
    }

    if (FAST_MODE) {
      const credentials = llmCredentials();
      if (!credentials) throw new Error('No LLM API key is configured.');
      const sessionId = randomUUID();
      const record: SessionRecord = {
        companyName: submission.companyName,
        websiteUrl: submission.websiteUrl,
        passwordGate: submission.passwordGate,
        html: null,
        sessionUrl: null,
        createdAt,
        status: 'working',
        local: true,
      };
      sessions.set(sessionId, record);
      void generateFastMicrosite(submission, { ...credentials, model: LLM_MODEL })
        .then((html) => {
          record.html = html;
          record.status = 'completed';
        })
        .catch((error: unknown) => {
          record.status = 'failed';
          record.error = error instanceof Error ? error.message : 'Generation failed.';
          console.error(`fast generation failed for ${submission.companyName}:`, error);
        });
      res.json({ sessionId, sessionUrl: null });
      return;
    }

    const session = await devinFetch(`/organizations/${DEVIN_ORG_ID}/sessions`, {
      method: 'POST',
      body: JSON.stringify({
        prompt: buildResearchPrompt(submission),
        title: `Microsite: ${submission.companyName}`,
        tags: ['html-generator'],
        unlisted: true,
        max_acu_limit: MAX_ACU_LIMIT,
        structured_output_schema: HTML_OUTPUT_SCHEMA,
      }),
    });
    if (!session.session_id) throw new Error('Devin API response did not include a session ID.');
    sessions.set(session.session_id, {
      companyName: submission.companyName,
      websiteUrl: submission.websiteUrl,
      passwordGate: submission.passwordGate,
      html: null,
      sessionUrl: session.url ?? null,
      createdAt,
    });
    res.json({ sessionId: session.session_id, sessionUrl: session.url ?? null });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/sessions/:sessionId', async (req: Request, res: Response) => {
  const requestedId = routeParam(req.params.sessionId);
  const record = sessions.get(requestedId) || sessions.get(withPrefix(requestedId));
  if (record?.demoReadyAt) {
    if (Date.now() >= record.demoReadyAt) {
      record.status = 'completed';
      res.json({ sessionId: requestedId, status: record.status, ready: true, url: `/pages/${requestedId}` });
    } else {
      res.json({ sessionId: requestedId, status: record.status || 'working', ready: false });
    }
    return;
  }

  if (record?.local) {
    if (record.status === 'failed') {
      res.json({ sessionId: requestedId, status: 'failed', ready: false, error: record.error });
    } else if (record.html) {
      res.json({ sessionId: requestedId, status: 'completed', ready: true, url: `/pages/${requestedId}` });
    } else {
      res.json({ sessionId: requestedId, status: record.status || 'working', ready: false });
    }
    return;
  }

  const configError = missingConfig();
  if (configError) {
    res.status(500).json({ error: configError });
    return;
  }
  try {
    const sessionId = withPrefix(requestedId);
    const session = await devinFetch(
      `/organizations/${DEVIN_ORG_ID}/sessions/${encodeURIComponent(sessionId)}`,
    );
    const html = typeof session.structured_output?.html === 'string' ? session.structured_output.html : '';
    if (record && html.trim()) record.html = html;
    if (record) {
      record.status = session.status;
      record.statusDetail = session.status_detail ?? null;
      record.sessionUrl = session.url ?? record.sessionUrl;
    }
    if (record?.html) {
      res.json({ sessionId: requestedId, status: session.status, ready: true, url: `/pages/${requestedId}` });
    } else {
      res.json({ sessionId: requestedId, status: session.status, ready: false });
    }
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/pages/:sessionId', (req, res) => {
  const id = routeParam(req.params.sessionId);
  const record = sessions.get(id) || sessions.get(withPrefix(id));
  if (record?.status === 'failed') {
    res.status(500).type('html').send(
      `<!doctype html><title>Build failed</title><p>This build failed: ${escapeHtml(record.error ?? 'unknown error')}</p>`,
    );
    return;
  }
  if (!record || !record.html || (record.demoReadyAt && Date.now() < record.demoReadyAt)) {
    res.status(404).type('html').send(
      '<!doctype html><title>Page not ready</title><p>This page is not ready or no longer exists.</p>',
    );
    return;
  }
  res.type('html').send(
    wrapWithGate(record.html, record.passwordGate, `Why Devin is fundamental for ${record.companyName}`),
  );
});

app.get('/demo/ferrari', (_req, res) => {
  res.type('html').send(getFerrariPage(true));
});

app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT} (Devin API: ${DEVIN_API_BASE_URL})`);
});
