# roi-calculator

Generates the personalized "Why Devin is fundamental for me" microsite: a single
self-contained static HTML page per prospect, with an interactive ROI calculator
and a client-side password gate.

Two brands, deliberately: the **intake app** (AUG-31/AUG-33) is a Cognition/Devin
surface, and the **generated microsite** (AUG-36) takes on the prospect's own
look. The research agent, proof-point matcher, hosting, and server-side
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

# end-to-end Ferrari mockup: intake form -> waiting game -> generated microsite
npx tsx src/mockupCli.ts --out-dir examples/mockup
```

Programmatically:

```ts
import { generateMicrosite } from './src/generator';

const html = generateMicrosite(input); // throws MicrositeInputError on bad input
```

## Intake app

`renderIntakeApp(options)` (`src/intake/`) renders the prospect-facing entry
point as one self-contained page in the Devin design system, switching between
four screens via `<body data-screen>`: `form`, `waiting`, `ready`, `fallback`.

- `validateIntake` (`src/intake/validate.ts`) is shared: the same function body is
  serialized into the page, so inline field errors and server-side checks agree.
  It rejects malformed URLs, IPs, `localhost`/`.local`, and consumer email
  domains — reachability and SSRF-safe fetching stay server-side (AUG-32).
- The password is hashed in the browser with `crypto.subtle` and a fresh 16-byte
  salt; the submitted payload carries only `{ salt, hash }`, and the password
  inputs are cleared once the gate material exists. Plaintext never leaves the
  page.
- The waiting screen (AUG-33) runs the trivia game from `src/intake/game.ts`
  alongside progress steps, capped at `maxWaitSeconds` (120) before it switches to
  the async-email fallback screen.

### Ferrari mockup

`src/mockupCli.ts` writes a clickable, offline demo of the whole flow:
`index.html` (Devin-branded intake, `demo: true` so no endpoint is called) and
`generated-page.html` (Ferrari-themed microsite, extracted from
`examples/ferrari-homepage.html` and gated with the `--password` value, default
`ferrari123`). `--demo-seconds` shortens the wait so the game and progress steps
are watchable without waiting the full two minutes.

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
and inline styles, resolves `var()` indirection, skips declarations it can't use,
and falls back to the most frequent saturated color for the accent. Anything it
can't determine falls back to the Devin defaults. The research agent (AUG-34) can
either use it or supply `theme` directly.

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
