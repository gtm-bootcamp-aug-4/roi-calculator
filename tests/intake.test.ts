import { describe, expect, it } from 'vitest';

import {
  COGNITION_THEME,
  DEFAULT_QUESTIONS,
  DEFAULT_STEPS,
  normalizeWebsiteUrl,
  questionsForWait,
  renderIntakeApp,
  validateIntake,
} from '../src/intake';
import type { IntakeValues } from '../src/intake';

function values(overrides: Partial<IntakeValues> = {}): IntakeValues {
  return {
    companyName: 'Ferrari',
    websiteUrl: 'ferrari.com',
    password: 'maranello1',
    passwordConfirm: 'maranello1',
    role: 'Director of Software Engineering',
    useCase: 'Vehicle software releases',
    ...overrides,
  };
}

describe('validateIntake', () => {
  it('accepts a complete submission and a bare domain', () => {
    expect(validateIntake(values())).toEqual({});
    expect(validateIntake(values({ websiteUrl: 'https://www.ferrari.com/en-EN' }))).toEqual({});
  });

  it('requires a company name and a website', () => {
    expect(validateIntake(values({ companyName: ' ' })).companyName).toBeTruthy();
    expect(validateIntake(values({ websiteUrl: '' })).websiteUrl).toBeTruthy();
  });

  it('rejects addresses that are not public company websites', () => {
    for (const websiteUrl of [
      'ferrari',
      'localhost:3000',
      '127.0.0.1',
      'http://192.168.1.4',
      'internal.local',
      'gmail.com',
      'not a url',
    ]) {
      expect(validateIntake(values({ websiteUrl })).websiteUrl, websiteUrl).toBeTruthy();
    }
  });

  it('enforces password length, strength, and confirmation', () => {
    expect(validateIntake(values({ password: 'short', passwordConfirm: 'short' })).password)
      .toBeTruthy();
    expect(validateIntake(values({ password: 'onlyletters', passwordConfirm: 'onlyletters' })).password)
      .toBeTruthy();
    expect(validateIntake(values({ passwordConfirm: 'maranello2' })).passwordConfirm).toBeTruthy();
  });

  it('does not report a mismatch while the password itself is invalid', () => {
    const errors = validateIntake(values({ password: 'abc', passwordConfirm: '' }));

    expect(errors.password).toBeTruthy();
    expect(errors.passwordConfirm).toBeUndefined();
  });

  it('caps the optional fields', () => {
    expect(validateIntake(values({ role: 'x'.repeat(200) })).role).toBeTruthy();
    expect(validateIntake(values({ useCase: 'x'.repeat(500) })).useCase).toBeTruthy();
    expect(validateIntake(values({ role: '', useCase: '' }))).toEqual({});
  });
});

describe('normalizeWebsiteUrl', () => {
  it('normalizes what the prospect typed to an origin', () => {
    expect(normalizeWebsiteUrl(' ferrari.com ')).toBe('https://ferrari.com');
    expect(normalizeWebsiteUrl('http://www.ferrari.com/en-EN/formula1')).toBe(
      'http://www.ferrari.com',
    );
    expect(normalizeWebsiteUrl('not a url')).toBe('');
  });
});

describe('waiting game content', () => {
  it('ships enough questions to cover the two-minute wait', () => {
    expect(DEFAULT_QUESTIONS.length).toBeGreaterThanOrEqual(questionsForWait(120));
  });

  it('has exactly one valid answer per question', () => {
    for (const question of DEFAULT_QUESTIONS) {
      expect(question.options.length).toBeGreaterThanOrEqual(2);
      expect(question.answerIndex).toBeGreaterThanOrEqual(0);
      expect(question.answerIndex).toBeLessThan(question.options.length);
      expect(question.explanation.length).toBeGreaterThan(0);
    }
  });

  it('orders the progress steps within the wait budget', () => {
    const startTimes = DEFAULT_STEPS.map((step) => step.startsAt);

    expect(startTimes[0]).toBe(0);
    expect([...startTimes].sort((a, b) => a - b)).toEqual(startTimes);
    expect(startTimes[startTimes.length - 1]).toBeLessThan(120);
  });
});

describe('renderIntakeApp', () => {
  const html = renderIntakeApp({ endpoint: 'https://cognition.ai/api/microsite' });

  it('renders one self-contained document with no external assets', () => {
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link[^>]+stylesheet/i);
    expect(html).not.toMatch(/<img/i);
    expect(html).not.toMatch(/@import/i);
    expect(html).not.toMatch(/fonts\.googleapis/i);
  });

  it('renders every screen of the flow', () => {
    for (const id of ['screen-form', 'screen-waiting', 'screen-ready', 'screen-fallback']) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain('data-screen="form"');
  });

  it('renders all form fields with an inline error slot each', () => {
    for (const field of [
      'companyName',
      'websiteUrl',
      'password',
      'passwordConfirm',
      'role',
      'useCase',
    ]) {
      expect(html).toContain(`id="field-${field}"`);
      expect(html).toContain(`id="error-${field}"`);
    }
  });

  it('uses the cognition.com design system rather than a prospect theme', () => {
    expect(html).toContain(`--bg: ${COGNITION_THEME.background};`);
    expect(html).toContain(`--accent: ${COGNITION_THEME.accent};`);
    expect(html).toContain(`--text: ${COGNITION_THEME.text};`);
    expect(html).toContain('NB International Pro');
    expect(html).toContain('STK Bureau Serif');
    expect(html).toContain('<span class="wordmark">Cognition</span>');
    // Numbered sections, as on cognition.com.
    expect(html).toContain('<p class="num">01</p>');
  });

  it('compresses progress step timing to the shortened demo run', () => {
    const demo = renderIntakeApp({ endpoint: '/api', demo: true, demoDurationSeconds: 20 });

    expect(demo).toContain('var RUN_MS = DEMO ? DEMO_DURATION_MS : MAX_WAIT_MS;');
    expect(demo).toContain('var TIME_SCALE = RUN_MS / MAX_WAIT_MS;');
  });

  it('draws the page-being-built wireframe with CSS only, one block per step', () => {
    // The waiting wireframe has a block per progress step, filled in as it lands.
    for (let index = 0; index < DEFAULT_STEPS.length; index += 1) {
      expect(html).toContain(`id="wait-preview-block-${index}"`);
    }
    expect(html).toContain('data-built="false"');
    expect(html).toContain('id="progress-ring"');
    expect(html).toContain('id="progress-pct"');
    // The wireframe must not reintroduce a network fetch.
    expect(html).not.toMatch(/background-image|background:\s*url\(/i);
  });

  it('inlines the same validation the tests exercise', () => {
    expect(html).toContain('function validateIntake');
    expect(html).toContain('Enter your company website.');
  });

  it('embeds the waiting game questions and progress steps', () => {
    expect(html).toContain(DEFAULT_QUESTIONS[0].question);
    expect(html).toContain(DEFAULT_STEPS[0].label);
    expect(html).toContain('id="game-options"');
  });

  it('posts to the configured endpoint and caps the wait at two minutes', () => {
    expect(html).toContain('"https://cognition.ai/api/microsite"');
    expect(html).toContain('var MAX_WAIT_MS = 120000;');
    expect(html).toContain('var DEMO = false;');
  });

  it('hashes the password in the browser instead of sending it', () => {
    expect(html).toContain("digest('SHA-256'");
    expect(html).toContain('getRandomValues');
    expect(html).toContain('passwordGate: gate');
    expect(html).not.toContain('password: values.password');
  });

  it('wires demo mode to a local result page without a backend call', () => {
    const demo = renderIntakeApp({
      endpoint: 'https://cognition.ai/api/microsite',
      demo: true,
      demoResultUrl: './generated-page.html',
      demoDurationSeconds: 5,
    });

    expect(demo).toContain('var DEMO = true;');
    expect(demo).toContain('"./generated-page.html"');
    expect(demo).toContain('var DEMO_DURATION_MS = 5000;');
  });

  it('escapes interpolated copy', () => {
    const escaped = renderIntakeApp({
      endpoint: 'https://cognition.ai/api/microsite',
      questions: [
        {
          question: '<script>alert(1)</script>',
          options: ['a', 'b'],
          answerIndex: 0,
          explanation: 'ok',
        },
      ],
      steps: [{ label: '<img onerror=alert(1)>', startsAt: 0 }],
    });

    expect(escaped).not.toContain('<script>alert(1)</script>');
    expect(escaped).not.toContain('<img onerror');
  });
});
