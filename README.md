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

## Routes

- `GET /` — intake form, waiting game, and completion screen.
- `POST /api/generate` — validates the intake and starts a Devin session.
- `GET /api/sessions/:id` — polls Devin and reports when the HTML result is ready.
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
