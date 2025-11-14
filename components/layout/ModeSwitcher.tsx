import React from 'react';
import { Mode } from '../../types';
import { ThemeAppearance, getAllModeAccentTokens } from '../../styles/theme';

type ModeSwitcherProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
  appearance: ThemeAppearance;
};

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, onChange, appearance }) => {
  const isPricePulse = mode === Mode.PricePulse;
  const accentTokens = getAllModeAccentTokens(appearance);
  const personalTokens = accentTokens.pricepulse;
  const enterpriseTokens = accentTokens.budgetpulse;

  return (
    <div
      className="flex items-center p-1 rounded-full border theme-transition"
      style={{
        backgroundColor: 'var(--color-surface-subtle)',
        borderColor: 'var(--color-border)',
      }}
      aria-label="Toggle PricePulse or BudgetPulse modes"
    >
      <button
        type="button"
        onClick={() => onChange(Mode.PricePulse)}
        className="px-3 py-1 text-sm font-semibold rounded-full transition-colors border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          backgroundColor: isPricePulse ? personalTokens.accentColorBg : 'transparent',
          color: isPricePulse ? personalTokens.accentColorText : personalTokens.accentColorBg,
          borderColor: personalTokens.accentColorBg,
          '--tw-ring-color': personalTokens.accentColorBg,
          '--tw-ring-offset-color': 'var(--color-surface)',
        } as React.CSSProperties & {
          '--tw-ring-color': string;
          '--tw-ring-offset-color': string;
        }}
        aria-pressed={isPricePulse}
      >
        Personal
      </button>
      <button
        type="button"
        onClick={() => onChange(Mode.BudgetPulse)}
        className="px-3 py-1 text-sm font-semibold rounded-full transition-colors border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          backgroundColor: !isPricePulse ? enterpriseTokens.accentColorBg : 'transparent',
          color: !isPricePulse ? enterpriseTokens.accentColorText : enterpriseTokens.accentColorBg,
          borderColor: enterpriseTokens.accentColorBg,
          '--tw-ring-color': enterpriseTokens.accentColorBg,
          '--tw-ring-offset-color': 'var(--color-surface)',
        } as React.CSSProperties & {
          '--tw-ring-color': string;
          '--tw-ring-offset-color': string;
        }}
        aria-pressed={!isPricePulse}
      >
        Enterprise
      </button>
    </div>
  );
};

export default ModeSwitcher;
