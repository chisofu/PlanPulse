# PlanPulse Architecture Overview

## Module Structure
- `components/layout/`: Shared layout primitives including `AppShell`, `NavigationRail`, and `ModeSwitcher`. These components orchestrate global chrome (header, navigation, avatar) and respond to theme tokens for both PricePulse and BudgetPulse modes.
- `styles/tokens.ts`: Centralized design tokens covering color palettes, spacing scale, typography, and computed dual-mode accents. Components reference these tokens for consistent theming instead of hard-coded class combinations.
- `screens/`: Route-level presentation components (dashboard, templates, list builder, quotes, purchase orders, merchants, admin). Each module manages its own local UI state while reading/writing shared data via the global store.
- `store/`: Zustand-inspired state container built with `createStore` and `planPulseStore`. It exposes selectors and mutation helpers for lists, quotes, purchase orders, templates, and mode toggling without external dependencies.
- `routes/`: Route configuration metadata that powers navigation and routing layout decisions.
- `vendor/`: Thin re-export of React Router DOM sourced from CDN to satisfy routing requirements in the constrained environment.

## Routing Map
The application uses React Router v6 semantics with two primary surfaces:

- `/pricepulse`
  - `/dashboard` – Personal (PricePulse) landing overview.
  - `/templates` – Template library shared with enterprise.
  - `/lists` – List builder experience.
  - `/quotes` – Accessible for consistency (limited features for personal mode).
  - `/purchase-orders` – Read-only view for reuse of layout.
  - `/purchase-orders/new/:quoteId` – PO creation wizard from a quote.
  - `/merchants` – Shared merchant directory.
  - `/admin` – Placeholder administrative controls (primarily for enterprise).

- `/budgetpulse`
  - Mirrors the same nested structure with enterprise-first defaults.

The root path redirects to `/pricepulse/dashboard`. Mode switching triggers navigation to the corresponding surface dashboard while preserving global layout via `AppShell`.

## Global State Strategy
We evaluated three candidates for shared state management:

| Option | Pros | Cons |
| --- | --- | --- |
| **Redux Toolkit** | Familiar slice-based model, excellent DevTools ecosystem, ergonomic immutable updates. | Requires additional packages (restricted in current environment), boilerplate for async data and selectors. |
| **Zustand** | Minimal boilerplate, hook-first API, easy to compose domain stores. | Still external dependency, lacks built-in action typing without extra utilities. |
| **React Query** | Powerful for server-state synchronization, caching, and background refresh. | Overkill for current mock-driven data, still needs companion solution for client-state like mode toggles and list drafting. |

**Selected approach:** a lightweight Zustand-style store implemented via `createStore` using `useSyncExternalStore`. This provides predictable state updates, memo-friendly selectors, and avoids additional dependencies while keeping the API close to Zustand for future migration. The `planPulseStore` exposes actions for list CRUD, quote conversations, purchase-order ingestion, and mode switching so route components remain declarative.

## Future Code-Splitting
Routes are defined declaratively, making it straightforward to wrap screen imports with `React.lazy` or dynamic `import()` once module boundaries solidify. `AppShell` already renders an `<Outlet>` for nested routes, so each route can be code-split independently without touching the shared layout.
