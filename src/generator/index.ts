import { renderMicrosite } from './template';
import { validateInput } from './validate';
import type { MicrositeInput } from './types';

export class MicrositeInputError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(`Invalid microsite input:\n- ${errors.join('\n- ')}`);
    this.name = 'MicrositeInputError';
    this.errors = errors;
  }
}

/**
 * Generates the personalized microsite as a single self-contained HTML string.
 * Throws MicrositeInputError when the research payload is incomplete.
 */
export function generateMicrosite(input: MicrositeInput): string {
  const errors = validateInput(input);
  if (errors.length) {
    throw new MicrositeInputError(errors);
  }
  return renderMicrosite(input);
}

export { computeRoi } from './roi';
export { validateInput } from './validate';
export { DEVIN_THEME, extractThemeFromHtml, resolveTheme } from './theme';
export type { BrandColors, BrandFonts, BrandLayout, BrandTheme, BrandThemeInput } from './theme';
export * from './types';
