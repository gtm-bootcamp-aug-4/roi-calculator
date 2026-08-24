import { DEVIN_THEME } from '../generator/theme';

const c = DEVIN_THEME.colors;

/**
 * Inline stylesheet for the entry experience. Unlike the generated microsite,
 * this page lives on cognition.ai, so it is pinned to the Devin design system
 * rather than themed from the prospect's site.
 */
export const INTAKE_STYLES = `
:root {
  --bg: ${c.background};
  --bg-elevated: ${c.surface};
  --bg-raised: ${c.raised};
  --border: ${c.border};
  --text: ${c.text};
  --text-muted: ${c.muted};
  --accent: ${c.accent};
  --accent-contrast: ${c.accentContrast};
  --accent-soft: ${c.accentSoft};
  --positive: ${c.positive};
  --danger: #f87171;
  --radius: ${DEVIN_THEME.radius};
  --font-heading: ${DEVIN_THEME.fonts.heading};
  --font-body: ${DEVIN_THEME.fonts.body};
  --mono: ${DEVIN_THEME.fonts.mono};
}

* { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--bg);
  background-image: radial-gradient(60% 45% at 50% 0%, ${c.accentSoft}, transparent 70%);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  min-height: 100vh;
}

h1, h2, h3 { font-family: var(--font-heading); }

a { color: var(--accent); }

.wrap {
  max-width: 620px;
  margin: 0 auto;
  padding: 56px 24px 72px;
}

.brand {
  align-items: center;
  display: flex;
  font-weight: 600;
  gap: 10px;
  letter-spacing: -0.01em;
  margin-bottom: 44px;
}

.brand .mark {
  background: var(--accent);
  border-radius: 7px;
  color: var(--accent-contrast);
  display: grid;
  font-family: var(--mono);
  font-size: 15px;
  height: 28px;
  place-items: center;
  width: 28px;
}

.eyebrow {
  color: var(--accent);
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  margin: 0 0 14px;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(28px, 5vw, 40px);
  letter-spacing: -0.02em;
  line-height: 1.14;
  margin: 0 0 14px;
}

.lede {
  color: var(--text-muted);
  font-size: 18px;
  margin: 0 0 36px;
}

/* One screen visible at a time */
.screen { display: none; }
body[data-screen="form"] #screen-form,
body[data-screen="waiting"] #screen-waiting,
body[data-screen="ready"] #screen-ready,
body[data-screen="fallback"] #screen-fallback { display: block; }

/* Form */
.field { margin-bottom: 20px; }

.field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 7px;
}

.field .optional { color: var(--text-muted); font-weight: 400; }

input, textarea {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  font: inherit;
  padding: 12px 14px;
  width: 100%;
}

textarea { min-height: 88px; resize: vertical; }

input::placeholder, textarea::placeholder { color: var(--text-muted); }

input:focus-visible, textarea:focus-visible, button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.field .hint { color: var(--text-muted); font-size: 12.5px; margin: 6px 0 0; }

.field .error {
  color: var(--danger);
  font-size: 12.5px;
  margin: 6px 0 0;
  min-height: 0;
}

.field[data-invalid="true"] input,
.field[data-invalid="true"] textarea { border-color: var(--danger); }

.row { display: grid; gap: 16px; grid-template-columns: 1fr; }

@media (min-width: 620px) {
  .row { grid-template-columns: 1fr 1fr; }
}

button {
  background: var(--accent);
  border: 0;
  border-radius: 10px;
  color: var(--accent-contrast);
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: 13px 22px;
}

button:hover:not(:disabled) { filter: brightness(1.08); }
button:disabled { cursor: not-allowed; opacity: 0.55; }

button.wide { width: 100%; }

button.ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}

.fineprint { color: var(--text-muted); font-size: 12.5px; margin: 16px 0 0; }

/* Waiting screen */
.progress {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  list-style: none;
  margin: 0 0 24px;
  padding: 18px 20px;
}

.progress li {
  align-items: center;
  color: var(--text-muted);
  display: flex;
  font-size: 15px;
  gap: 11px;
  padding: 7px 0;
}

.progress li .dot {
  border: 1.5px solid var(--border);
  border-radius: 50%;
  flex: 0 0 auto;
  height: 13px;
  width: 13px;
}

.progress li[data-state="active"] { color: var(--text); }
.progress li[data-state="active"] .dot {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.progress li[data-state="done"] .dot {
  background: var(--positive);
  border-color: var(--positive);
}

.elapsed { color: var(--text-muted); font-family: var(--mono); font-size: 12.5px; }

.bar {
  background: var(--bg-raised);
  border-radius: 999px;
  height: 4px;
  margin: 0 0 28px;
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
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
}

.game-head {
  align-items: baseline;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.game-head h2 { font-size: 13px; font-family: var(--mono); letter-spacing: 0.1em; margin: 0; text-transform: uppercase; color: var(--text-muted); }
.game-score { color: var(--text-muted); font-family: var(--mono); font-size: 12.5px; }

.question { font-size: 19px; margin: 0 0 18px; }

.options { display: grid; gap: 10px; }

.option {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  cursor: pointer;
  font: inherit;
  padding: 13px 15px;
  text-align: left;
}

.option:hover:not(:disabled) { border-color: var(--accent); filter: none; }
.option[data-state="correct"] { border-color: var(--positive); background: rgba(52, 211, 153, 0.12); }
.option[data-state="wrong"] { border-color: var(--danger); background: rgba(248, 113, 113, 0.12); }
.option:disabled { cursor: default; opacity: 1; }

.explanation {
  color: var(--text-muted);
  font-size: 14.5px;
  margin: 16px 0 0;
  min-height: 0;
}

/* Ready / fallback */
.done {
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  padding: 28px;
  text-align: center;
}

.done h2 { font-size: 24px; margin: 0 0 10px; }
.done p { color: var(--text-muted); margin: 0 0 22px; }

.link-box {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-family: var(--mono);
  font-size: 13px;
  margin: 0 0 20px;
  overflow-wrap: anywhere;
  padding: 12px 14px;
  text-align: left;
}

.cta {
  background: var(--accent);
  border-radius: 10px;
  color: var(--accent-contrast);
  display: inline-block;
  font-weight: 600;
  padding: 13px 26px;
  text-decoration: none;
}

footer { color: var(--text-muted); font-size: 12.5px; margin-top: 40px; }
`;
