import type { MicrositeInput } from './types';

const SHA256_HEX = /^[0-9a-f]{64}$/;

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates generator input before rendering. Fails loudly rather than
 * emitting a page with missing sections or unattributed claims, since every
 * claim on a generated page must carry a source.
 */
export function validateInput(input: MicrositeInput): string[] {
  const errors: string[] = [];

  if (!input.company?.name?.trim()) {
    errors.push('company.name is required');
  }
  if (!isHttpUrl(input.company?.websiteUrl ?? '')) {
    errors.push('company.websiteUrl must be an http(s) URL');
  }
  if (!input.whyDevin?.summary?.trim()) {
    errors.push('whyDevin.summary is required');
  }
  if (!input.whyDevin?.points?.length) {
    errors.push('whyDevin.points must contain at least one claim');
  }
  if (!input.whyNow?.signals?.length) {
    errors.push('whyNow.signals must contain at least one claim');
  }
  if (!input.priorities?.length) {
    errors.push('priorities must contain at least one entry');
  }
  if ((input.proofPoints?.length ?? 0) < 2) {
    errors.push('proofPoints must contain at least two matched customers');
  }
  if (!input.contact?.buttonUrl || !isHttpUrl(input.contact.buttonUrl)) {
    errors.push('contact.buttonUrl must be an http(s) URL');
  }

  const sourced = [
    ...(input.whyDevin?.points ?? []),
    ...(input.whyNow?.signals ?? []),
    ...(input.priorities ?? []),
    ...(input.proofPoints ?? []),
  ];
  sourced.forEach((item, index) => {
    if (!isHttpUrl(item.source?.url ?? '')) {
      errors.push(`sourced item #${index + 1} is missing a valid source URL`);
    }
  });

  input.proofPoints?.forEach((proof) => {
    if (!/^https:\/\/(www\.)?devin\.ai\//.test(proof.source?.url ?? '')) {
      errors.push(`proof point "${proof.customer}" must be sourced from devin.ai`);
    }
  });

  const roi = input.roiDefaults;
  if (!roi) {
    errors.push('roiDefaults is required');
  } else {
    (['engineers', 'avgSalary', 'toilPercent', 'automationPercent', 'devinAnnualCost'] as const).forEach(
      (field) => {
        if (typeof roi[field] !== 'number' || !Number.isFinite(roi[field]) || roi[field] < 0) {
          errors.push(`roiDefaults.${field} must be a non-negative number`);
        }
      },
    );
    if (roi.toilPercent > 100 || roi.automationPercent > 100) {
      errors.push('roiDefaults percentages must be between 0 and 100');
    }
  }

  const gate = input.passwordGate;
  if (gate) {
    if (!SHA256_HEX.test(gate.hash)) {
      errors.push('passwordGate.hash must be a 64-character lowercase hex SHA-256 digest');
    }
    if (!/^[0-9a-f]{16,}$/.test(gate.salt)) {
      errors.push('passwordGate.salt must be at least 16 hex characters');
    }
  }

  return errors;
}
