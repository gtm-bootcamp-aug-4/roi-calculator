/**
 * The prompt the generation endpoint sends to a Devin session. The session
 * researches the prospect from public sources and reports one complete HTML
 * document as structured output, which is what the finished page serves.
 *
 * The prompt is written as a research plan first and a build step second: the
 * page is only as good as the facts and brand tokens gathered before any HTML
 * is written, and the session gets one shot with no human in the loop.
 */
import {
  AGGREGATE_OUTCOMES,
  AGGREGATE_OUTCOMES_SOURCE,
  PRICING_ANCHORS,
  formatProofPoints,
  guessIndustry,
} from './research';

export interface PromptInput {
  companyName: string;
  websiteUrl: string;
  role?: string;
  useCase?: string;
}

export function buildResearchPrompt({
  companyName,
  websiteUrl,
  role,
  useCase,
}: PromptInput): string {
  const industryGuess = guessIndustry(companyName, websiteUrl);
  const context = [
    role ? `The person who requested this page describes their role as: ${role}.` : '',
    useCase
      ? `They said they would point Devin at this first, so weight the priorities section toward it: ${useCase}.`
      : '',
    industryGuess
      ? `Best guess at their industry before research: ${industryGuess}. Confirm or correct it from their site.`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `You are building a one-page HTML sales microsite that makes the case for Devin (Cognition's AI
software engineer) to a specific prospect. Nobody will review your work: the page you report is
served to the prospect as-is, so it must be finished, factual, and visibly in their brand.

Prospect: ${companyName} (${websiteUrl})
${context}

======================================================================
PHASE 1 - RESEARCH (do this before writing any HTML)
======================================================================
Work only from public sources: the prospect's own site, its engineering blog, press coverage,
investor or annual reports, conference talks, public repos, and job postings. Never log in, never
pay, never scrape at volume, and never guess. Keep a running notes file at /home/ubuntu/notes.md
with, for every fact, the exact URL you read it on. Anything without a URL does not go on the page.

1. Company reality. Answer in your notes, each with a source URL:
   - What they sell, to whom, and how they make money (one sentence in their own vocabulary).
   - Scale markers: headcount or engineering headcount, customers/users, revenue, markets, number of
     products or brands, regulatory regime if any.
   - Recent news from the last 18 months: funding, acquisitions, launches, restructurings,
     platform rewrites, cloud or AI initiatives, public commitments to efficiency.
2. Software reality. This is the core of the page, so dig until you have specifics:
   - Their stack and platforms, from engineering blog posts, public repos, tech-radar pages, and
     especially the technologies named in current job postings.
   - Legacy or migration surface: mainframe/COBOL, monoliths, old framework versions, in-flight
     cloud migrations, acquisitions to integrate, multiple codebases or many repos.
   - Delivery pain signals: hiring volume for maintenance/QA/platform roles, stated release
     cadence, test or QA burden, on-call and reliability posture, backlog complaints in public
     forums or reviews written by their own engineers.
   - Where they are already public about AI, so the page meets them where they are.
3. Brand tokens. Open ${websiteUrl} in a browser and read the real rendered values - do not
   eyeball a screenshot and do not invent a palette. Use the page's CSS custom properties or
   getComputedStyle on the body, a heading, a primary button, and a card, and record in your notes:
   - page background, surface/card background, primary text, muted text, border color
   - accent/brand color and the text color that sits on top of it
   - heading font family, body font family (record the full family list as authored)
   - border radius scale, whether the site reads light or dark, and how dense/airy it feels
   - the wordmark's exact capitalization (e.g. all caps, lowercase) if it is set in type
   Check a second page (product, careers, or about) so you do not theme off a one-off landing page.
4. Proof points. Use only the published Devin results below. Pick the two or three closest to this
   prospect by industry first, then by the work they actually need done. Do not fetch
   devin.ai/customers - it renders client-side behind a bot check and will waste your time. Do not
   invent numbers, logos, quotes, or customers, and do not claim the prospect is already a customer.

${formatProofPoints()}

   Anonymized outcomes you may also cite, all sourced to ${AGGREGATE_OUTCOMES_SOURCE}:
${AGGREGATE_OUTCOMES.map((outcome) => `   - ${outcome}`).join('\n')}

5. ROI inputs. Derive plausible seed values for this specific company from what you found:
   engineers in scope (from headcount or engineering job postings; if unknown, pick a defensible
   number for their size and say so in the caption), fully loaded cost per engineer for their main
   engineering geography, share of engineering time on Devin-addressable work (maintenance,
   migrations, tests, upgrades, integrations, small features), share of that work Devin absorbs, and
   Devin annual cost. Devin's published pricing: ${PRICING_ANCHORS.notes.join(' ')} Source:
   ${PRICING_ANCHORS.source}. Keep every assumption visible as an editable input, never hard-coded
   inside the arithmetic.

Before moving on, check your notes: if a section below has no sourced fact behind it, go back and
research it. A generic sentence that could apply to any company is a failure, not a fallback.

======================================================================
PHASE 2 - BUILD
======================================================================
Produce ONE complete, self-contained HTML document (single file, inline <style> only, no external
stylesheets, fonts, images, or scripts; reference fonts by family name with system fallbacks and
fetch nothing). Sections in order:

1. Hero: a short eyebrow line describing what the company does in their own words, an <h1> reading
   "Why Devin is fundamental for ${companyName}", and a 3-4 sentence paragraph connecting their
   actual software reality (named systems, migrations, or platforms from your research) to the work
   Devin absorbs.
2. "Why Devin?" - two or three evidence cards, each a specific claim about this company plus a
   "Source: ..." link to the public page it came from.
3. "Why now?" - a short framing paragraph plus two evidence cards with source links, tied to their
   recent news or hiring.
4. "Mission-critical priorities" - three priorities, each with a heading, two or three sentences on
   what Devin does for it, and a source link.
5. "Proof points from Devin customers" - the two or three customers you selected, each with the
   published result, its source link, and one line on why it is relevant to this prospect.
6. "ROI calculator" - a working calculator with number inputs for: engineers in scope, fully loaded
   cost per engineer (USD/year), share of time on Devin-addressable work (%), share of that work
   Devin absorbs (%), and Devin annual cost (USD). It recomputes on every input change and shows:
   net annual savings, annual cost of addressable work, cost recovered with Devin, return on Devin
   spend, capacity returned in engineer-years, and payback period in months. Implement it with a
   small inline <script>, seed it with the values you derived in research, and add one line naming
   where the seeds came from.
7. "Contact us" - a short offer to run Devin against a real ticket from their backlog, linking to
   https://cognition.com/contact.
8. Footer: prepared for ${companyName}, the generation date, a note that the page is built from
   public information, and that the ROI figures are illustrative and depend on the inputs above.

Theme the page with the tokens you recorded, not a generic template: their background, surfaces,
text, accent, fonts, radii, and light/dark feel, applied as CSS custom properties on :root and used
everywhere. Keep body text at accessible contrast against the background you chose. The page should
read as dense, confident, and unmistakably theirs, and be legible down to 375px wide.

======================================================================
PHASE 3 - VERIFY, THEN REPORT
======================================================================
Write the document to /home/ubuntu/output.html and check all of the following before you finish:
- Every factual claim about ${companyName} has a working link to the public source it came from, and
  each link opens the page you actually read.
- No placeholder text, no "TODO", no lorem ipsum, no square-bracket slots, no invented metrics or
  quotes, and no claim that the prospect already uses Devin.
- The colors and fonts in the file match the tokens in your notes.
- The calculator recomputes correctly: open the file in a browser, change every input, and confirm
  the six outputs update and stay sane (no NaN, no Infinity, no division by zero at 0 inputs).
- The document is valid standalone HTML: it starts with <!doctype html>, includes a <title>, and
  loads with no console errors and no external requests.

Do NOT clone any repository and do NOT create a pull request. Finish by reporting the complete HTML
document as your structured output under the key "html".`;
}
