/**
 * Fast generation path: fetch a handful of the prospect's public pages, read
 * the brand tokens from their homepage, then ask one LLM call for the page
 * *content* only. The existing generator renders the HTML, so layout, styling,
 * and the ROI calculator are never model output.
 */
import { generateMicrosite } from '../src/generator';
import { extractThemeFromHtml } from '../src/generator/theme';
import type { MicrositeInput, PasswordGate } from '../src/generator/types';
import { validateInput } from '../src/generator/validate';
import type { IntakeSubmission } from '../src/intake';
import { PRICING_ANCHORS, PROOF_POINTS, guessIndustry } from './research';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODELS = {
  gemini: 'gemini-3.6-flash',
  anthropic: 'claude-sonnet-4-5',
} as const;
const PAGE_FETCH_TIMEOUT_MS = 8000;
const LLM_TIMEOUT_MS = 120000;
const MAX_PAGE_CHARS = 6000;
const MAX_EXTRA_PAGES = 3;

const PAGE_HINTS: Array<{ kind: string; pattern: RegExp }> = [
  { kind: 'about', pattern: /\/(about|about-us|company|who-we-are)(\/|$|\?)/i },
  { kind: 'news', pattern: /\/(news|press|newsroom|blog|insights)(\/|$|\?)/i },
  { kind: 'careers', pattern: /\/(careers|jobs|join-us|work-with-us)(\/|$|\?)/i },
];

export interface FetchedPage {
  kind: string;
  url: string;
  text: string;
}

const withTimeout = async (url: string, timeoutMs: number): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DevinMicrositeBot/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) throw new Error(`${url} responded ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
};

/** Strips markup and scripts so only human-readable copy reaches the model. */
export function htmlToText(html: string, maxChars = MAX_PAGE_CHARS): string {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars);
}

/** Picks up to one about/news/careers link from the homepage markup. */
export function discoverPages(homepageHtml: string, baseUrl: string): Array<{ kind: string; url: string }> {
  const hrefs = new Set<string>();
  for (const match of homepageHtml.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    hrefs.add(match[1]);
  }
  const found: Array<{ kind: string; url: string }> = [];
  for (const { kind, pattern } of PAGE_HINTS) {
    for (const href of hrefs) {
      let absolute: URL;
      try {
        absolute = new URL(href, baseUrl);
      } catch {
        continue;
      }
      if (absolute.origin !== new URL(baseUrl).origin) continue;
      if (!pattern.test(absolute.pathname)) continue;
      found.push({ kind, url: absolute.toString() });
      break;
    }
    if (found.length >= MAX_EXTRA_PAGES) break;
  }
  return found;
}

async function fetchProspectPages(websiteUrl: string): Promise<{ homepageHtml: string; pages: FetchedPage[] }> {
  const homepageHtml = await withTimeout(websiteUrl, PAGE_FETCH_TIMEOUT_MS);
  const targets = discoverPages(homepageHtml, websiteUrl);
  const extras = await Promise.all(
    targets.map(async ({ kind, url }) => {
      try {
        return { kind, url, text: htmlToText(await withTimeout(url, PAGE_FETCH_TIMEOUT_MS)) };
      } catch {
        return null;
      }
    }),
  );
  return {
    homepageHtml,
    pages: [
      { kind: 'homepage', url: websiteUrl, text: htmlToText(homepageHtml) },
      ...extras.filter((page): page is FetchedPage => page !== null),
    ],
  };
}

/** Proof points the generator accepts (devin.ai-sourced), industry first. */
export function selectProofPoints(companyName: string, websiteUrl: string, limit = 3) {
  const eligible = PROOF_POINTS.filter((point) => /^https:\/\/(www\.)?devin\.ai\//.test(point.source));
  const industry = guessIndustry(companyName, websiteUrl);
  const matching = industry ? eligible.filter((point) => point.industry === industry) : [];
  const rest = eligible.filter((point) => !matching.includes(point));
  return [...matching, ...rest].slice(0, limit);
}

export function buildContentPrompt(
  submission: IntakeSubmission,
  pages: FetchedPage[],
  proofPoints: ReturnType<typeof selectProofPoints>,
): string {
  const sources = pages.map((page) => `### ${page.kind} — ${page.url}\n${page.text}`).join('\n\n');
  const proof = proofPoints
    .map((point) => `- ${point.customer} (${point.industry}): ${point.result} [${point.source}]`)
    .join('\n');
  const context = [
    submission.role ? `Prospect role: ${submission.role}` : null,
    submission.useCase ? `Use case they described: ${submission.useCase}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `You are writing the content for a one-page microsite that argues why ${submission.companyName} should adopt Devin, Cognition's autonomous AI software engineer.

${context}

Use ONLY the page text below for claims about ${submission.companyName}. Every claim must cite one of these exact URLs — never invent a URL, statistic, quote, or customer. If the pages do not support a claim, leave it out rather than guessing.

## Prospect pages
${sources}

## Devin proof points you may cite (use these verbatim, with these source URLs)
${proof}

## Devin pricing (for ROI defaults)
${PRICING_ANCHORS.notes.join('\n')}
Source: ${PRICING_ANCHORS.source}

Return ONLY a JSON object (no markdown fence, no commentary) matching this shape:
{
  "company": { "name": string, "websiteUrl": string, "descriptor": string, "industry": string },
  "whyDevin": { "summary": string, "points": [{ "text": string, "source": { "label": string, "url": string } }] },
  "whyNow": { "summary": string, "signals": [{ "text": string, "source": { "label": string, "url": string } }] },
  "priorities": [{ "priority": string, "devinAngle": string, "source": { "label": string, "url": string } }],
  "proofPoints": [{ "customer": string, "headline": string, "relevance": string, "source": { "label": string, "url": string } }],
  "roiDefaults": { "engineers": number, "avgSalary": number, "toilPercent": number, "automationPercent": number, "devinAnnualCost": number },
  "contact": { "headline": string, "body": string, "buttonLabel": string, "buttonUrl": "https://cognition.com/contact" }
}

Requirements:
- 3 whyDevin points, 2-3 whyNow signals, 3 priorities, and one proofPoints entry per proof point above (same customer and source URL).
- whyNow signals must come from the prospect's own pages (news, hiring, product launches, migrations) — this is why the timing matters for them specifically.
- priorities must be things ${submission.companyName} publicly cares about, each mapped to concrete Devin work (migrations, test coverage, backlog burn-down, refactors, on-call toil).
- roiDefaults: infer a defensible engineer count from the pages (default 200 if there is no signal), avgSalary 180000, toilPercent 30, automationPercent 40, and devinAnnualCost derived from the pricing above for that engineer count.
- Write in the prospect's own vocabulary, second person, no hype, no em dashes.`;
}

export type LlmProvider = keyof typeof DEFAULT_MODELS;

async function callGemini(prompt: string, apiKey: string, model: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetch(`${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192 },
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Gemini API ${res.status}: ${text.slice(0, 500)}`);
    const body = JSON.parse(text) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const out = (body.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? '')
      .join('');
    if (!out.trim()) throw new Error('Gemini API returned no text content.');
    return out;
  } finally {
    clearTimeout(timer);
  }
}

async function callClaude(prompt: string, apiKey: string, model: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 500)}`);
    const body = JSON.parse(text) as { content?: Array<{ type?: string; text?: string }> };
    const out = (body.content ?? [])
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text)
      .join('');
    if (!out.trim()) throw new Error('Anthropic API returned no text content.');
    return out;
  } finally {
    clearTimeout(timer);
  }
}

export function parseContentJson(raw: string): Partial<MicrositeInput> {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : raw).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Model response did not contain a JSON object.');
  return JSON.parse(candidate.slice(start, end + 1)) as Partial<MicrositeInput>;
}

export interface FastGenerateOptions {
  provider: LlmProvider;
  apiKey: string;
  model?: string;
}

/** Runs the whole fast path and returns the rendered, ungated microsite. */
export async function generateFastMicrosite(
  submission: IntakeSubmission & { passwordGate?: PasswordGate },
  { provider, apiKey, model = DEFAULT_MODELS[provider] }: FastGenerateOptions,
): Promise<string> {
  const { homepageHtml, pages } = await fetchProspectPages(submission.websiteUrl);
  const proofPoints = selectProofPoints(submission.companyName, submission.websiteUrl);
  const prompt = buildContentPrompt(submission, pages, proofPoints);
  const raw =
    provider === 'gemini'
      ? await callGemini(prompt, apiKey, model)
      : await callClaude(prompt, apiKey, model);
  const content = parseContentJson(raw);

  const input: MicrositeInput = {
    ...(content as MicrositeInput),
    company: {
      ...(content.company ?? { name: submission.companyName, websiteUrl: submission.websiteUrl }),
      name: submission.companyName,
      websiteUrl: submission.websiteUrl,
      prospectRole: submission.role,
      useCase: submission.useCase,
    },
    theme: extractThemeFromHtml(homepageHtml, submission.websiteUrl),
    generatedAt: new Date().toISOString(),
  };

  const errors = validateInput(input);
  if (errors.length) throw new Error(`Generated content was incomplete: ${errors.join('; ')}`);
  return generateMicrosite(input);
}
