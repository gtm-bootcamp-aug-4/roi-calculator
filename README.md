# roi-calculator

Generates the personalized "Why Devin is fundamental for me" microsite: a single
self-contained static HTML page per prospect, with an interactive ROI calculator
and a client-side password gate.

This repo currently contains the static HTML generator (AUG-36). The input form,
URL validation, waiting game, research agent, proof-point matcher, hosting, and
orchestration are tracked as separate issues under AUG-30.

## Usage

```bash
npm install
npm test
npm run typecheck

# render the sample payload into a gated page
npx tsx src/cli.ts examples/acme-input.json --out out.html --password hunter2

# same page, themed from a saved copy of the prospect's homepage
npx tsx src/cli.ts examples/acme-input.json --theme-from examples/acme-homepage.html \
  --out out.html --password hunter2
```

Programmatically:

```ts
import { generateMicrosite } from './src/generator';

const html = generateMicrosite(input); // throws MicrositeInputError on bad input
```

## Input contract

`MicrositeInput` (see `src/generator/types.ts`) is what the research agent and
proof-point matcher produce:

| Field | Purpose |
| --- | --- |
| `company` | Name, website URL, descriptor, optional prospect role / use case |
| `whyDevin` | Personalized value proposition summary + sourced claims |
| `whyNow` | Urgency summary + sourced research signals |
| `priorities` | Inferred priorities mapped to a Devin angle, each with a source |
| `proofPoints` | Matched customers from `devin.ai/customers`, each with a source |
| `roiDefaults` | Starting values for the client-side ROI calculator |
| `contact` | Demo / sales CTA copy and link |
| `passwordGate` | Optional `{ salt, hash }`; omit for an ungated preview |
| `theme` | Optional palette / type / layout taken from the prospect's site |

Validation runs before rendering and fails loudly rather than producing a page
with empty sections or unattributed claims:

- every claim, signal, priority, and proof point needs a valid `http(s)` source
- proof points must be sourced from `devin.ai`
- at least two matched proof points
- ROI defaults must be non-negative, percentages within 0-100
- a supplied gate must carry a 64-char hex SHA-256 hash and a >=16 hex char salt

## Prospect theming

Generated pages adopt the prospect's own look rather than a fixed Devin palette.
`theme` is a partial `BrandThemeInput`; `resolveTheme` merges it over the Devin
defaults, so a payload only needs the few values worth trusting:

```ts
theme: {
  colors: { background: '#fbfaf7', text: '#14213d', accent: '#e07a2f' },
  fonts: { heading: '"Söhne", Georgia, serif' },
  radius: '8px',
  layout: { hero: 'centered', sections: 'cards', density: 'comfortable' },
  sourceUrl: 'https://acme-payments.example.com',
}
```

Everything else — surface, raised, border, muted text, accent contrast, light vs.
dark mode — is *derived* from those three colors, so the page stays readable
whatever the prospect's brand is. Contrast of muted text and accent foregrounds
is covered by tests.

Layout variants are CSS-only over the same markup: `hero` left/centered,
`sections` cards/list, `density` comfortable/compact. The resolved combination is
exposed on `<body data-theme-mode data-layout>`.

`extractThemeFromHtml(html, sourceUrl)` is a network-free, best-effort extractor
for a saved prospect homepage: it reads CSS custom properties, `<style>` blocks,
and inline styles, and falls back to the most frequent saturated color for the
accent. Anything it can't determine falls back to the Devin defaults. The
research agent (AUG-34) can either use it or supply `theme` directly.

Theme values are sanitized before they reach CSS — colors must be hex/rgb/hsl,
fonts a restricted character set, radius `<n>px|rem` — so a hostile stylesheet
cannot break out of the declaration and inject rules or remote URLs.

## Output

One HTML file, no network requests: styles and script are inlined, no images, no
external fonts (prospect fonts are referenced as family names only, never
fetched). Sections rendered: **Why Devin?**, **Why now?**,
**Mission-critical priorities**, **Proof points**, **ROI calculator**,
**Contact us**, plus a footer noting the page was built from public information.

### ROI calculator

`computeRoi` in `src/generator/roi.ts` is the single source of truth for the
model; its function body is serialized into the generated page, so the inlined
calculator and the tested TypeScript model cannot drift apart.

```
toilCost        = engineers * avgSalary * toilPercent/100
recoveredCost   = toilCost * automationPercent/100
netAnnualSavings= recoveredCost - devinAnnualCost
roiMultiple     = netAnnualSavings / devinAnnualCost
paybackMonths   = devinAnnualCost / recoveredCost * 12
```

### Password gate

When `passwordGate` is present the body renders with `data-locked="true"`, the
page content is hidden by CSS, and an unlock form hashes the entered password
with the embedded salt via `crypto.subtle` and compares it to the embedded
digest. This is obfuscation-grade protection by design: the digest ships in the
file. The plaintext password never enters the generated HTML.

All research text is HTML-escaped and source URLs are restricted to `http(s)`,
so a hostile research result cannot inject script into a generated page.

## Devin HTML generator spike

A separate end-to-end spike lives in `client/` and `server/`: a React button kicks off a
Devin session via the Devin API, the app polls the session, and the HTML the session
produces is previewed and downloadable. It is independent of the generator above.

### Layout

- `server/` — Express API that holds the Devin API key and proxies the Devin API (v3, service-user auth)
  - `POST /api/generate` — `POST /v3/organizations/{org_id}/sessions` with a `structured_output_schema` of `{ html: string }`
  - `GET /api/sessions/:id` — `GET /v3/organizations/{org_id}/sessions/devin-{id}`, returns status and, once finished, `structured_output.html`
- `client/` — Vite + React UI (single button, status, download, preview). Dev server proxies `/api` to `:3001`.

### Run

```bash
cd server && npm install && cp .env.example .env  # set DEVIN_API_KEY, DEVIN_ORG_ID, DEVIN_API_BASE_URL
npm run dev

cd ../client && npm install && npm run dev
```

Open the printed Vite URL and click **Generate HTML**.

### Notes on the Devin API

- Auth uses a **service user** key (`cog_` prefix) from Settings > Service users; personal keys are not
  accepted by v3. The v1 API (`/v1/sessions`) returns 403 for these keys on this instance.
- Session IDs come back from create without the `devin-` prefix but the get endpoint requires it.
- The session's final answer is read from `structured_output`, validated against the schema sent at
  creation time, so no file transfer out of the session is needed.
