import { Mode } from '../types';
import { colorTokens } from './tokens';

export type ThemeAppearance = 'light' | 'dark';

const accentMap = {
  pricepulse: colorTokens.pricepulse,
  budgetpulse: colorTokens.budgetpulse,
};

const toRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const themePreferenceKey = 'planpulse_theme_preference';

export const resolveInitialAppearance = (): ThemeAppearance => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(themePreferenceKey);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

export const storeAppearancePreference = (appearance: ThemeAppearance) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(themePreferenceKey, appearance);
  } catch (error) {
    console.warn('Failed to persist theme preference', error);
  }
};

export type ModeAccentTokens = {
  accentColorBg: string;
  accentColorText: string;
  accentSurface: string;
};

export const getAllModeAccentTokens = (
  appearance: ThemeAppearance,
): Record<'pricepulse' | 'budgetpulse', ModeAccentTokens> => ({
  pricepulse: {
    accentColorBg: appearance === 'dark' ? accentMap.pricepulse.dark : accentMap.pricepulse.DEFAULT,
    accentColorText: '#ffffff',
    accentSurface:
      appearance === 'dark'
        ? toRgba(colorTokens.pricepulse.DEFAULT, 0.25)
        : colorTokens.pricepulse.light,
  },
  budgetpulse: {
    accentColorBg: appearance === 'dark' ? accentMap.budgetpulse.dark : accentMap.budgetpulse.DEFAULT,
    accentColorText: '#ffffff',
    accentSurface:
      appearance === 'dark'
        ? toRgba(colorTokens.budgetpulse.DEFAULT, 0.25)
        : colorTokens.budgetpulse.light,
  },
});

export const getAccentTokensForMode = (mode: Mode, appearance: ThemeAppearance): ModeAccentTokens => {
  const palette = getAllModeAccentTokens(appearance);
  return mode === Mode.PricePulse ? palette.pricepulse : palette.budgetpulse;
};

export const setDocumentThemeClass = (appearance: ThemeAppearance) => {
  if (typeof document === 'undefined') {
    return;
  }
  const className = appearance === 'dark' ? 'theme-dark' : 'theme-light';
  document.documentElement.classList.remove('theme-light', 'theme-dark');
  document.documentElement.classList.add(className);
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add(className);
};

export const syncAccentCssVariables = (mode: Mode, appearance: ThemeAppearance) => {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  const tokens = getAccentTokensForMode(mode, appearance);
  root.style.setProperty('--accent-color-bg', tokens.accentColorBg);
  root.style.setProperty('--accent-color-text', tokens.accentColorText);
  root.style.setProperty('--accent-color-soft', tokens.accentSurface);
};
