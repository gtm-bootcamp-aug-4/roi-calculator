/**
 * Inline stylesheet for generated microsites.
 *
 * Tokens follow the Cognition.ai / Devin dark palette. Kept as a single inline
 * string so the output stays a self-contained file with no network requests.
 */
export const STYLES = `
:root {
  --bg: #0a0a0b;
  --bg-elevated: #131316;
  --bg-raised: #1a1a1f;
  --border: #26262c;
  --text: #f4f4f5;
  --text-muted: #a1a1aa;
  --accent: #4d6bfe;
  --accent-soft: rgba(77, 107, 254, 0.12);
  --positive: #34d399;
  --radius: 14px;
  --font: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

* { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  line-height: 1.6;
  font-size: 16px;
}

a { color: var(--accent); }

.wrap {
  max-width: 880px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Password gate */
#gate {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 24px;
}

#gate-card {
  width: 100%;
  max-width: 380px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px;
  text-align: center;
}

#gate-card h1 { font-size: 20px; margin: 0 0 8px; }
#gate-card p { color: var(--text-muted); font-size: 14px; margin: 0 0 20px; }

#gate-error {
  color: #f87171;
  font-size: 13px;
  min-height: 18px;
  margin: 10px 0 0;
}

input[type="password"], input[type="number"] {
  width: 100%;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  font: inherit;
  padding: 11px 13px;
}

input:focus-visible, button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

button {
  background: var(--accent);
  border: 0;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: 11px 18px;
}

button:hover { filter: brightness(1.08); }

/* Hidden until the gate is cleared */
body[data-locked="true"] main { display: none; }

/* Hero */
header.hero {
  border-bottom: 1px solid var(--border);
  padding: 72px 0 56px;
}

.eyebrow {
  color: var(--accent);
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0 0 16px;
}

header.hero h1 {
  font-size: clamp(30px, 5vw, 46px);
  line-height: 1.12;
  letter-spacing: -0.02em;
  margin: 0 0 18px;
}

header.hero p.lede {
  color: var(--text-muted);
  font-size: 18px;
  margin: 0;
  max-width: 62ch;
}

/* Sections */
section {
  border-bottom: 1px solid var(--border);
  padding: 56px 0;
}

section > .wrap > h2 {
  font-size: 13px;
  font-family: var(--mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0 0 20px;
}

.summary { font-size: 19px; margin: 0 0 28px; max-width: 66ch; }

.cards {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}

.card h3 { font-size: 16px; margin: 0 0 8px; }
.card p { margin: 0 0 10px; color: var(--text-muted); font-size: 15px; }
.card p:last-child { margin-bottom: 0; }

.metric {
  color: var(--positive);
  font-family: var(--mono);
  font-size: 14px;
}

.cite {
  display: inline-block;
  font-size: 12px;
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 1px dotted var(--border);
}

.cite:hover { color: var(--accent); border-bottom-color: var(--accent); }

.priority-list { display: grid; gap: 14px; }

.priority {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
  padding: 18px 20px;
}

.priority h3 { margin: 0 0 6px; font-size: 16px; }
.priority p { margin: 0 0 10px; color: var(--text-muted); font-size: 15px; }

/* ROI calculator */
.roi {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: grid;
  gap: 28px;
  grid-template-columns: 1fr;
  padding: 24px;
}

@media (min-width: 720px) {
  .roi { grid-template-columns: 1fr 1fr; }
}

.field { margin-bottom: 16px; }
.field label { display: block; font-size: 14px; margin-bottom: 6px; }
.field .hint { color: var(--text-muted); font-size: 12px; margin-top: 5px; }

.results {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
}

.result-row:last-of-type { border-bottom: 0; }
.result-row span:first-child { color: var(--text-muted); }
.result-row span:last-child { font-family: var(--mono); }

.result-headline {
  font-size: 28px;
  font-family: var(--mono);
  color: var(--positive);
  margin: 0 0 4px;
}

.result-headline-label {
  color: var(--text-muted);
  font-size: 13px;
  margin: 0 0 18px;
}

/* Contact */
.contact {
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  padding: 32px;
  text-align: center;
}

.contact h3 { font-size: 24px; margin: 0 0 10px; }
.contact p { color: var(--text-muted); margin: 0 0 22px; }

.cta {
  display: inline-block;
  background: var(--accent);
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  padding: 13px 26px;
  text-decoration: none;
}

footer {
  color: var(--text-muted);
  font-size: 13px;
  padding: 32px 0 56px;
}

footer p { margin: 0 0 6px; }
`;
