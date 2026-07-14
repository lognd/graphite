// Single source of design truth (spec 03.4). Every color/space/type value
// used anywhere in the app must resolve through these tokens -- a raw hex
// or px literal in component code is an eslint error (see eslint.config.js).
//
// This file is read by two generators (scripts/build-tokens.mjs):
//   1. CSS custom properties -> src/tokens/tokens.css (committed, drift-checked)
//   2. the textual mirror -> ../../graphite/tui/tokens.py (committed, drift-checked)
// Edit ONLY this file; never hand-edit either generated output.

export const space = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const radius = {
  none: '0px',
  sm: '2px',
} as const;

export const fontSize = {
  11: '11px',
  12: '12px',
  13: '13px',
  14: '14px',
  16: '16px',
  20: '20px',
} as const;

// Line heights sit on the 4px baseline grid.
export const lineHeight = {
  11: '16px',
  12: '16px',
  13: '16px',
  14: '20px',
  16: '24px',
  20: '28px',
} as const;

export const fontFamily = {
  mono: '"JetBrains Mono", ui-monospace, monospace',
  sans: '"Inter", ui-sans-serif, sans-serif',
} as const;

export const letterSpacing = {
  normal: '0',
  microLabel: '0.08em',
} as const;

export const borderWidth = {
  hairline: '1px',
} as const;

export const motion = {
  fast: '100ms',
  ack: '150ms',
} as const;

// Dark theme is the primary/default palette (spec 03.2).
export const colorDark = {
  paper: '#111417',
  raised: '#171B1F',
  ink: '#D7DEE4',
  inkDim: '#8A949D',
  hairline: '#2A3138',
  accent: '#E8A33D',
  verdict: {
    discharged: '#4CAF6E',
    violated: '#E05252',
    deferred: '#D9B23D',
    acceptedDeviation: '#7A8CE0',
    excluded: '#8A949D',
  },
  // WO-G9 board gerber-layer stack colors (spec 04.1 "any graphic" floor:
  // a legend-backed palette, not ad hoc hex per component). Conventional
  // fab-drawing hues (copper=orange, mask=green, silkscreen=near-white,
  // fab/courtyard=blue/gold outline layers, Edge.Cuts=amber board edge).
  gerberLayer: {
    bCu: '#C87137',
    fCu: '#E8935A',
    bMask: '#4CAF6E',
    fMask: '#6FCB8E',
    bPaste: '#8A949D',
    fPaste: '#B7BEC5',
    bSilkscreen: '#D7DEE4',
    fSilkscreen: '#FFFFFF',
    bFab: '#7A8CE0',
    fFab: '#9CA8EA',
    bCourtyard: '#D9B23D',
    fCourtyard: '#E8CB6E',
    margin: '#E05252',
    edgeCuts: '#E8A33D',
    unknown: '#8A949D',
  },
} as const;

// Light theme reads as an engineering drawing (title-block paper), not a
// bleached dark theme (spec 03.2).
export const colorLight = {
  paper: '#F4F2EC',
  raised: '#FFFFFF',
  ink: '#1A1D20',
  inkDim: '#5B6167',
  hairline: '#C9C4B8',
  // Darkened from the raw amber (#9C6A1E only hits 4.17:1 on the drawing-
  // paper background) so small text at this color clears WCAG AA (spec
  // 04.3's AA-contrast-verified requirement).
  accent: '#8A5A16',
  // deferred and excluded darkened from the charter-suggested values, which
  // read at 3.60:1 and 4.46:1 respectively on the drawing-paper background
  // -- both below the WCAG AA 4.5:1 floor for small text (spec 04.3).
  verdict: {
    discharged: '#2F7D4C',
    violated: '#B23A3A',
    deferred: '#7D5F14',
    acceptedDeviation: '#4B57A8',
    excluded: '#5A5F67',
  },
  // Darkened counterparts of colorDark.gerberLayer for the drawing-paper
  // background (same AA-floor reasoning as `accent`/`verdict` above).
  gerberLayer: {
    bCu: '#8A4A1E',
    fCu: '#A85A28',
    bMask: '#2F7D4C',
    fMask: '#3D9760',
    bPaste: '#5A5F67',
    fPaste: '#767C84',
    bSilkscreen: '#5B6167',
    fSilkscreen: '#1A1D20',
    bFab: '#4B57A8',
    fFab: '#5F6DC4',
    bCourtyard: '#7D5F14',
    fCourtyard: '#96751C',
    margin: '#B23A3A',
    edgeCuts: '#8A5A16',
    unknown: '#5B6167',
  },
} as const;

export const tokens = {
  space,
  radius,
  fontSize,
  lineHeight,
  fontFamily,
  letterSpacing,
  borderWidth,
  motion,
  color: {
    dark: colorDark,
    light: colorLight,
  },
} as const;

export type Tokens = typeof tokens;
