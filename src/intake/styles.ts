/**
 * Design tokens read from cognition.com's own stylesheet, so the entry
 * experience looks like the site it is an extension of. Fonts are referenced by
 * family name with system fallbacks only — the page never fetches a webfont.
 */
export const COGNITION_THEME = {
  background: '#f7f6f5',
  surface: '#ffffff',
  surfaceAlt: '#f2f5fa',
  border: 'rgba(0, 0, 0, 0.06)',
  borderStrong: 'rgba(0, 0, 0, 0.16)',
  text: '#000000',
  textSecondary: 'rgba(25, 25, 25, 0.56)',
  accent: '#2200ff',
  button: '#191919',
  error: '#fa5050',
  positive: '#1f7a4d',
  fonts: {
    heading: '"NB International Pro", system-ui, -apple-system, Helvetica, Arial, sans-serif',
    body: '"STK Bureau Serif", Georgia, "Times New Roman", serif',
    mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
} as const;

const t = COGNITION_THEME;

/**
 * Inline stylesheet for the entry experience. Unlike the generated microsite,
 * this page lives on cognition.com, so it is pinned to that design system —
 * flat off-white, hairline rules, mono section numbers, square controls — while
 * only the page it produces adopts the prospect's brand.
 */
export const INTAKE_STYLES = `
:root {
  --bg: ${t.background};
  --surface: ${t.surface};
  --surface-alt: ${t.surfaceAlt};
  --border: ${t.border};
  --border-strong: ${t.borderStrong};
  --text: ${t.text};
  --text-secondary: ${t.textSecondary};
  --accent: ${t.accent};
  --button: ${t.button};
  --danger: ${t.error};
  --positive: ${t.positive};
  --font-heading: ${t.fonts.heading};
  --font-body: ${t.fonts.body};
  --mono: ${t.fonts.mono};
  --container-padding: 20px;
  --section-gap: 88px;
}

@media (min-width: 900px) {
  :root { --container-padding: 64px; --section-gap: 140px; }
}

* { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.5;
  min-height: 100vh;
}

h1, h2, h3, label, button, .nav, .num, .eyebrow {
  font-family: var(--font-heading);
  font-weight: 400;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

.wrap {
  margin: 0 auto;
  max-width: 1440px;
  padding: 0 var(--container-padding) 96px;
}

/* Site chrome */
.nav {
  align-items: center;
  border-bottom: 1px solid var(--border);
  display: flex;
  font-size: 15px;
  justify-content: space-between;
  padding: 24px 0 20px;
}

.nav .wordmark { letter-spacing: -0.01em; }
.nav a { color: var(--text); }

/* Numbered sections, as on cognition.com */
.num {
  color: var(--text-secondary);
  font-family: var(--mono);
  font-size: 13px;
  letter-spacing: 0.02em;
  padding-top: 28px;
}

.screen { display: none; }
body[data-screen="form"] #screen-form,
body[data-screen="waiting"] #screen-waiting,
body[data-screen="ready"] #screen-ready,
body[data-screen="fallback"] #screen-fallback { display: block; }

h1 {
  font-size: clamp(24px, 4.4vw, 44px);
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 10px 0 0;
  max-width: 22ch;
}

.lede {
  color: var(--text);
  font-size: 18px;
  margin: 22px 0 0;
  max-width: 62ch;
}

.eyebrow {
  color: var(--accent);
  font-size: 15px;
  margin: 0;
}

.panel {
  border-top: 1px solid var(--border);
  margin-top: 44px;
  padding-top: 36px;
}

/* Form: hairline rules rather than boxes */
.field { border-bottom: 1px solid var(--border); padding: 14px 0; }

.field label {
  display: block;
  font-size: 15px;
  margin-bottom: 6px;
}

.field .optional { color: var(--text-secondary); }

input, textarea {
  background: transparent;
  border: 0;
  color: var(--text);
  font-family: var(--font-body);
  font-size: 18px;
  line-height: 1.4;
  padding: 4px 0;
  width: 100%;
}

textarea { min-height: 76px; resize: vertical; }

input::placeholder, textarea::placeholder { color: var(--text-secondary); }

input:focus, textarea:focus { outline: none; }
input:focus-visible, textarea:focus-visible, button:focus-visible, a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.field .hint, .fineprint {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 8px 0 0;
}

.field .error {
  color: var(--danger);
  font-family: var(--font-heading);
  font-size: 14px;
  margin: 8px 0 0;
}

.field[data-invalid="true"] { border-bottom-color: var(--danger); }

.row { display: grid; gap: 0 40px; grid-template-columns: 1fr; }

@media (min-width: 720px) {
  .row { grid-template-columns: 1fr 1fr; }
}

button {
  background: var(--button);
  border: 0;
  border-radius: 0;
  color: var(--bg);
  cursor: pointer;
  font-size: 15px;
  padding: 10px 16px;
}

button:hover:not(:disabled) { opacity: 0.8; }
button:disabled { cursor: not-allowed; opacity: 0.4; }

button.wide { margin-top: 28px; width: 100%; }

button.ghost {
  background: transparent;
  border: 1px solid var(--border-strong);
  color: var(--text);
}

/* Waiting screen */
.progress {
  list-style: none;
  margin: 0;
  padding: 0;
}

.progress li {
  align-items: center;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
  display: flex;
  font-family: var(--font-heading);
  font-size: 15px;
  gap: 12px;
  padding: 12px 0;
}

.progress li .dot {
  border: 1px solid var(--border-strong);
  border-radius: 50%;
  flex: 0 0 auto;
  height: 10px;
  width: 10px;
}

.progress li[data-state="active"] { color: var(--text); }
.progress li[data-state="active"] .dot {
  background: var(--accent);
  border-color: var(--accent);
}

.progress li[data-state="done"] .dot {
  background: var(--positive);
  border-color: var(--positive);
}

.elapsed {
  color: var(--text-secondary);
  font-family: var(--mono);
  font-size: 13px;
  margin: 14px 0 0;
}

.bar {
  background: var(--border);
  height: 2px;
  margin: 32px 0 28px;
  overflow: hidden;
}

.bar > div {
  background: var(--accent);
  height: 100%;
  transition: width 0.6s linear;
  width: 0;
}

/* Trivia game */
.game {
  background: var(--surface);
  border: 1px solid var(--border);
  margin-top: 40px;
  padding: 28px;
}

.game-head {
  align-items: baseline;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 18px;
}

.game-head h2 {
  color: var(--text-secondary);
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.game-score { color: var(--text-secondary); font-family: var(--mono); font-size: 12px; }

.question { font-family: var(--font-heading); font-size: 21px; letter-spacing: -0.01em; margin: 0 0 20px; }

.options { display: grid; gap: 1px; }

.option {
  background: transparent;
  border: 1px solid var(--border-strong);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 17px;
  padding: 13px 16px;
  text-align: left;
}

.option:hover:not(:disabled) { background: var(--surface-alt); opacity: 1; }
.option[data-state="correct"] { border-color: var(--positive); color: var(--positive); }
.option[data-state="wrong"] { border-color: var(--danger); color: var(--danger); }
.option:disabled { cursor: default; opacity: 1; }

.explanation {
  color: var(--text-secondary);
  font-size: 16px;
  margin: 18px 0 0;
}

/* Ready / fallback */
.done {
  border-top: 1px solid var(--border);
  margin-top: 36px;
  padding-top: 32px;
}

.done h2 { font-size: clamp(22px, 3vw, 32px); letter-spacing: -0.02em; margin: 0 0 12px; }
.done p { margin: 0 0 18px; max-width: 60ch; }

.link-box {
  background: var(--surface);
  border: 1px solid var(--border);
  font-family: var(--mono);
  font-size: 13px;
  margin: 0 0 22px;
  overflow-wrap: anywhere;
  padding: 14px 16px;
}

.cta {
  background: var(--button);
  color: var(--bg);
  display: inline-block;
  font-family: var(--font-heading);
  font-size: 15px;
  padding: 10px 18px;
}

.cta:hover { opacity: 0.8; text-decoration: none; }

footer {
  border-top: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: var(--section-gap);
  padding-top: 20px;
}
`;
