import { Mode } from '../../types';

export interface ModeTheme {
  accentKey: 'pricepulse' | 'budgetpulse';
  accentTextClass: string;
  accentBgClass: string;
  toggleBgClass: string;
}

export const getModeTheme = (mode: Mode): ModeTheme => {
  const isPricePulse = mode === Mode.PricePulse;
  return {
    accentKey: isPricePulse ? 'pricepulse' : 'budgetpulse',
    accentTextClass: isPricePulse ? 'text-pricepulse' : 'text-budgetpulse',
    accentBgClass: isPricePulse ? 'bg-pricepulse' : 'bg-budgetpulse',
    toggleBgClass: isPricePulse ? 'bg-pricepulse-light' : 'bg-budgetpulse-light',
  };
};
