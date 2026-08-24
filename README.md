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

Validation runs before rendering and fails loudly rather than producing a page
with empty sections or unattributed claims:

- every claim, signal, priority, and proof point needs a valid `http(s)` source
- proof points must be sourced from `devin.ai`
- at least two matched proof points
- ROI defaults must be non-negative, percentages within 0-100
- a supplied gate must carry a 64-char hex SHA-256 hash and a >=16 hex char salt

## Output

One HTML file, no network requests: styles and script are inlined, no images, no
external fonts. Sections rendered: **Why Devin?**, **Why now?**,
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
