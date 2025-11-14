import React from 'react';
import { Mode } from '../../types';
import { ArrowLeftIcon } from '../Icons';
import { getModeTheme } from './ModeTheme';

type Screen = 'dashboard' | 'templates' | 'list' | 'quotes' | 'pos' | 'po-creation' | 'imports' | 'merchants';

interface HeaderProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  activeScreen: Screen;
  onBack: () => void;
  screenTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ mode, setMode, activeScreen, onBack, screenTitle }) => {
  const theme = getModeTheme(mode);
  const isPricePulse = mode === Mode.PricePulse;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {activeScreen !== 'dashboard' && (
            <button onClick={onBack} className="text-slate-500 hover:text-slate-800" aria-label="Back to dashboard">
              <ArrowLeftIcon />
            </button>
          )}
          <div>
            <h1 className={`text-xl font-bold ${theme.accentTextClass}`}>PlanPulse</h1>
            {screenTitle && <p className="text-sm text-slate-500 truncate">{screenTitle}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className={`flex items-center p-1 rounded-full ${theme.toggleBgClass}`} role="tablist" aria-label="Switch mode">
            <button
              onClick={() => setMode(Mode.PricePulse)}
              className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
                isPricePulse ? `${theme.accentBgClass} text-white` : 'text-slate-600'
              }`}
              role="tab"
              aria-selected={isPricePulse}
            >
              Personal
            </button>
            <button
              onClick={() => setMode(Mode.BudgetPulse)}
              className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
                !isPricePulse ? `${theme.accentBgClass} text-white` : 'text-slate-600'
              }`}
              role="tab"
              aria-selected={!isPricePulse}
            >
              Enterprise
            </button>
          </div>
          <img src="https://picsum.photos/seed/user/40" alt="User" className="w-10 h-10 rounded-full" />
        </div>
      </div>
    </header>
  );
};

export type { Screen };
