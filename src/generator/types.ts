/**
 * Input contract for the static microsite generator.
 *
 * The research agent (AUG-34) and proof-point matcher (AUG-35) produce this
 * structure; the generator turns it into a single self-contained HTML file.
 */
import type { BrandThemeInput } from './theme';

export type { BrandThemeInput };

/** A public source backing a claim. Every claim on the page must have one. */
export interface Source {
  /** Human readable label, e.g. "Acme careers page". */
  label: string;
  /** Absolute public URL. */
  url: string;
}

/** A single researched statement about the prospect, with attribution. */
export interface Claim {
  text: string;
  source: Source;
}

export interface CompanyProfile {
  name: string;
  websiteUrl: string;
  /** Short descriptor, e.g. "Series C fintech infrastructure company". */
  descriptor?: string;
  industry?: string;
  /** Role of the prospect who requested the page, when provided. */
  prospectRole?: string;
  /** Use case the prospect described, when provided. */
  useCase?: string;
}

/** A matched proof point from https://devin.ai/customers. */
export interface ProofPoint {
  customer: string;
  /** One line headline, e.g. "Cut migration time by 60%". */
  headline: string;
  /** Why this customer is relevant to the prospect. */
  relevance: string;
  /** Optional quantified outcome, e.g. "12,000 engineering hours saved". */
  metric?: string;
  source: Source;
}

export interface RoiInputs {
  /** Number of engineers in scope. */
  engineers: number;
  /** Fully loaded annual cost per engineer, in USD. */
  avgSalary: number;
  /** Share of engineering time spent on Devin-addressable toil, 0-100. */
  toilPercent: number;
  /** Expected reduction of that toil with Devin, 0-100. */
  automationPercent: number;
  /** Annual Devin platform cost, in USD. */
  devinAnnualCost: number;
}

export interface ContactCta {
  headline: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
}

/** Client-side password gate parameters produced by AUG-37. */
export interface PasswordGate {
  /** Per-page random salt, hex encoded. */
  salt: string;
  /** SHA-256 hex digest of (password + salt). */
  hash: string;
}

export interface MicrositeInput {
  company: CompanyProfile;
  /** Personalized value proposition — "Why Devin?". */
  whyDevin: {
    summary: string;
    points: Claim[];
  };
  /** Urgency signals from research — "Why now?". */
  whyNow: {
    summary: string;
    signals: Claim[];
  };
  /** Inferred priorities mapped to Devin capabilities. */
  priorities: Array<{
    priority: string;
    devinAngle: string;
    source: Source;
  }>;
  proofPoints: ProofPoint[];
  roiDefaults: RoiInputs;
  contact: ContactCta;
  /** Omitted for an ungated preview render. */
  passwordGate?: PasswordGate;
  /**
   * Palette, type, and layout taken from the prospect's website so the page
   * looks like theirs. Anything omitted falls back to the Devin defaults.
   */
  theme?: BrandThemeInput;
  /** ISO timestamp shown in the footer. Defaults to generation time. */
  generatedAt?: string;
}
