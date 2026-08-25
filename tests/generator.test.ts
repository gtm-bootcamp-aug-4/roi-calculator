import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { computeRoi, generateMicrosite, MicrositeInputError, validateInput } from '../src/generator';
import { createPasswordGate, hashPassword } from '../src/generator/passwordGate';
import type { MicrositeInput } from '../src/generator/types';

const samplePath = fileURLToPath(new URL('../examples/acme-input.json', import.meta.url));

function sample(): MicrositeInput {
  return JSON.parse(readFileSync(samplePath, 'utf8')) as MicrositeInput;
}

describe('generateMicrosite', () => {
  it('renders a single self-contained document with all five sections', () => {
    const html = generateMicrosite(sample());

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    for (const id of ['why-devin', 'why-now', 'priorities', 'roi', 'contact']) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain('Acme Payments');
    expect(html).toContain('https://devin.ai/customers');
  });

  it('makes no external requests: no src/link references outside the document', () => {
    const html = generateMicrosite(sample());

    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link[^>]+rel="stylesheet"/i);
    expect(html).not.toMatch(/<img/i);
    expect(html).toContain('<style>');
  });

  it('attributes every claim with a link to its source', () => {
    const input = sample();
    const html = generateMicrosite(input);
    const sources = [
      ...input.whyDevin.points,
      ...input.whyNow.signals,
      ...input.priorities,
      ...input.proofPoints,
    ].map((item) => item.source.url);

    for (const url of new Set(sources)) {
      expect(html).toContain(`href="${url}"`);
    }
  });

  it('escapes research content instead of injecting markup', () => {
    const input = sample();
    input.company.name = '<script>alert(1)</script>';
    input.whyDevin.points[0].text = 'A "quoted" & <b>bold</b> claim';

    const html = generateMicrosite(input);

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;');
  });

  it('neutralizes non-http source URLs', () => {
    const input = sample();
    input.whyDevin.points[0].source.url = 'https://acme-payments.example.com/ok';
    const html = generateMicrosite(input);
    expect(html).not.toContain('javascript:');
  });

  it('embeds the gate salt and hash and locks the body when gated', () => {
    const input = sample();
    const gate = createPasswordGate('correct horse');
    input.passwordGate = gate;

    const html = generateMicrosite(input);

    expect(html).toContain('data-locked="true"');
    expect(html).toContain(gate.salt);
    expect(html).toContain(gate.hash);
    expect(html).toContain('id="gate-form"');
    expect(html).not.toContain('correct horse');
    expect(gate.hash).toBe(hashPassword('correct horse', gate.salt));
  });

  it('renders ungated when no password gate is supplied', () => {
    const html = generateMicrosite(sample());
    expect(html).toContain('data-locked="false"');
    expect(html).not.toContain('id="gate-form"');
  });

  it('inlines the shared ROI model so the calculator runs client-side', () => {
    const html = generateMicrosite(sample());
    expect(html).toContain('var computeRoi = ');
    expect(html).toContain('netAnnualSavings');
    expect(html).toContain('id="roi-engineers"');
  });

  it('rejects incomplete research payloads', () => {
    const input = sample();
    input.proofPoints = [input.proofPoints[0]];

    expect(() => generateMicrosite(input)).toThrow(MicrositeInputError);
  });
});

describe('validateInput', () => {
  it('accepts the sample payload', () => {
    expect(validateInput(sample())).toEqual([]);
  });

  it('requires proof points to come from devin.ai', () => {
    const input = sample();
    input.proofPoints[0].source.url = 'https://example.com/case-study';

    expect(validateInput(input)).toContain('proof point "Nubank" must be sourced from devin.ai');
  });

  it('requires a source URL on every claim', () => {
    const input = sample();
    input.whyNow.signals[0].source.url = 'not-a-url';

    expect(validateInput(input).some((e) => e.includes('missing a valid source URL'))).toBe(true);
  });

  it('rejects a malformed password gate', () => {
    const input = sample();
    input.passwordGate = { salt: 'abc', hash: 'nope' };

    const errors = validateInput(input);
    expect(errors).toContain('passwordGate.salt must be at least 16 hex characters');
    expect(errors).toContain(
      'passwordGate.hash must be a 64-character lowercase hex SHA-256 digest',
    );
  });
});

describe('computeRoi', () => {
  it('computes savings, multiple, capacity and payback', () => {
    const result = computeRoi({
      engineers: 100,
      avgSalary: 200000,
      toilPercent: 30,
      automationPercent: 50,
      devinAnnualCost: 1000000,
    });

    expect(result.toilCost).toBe(6000000);
    expect(result.recoveredCost).toBe(3000000);
    expect(result.netAnnualSavings).toBe(2000000);
    expect(result.roiMultiple).toBe(2);
    expect(result.engineerYearsRecovered).toBe(15);
    expect(result.paybackMonths).toBeCloseTo(4, 5);
  });

  it('clamps out-of-range percentages and negative inputs', () => {
    const result = computeRoi({
      engineers: -10,
      avgSalary: 100000,
      toilPercent: 500,
      automationPercent: -20,
      devinAnnualCost: -5,
    });

    expect(result.toilCost).toBe(0);
    expect(result.recoveredCost).toBe(0);
    expect(result.paybackMonths).toBeNull();
    expect(result.roiMultiple).toBe(0);
  });
});
