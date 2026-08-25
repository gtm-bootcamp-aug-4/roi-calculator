import { escapeHtml } from '../generator/escape';
import { buildIntakeScript, DEFAULT_APP_OPTIONS } from './clientScript';
import { INTAKE_STYLES } from './styles';
import type { IntakeAppOptions, ProgressStep } from './types';

interface FieldOptions {
  type?: 'text' | 'url' | 'password' | 'textarea';
  placeholder?: string;
  hint?: string;
  optional?: boolean;
  autocomplete?: string;
}

function field(name: string, label: string, options: FieldOptions = {}): string {
  const { type = 'text', placeholder = '', hint, optional, autocomplete } = options;
  const id = `field-${name}`;
  const autoAttr = autocomplete ? ` autocomplete="${escapeHtml(autocomplete)}"` : '';
  const control =
    type === 'textarea'
      ? `<textarea id="${id}" placeholder="${escapeHtml(placeholder)}"></textarea>`
      : `<input type="${type}" id="${id}" placeholder="${escapeHtml(placeholder)}"${autoAttr} />`;

  return `
        <div class="field" id="wrap-${name}" data-invalid="false">
          <label for="${id}">${escapeHtml(label)}${optional ? ' <span class="optional">(optional)</span>' : ''}</label>
          ${control}
          ${hint ? `<p class="hint">${escapeHtml(hint)}</p>` : ''}
          <p class="error" id="error-${name}"></p>
        </div>`;
}

const PREVIEW_BLOCKS = [
  { title: 'Why Devin', lines: 3 },
  { title: 'Why now', lines: 2 },
  { title: 'Mission-critical priorities', lines: 3 },
  { title: 'Proof points from Devin customers', lines: 2 },
  { title: 'ROI calculator', lines: 0 },
];

/**
 * A wireframe of the page being generated, drawn with borders and rules only —
 * no images, so the page stays self-contained. Blocks light up as the matching
 * progress step completes, which is what makes the wait feel like it is building
 * something.
 */
function pagePreview(prefix: string, built = false): string {
  const state = built ? 'true' : 'false';
  const blocks = PREVIEW_BLOCKS.map((block, index) => {
    const lines = Array.from({ length: block.lines }, () => '<span></span>').join('');
    const body = block.lines
      ? `<div class="pv-lines">${lines}</div>`
      : '<div class="pv-bars"><i></i><i></i><i></i><i></i></div>';
    return `        <div class="pv-block" id="${prefix}-block-${index}" data-built="${state}"><p class="pv-title">${escapeHtml(block.title)}</p>${body}</div>`;
  }).join('\n');

  return `      <div class="preview" aria-hidden="true">
        <div class="preview-chrome"><span class="lock">&#128274; yourcompany.devin.page &middot; password required</span></div>
        <div class="preview-body">
          <div class="pv-block hero" id="${prefix}-block-hero" data-built="${state}"><p class="pv-title">Why Devin is fundamental for <span data-preview-company>your company</span></p><div class="pv-lines"><span></span><span></span></div></div>
${blocks}
        </div>
      </div>`;
}

function progressList(steps: ProgressStep[]): string {
  return steps
    .map(
      (step, index) =>
        `          <li id="step-${index}" data-state="pending"><span class="dot"></span>${escapeHtml(step.label)}</li>`,
    )
    .join('\n');
}

/**
 * Renders the entry experience as one self-contained page: the intake form,
 * the waiting screen with the trivia game, and the two terminal states.
 *
 * This is the cognition.com-side surface, so it uses that site's design system
 * — only the page it generates adopts the prospect's brand.
 */
export function renderIntakeApp(options: IntakeAppOptions): string {
  const resolved = { ...DEFAULT_APP_OPTIONS, ...options };
  const waitMinutes = Math.max(1, Math.ceil(resolved.maxWaitSeconds / 60));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Why Devin is fundamental for your company</title>
<style>${INTAKE_STYLES}</style>
</head>
<body data-screen="form"${resolved.demo ? ' data-demo="true"' : ''}>
  <div class="wrap">
    <nav class="nav">
      <span class="wordmark">Cognition</span>
      <a href="https://devin.ai" target="_blank" rel="noopener noreferrer">Devin</a>
    </nav>

    <section class="screen" id="screen-form">
      <p class="num">01</p>
      <h1>Why Devin is fundamental for your company</h1>
      <p class="lede">Tell us who you are. We research your company, match it against what Devin already does for teams like yours, and build you a private page you can share internally &mdash; in under ${escapeHtml(String(waitMinutes))} minutes.</p>

      <div class="split">
      <div>
      <form id="intake-form" class="panel" novalidate>
${field('companyName', 'Company name', { placeholder: 'Ferrari', autocomplete: 'organization' })}
${field('websiteUrl', 'Company website', { type: 'url', placeholder: 'ferrari.com', autocomplete: 'url' })}
        <div class="row">
${field('password', 'Choose a password', { type: 'password', placeholder: 'At least 8 characters', autocomplete: 'new-password' })}
${field('passwordConfirm', 'Confirm password', { type: 'password', placeholder: 'Repeat it', autocomplete: 'new-password' })}
        </div>
        <p class="hint">Your page is locked with this password. It is hashed in your browser &mdash; we never receive it.</p>
${field('role', 'Your role', { placeholder: 'VP Engineering', optional: true, autocomplete: 'organization-title' })}
${field('useCase', 'What would you point Devin at first?', { type: 'textarea', placeholder: 'Migrations, test coverage, the backlog nobody gets to...', optional: true })}
        <button type="submit" id="intake-submit" class="wide">Build my page</button>
        <p class="fineprint">We only use public information about your company. No credentials, no crawling behind logins.</p>
      </form>
      <div class="facts">
        <div><b>01</b><p><strong>Public sources only.</strong> Your site, press, job postings &mdash; every claim links back to where it came from.</p></div>
        <div><b>02</b><p><strong>Proof from real deployments.</strong> Matched against published Devin customer stories on devin.ai/customers.</p></div>
        <div><b>03</b><p><strong>Yours to share.</strong> One page, your brand, locked with your password.</p></div>
      </div>
      </div>
      <div class="aside">
        <p class="aside-label">What you get</p>
${pagePreview('form-preview', true)}
      </div>
      </div>
    </section>

    <section class="screen" id="screen-waiting">
      <p class="num">02</p>
      <h1>Building the case for <span id="waiting-company">your company</span></h1>
      <p class="lede">This takes up to ${escapeHtml(String(waitMinutes))} minutes. Play while you wait &mdash; the answers are the point.</p>

      <div class="split">
      <div>
      <div class="ring-row">
        <div class="ring">
          <svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="54"></circle><circle class="value" id="progress-ring" cx="60" cy="60" r="54" stroke-dasharray="339.292" stroke-dashoffset="339.292"></circle></svg>
          <span class="ring-pct" id="progress-pct">0%</span>
        </div>
        <p class="ring-note">Researching, matching and writing. The page assembles section by section on the right.</p>
      </div>

      <div class="bar"><div id="progress-bar"></div></div>
      <ul class="progress">
${progressList(resolved.steps)}
      </ul>
      <p class="elapsed" id="elapsed">0s elapsed</p>
      </div>
      <div class="aside">
        <p class="aside-label">Building</p>
${pagePreview('wait-preview')}
      </div>
      </div>

      <div class="game">
        <div class="game-head">
          <h2>While you wait</h2>
          <span class="game-score" id="game-score">0 / 0 correct</span>
        </div>
        <p class="question" id="game-question"></p>
        <div class="options" id="game-options"></div>
        <p class="explanation" id="game-explanation"></p>
      </div>
    </section>

    <section class="screen" id="screen-ready">
      <p class="num">03</p>
      <div class="done">
        <div class="split">
        <div>
          <h2>Your page is ready</h2>
          <p id="ready-score"></p>
          <p>Share this link and the password you chose. Anyone with both can open it.</p>
          <div class="link-box" id="ready-link"></div>
          <a class="cta" id="ready-open" href="#" target="_blank" rel="noopener noreferrer">Open my page</a>
        </div>
        <div class="aside">
${pagePreview('ready-preview', true)}
        </div>
        </div>
      </div>
    </section>

    <section class="screen" id="screen-fallback">
      <p class="num">03</p>
      <div class="done">
        <h2>Still working</h2>
        <p id="fallback-message">This one is taking longer than ${escapeHtml(String(waitMinutes))} minutes. We will email you the link as soon as it is done &mdash; you can close this tab.</p>
        <div class="link-box" id="fallback-link" hidden></div>
        <a class="cta" id="fallback-open" href="#" target="_blank" rel="noopener noreferrer" hidden>Open my page</a>
        <button type="button" id="fallback-restart" class="ghost">Start over</button>
      </div>
    </section>

    <footer>Cognition &middot; Devin &middot; pages are built from public information only.</footer>
  </div>
<script>${buildIntakeScript(resolved)}</script>
</body>
</html>
`;
}
