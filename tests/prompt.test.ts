import { describe, expect, it } from 'vitest';

import { buildResearchPrompt } from '../server/prompt';
import { AGGREGATE_OUTCOMES, PROOF_POINTS, guessIndustry } from '../server/research';

const input = {
  companyName: 'Ferrari',
  websiteUrl: 'https://www.ferrari.com/',
  role: 'Director of Software Engineering',
  useCase: 'Vehicle software releases',
};

describe('buildResearchPrompt', () => {
  it('names the prospect and echoes the submitted context', () => {
    const prompt = buildResearchPrompt(input);
    expect(prompt).toContain('Ferrari (https://www.ferrari.com/)');
    expect(prompt).toContain('Why Devin is fundamental for Ferrari');
    expect(prompt).toContain(input.role);
    expect(prompt).toContain(input.useCase);
    expect(prompt).toContain('Automotive');
  });

  it('omits optional context when it was not submitted', () => {
    const prompt = buildResearchPrompt({
      companyName: 'Acme',
      websiteUrl: 'https://acme.example/',
    });
    expect(prompt).not.toContain('describes their role as');
    expect(prompt).not.toContain('weight the priorities section');
    expect(prompt).not.toContain('undefined');
  });

  it('spells out the research phase before the build phase', () => {
    const prompt = buildResearchPrompt(input);
    const research = prompt.indexOf('PHASE 1 - RESEARCH');
    const build = prompt.indexOf('PHASE 2 - BUILD');
    const verify = prompt.indexOf('PHASE 3 - VERIFY');
    expect(research).toBeGreaterThan(-1);
    expect(build).toBeGreaterThan(research);
    expect(verify).toBeGreaterThan(build);
    for (const topic of ['job postings', 'getComputedStyle', 'border radius', 'notes.md']) {
      expect(prompt).toContain(topic);
    }
  });

  it('supplies verified proof points instead of asking the session to find them', () => {
    const prompt = buildResearchPrompt(input);
    for (const point of PROOF_POINTS) {
      expect(prompt).toContain(point.customer);
      expect(prompt).toContain(point.source);
    }
    expect(prompt).toContain(AGGREGATE_OUTCOMES[0]);
    expect(prompt).toContain('Do not fetch\n   devin.ai/customers');
  });

  it('anchors the ROI seeds to published pricing and keeps them editable', () => {
    const prompt = buildResearchPrompt(input);
    expect(prompt).toContain('https://devin.ai/pricing');
    expect(prompt).toContain('$40/month per full developer seat');
    expect(prompt).toContain('never hard-coded');
  });

  it('keeps the delivery contract the server depends on', () => {
    const prompt = buildResearchPrompt(input);
    expect(prompt).toContain('/home/ubuntu/output.html');
    expect(prompt).toContain('structured output under the key "html"');
    expect(prompt).toContain('Do NOT clone any repository');
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
