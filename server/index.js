import cors from 'cors';
import 'dotenv/config';
import express from 'express';

const PORT = process.env.PORT || 3001;
const DEVIN_API_BASE_URL = (process.env.DEVIN_API_BASE_URL || 'https://api.devin.ai/v3').replace(/\/$/, '');
const DEVIN_API_KEY = process.env.DEVIN_API_KEY;
const DEVIN_ORG_ID = process.env.DEVIN_ORG_ID;
const MAX_ACU_LIMIT = Number(process.env.DEVIN_MAX_ACU_LIMIT || 5);

const HTML_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    html: {
      type: 'string',
      description: 'The complete, self-contained HTML document.'
    }
  },
  required: ['html'],
  additionalProperties: false
};

const PROMPT = `Create a single self-contained HTML file (inline CSS only, no external assets) that is a simple
one-page "Hello from Devin" report with a heading, a short paragraph, and today's date.

Do NOT clone any repository and do NOT create a pull request. Write the file to /home/ubuntu/output.html,
then finish by reporting the full HTML document as your structured output under the key "html".`;

const withPrefix = (sessionId) => (sessionId.startsWith('devin-') ? sessionId : `devin-${sessionId}`);

const devinFetch = async (path, init = {}) => {
  const res = await fetch(`${DEVIN_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${DEVIN_API_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const error = new Error(`Devin API ${res.status}: ${text.slice(0, 500)}`);
    error.status = res.status;
    throw error;
  }
  return body;
};

const missingConfig = () => {
  if (!DEVIN_API_KEY) return 'DEVIN_API_KEY is not configured on the server.';
  if (!DEVIN_ORG_ID) return 'DEVIN_ORG_ID is not configured on the server.';
  return null;
};

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: !missingConfig(), baseUrl: DEVIN_API_BASE_URL, orgId: DEVIN_ORG_ID ?? null });
});

app.post('/api/generate', async (req, res) => {
  const configError = missingConfig();
  if (configError) return res.status(500).json({ error: configError });
  try {
    const session = await devinFetch(`/organizations/${DEVIN_ORG_ID}/sessions`, {
      method: 'POST',
      body: JSON.stringify({
        prompt: PROMPT,
        title: 'HTML generator spike',
        tags: ['html-generator'],
        unlisted: true,
        max_acu_limit: MAX_ACU_LIMIT,
        structured_output_schema: HTML_OUTPUT_SCHEMA
      })
    });
    res.json({ sessionId: session.session_id, url: session.url });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.get('/api/sessions/:sessionId', async (req, res) => {
  const configError = missingConfig();
  if (configError) return res.status(500).json({ error: configError });
  try {
    const sessionId = withPrefix(req.params.sessionId);
    const session = await devinFetch(`/organizations/${DEVIN_ORG_ID}/sessions/${encodeURIComponent(sessionId)}`);
    const html = typeof session.structured_output?.html === 'string' ? session.structured_output.html : null;
    res.json({
      sessionId: session.session_id,
      status: session.status,
      statusDetail: session.status_detail ?? null,
      url: session.url ?? null,
      html
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT} (Devin API: ${DEVIN_API_BASE_URL})`);
});
