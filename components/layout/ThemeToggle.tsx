import React from 'react';
import { ThemeAppearance } from '../../styles/theme';
import { MoonIcon, SunIcon } from '../Icons';

type ThemeToggleProps = {
  appearance: ThemeAppearance;
  onToggle: () => void;
  accentColorBg: string;
  accentColorText: string;
};

const ThemeToggle: React.FC<ThemeToggleProps> = ({ appearance, onToggle, accentColorBg, accentColorText }) => {
  const isDark = appearance === 'dark';

  const buttonStyles = {
    backgroundColor: isDark ? accentColorBg : 'var(--color-surface-subtle)',
    color: isDark ? accentColorText : 'var(--color-text-muted)',
    borderColor: accentColorBg,
    '--tw-ring-color': accentColorBg,
    '--tw-ring-offset-color': 'var(--color-surface)',
  } as React.CSSProperties & {
    '--tw-ring-color': string;
    '--tw-ring-offset-color': string;
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 theme-transition"
      style={buttonStyles}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      aria-pressed={isDark}
    >
      {isDark ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
      <span className="text-xs font-semibold">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
};

export default ThemeToggle;
