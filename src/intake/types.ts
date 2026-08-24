/** What the prospect types into the entry form. */
export interface IntakeValues {
  companyName: string;
  websiteUrl: string;
  password: string;
  passwordConfirm: string;
  role: string;
  useCase: string;
}

export type IntakeField = keyof IntakeValues;

/** Field -> message. An empty object means the form may be submitted. */
export type IntakeErrors = Partial<Record<IntakeField, string>>;

/**
 * What the browser posts to the generation endpoint. The chosen password is
 * never included: the form hashes it locally and sends only the gate material,
 * so plaintext stays in the prospect's browser.
 */
export interface IntakeSubmission {
  companyName: string;
  websiteUrl: string;
  role?: string;
  useCase?: string;
  passwordGate: { salt: string; hash: string };
  submittedAt: string;
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  /** Index into `options`. */
  answerIndex: number;
  /** Shown after answering, so the wait teaches something about Devin. */
  explanation: string;
}

/** A step in the "we are working on it" progress list. */
export interface ProgressStep {
  label: string;
  /** Seconds after submit when this step starts. */
  startsAt: number;
}

export interface IntakeAppOptions {
  /** Where the browser POSTs the submission. */
  endpoint: string;
  /**
   * Fakes the endpoint in-browser so the whole flow can be demoed from a
   * file:// page with no backend. Never enable this in production.
   */
  demo?: boolean;
  /** In demo mode, the link the finished flow points at. */
  demoResultUrl?: string;
  /** How long the faked generation takes in demo mode, in seconds. */
  demoDurationSeconds?: number;
  /** Hard cap on the synchronous wait; then we fall back to email. */
  maxWaitSeconds?: number;
  questions?: TriviaQuestion[];
  steps?: ProgressStep[];
}
