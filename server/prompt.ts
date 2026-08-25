/**
 * The prompt the generation endpoint sends to a Devin session. The session
 * researches the prospect from public sources and reports one complete HTML
 * document as structured output, which is what the finished page serves.
 */
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
  const context = [
    role ? `The person who requested this page describes their role as: ${role}.` : '',
    useCase
      ? `They said they would point Devin at this first, so weight the priorities section toward it: ${useCase}.`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `You are building a one-page HTML sales microsite that makes the case for Devin (Cognition's AI
software engineer) to a specific prospect.

Prospect: ${companyName} (${websiteUrl})
${context}

Research the prospect using public sources only: their own website, press coverage, engineering blog,
and job postings. Do not attempt to reach anything behind a login and do not scrape at volume. Also
read https://devin.ai/customers so the proof points are real published Devin results.

Then produce ONE complete, self-contained HTML document (a single file, inline <style> only, no
external stylesheets, fonts, or images) with these sections in order:

1. Hero: a short eyebrow line describing what the company does, an <h1> reading
   "Why Devin is fundamental for ${companyName}", and a 3-4 sentence paragraph connecting their actual
   software reality to the work Devin absorbs.
2. "Why Devin?" - two or three evidence cards, each a specific claim about this company plus a
   "Source: ..." link to the public page it came from.
3. "Why now?" - a short framing paragraph plus two evidence cards with source links.
4. "Mission-critical priorities" - three priorities, each with a heading, two or three sentences on
   what Devin does for it, and a source link.
5. "Proof points from Devin customers" - two or three named customers from devin.ai/customers with the
   concrete published result and one line on why it is relevant to this prospect.
6. "ROI calculator" - a working calculator with number inputs for: engineers in scope, fully loaded
   cost per engineer (USD/year), share of time on Devin-addressable work (%), share of that work Devin
   absorbs (%), and Devin annual cost (USD). It recomputes on every input change and shows: net annual
   savings, annual cost of addressable work, cost recovered with Devin, return on Devin spend,
   capacity returned in engineer-years, and payback period in months. Implement it with a small inline
   <script> and seed the inputs with plausible values for a company of this size.
7. "Contact us" - a short offer to run Devin against a real ticket from their backlog, linking to
   https://cognition.ai/contact.
8. Footer: prepared for ${companyName}, the generation date, a note that the page is built from public
   information, and that the ROI figures are illustrative and depend on the inputs above.

Style the page in the prospect's own brand, not a generic template: read the background, text, and
accent colors, the heading and body font families, the corner radius, and the general light/dark feel
from ${websiteUrl}, and theme the whole page to match. Reference fonts by family name with system
fallbacks only - fetch nothing. The result should read as dense, confident, and unmistakably theirs.

Every factual claim about the prospect must carry a link to the public source it came from. Do not
invent customers, metrics, or quotes; if you cannot source a claim, leave it out.

Do NOT clone any repository and do NOT create a pull request. Write the file to
/home/ubuntu/output.html, then finish by reporting the complete HTML document as your structured
output under the key "html".`;
}
