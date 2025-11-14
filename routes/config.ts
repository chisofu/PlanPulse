import React from 'react';
import { Mode } from '../types';

export type RouteKey =
  | 'dashboard'
  | 'templates'
  | 'lists'
  | 'quotes'
  | 'pos'
  | 'merchants'
  | 'admin'
  | 'settings';

export type SurfaceRoute = {
  key: RouteKey;
  path: string;
  label: string;
  modeVisibility: Mode[];
};

export const surfaceRoutes: SurfaceRoute[] = [
  { key: 'dashboard', path: 'dashboard', label: 'Dashboard', modeVisibility: [Mode.PricePulse, Mode.BudgetPulse] },
  { key: 'templates', path: 'templates', label: 'Templates', modeVisibility: [Mode.PricePulse, Mode.BudgetPulse] },
  { key: 'lists', path: 'lists', label: 'Lists', modeVisibility: [Mode.PricePulse, Mode.BudgetPulse] },
  { key: 'quotes', path: 'quotes', label: 'Quotes', modeVisibility: [Mode.BudgetPulse] },
  { key: 'pos', path: 'purchase-orders', label: 'Purchase Orders', modeVisibility: [Mode.BudgetPulse] },
  { key: 'merchants', path: 'merchants', label: 'Merchants', modeVisibility: [Mode.PricePulse, Mode.BudgetPulse] },
  { key: 'admin', path: 'admin', label: 'Admin', modeVisibility: [Mode.BudgetPulse] },
  { key: 'settings', path: 'settings', label: 'Settings', modeVisibility: [Mode.PricePulse, Mode.BudgetPulse] },
];

export type RouteConfigEntry = {
  surface: Mode;
  basePath: string;
  routes: SurfaceRoute[];
};

export const routeConfigs: RouteConfigEntry[] = [
  {
    surface: Mode.PricePulse,
    basePath: '/pricepulse',
    routes: surfaceRoutes,
  },
  {
    surface: Mode.BudgetPulse,
    basePath: '/budgetpulse',
    routes: surfaceRoutes,
  },
];
