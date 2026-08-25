import { buildClientScript } from './clientScript';
import { escapeHtml, safeUrl } from './escape';
import { buildStyles } from './styles';
import { resolveTheme } from './theme';
import type { Claim, MicrositeInput, ProofPoint, Source } from './types';

function cite(source: Source): string {
  return `<a class="cite" href="${safeUrl(source.url)}" target="_blank" rel="noopener noreferrer nofollow">Source: ${escapeHtml(source.label)}</a>`;
}

function claimCard(claim: Claim): string {
  return `
        <div class="card">
          <p>${escapeHtml(claim.text)}</p>
          ${cite(claim.source)}
        </div>`;
}

function proofCard(proof: ProofPoint): string {
  const metric = proof.metric ? `<p class="metric">${escapeHtml(proof.metric)}</p>` : '';
  return `
        <div class="card">
          <h3>${escapeHtml(proof.customer)}</h3>
          <p>${escapeHtml(proof.headline)}</p>
          ${metric}
          <p>${escapeHtml(proof.relevance)}</p>
          ${cite(proof.source)}
        </div>`;
}

function section(id: string, heading: string, body: string): string {
  return `
    <section id="${id}">
      <div class="wrap">
        <h2>${escapeHtml(heading)}</h2>
${body}
      </div>
    </section>`;
}

function roiField(id: string, label: string, value: number, hint: string, max?: number): string {
  const maxAttr = max === undefined ? '' : ` max="${max}"`;
  return `
          <div class="field">
            <label for="roi-${id}">${escapeHtml(label)}</label>
            <input type="number" id="roi-${id}" value="${value}" min="0"${maxAttr} step="any" />
            <p class="hint">${escapeHtml(hint)}</p>
          </div>`;
}

function gateMarkup(companyName: string): string {
  return `
    <div id="gate">
      <div id="gate-card">
        <h1>${escapeHtml(companyName)} &times; Devin</h1>
        <p>This page is password protected. Enter the password you were given to continue.</p>
        <form id="gate-form">
          <input type="password" id="gate-password" autocomplete="current-password" placeholder="Password" />
          <p id="gate-error"></p>
          <button type="submit">Unlock</button>
        </form>
      </div>
    </div>`;
}

function themeCredit(sourceUrl?: string): string {
  if (!sourceUrl) return '';
  return `<p>Styled to match <a href="${safeUrl(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceUrl)}</a>.</p>`;
}

/** Renders the complete, self-contained microsite HTML document. */
export function renderMicrosite(input: MicrositeInput): string {
  const { company, whyDevin, whyNow, priorities, proofPoints, roiDefaults, contact } = input;
  const locked = Boolean(input.passwordGate);
  const theme = resolveTheme(input.theme);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const title = `Why Devin is fundamental for ${company.name}`;

  const descriptorLine = company.descriptor
    ? `<p class="eyebrow">${escapeHtml(company.descriptor)}</p>`
    : '<p class="eyebrow">Prepared for you by Cognition</p>';

  const prioritiesMarkup = priorities.length
    ? `        <div class="priority-list">
${priorities
  .map(
    (item) => `          <div class="priority">
            <h3>${escapeHtml(item.priority)}</h3>
            <p>${escapeHtml(item.devinAngle)}</p>
            ${cite(item.source)}
          </div>`,
  )
  .join('\n')}
        </div>`
    : '';

  const roiMarkup = `        <div class="roi">
          <div>
${roiField('engineers', 'Engineers in scope', roiDefaults.engineers, 'Engineers who would use Devin.')}
${roiField('avgSalary', 'Fully loaded cost per engineer (USD/year)', roiDefaults.avgSalary, 'Salary plus benefits and overhead.')}
${roiField('toilPercent', 'Time on Devin-addressable work (%)', roiDefaults.toilPercent, 'Migrations, refactors, test coverage, bug backlog, code review.', 100)}
${roiField('automationPercent', 'Share of that work Devin absorbs (%)', roiDefaults.automationPercent, 'Conservative starting point: 30-50%.', 100)}
${roiField('devinAnnualCost', 'Devin annual cost (USD)', roiDefaults.devinAnnualCost, 'Replace with your quoted price.')}
          </div>
          <div class="results">
            <p class="result-headline" id="roi-net">&mdash;</p>
            <p class="result-headline-label">Net annual savings</p>
            <div class="result-row"><span>Annual cost of addressable work</span><span id="roi-toil-cost">&mdash;</span></div>
            <div class="result-row"><span>Cost recovered with Devin</span><span id="roi-recovered">&mdash;</span></div>
            <div class="result-row"><span>Return on Devin spend</span><span id="roi-multiple">&mdash;</span></div>
            <div class="result-row"><span>Capacity returned</span><span id="roi-capacity">&mdash;</span></div>
            <div class="result-row"><span>Payback period</span><span id="roi-payback">&mdash;</span></div>
          </div>
        </div>`;

  const contactMarkup = `        <div class="contact">
          <h3>${escapeHtml(contact.headline)}</h3>
          <p>${escapeHtml(contact.body)}</p>
          <a class="cta" href="${safeUrl(contact.buttonUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(contact.buttonLabel)}</a>
        </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${escapeHtml(title)}</title>
<style>${buildStyles(theme)}</style>
</head>
<body data-locked="${locked ? 'true' : 'false'}" data-theme-mode="${theme.mode}" data-layout="${theme.layout.hero}-${theme.layout.sections}-${theme.layout.density}">
${locked ? gateMarkup(company.name) : ''}
  <main>
    <header class="hero">
      <div class="wrap">
        ${descriptorLine}
        <h1>${escapeHtml(title)}</h1>
        <p class="lede">${escapeHtml(whyDevin.summary)}</p>
      </div>
    </header>
${section('why-devin', 'Why Devin?', `        <div class="cards">${whyDevin.points.map(claimCard).join('')}
        </div>`)}
${section('why-now', 'Why now?', `        <p class="summary">${escapeHtml(whyNow.summary)}</p>
        <div class="cards">${whyNow.signals.map(claimCard).join('')}
        </div>`)}
${section('priorities', 'Mission-critical priorities', prioritiesMarkup)}
${section('proof', 'Proof points from Devin customers', `        <div class="cards">${proofPoints.map(proofCard).join('')}
        </div>`)}
${section('roi', 'ROI calculator', roiMarkup)}
${section('contact', 'Contact us', contactMarkup)}
    <footer>
      <div class="wrap">
        <p>Prepared for ${escapeHtml(company.name)} (${escapeHtml(company.websiteUrl)}) &middot; generated ${escapeHtml(generatedAt)}.</p>
        ${themeCredit(theme.sourceUrl)}
        <p>Built from public information. Proof points from <a href="https://devin.ai/customers" target="_blank" rel="noopener noreferrer">devin.ai/customers</a>. ROI figures are illustrative and depend on the inputs above.</p>
      </div>
    </footer>
  </main>
<script>${buildClientScript(roiDefaults, input.passwordGate)}</script>
</body>
</html>
`;
}
