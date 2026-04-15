const PALETTE = {
  primary: '#01646D',
  secondary: '#E16A3D',
  accent: '#81923D',
  black: '#2E2E2E',
  white: '#E5E5E5',
  highlight: '#FFA45D'
} as const;

export type PaletteToken = (typeof PALETTE)[keyof typeof PALETTE];

export const tokens = {
  palette: PALETTE,
  surface: {
    base: PALETTE.white,
    subtle: PALETTE.highlight,
    sidebar: PALETTE.primary,
    topbar: PALETTE.white
  },
  text: {
    primary: PALETTE.black,
    onDark: PALETTE.white,
    muted: PALETTE.primary
  },
  action: {
    primary: PALETTE.secondary,
    primaryContrast: PALETTE.white
  },
  status: {
    success: PALETTE.accent,
    warning: PALETTE.highlight,
    danger: PALETTE.secondary
  }
} as const;

export type DesignTokens = typeof tokens;
