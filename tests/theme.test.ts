import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { contrastRatio, parseColor, type Rgb } from '../src/generator/color';
import { generateMicrosite } from '../src/generator';
import { buildStyles } from '../src/generator/styles';
import { DEVIN_THEME, extractThemeFromHtml, resolveTheme } from '../src/generator/theme';
import type { MicrositeInput } from '../src/generator/types';

const homepage = readFileSync(
  fileURLToPath(new URL('../examples/acme-homepage.html', import.meta.url)),
  'utf8',
);

function sample(): MicrositeInput {
  return JSON.parse(
    readFileSync(fileURLToPath(new URL('../examples/acme-input.json', import.meta.url)), 'utf8'),
  ) as MicrositeInput;
}

describe('extractThemeFromHtml', () => {
  it('pulls palette, font, radius and hero style off a prospect homepage', () => {
    const theme = extractThemeFromHtml(homepage, 'https://acme-payments.example.com');

    expect(theme.colors).toMatchObject({
      background: '#fbfaf7',
      text: '#14213d',
      accent: '#e07a2f',
    });
    expect(theme.fonts?.heading).toContain('Söhne');
    expect(theme.radius).toBe('8px');
    expect(theme.layout?.hero).toBe('centered');
    expect(theme.sourceUrl).toBe('https://acme-payments.example.com');
  });

  it('falls back to the most frequent saturated color when no accent is declared', () => {
    const html = `<style>.a{color:#123456}.b{background:#22aa66}.c{border-color:#22aa66}</style>`;

    expect(extractThemeFromHtml(html).colors?.accent).toBe('#22aa66');
  });

  it('returns an empty theme for markup with no usable styles', () => {
    const theme = extractThemeFromHtml('<html><body><h1>Hi</h1></body></html>');

    expect(theme.colors).toBeUndefined();
    const resolved = resolveTheme(theme);
    expect(resolved.mode).toBe('dark');
    expect(resolved.colors.background).toBe(DEVIN_THEME.colors.background);
    expect(resolved.colors.accent).toBe(DEVIN_THEME.colors.accent);
  });
});

describe('resolveTheme', () => {
  it('derives a light-mode palette from a light prospect background', () => {
    const theme = resolveTheme({ colors: { background: '#ffffff', text: '#111111' } });

    expect(theme.mode).toBe('light');
    expect(theme.colors.surface).not.toBe('#ffffff');
    expect(contrastRatio(parseColor(theme.colors.text) as Rgb, parseColor('#ffffff') as Rgb))
      .toBeGreaterThan(4.5);
  });

  it('keeps muted text readable against the prospect background', () => {
    for (const background of ['#ffffff', '#fbfaf7', '#0a0a0b', '#14213d']) {
      const theme = resolveTheme({ colors: { background } });
      const ratio = contrastRatio(
        parseColor(theme.colors.muted) as Rgb,
        parseColor(background) as Rgb,
      );
      expect(ratio).toBeGreaterThan(3);
    }
  });

  it('picks an accent-contrast color that is readable on the accent', () => {
    const theme = resolveTheme({ colors: { accent: '#e07a2f' } });
    const ratio = contrastRatio(
      parseColor(theme.colors.accentContrast) as Rgb,
      parseColor('#e07a2f') as Rgb,
    );

    expect(ratio).toBeGreaterThan(4);
  });

  it('rejects unsafe color, font and radius values instead of injecting them into CSS', () => {
    const theme = resolveTheme({
      colors: { background: 'red; } body { display: none', accent: 'url(evil)' },
      fonts: { heading: 'Inter; } * { background: url(http://evil) ' },
      radius: '9999px; }',
    });

    expect(theme.colors.background).toBe(DEVIN_THEME.colors.background);
    expect(theme.colors.accent).toBe(DEVIN_THEME.colors.accent);
    expect(theme.fonts.heading).toBe(DEVIN_THEME.fonts.heading);
    expect(theme.radius).toBe(DEVIN_THEME.radius);
    expect(buildStyles(theme)).not.toContain('evil');
  });

  it('defaults layout variants and accepts the alternatives', () => {
    expect(resolveTheme().layout).toEqual({
      hero: 'left',
      sections: 'cards',
      density: 'comfortable',
    });
    expect(
      resolveTheme({ layout: { hero: 'centered', sections: 'list', density: 'compact' } }).layout,
    ).toEqual({ hero: 'centered', sections: 'list', density: 'compact' });
  });
});

describe('themed rendering', () => {
  it('applies the prospect palette and layout to the generated page', () => {
    const input = sample();
    input.theme = extractThemeFromHtml(homepage, 'https://acme-payments.example.com');

    const html = generateMicrosite(input);

    expect(html).toContain('--bg: #fbfaf7;');
    expect(html).toContain('--accent: #e07a2f;');
    expect(html).toContain('Söhne');
    expect(html).toContain('data-theme-mode="light"');
    expect(html).toContain('data-layout="centered-cards-comfortable"');
    expect(html).toContain('Styled to match');
  });

  it('falls back to the Devin palette when no theme is supplied', () => {
    const html = generateMicrosite(sample());

    expect(html).toContain(`--bg: ${DEVIN_THEME.colors.background};`);
    expect(html).toContain('data-theme-mode="dark"');
    expect(html).not.toContain('Styled to match');
  });

  it('varies the stylesheet with the layout variant', () => {
    const cards = buildStyles(resolveTheme({ layout: { sections: 'cards' } }));
    const list = buildStyles(resolveTheme({ layout: { sections: 'list', density: 'compact' } }));

    expect(cards).toContain('repeat(auto-fit, minmax(260px, 1fr))');
    expect(list).not.toContain('repeat(auto-fit, minmax(260px, 1fr))');
    expect(list).toContain('--section-padding: 38px;');
  });
});

describe('default theme fidelity', () => {
  it('keeps the Devin accent label white when no prospect theme is supplied', () => {
    expect(resolveTheme().colors.accentContrast).toBe(DEVIN_THEME.colors.accentContrast);
  });
});
