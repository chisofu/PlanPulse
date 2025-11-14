import React from 'react';
import { Mode } from '../../types';
import { themeTokens } from '../../styles/tokens';

type ModeSwitcherProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, onChange }) => {
  const isPricePulse = mode === Mode.PricePulse;
  const personalTokens = themeTokens.modeStyles.pricepulse;
  const enterpriseTokens = themeTokens.modeStyles.budgetpulse;

  return (
    <div
      className="flex items-center p-1 rounded-full"
      style={{ backgroundColor: isPricePulse ? personalTokens.toggleBg : enterpriseTokens.toggleBg }}
      aria-label="Toggle PricePulse or BudgetPulse modes"
    >
      <button
        type="button"
        onClick={() => onChange(Mode.PricePulse)}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
          isPricePulse ? 'text-white shadow-sm' : 'text-slate-600'
        }`}
        style={{
          backgroundColor: isPricePulse ? personalTokens.accentBg : 'transparent',
        }}
      >
        Personal
      </button>
      <button
        type="button"
        onClick={() => onChange(Mode.BudgetPulse)}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
          !isPricePulse ? 'text-white shadow-sm' : 'text-slate-600'
        }`}
        style={{
          backgroundColor: !isPricePulse ? enterpriseTokens.accentBg : 'transparent',
        }}
      >
        Enterprise
      </button>
    </div>
  );
};

export default ModeSwitcher;
