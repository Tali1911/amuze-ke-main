import React from 'react';

export type TypographyFont =
  | 'inherit'
  | 'playfair'
  | 'inter'
  | 'georgia'
  | 'system-serif'
  | 'system-sans'
  | 'mono';

export type TypographySize =
  | 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';

export type TypographyWeight =
  | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

export type TypographyAlign = 'left' | 'center' | 'right';

export interface TypographyStyle {
  fontFamily?: TypographyFont;
  fontSize?: TypographySize;
  fontWeight?: TypographyWeight;
  align?: TypographyAlign;
  color?: string; // hex or css color
}

export const TYPOGRAPHY_FONT_OPTIONS: { value: TypographyFont; label: string; css: string }[] = [
  { value: 'inherit', label: 'Default (page style)', css: 'inherit' },
  { value: 'playfair', label: 'Playfair Display (serif)', css: "'Playfair Display', Georgia, serif" },
  { value: 'inter', label: 'Inter (sans-serif)', css: "'Inter', system-ui, sans-serif" },
  { value: 'georgia', label: 'Georgia (serif)', css: 'Georgia, serif' },
  { value: 'system-serif', label: 'System serif', css: 'ui-serif, Georgia, serif' },
  { value: 'system-sans', label: 'System sans', css: 'ui-sans-serif, system-ui, sans-serif' },
  { value: 'mono', label: 'Monospace', css: 'ui-monospace, SFMono-Regular, monospace' },
];

export const TYPOGRAPHY_SIZE_OPTIONS: { value: TypographySize; label: string; rem: string }[] = [
  { value: 'xs',   label: 'Extra small', rem: '0.75rem' },
  { value: 'sm',   label: 'Small',       rem: '0.875rem' },
  { value: 'base', label: 'Base',        rem: '1rem' },
  { value: 'lg',   label: 'Large',       rem: '1.125rem' },
  { value: 'xl',   label: 'XL',          rem: '1.25rem' },
  { value: '2xl',  label: '2XL',         rem: '1.5rem' },
  { value: '3xl',  label: '3XL',         rem: '1.875rem' },
  { value: '4xl',  label: '4XL',         rem: '2.25rem' },
  { value: '5xl',  label: '5XL',         rem: '3rem' },
  { value: '6xl',  label: '6XL',         rem: '3.75rem' },
];

export const TYPOGRAPHY_WEIGHT_OPTIONS: { value: TypographyWeight; label: string; num: number }[] = [
  { value: 'light',     label: 'Light',       num: 300 },
  { value: 'regular',   label: 'Regular',     num: 400 },
  { value: 'medium',    label: 'Medium',      num: 500 },
  { value: 'semibold',  label: 'Semibold',    num: 600 },
  { value: 'bold',      label: 'Bold',        num: 700 },
  { value: 'extrabold', label: 'Extra bold',  num: 800 },
];

export const TYPOGRAPHY_COLOR_SWATCHES: { value: string; label: string }[] = [
  { value: '#2b4321', label: 'Forest 900' },
  { value: '#3f6a2f', label: 'Forest 700' },
  { value: '#c9a25b', label: 'Secondary' },
  { value: '#4bb3ea', label: 'Accent (sky)' },
  { value: '#1f2937', label: 'Slate 800' },
  { value: '#6b7280', label: 'Muted' },
  { value: '#ffffff', label: 'White' },
  { value: '#000000', label: 'Black' },
];

export function typographyToStyle(style?: TypographyStyle | null): React.CSSProperties {
  if (!style) return {};
  const out: React.CSSProperties = {};

  if (style.fontFamily) {
    const opt = TYPOGRAPHY_FONT_OPTIONS.find(o => o.value === style.fontFamily);
    if (opt && opt.value !== 'inherit') out.fontFamily = opt.css;
  }
  if (style.fontSize) {
    const opt = TYPOGRAPHY_SIZE_OPTIONS.find(o => o.value === style.fontSize);
    if (opt) out.fontSize = opt.rem;
  }
  if (style.fontWeight) {
    const opt = TYPOGRAPHY_WEIGHT_OPTIONS.find(o => o.value === style.fontWeight);
    if (opt) out.fontWeight = opt.num;
  }
  if (style.align) out.textAlign = style.align;
  if (style.color) out.color = style.color;

  return out;
}

/** Returns true when any typography value is actually set. */
export function hasTypography(style?: TypographyStyle | null): boolean {
  if (!style) return false;
  return !!(style.fontFamily || style.fontSize || style.fontWeight || style.align || style.color);
}
