import { describe, expect, it } from 'vitest';

import {
  buildContentPrompt,
  discoverPages,
  htmlToText,
  parseContentJson,
  selectProofPoints,
} from '../server/fastGenerate';

const submission = {
  companyName: 'Ferrari',
  websiteUrl: 'https://www.ferrari.com/',
  role: 'VP Engineering',
  useCase: 'Legacy migrations',
  passwordGate: { salt: 'aa', hash: 'b'.repeat(64) },
  submittedAt: '2026-01-01T00:00:00.000Z',
};

describe('htmlToText', () => {
  it('drops scripts, styles, and markup', () => {
    const text = htmlToText('<style>a{color:red}</style><p>Hello <b>world</b></p><script>x()</script>');
    expect(text).toBe('Hello world');
  });

  it('truncates to the requested length', () => {
    expect(htmlToText('<p>abcdefghij</p>', 4)).toBe('abcd');
  });
});

describe('discoverPages', () => {
  it('finds one same-origin page per category', () => {
    const html = `
      <a href="/about-us">About</a>
      <a href="/company/team">Team</a>
      <a href="https://news.other.com/press">Press</a>
      <a href="/newsroom/latest">Newsroom</a>
      <a href="/careers">Careers</a>
    `;
    const found = discoverPages(html, 'https://www.ferrari.com/');
    expect(found.map((page) => page.kind)).toEqual(['about', 'news', 'careers']);
    expect(found[0].url).toBe('https://www.ferrari.com/about-us');
    expect(found.every((page) => page.url.startsWith('https://www.ferrari.com/'))).toBe(true);
  });

  it('ignores unparseable and cross-origin hrefs', () => {
    const found = discoverPages('<a href="::bad::">x</a><a href="https://evil.com/about">y</a>', 'https://a.com/');
    expect(found).toEqual([]);
  });
});

describe('selectProofPoints', () => {
  it('only returns devin.ai-sourced points, industry matches first', () => {
    const points = selectProofPoints('Ferrari', 'https://www.ferrari.com/');
    expect(points).toHaveLength(3);
    expect(points.every((point) => point.source.startsWith('https://devin.ai/'))).toBe(true);
  });

  it('respects the limit', () => {
    expect(selectProofPoints('Acme', 'https://acme.test/', 2)).toHaveLength(2);
  });
});

describe('buildContentPrompt', () => {
  const prompt = buildContentPrompt(
    submission,
    [{ kind: 'homepage', url: 'https://www.ferrari.com/', text: 'Ferrari builds cars.' }],
    selectProofPoints('Ferrari', 'https://www.ferrari.com/'),
  );

  it('carries the prospect context and page text', () => {
    expect(prompt).toContain('Ferrari');
    expect(prompt).toContain('VP Engineering');
    expect(prompt).toContain('Legacy migrations');
    expect(prompt).toContain('Ferrari builds cars.');
  });

  it('pins sourcing, pricing, and the contact URL', () => {
    expect(prompt).toContain('never invent a URL');
    expect(prompt).toContain('https://devin.ai/pricing');
    expect(prompt).toContain('https://cognition.com/contact');
  });
});

describe('parseContentJson', () => {
  it('parses bare JSON', () => {
    expect(parseContentJson('{"company":{"name":"A"}}')).toEqual({ company: { name: 'A' } });
  });

  it('parses fenced JSON with commentary', () => {
    const raw = 'Here you go:\n```json\n{"company":{"name":"A"}}\n```\nthanks';
    expect(parseContentJson(raw)).toEqual({ company: { name: 'A' } });
  });

  it('throws when there is no object', () => {
    expect(() => parseContentJson('no json here')).toThrow('did not contain a JSON object');
  });
});
