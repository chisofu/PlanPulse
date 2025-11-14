import React from 'react';
import { Mode } from '../../types';
import ModeSwitcher from './ModeSwitcher';
import NavigationRail, { NavigationItem } from './NavigationRail';
import ThemeToggle from './ThemeToggle';
import { ThemeAppearance, getAccentTokensForMode } from '../../styles/theme';

interface AppShellProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  appearance: ThemeAppearance;
  onThemeToggle: () => void;
  navigation: NavigationItem[];
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  navigationFooter?: React.ReactNode;
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({
  mode,
  onModeChange,
  navigation,
  title,
  subtitle,
  showBack,
  onBack,
  actions,
  navigationFooter,
  children,
  appearance,
  onThemeToggle,
}) => {
  const accentTokens = getAccentTokensForMode(mode, appearance);
  return (
    <div className="min-h-screen bg-slate-50 flex theme-transition">
      <NavigationRail items={navigation} footer={navigationFooter} />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="text-slate-500 hover:text-slate-800"
                  aria-label="Go back"
                >
                  ←
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500 truncate">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <ModeSwitcher mode={mode} onChange={onModeChange} appearance={appearance} />
              <ThemeToggle
                appearance={appearance}
                onToggle={onThemeToggle}
                accentColorBg={accentTokens.accentColorBg}
                accentColorText={accentTokens.accentColorText}
              />
              {actions}
              <img src="https://picsum.photos/seed/user/40" alt="User" className="w-10 h-10 rounded-full" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
