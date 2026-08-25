import { describe, expect, it } from 'vitest';

import { buildResearchPrompt, RESEARCH_USE_CASES } from '../server/prompt';
import { AGGREGATE_OUTCOMES, PRICING_ANCHORS, PROOF_POINTS, guessIndustry } from '../server/research';

const input = {
  companyName: 'Acme',
  websiteUrl: 'https://acme.example/',
};

describe('buildResearchPrompt', () => {
  it('states the public-sources-only goal and the provenance requirement', () => {
    const prompt = buildResearchPrompt(input);

    expect(prompt).toContain('defensible from public sources only');
    expect(prompt).toContain('Every number must');
    expect(prompt).toContain('carry a provenance record');
  });

  it('lists every use case with its category, priority, and output file', () => {
    const prompt = buildResearchPrompt(input);

    for (const useCase of RESEARCH_USE_CASES) {
      expect(prompt).toContain(
        `| ${useCase.name} | ${useCase.category} | ${useCase.priority} | research/use-cases/${useCase.slug}.md |`,
      );
    }
  });

  it('asks for all four calculator inputs and the evidence record', () => {
    const prompt = buildResearchPrompt(input);

    expect(prompt).toContain('volumePerEngineerPerMonth');
    expect(prompt).toContain('hoursPerUnit');
    expect(prompt).toContain('automationRate');
    expect(prompt).toContain('reviewOverhead');
    expect(prompt).toContain('case-study');
    expect(prompt).toContain('benchmark');
    expect(prompt).toContain('estimate');
  });

  it('specifies the markdown deliverables and the structured output keys', () => {
    const prompt = buildResearchPrompt(input);

    expect(prompt).toContain('research/evidence-summary.md');
    expect(prompt).toContain('research/README.md');
    expect(prompt).toContain('"files"');
    expect(prompt).toContain('"html"');
    expect(prompt).toContain('Do NOT clone any repository and do NOT create a pull request.');
  });

  it('keeps the overlap guidance and the quality checks', () => {
    const prompt = buildResearchPrompt(input);

    expect(prompt).toContain('overlap discount');
    expect(prompt).toContain('Automation rates are derived from Devin-specific public claims');
    expect(prompt).toContain('most conservative interpretation');
  });

  it('scopes the research to the requesting company without licensing claims about it', () => {
    const prompt = buildResearchPrompt(input);

    expect(prompt).toContain('Acme (https://acme.example/)');
    expect(prompt).toContain('do not make claims about Acme itself');
  });

  it('promotes the submitted use case to P0 and includes the role when given', () => {
    const prompt = buildResearchPrompt({
      ...input,
      role: 'VP Engineering',
      useCase: 'Java 8 to 17 migration',
    });

    expect(prompt).toContain('describes their role as: VP Engineering');
    expect(prompt).toContain('treat it as\nP0');
    expect(prompt).toContain('Java 8 to 17 migration');
  });

  it('omits the role and use case lines when they are not provided', () => {
    const prompt = buildResearchPrompt(input);

    expect(prompt).not.toContain('describes their role as');
    expect(prompt).not.toContain('treat it as\nP0');
  });

  it('supplies the verified Devin claims instead of asking the session to find them', () => {
    const prompt = buildResearchPrompt(input);

    for (const point of PROOF_POINTS) {
      expect(prompt).toContain(point.customer);
      expect(prompt).toContain(point.source);
    }
    expect(prompt).toContain(AGGREGATE_OUTCOMES[0]);
    expect(prompt).toContain(PRICING_ANCHORS.source);
    expect(prompt).toContain('do not fetch\n  devin.ai/customers');
    expect(prompt).toContain('treat them as upper\nbounds when deriving an automationRate');
  });
});

describe('guessIndustry', () => {
  it('matches on the company name or host, and returns null otherwise', () => {
    expect(guessIndustry('Ferrari', 'https://www.ferrari.com/')).toBe('Automotive');
    expect(guessIndustry('Acme Health', 'https://acme.example/')).toBe('Healthcare');
    expect(guessIndustry('Zzyzx', 'https://zzyzx.example/')).toBeNull();
  });
});

describe('PROOF_POINTS', () => {
  it('are unique and all point at a cognition.com or devin.ai page', () => {
    const names = PROOF_POINTS.map((point) => point.customer);
    expect(new Set(names).size).toBe(names.length);
    for (const point of PROOF_POINTS) {
      expect(point.source).toMatch(/^https:\/\/(devin\.ai|cognition\.com)\//);
      expect(point.motions.length).toBeGreaterThan(0);
    }
  });
});
