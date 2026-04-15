import { describe, expect, it } from 'vitest';
import { tokens } from './tokens';

const MANDATORY_PALETTE = new Set([
  '#01646D',
  '#E16A3D',
  '#81923D',
  '#2E2E2E',
  '#E5E5E5',
  '#FFA45D'
]);

const collectHexValues = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];

  return Object.values(value as Record<string, unknown>).flatMap(collectHexValues);
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const bigint = Number.parseInt(normalized, 16);

  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
};

const relativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const transform = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
};

const contrastRatio = (foregroundHex: string, backgroundHex: string) => {
  const foreground = relativeLuminance(hexToRgb(foregroundHex));
  const background = relativeLuminance(hexToRgb(backgroundHex));

  const lighter = Math.max(foreground, background);
  const darker = Math.min(foreground, background);

  return (lighter + 0.05) / (darker + 0.05);
};

describe('tokens', () => {
  it('usa exclusivamente la paleta obligatoria en todos los tokens', () => {
    const allTokenColors = collectHexValues(tokens);

    expect(allTokenColors.length).toBeGreaterThan(0);

    for (const color of allTokenColors) {
      expect(MANDATORY_PALETTE.has(color)).toBe(true);
    }
  });

  it('expone exactamente los 6 colores obligatorios en palette', () => {
    const paletteValues = Object.values(tokens.palette);

    expect(new Set(paletteValues)).toEqual(MANDATORY_PALETTE);
    expect(paletteValues).toHaveLength(6);
  });

  it('mantiene contraste AA mínimo para pares principales de texto', () => {
    expect(contrastRatio(tokens.text.primary, tokens.surface.base)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokens.text.onDark, tokens.surface.sidebar)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokens.text.primary, tokens.surface.subtle)).toBeGreaterThanOrEqual(4.5);
  });
});
