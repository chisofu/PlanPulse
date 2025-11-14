import React, { useContext } from 'react';
import { ThemeAppearance } from './theme';

const ThemeAppearanceContext = React.createContext<ThemeAppearance>('light');

export const ThemeAppearanceProvider = ThemeAppearanceContext.Provider;

export const useThemeAppearance = () => useContext(ThemeAppearanceContext);
