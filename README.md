# Devin HTML Generator (spike)

Minimal end-to-end spike: a React button kicks off a Devin session via the Devin API, the app
polls the session, and the HTML the session produces is previewed and downloadable.

## Layout

- `server/` — Express API that holds the Devin API key and proxies the Devin API (v3, service-user auth)
  - `POST /api/generate` — `POST /v3/organizations/{org_id}/sessions` with a `structured_output_schema` of `{ html: string }`
  - `GET /api/sessions/:id` — `GET /v3/organizations/{org_id}/sessions/devin-{id}`, returns status and, once finished, `structured_output.html`
- `client/` — Vite + React UI (single button, status, download, preview). Dev server proxies `/api` to `:3001`.

## Run

```bash
cd server && npm install && cp .env.example .env  # set DEVIN_API_KEY, DEVIN_ORG_ID, DEVIN_API_BASE_URL
npm run dev

cd ../client && npm install && npm run dev
```

Open the printed Vite URL and click **Generate HTML**.

## Notes on the Devin API

- Auth uses a **service user** key (`cog_` prefix) from Settings > Service users; personal keys are not
  accepted by v3. The v1 API (`/v1/sessions`) returns 403 for these keys on this instance.
- Session IDs come back from create without the `devin-` prefix but the get endpoint requires it.
- The session's final answer is read from `structured_output`, validated against the schema sent at
  creation time, so no file transfer out of the session is needed.
