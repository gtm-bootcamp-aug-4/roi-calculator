export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  blue: '#0000ff',
  green: '#008000',
  gray: '#808080',
  grey: '#808080',
  navy: '#000080',
  orange: '#ffa500',
  purple: '#800080',
  teal: '#008080',
  yellow: '#ffff00',
};

function clamp255(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

/** Parses hex, rgb(), rgba() and a small set of named colors. */
export function parseColor(value: string): Rgb | null {
  const input = value.trim().toLowerCase();
  const named = NAMED_COLORS[input];
  const candidate = named ?? input;

  const hex = /^#([0-9a-f]{3,8})$/.exec(candidate);
  if (hex) {
    const digits = hex[1];
    if (digits.length === 3 || digits.length === 4) {
      return {
        r: parseInt(digits[0] + digits[0], 16),
        g: parseInt(digits[1] + digits[1], 16),
        b: parseInt(digits[2] + digits[2], 16),
      };
    }
    if (digits.length === 6 || digits.length === 8) {
      return {
        r: parseInt(digits.slice(0, 2), 16),
        g: parseInt(digits.slice(2, 4), 16),
        b: parseInt(digits.slice(4, 6), 16),
      };
    }
    return null;
  }

  const fn = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(candidate);
  if (fn) {
    return { r: clamp255(Number(fn[1])), g: clamp255(Number(fn[2])), b: clamp255(Number(fn[3])) };
  }

  return null;
}

export function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((c) => clamp255(c).toString(16).padStart(2, '0')).join('')}`;
}

/** Relative luminance per WCAG 2.1. */
export function luminance({ r, g, b }: Rgb): number {
  const channel = (raw: number): number => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function isDark(color: Rgb): boolean {
  return luminance(color) < 0.35;
}

/** Linear mix; `amount` is the share of `to`. */
export function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  const t = Math.min(1, Math.max(0, amount));
  return {
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t,
  };
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Black or white, whichever is readable on `background`. White wins ties and
 * near-ties: brand accents conventionally carry light labels, so it is only
 * dropped when it is meaningfully harder to read.
 */
export function readableOn(background: Rgb): string {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 17, g: 17, b: 17 };
  const onWhite = contrastRatio(background, white);
  if (onWhite >= 4) return toHex(white);
  return onWhite >= contrastRatio(background, black) ? toHex(white) : toHex(black);
}

/** Saturation in HSL terms, used to tell brand colors from neutrals. */
export function saturation({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const lightness = (max + min) / 2;
  if (max === min) return 0;
  return lightness > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
}

export function rgba(color: Rgb, alpha: number): string {
  return `rgba(${clamp255(color.r)}, ${clamp255(color.g)}, ${clamp255(color.b)}, ${alpha})`;
}
