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
 * This is the cognition.ai-side surface, so it stays on the Devin design
 * system — only the page it generates adopts the prospect's brand.
 */
export function renderIntakeApp(options: IntakeAppOptions): string {
  const resolved = { ...DEFAULT_APP_OPTIONS, ...options };
  const waitMinutes = Math.round(resolved.maxWaitSeconds / 60);

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
    <div class="brand"><span class="mark">D</span>Devin by Cognition</div>

    <section class="screen" id="screen-form">
      <p class="eyebrow">Built for you in under ${escapeHtml(String(waitMinutes))} minutes</p>
      <h1>Why Devin is fundamental for your company</h1>
      <p class="lede">Tell us who you are. We research your company, match it against what Devin already does for teams like yours, and build you a private page you can share internally.</p>

      <form id="intake-form" novalidate>
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
    </section>

    <section class="screen" id="screen-waiting">
      <p class="eyebrow">Working on it</p>
      <h1>Building the case for <span id="waiting-company">your company</span></h1>
      <p class="lede">This takes up to ${escapeHtml(String(waitMinutes))} minutes. Play while you wait &mdash; the answers are the point.</p>

      <div class="bar"><div id="progress-bar"></div></div>
      <ul class="progress">
${progressList(resolved.steps)}
      </ul>
      <p class="elapsed" id="elapsed">0s elapsed</p>

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
      <div class="done">
        <h2>Your page is ready</h2>
        <p id="ready-score"></p>
        <p>Share this link and the password you chose. Anyone with both can open it.</p>
        <div class="link-box" id="ready-link"></div>
        <a class="cta" id="ready-open" href="#" target="_blank" rel="noopener noreferrer">Open my page</a>
      </div>
    </section>

    <section class="screen" id="screen-fallback">
      <div class="done">
        <h2>Still working</h2>
        <p>This one is taking longer than ${escapeHtml(String(waitMinutes))} minutes. We will email you the link as soon as it is done &mdash; you can close this tab.</p>
        <button type="button" id="fallback-restart" class="ghost">Start over</button>
      </div>
    </section>

    <footer>Devin by Cognition &middot; pages are built from public information only.</footer>
  </div>
<script>${buildIntakeScript(resolved)}</script>
</body>
</html>
`;
}
