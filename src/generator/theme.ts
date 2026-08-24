import { isDark, mix, parseColor, readableOn, rgba, saturation, toHex, type Rgb } from './color';

export type HeroLayout = 'left' | 'centered';
export type SectionLayout = 'cards' | 'list';
export type Density = 'comfortable' | 'compact';

export interface BrandColors {
  background: string;
  surface: string;
  raised: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentContrast: string;
  positive: string;
  accentSoft: string;
}

export interface BrandFonts {
  heading: string;
  body: string;
  mono: string;
}

export interface BrandLayout {
  hero: HeroLayout;
  sections: SectionLayout;
  density: Density;
}

/** Fully resolved theme used by the stylesheet builder. */
export interface BrandTheme {
  mode: 'light' | 'dark';
  colors: BrandColors;
  fonts: BrandFonts;
  radius: string;
  layout: BrandLayout;
  /** Page the theme was derived from, surfaced in the footer. */
  sourceUrl?: string;
}

/** What the research agent supplies: any subset, merged over the defaults. */
export interface BrandThemeInput {
  mode?: 'light' | 'dark';
  /** Only these three are needed; the rest of the palette is derived. */
  colors?: Partial<BrandColors>;
  fonts?: Partial<BrandFonts>;
  radius?: string;
  layout?: Partial<BrandLayout>;
  sourceUrl?: string;
}

const DEFAULT_FONTS: BrandFonts = {
  heading:
    'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif',
  body: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
};

/** Cognition dark palette, used when a prospect theme can't be derived. */
export const DEVIN_THEME: BrandTheme = {
  mode: 'dark',
  colors: {
    background: '#0a0a0b',
    surface: '#131316',
    raised: '#1a1a1f',
    border: '#26262c',
    text: '#f4f4f5',
    muted: '#a1a1aa',
    accent: '#4d6bfe',
    accentContrast: '#ffffff',
    positive: '#34d399',
    accentSoft: 'rgba(77, 107, 254, 0.12)',
  },
  fonts: DEFAULT_FONTS,
  radius: '14px',
  layout: { hero: 'left', sections: 'cards', density: 'comfortable' },
};

const SAFE_COLOR = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\))$/;
const SAFE_FONT = /^[\p{L}\p{N}\s,"'\-]{1,200}$/u;
const SAFE_RADIUS = /^\d{1,3}(px|rem)$/;

function safeColor(value: string | undefined, fallback: string): string {
  return value && SAFE_COLOR.test(value.trim()) ? value.trim() : fallback;
}

function safeFont(value: string | undefined, fallback: string): string {
  return value && SAFE_FONT.test(value) ? value : fallback;
}

/**
 * Derives the full palette from the few colors worth trusting from a prospect
 * site (background, text, accent) so generated pages stay readable even when
 * the extractor only found a partial theme.
 */
function derivePalette(input: Partial<BrandColors> | undefined): BrandColors {
  const base = DEVIN_THEME.colors;
  const background = safeColor(input?.background, base.background);
  const bgRgb = parseColor(background) ?? (parseColor(base.background) as Rgb);
  const dark = isDark(bgRgb);
  const contrastPole: Rgb = dark ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };

  const text = safeColor(input?.text, dark ? '#f4f4f5' : '#111114');
  const textRgb = parseColor(text) ?? contrastPole;
  const accent = safeColor(input?.accent, base.accent);
  const accentRgb = parseColor(accent) ?? (parseColor(base.accent) as Rgb);

  return {
    background,
    surface: safeColor(input?.surface, toHex(mix(bgRgb, contrastPole, dark ? 0.05 : 0.035))),
    raised: safeColor(input?.raised, toHex(mix(bgRgb, contrastPole, dark ? 0.09 : 0.07))),
    border: safeColor(input?.border, toHex(mix(bgRgb, contrastPole, dark ? 0.16 : 0.13))),
    text,
    muted: safeColor(input?.muted, toHex(mix(textRgb, bgRgb, 0.38))),
    accent,
    accentContrast: safeColor(input?.accentContrast, readableOn(accentRgb)),
    positive: safeColor(input?.positive, dark ? '#34d399' : '#047857'),
    accentSoft: safeColor(input?.accentSoft, rgba(accentRgb, dark ? 0.14 : 0.1)),
  };
}

/** Merges and sanitizes an agent-supplied theme over the Devin defaults. */
export function resolveTheme(input?: BrandThemeInput): BrandTheme {
  const colors = derivePalette(input?.colors);
  const backgroundRgb = parseColor(colors.background);
  const mode = input?.mode ?? (backgroundRgb && !isDark(backgroundRgb) ? 'light' : 'dark');

  return {
    mode,
    colors,
    fonts: {
      heading: safeFont(input?.fonts?.heading, DEFAULT_FONTS.heading),
      body: safeFont(input?.fonts?.body, DEFAULT_FONTS.body),
      mono: safeFont(input?.fonts?.mono, DEFAULT_FONTS.mono),
    },
    radius:
      input?.radius && SAFE_RADIUS.test(input.radius.trim())
        ? input.radius.trim()
        : DEVIN_THEME.radius,
    layout: {
      hero: input?.layout?.hero === 'centered' ? 'centered' : 'left',
      sections: input?.layout?.sections === 'list' ? 'list' : 'cards',
      density: input?.layout?.density === 'compact' ? 'compact' : 'comfortable',
    },
    sourceUrl: input?.sourceUrl,
  };
}

const NEUTRAL_SATURATION = 0.18;

function countColors(css: string): Map<string, number> {
  const counts = new Map<string, number>();
  const pattern = /(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g;
  for (const match of css.matchAll(pattern)) {
    const parsed = parseColor(match[1]);
    if (!parsed) continue;
    const key = toHex(parsed);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function firstDeclaration(css: string, property: string): string | undefined {
  const pattern = new RegExp(`${property}\\s*:\\s*([^;{}!]+)`, 'i');
  return pattern.exec(css)?.[1]?.trim();
}

/**
 * Best-effort theme extraction from a prospect's homepage HTML.
 *
 * Deliberately heuristic and network-free: it reads inline styles, style
 * blocks, and CSS custom properties in the markup it is handed. Anything it
 * cannot determine falls back to the Devin defaults via `resolveTheme`.
 */
export function extractThemeFromHtml(html: string, sourceUrl?: string): BrandThemeInput {
  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => match[1])
    .join('\n');
  const inlineStyles = [...html.matchAll(/style="([^"]*)"/gi)].map((match) => match[1]).join(';');
  const css = `${styleBlocks}\n${inlineStyles}`;

  const background =
    firstDeclaration(css, '--(?:color-)?(?:bg|background)[\\w-]*') ??
    /body\s*{[^}]*background(?:-color)?\s*:\s*([^;}]+)/i.exec(css)?.[1]?.trim();

  const text =
    firstDeclaration(css, '--(?:color-)?(?:text|fg|foreground)[\\w-]*') ??
    /body\s*{[^}]*[^-]color\s*:\s*([^;}]+)/i.exec(css)?.[1]?.trim();

  const declaredAccent =
    firstDeclaration(css, '--(?:color-)?(?:accent|primary|brand)[\\w-]*') ??
    /a\s*{[^}]*[^-]color\s*:\s*([^;}]+)/i.exec(css)?.[1]?.trim();

  // Fall back to the most frequent saturated color in the page's CSS.
  const accent =
    declaredAccent ??
    [...countColors(css).entries()]
      .filter(([hex]) => {
        const parsed = parseColor(hex);
        return parsed !== null && saturation(parsed) > NEUTRAL_SATURATION;
      })
      .sort((a, b) => b[1] - a[1])[0]?.[0];

  const headingFont = firstDeclaration(css, 'font-family');

  const colors: Partial<BrandColors> = {};
  if (background && parseColor(background)) colors.background = background;
  if (text && parseColor(text)) colors.text = text;
  if (accent && parseColor(accent)) colors.accent = accent;

  const fonts: Partial<BrandFonts> = {};
  if (headingFont) {
    fonts.heading = headingFont;
    fonts.body = headingFont;
  }

  const radius = firstDeclaration(css, 'border-radius');
  const centeredHero = /text-align\s*:\s*center/i.test(css);

  return {
    colors: Object.keys(colors).length ? colors : undefined,
    fonts: Object.keys(fonts).length ? fonts : undefined,
    radius: radius && SAFE_RADIUS.test(radius) ? radius : undefined,
    layout: centeredHero ? { hero: 'centered' } : undefined,
    sourceUrl,
  };
}
