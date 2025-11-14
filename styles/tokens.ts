export const colorTokens = {
  pricepulse: {
    DEFAULT: '#0d9488',
    light: '#ccfbf1',
    dark: '#115e59',
  },
  budgetpulse: {
    DEFAULT: '#4f46e5',
    light: '#e0e7ff',
    dark: '#3730a3',
  },
  neutrals: {
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    muted: '#475569',
  },
};

export const spacingTokens = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

export const typographyTokens = {
  fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  heading: {
    h1: '2.25rem',
    h2: '1.875rem',
    h3: '1.5rem',
    subtitle: '1.125rem',
  },
  body: {
    regular: '1rem',
    small: '0.875rem',
  },
};

export const themeTokens = {
  modeStyles: {
    pricepulse: {
      accentBg: colorTokens.pricepulse.DEFAULT,
      accentSurface: colorTokens.pricepulse.light,
      accentText: '#ffffff',
      toggleBg: colorTokens.pricepulse.light,
    },
    budgetpulse: {
      accentBg: colorTokens.budgetpulse.DEFAULT,
      accentSurface: colorTokens.budgetpulse.light,
      accentText: '#ffffff',
      toggleBg: colorTokens.budgetpulse.light,
    },
  },
};

export type ThemeModeKey = keyof typeof themeTokens.modeStyles;
