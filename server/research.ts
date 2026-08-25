/**
 * Verified Devin reference material handed to the research session.
 *
 * devin.ai renders its customer index client-side and sits behind a bot
 * checkpoint, so a session cannot reliably read it with a plain fetch. These
 * entries were read from the published pages and are passed into the prompt so
 * the session never has to guess a customer name, number, or link.
 */

export interface ProofPoint {
  /** Customer name exactly as published. */
  customer: string;
  /** The published headline result, quoted or closely paraphrased. */
  result: string;
  /** Public page the result is published on. */
  source: string;
  /** Rough industry, used to pick the closest analogues for a prospect. */
  industry: string;
  /** Work Devin did, used to match the prospect's stated use case. */
  motions: string[];
}

export const PROOF_POINTS: ProofPoint[] = [
  {
    customer: 'Mercedes-Benz',
    result: 'Cut the time to complete a COBOL migration from 8 months to 8 days.',
    source: 'https://cognition.com/blog/mercedes-benz-cognition',
    industry: 'Automotive / manufacturing',
    motions: ['legacy migration', 'modernization'],
  },
  {
    customer: 'Nubank',
    result:
      'Refactors millions of lines of code to improve engineering efficiency with Devin.',
    source: 'https://devin.ai/customers/nubank',
    industry: 'Financial services',
    motions: ['large-scale refactor', 'modernization'],
  },
  {
    customer: 'Itaú',
    result: 'Deployed AI across the SDLC at global-finance scale.',
    source: 'https://devin.ai/customers/itau',
    industry: 'Financial services',
    motions: ['SDLC rollout', 'platform adoption'],
  },
  {
    customer: 'EBANX',
    result:
      'Went from one engineer evaluating Devin to 92% of merged PRs in the core payments platform created with Devin; a payment-provider integration scoped at six weeks shipped in about twelve hours.',
    source: 'https://devin.ai/customers/ebanx',
    industry: 'Payments / fintech',
    motions: ['feature delivery', 'platform adoption'],
  },
  {
    customer: 'AngelList',
    result: 'Completed a Redshift-to-Snowflake migration 5.2x faster with Devin.',
    source: 'https://devin.ai/customers/angellist',
    industry: 'Financial services / data',
    motions: ['data migration', 'legacy migration'],
  },
  {
    customer: 'GE Aerospace',
    result: 'Uses Devin across engineering to invent the future of flight.',
    source: 'https://devin.ai/customers/geaerospace',
    industry: 'Aerospace / industrial',
    motions: ['regulated engineering', 'platform adoption'],
  },
  {
    customer: 'Evinova',
    result: 'Accelerates regulated software delivery with Devin.',
    source: 'https://devin.ai/customers/evinova',
    industry: 'Healthcare / life sciences',
    motions: ['regulated engineering', 'feature delivery'],
  },
  {
    customer: 'Compiled Health',
    result: 'Uses Devin to make the standard of care executable as software.',
    source: 'https://devin.ai/customers/compiledhealth',
    industry: 'Healthcare',
    motions: ['greenfield development', 'feature delivery'],
  },
  {
    customer: 'Litera',
    result:
      'Cut regression cycles by 90%, delivering new products to customers faster than ever.',
    source: 'https://devin.ai/customers/litera',
    industry: 'Legal software',
    motions: ['testing and QA', 'release velocity'],
  },
  {
    customer: 'FE fundinfo',
    result: 'Scaled engineering capacity with AI-driven automation across 1,800 repos.',
    source: 'https://devin.ai/customers/fefundinfo',
    industry: 'Financial data',
    motions: ['fleet-wide maintenance', 'upgrades'],
  },
  {
    customer: 'Ramp',
    result:
      'Devin fixed tens of thousands of hours of technical debt so engineers could stay on customer-facing work.',
    source: 'https://devin.ai/customers/ramp',
    industry: 'Fintech',
    motions: ['technical debt', 'maintenance'],
  },
  {
    customer: 'Gumroad',
    result: 'Devin became the #1 contributor to the codebase with 1,500+ merged PRs.',
    source: 'https://devin.ai/customers/gumroad',
    industry: 'Consumer software / marketplace',
    motions: ['feature delivery', 'maintenance'],
  },
  {
    customer: 'Rohlik Group',
    result: 'Building an agent-driven grocery company on Devin.',
    source: 'https://devin.ai/customers/rohlikgroup',
    industry: 'E-commerce / retail',
    motions: ['platform adoption', 'feature delivery'],
  },
  {
    customer: 'Hippo',
    result: 'Building the future of insurance with Devin.',
    source: 'https://devin.ai/customers/hippo',
    industry: 'Insurance',
    motions: ['feature delivery', 'modernization'],
  },
  {
    customer: 'RV Tech (Rivian and Volkswagen joint venture)',
    result: 'Uses AI to ship the future of vehicle software.',
    source: 'https://devin.ai/customers/rvtech',
    industry: 'Automotive software',
    motions: ['embedded / vehicle software', 'feature delivery'],
  },
  {
    customer: 'AHEAD',
    result: 'Unlocked 8x-40x faster engineering with Devin.',
    source: 'https://devin.ai/customers/ahead',
    industry: 'Technology consulting',
    motions: ['delivery services', 'modernization'],
  },
  {
    customer: 'The Citation Group',
    result: 'Measures engineering ROI directly with Devin.',
    source: 'https://devin.ai/customers/thecitationgroup',
    industry: 'Compliance services',
    motions: ['ROI measurement', 'platform adoption'],
  },
  {
    customer: 'Linktree',
    result:
      'Expanded social media platform coverage and shipped new features with Devin (per its Director of Engineering).',
    source: 'https://devin.ai/customers/linktree',
    industry: 'Consumer software',
    motions: ['integrations', 'feature delivery'],
  },
  {
    customer: 'Hamming',
    result: 'Devin contributes 25% of total code volume.',
    source: 'https://devin.ai/customers/hamming',
    industry: 'AI tooling',
    motions: ['feature delivery'],
  },
  {
    customer: 'Bilt',
    result:
      'Devin helps engineers overcome coder\u2019s block and accelerate development across complex projects.',
    source: 'https://devin.ai/customers/bilt',
    industry: 'Fintech / loyalty',
    motions: ['feature delivery'],
  },
  {
    customer: 'Cognizant',
    result: 'Rolling Devin across its engineering org and global client base.',
    source: 'https://cognition.com/blog/cognizant-cognition',
    industry: 'Technology consulting',
    motions: ['enterprise rollout'],
  },
  {
    customer: 'Infosys',
    result: 'Partnered with Cognition to expand engineering capacity.',
    source: 'https://cognition.com/blog/infosys-cognition',
    industry: 'Technology consulting',
    motions: ['enterprise rollout'],
  },
];

/**
 * Anonymized outcomes published on the customers index. Useful when no named
 * customer is a close analogue for the prospect.
 */
export const AGGREGATE_OUTCOMES: string[] = [
  '8-12x efficiency gain on a dataset migration touching 100,000+ datasets (financial institution)',
  '10,000+ hours saved annually on Angular version upgrades (technology consulting firm)',
  '16x acceleration on a large-scale data infrastructure migration to Databricks (financial institution)',
  '8x increase in engineering hour efficiency to maintain >90% test coverage (technology consulting firm)',
  '70% reduction in time spent on a .NET migration (technology company)',
  '22x more cost-effective Jupyter notebook migration (technology consulting firm)',
];

export const AGGREGATE_OUTCOMES_SOURCE = 'https://devin.ai/customers';

/**
 * Published list pricing, so the ROI calculator seeds a defensible Devin cost
 * instead of an invented one.
 */
export const PRICING_ANCHORS = {
  source: 'https://devin.ai/pricing',
  notes: [
    'Team plan: $80/month for the team plus $40/month per full developer seat.',
    'Enterprise pricing is custom ("Let\u2019s talk"), so treat any enterprise figure as an assumption the reader can change.',
  ],
};

const industryKeywords: Array<[string, string[]]> = [
  ['Financial services', ['bank', 'finance', 'financial', 'capital', 'invest', 'wealth', 'trading']],
  ['Payments / fintech', ['payment', 'fintech', 'card', 'checkout', 'billing', 'wallet']],
  ['Insurance', ['insurance', 'insurer', 'underwriting', 'claims']],
  ['Healthcare', ['health', 'clinic', 'patient', 'medical', 'care', 'pharma', 'hospital']],
  ['Automotive', ['auto', 'car', 'vehicle', 'mobility', 'motor', 'ferrari', 'truck']],
  ['E-commerce / retail', ['retail', 'commerce', 'shop', 'store', 'grocery', 'marketplace']],
  ['Technology consulting', ['consult', 'services', 'systems integrator', 'agency']],
  ['Aerospace / industrial', ['aero', 'aviation', 'flight', 'space', 'industrial', 'manufactur']],
];

/**
 * Best-effort industry guess from the company name and website host. Only used
 * to hint which proof points to look at first; the session still decides.
 */
export function guessIndustry(companyName: string, websiteUrl: string): string | null {
  const haystack = `${companyName} ${websiteUrl}`.toLowerCase();
  for (const [industry, keywords] of industryKeywords) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return industry;
  }
  return null;
}

/** Renders the proof-point library as prompt-ready lines. */
export function formatProofPoints(points: ProofPoint[] = PROOF_POINTS): string {
  return points
    .map(
      (point) =>
        `- ${point.customer} (${point.industry}; ${point.motions.join(', ')}): ${point.result} Source: ${point.source}`,
    )
    .join('\n');
}
