import type { IntakeErrors, IntakeValues } from './types';

/**
 * Client-side shape validation for the entry form.
 *
 * Deliberately dependency-free and self-contained: its source is serialized
 * into the page's inline script, so the browser and the tested TypeScript run
 * the exact same rules. Cheap checks only — that the URL actually resolves and
 * belongs to a real business is the server's job (AUG-32), because anything
 * reachability-related needs a network call and SSRF protection.
 */
export function validateIntake(values: IntakeValues): IntakeErrors {
  var errors: IntakeErrors = {};
  var name = values.companyName.trim();
  var url = values.websiteUrl.trim();

  if (name.length < 2) {
    errors.companyName = 'Enter your company name.';
  } else if (name.length > 120) {
    errors.companyName = 'That name is too long.';
  }

  if (!url) {
    errors.websiteUrl = 'Enter your company website.';
  } else {
    var withScheme = /^https?:\/\//i.test(url) ? url : 'https://' + url;
    var host = '';
    try {
      host = new URL(withScheme).hostname.toLowerCase();
    } catch (error) {
      host = '';
    }
    var labels = host.split('.');
    var tld = labels.length > 1 ? labels[labels.length - 1] : '';
    var isIpAddress = /^[\d.]+$/.test(host);

    if (!host || labels.length < 2 || tld.length < 2) {
      errors.websiteUrl = 'Enter a full website address, like acme.com.';
    } else if (isIpAddress || host === 'localhost' || /\.local$/.test(host)) {
      errors.websiteUrl = 'Enter a public company website.';
    } else if (/^(gmail|yahoo|hotmail|outlook|icloud)\./.test(host)) {
      errors.websiteUrl = 'Enter your company website, not an email provider.';
    }
  }

  if (values.password.length < 8) {
    errors.password = 'Use at least 8 characters.';
  } else if (values.password.length > 200) {
    errors.password = 'That password is too long.';
  } else if (!/[^a-zA-Z]/.test(values.password)) {
    errors.password = 'Add a number or symbol.';
  }

  if (!errors.password && values.passwordConfirm !== values.password) {
    errors.passwordConfirm = 'Passwords do not match.';
  }

  if (values.role.length > 120) {
    errors.role = 'That is too long.';
  }

  if (values.useCase.length > 400) {
    errors.useCase = 'Keep it under 400 characters.';
  }

  return errors;
}

/** True when `validateIntake` found nothing to complain about. */
export function isValidIntake(values: IntakeValues): boolean {
  return Object.keys(validateIntake(values)).length === 0;
}

/**
 * Normalizes a submitted URL the way the form does before sending it on, so
 * "acme.com" and "http://acme.com/" reach the research agent the same way.
 */
export function normalizeWebsiteUrl(value: string): string {
  var trimmed = value.trim();
  var withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
  try {
    return new URL(withScheme).origin;
  } catch (error) {
    return '';
  }
}
