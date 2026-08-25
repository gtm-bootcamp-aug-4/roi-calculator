/**
 * The prompt the generation endpoint sends to a Devin session. The session
 * researches public evidence for the Devin ROI calculator and reports one
 * markdown file per use case plus a consolidated summary, together with a
 * self-contained HTML rendering of that summary, which is what the finished
 * page serves.
 */
import {
  AGGREGATE_OUTCOMES,
  AGGREGATE_OUTCOMES_SOURCE,
  PRICING_ANCHORS,
  formatProofPoints,
} from './research';

export interface PromptInput {
  companyName: string;
  websiteUrl: string;
  role?: string;
  useCase?: string;
}

export interface ResearchUseCase {
  slug: string;
  name: string;
  category: 'maintenance' | 'quality' | 'delivery' | 'operations';
  priority: 'P0' | 'P1' | 'P2';
}

export const RESEARCH_USE_CASES: ResearchUseCase[] = [
  {
    slug: 'migrations-and-dependency-upgrades',
    name: 'Migrations & dependency upgrades',
    category: 'maintenance',
    priority: 'P0',
  },
  {
    slug: 'code-review-and-pr-feedback',
    name: 'Code review & PR feedback',
    category: 'quality',
    priority: 'P0',
  },
  {
    slug: 'test-coverage-and-flaky-tests',
    name: 'Test coverage & flaky tests',
    category: 'quality',
    priority: 'P0',
  },
  {
    slug: 'bug-fixes-and-small-tickets',
    name: 'Bug fixes & small tickets',
    category: 'delivery',
    priority: 'P0',
  },
  {
    slug: 'ci-and-build-failure-triage',
    name: 'CI & build failure triage',
    category: 'operations',
    priority: 'P1',
  },
  {
    slug: 'refactoring-and-tech-debt',
    name: 'Refactoring & tech debt',
    category: 'maintenance',
    priority: 'P2',
  },
  {
    slug: 'documentation-and-onboarding',
    name: 'Documentation & onboarding',
    category: 'delivery',
    priority: 'P2',
  },
  {
    slug: 'on-call-and-incident-investigation',
    name: 'On-call & incident investigation',
    category: 'operations',
    priority: 'P2',
  },
];

const useCaseTable = (): string => {
  const rows = RESEARCH_USE_CASES.map(
    (useCase, index) =>
      `| ${index + 1} | ${useCase.name} | ${useCase.category} | ${useCase.priority} | research/use-cases/${useCase.slug}.md |`,
  );
  return [
    '| # | Use case | Category | Priority | Output file |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
};

export function buildResearchPrompt({
  companyName,
  websiteUrl,
  role,
  useCase,
}: PromptInput): string {
  const context = [
    `The research is being run for ${companyName} (${websiteUrl}). Use that only to decide which public
sources are most relevant to their stack and scale; do not make claims about ${companyName} itself
unless a public source supports them.`,
    role ? `The person who requested this research describes their role as: ${role}.` : '',
    useCase
      ? `They said they would point Devin at this first, so research that use case first and treat it as
P0 even if the table below ranks it lower: ${useCase}.`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `Research Agent Prompt: Public Evidence for Devin ROI Calculator

# Goal

Populate the Devin ROI calculator with values that are defensible from public sources only. Do not use
internal Cognition data, customer names that have not publicly spoken, or anecdotes that cannot be
cited with a URL.

The output will be used to set defaults and scenario ranges for the calculator. Every number must
carry a provenance record.

${context}

# What counts as a public source

Acceptable:

- Cognition-published case studies, blog posts, press releases, or customer pages with named logos and
  quantified outcomes. The verified library below is your starting point; do not fetch
  devin.ai/customers, which renders client-side behind a bot check and will waste your time.
- A customer's own public statements (blog posts, conference talks, earnings calls, LinkedIn posts)
  mentioning Devin outcomes.
- Peer-reviewed or preprint academic papers on the relevant engineering activity (e.g., code review
  latency, bug fix cycle time, CI failure rates).
- Public industry reports (e.g., DORA State of DevOps, GitHub Octoverse, Stack Overflow Survey) with
  disclosed methodology.
- Public engineering blog posts from named companies that quantify time spent on the relevant task
  type.

Not acceptable:

- Internal POC results, closed-won deal metrics, rep anecdotes, or Slack threads.
- Customer-specific telemetry not released by the customer.
- "We have seen X at many accounts" without a public citation.

# Verified Devin-specific public claims

These were read from the published pages, so cite them directly rather than rediscovering them. They
are the only Devin-specific evidence you start with; any additional Devin claim must carry its own
public URL.

${formatProofPoints()}

Anonymized outcomes published on ${AGGREGATE_OUTCOMES_SOURCE}:
${AGGREGATE_OUTCOMES.map((outcome) => `- ${outcome}`).join('\n')}

Published pricing, if a cost figure is needed: ${PRICING_ANCHORS.notes.join(' ')} Source:
${PRICING_ANCHORS.source}.

Most of these are directional statements rather than task-level measurements, so treat them as upper
bounds when deriving an automationRate and say so in the provenance record.

# Use cases to research

For each use case below, determine whether publicly citable evidence exists. If it does, collect the
required fields. If it does not, mark it as unsupported and do not invent numbers.

${useCaseTable()}

P0 = required for launch. P1 = include if evidence exists, otherwise off by default. P2 = include only
if strong public evidence exists; otherwise omit or mark unsupported.

# For each supported use case, collect

1. volumePerEngineerPerMonth - how many units of this work an adopting engineer encounters per month.
   Prefer sources that measure the activity itself, not Devin's impact. If no direct source, derive
   from public engineering activity data and explain the derivation.
2. hoursPerUnit - engineer-hours one unit costs today, without Devin. Prefer time-in-motion studies,
   public post-mortems, or named company blog posts. Document whether the number is median, mean, or a
   range.
3. automationRate - share of the work Devin takes end to end. This is the highest-impact input, so be
   conservative. Only use sources that explicitly describe Devin completing this task type. If the
   source gives a time reduction (e.g., "40% faster"), convert carefully to an automation rate and
   explain the conversion.
4. reviewOverhead - share of automated time that comes back as human review, prompting, and rework.
   Public evidence here is rare. If absent, default to 15-25% and label it as an estimate.
5. Evidence record - one of:
   - case-study: source title, source URL, sample size or scope, collected date, note summarizing the
     claim.
   - benchmark: report title, URL, year, page/section, note summarizing the relevant finding.
   - estimate: note explaining why no public source exists and what assumption is being made.

# Output format

Return one markdown file per use case plus one consolidated summary.

Per-use-case file: research/use-cases/{use-case-slug}.md

\`\`\`markdown
# {Use Case Name}

## Status
- Evidence tier: [public-case-study | public-benchmark | estimate | unsupported]
- Include by default: [yes | no]
- Confidence: [high | medium | low]

## Suggested defaults
| Input | Value | Range (conservative -> optimistic) | Source |
|---|---|---|---|
| volumePerEngineerPerMonth | X | Y -> Z | [source or "estimate"] |
| hoursPerUnit | X | Y -> Z | [source] |
| automationRate | X | Y -> Z | [source] |
| reviewOverhead | X | Y -> Z | [source] |

## Provenance
### Source 1
- Title:
- URL:
- Claim:
- What it actually measures:
- Limitations:
- Collected on: {date}

## Notes
[Any conversions, caveats, or reasons the number may not transfer to other teams.]

## Recommended action
[include | include-with-caveat | off-by-default | omit]
\`\`\`

Consolidated file: research/evidence-summary.md

\`\`\`markdown
# ROI Evidence Summary

## Use cases ready to include by default
[List with high-confidence public sources]

## Use cases to include off by default
[List with estimates or weak public sources]

## Use cases to omit
[List unsupported]

## Cross-cutting risks
- Overlap/double counting notes
- Generalizability concerns
- Gaps requiring primary research
\`\`\`

Also write research/README.md describing any blocked items and recommended next steps.

# Overlap and taxonomy guidance

When researching, note whether two use cases frequently describe the same engineering time. For
example, a red build fixed by Devin may also be counted as a bug-fix ticket, and a migration often
includes refactoring. For each use case, list any other use cases it likely overlaps with and estimate
the overlap magnitude if any public source supports it. The calculator will apply a category-based
overlap discount; your notes will inform the discount rates.

# Quality checks

Before returning, verify:

1. Every number is tied to a public URL or explicitly marked as an estimate.
2. No source is misrepresented as proving more than it does.
3. Automation rates are derived from Devin-specific public claims, not general AI coding-assistant
   studies.
4. Ranges are provided for every input, not just point estimates.
5. The most conservative interpretation of each source is used, not the marketing headline.

# Deliverables

Do NOT clone any repository and do NOT create a pull request. Write the files under
/home/ubuntu/research/ (one file per researched use case in /home/ubuntu/research/use-cases/, plus
/home/ubuntu/research/evidence-summary.md and /home/ubuntu/research/README.md), then finish by
reporting structured output with:

- "files": every markdown file you wrote, each as an object with "path" (relative to the repository
  root, e.g. "research/use-cases/${RESEARCH_USE_CASES[0].slug}.md") and "contents" (the full markdown).
- "html": ONE complete, self-contained HTML document (a single file, inline <style> only, no external
  stylesheets, fonts, or images) that renders research/evidence-summary.md for a reader who will not
  open the markdown: a heading, the three use-case lists as sections, a table of the suggested
  defaults and ranges per use case, the cross-cutting risks, and a source list where every cited claim
  links to the public URL it came from. Do not put any number on the page that is not either linked to
  a public source or labelled as an estimate.`;
}
