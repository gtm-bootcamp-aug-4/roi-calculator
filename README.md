# Devin prospect microsites

This app combines a cognition.com-styled intake experience with a Devin-powered
research workflow. A prospect submits their company, website, and a password;
the app starts a Devin session that researches public sources and returns one
complete HTML document for a private, password-gated results page. While Devin
works, the intake page shows a progress ring, page-building preview, and trivia
game.

## Run

```bash
cd server
npm install
cp .env.example .env
# Set DEVIN_API_KEY and DEVIN_ORG_ID in .env
npm run dev
```

Open <http://localhost:3001>.

The root package also contains the generator and its tests:

```bash
npm install
npm run typecheck
npm test
```

## Fast mode

A Devin session researches deeply but takes 10-20 minutes. `FAST_MODE=1` swaps it
for a single LLM call and finishes in about 30 seconds:

1. The server fetches the prospect homepage plus one about, news, and careers
   page, and strips them to text.
2. Brand tokens come from the homepage through the existing theme extractor.
3. One LLM call returns page *content* only (`MicrositeInput` JSON) with a
   source URL per claim, restricted to the fetched pages and the verified proof
   points in `server/research.ts`.
4. The existing generator renders the HTML, so layout, styling, and the ROI
   calculator are never model output, and `validateInput` rejects unsourced
   claims.

```bash
FAST_MODE=1 GEMINI_API_KEY=... npm run dev
```

Gemini is used when `GEMINI_API_KEY` is set (the free tier is enough), otherwise
`ANTHROPIC_API_KEY`. The default model is `gemini-3.1-flash-lite` (fastest of the
free models tried); override it with `LLM_MODEL`.

## Routes

- `GET /` — intake form, waiting game, and completion screen.
- `POST /api/generate` — validates the intake and starts a Devin session, or
  generates locally in fast mode.
- `GET /api/sessions/:id` — reports when the HTML result is ready (polls Devin
  unless the page was generated locally).
- `GET /pages/:id` — serves the returned HTML behind the submitted password gate.
- `GET /demo/ferrari` — serves the generated Ferrari sample page.
- `GET /api/health` — reports API configuration health.

## Demo mode

Set `DEMO_MODE=1` to skip the Devin API. Submissions use the Ferrari sample
results page, but still wait for `DEMO_DELAY_MS` before reporting completion.
The password entered into the intake form unlocks the submitted page.

## Devin API notes

- Use a Devin v3 service-user key from Settings > Service users. It starts with
  the `cog_` prefix; session IDs returned by create may need the `devin-`
  prefix when polling.
- Configure `DEVIN_API_BASE_URL` as `https://api.devin.ai/v3` for the SaaS
  service, or as the equivalent `/api/v3` URL for an enterprise instance.
- The app creates sessions through
  `POST /organizations/{org_id}/sessions` with a structured output schema of
  `{ html: string }`. The session must return the complete HTML document in
  `structured_output.html`; no generator template is used for real runs.
