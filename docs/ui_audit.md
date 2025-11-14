# UI Audit vs. Product Blueprint (Sections 2–4)

This audit reviews the current UI flows in `App.tsx` and `components/` against the MVP requirements defined in sections 2–4 of `plan_pulse_blueprint.md`. It highlights implemented coverage and gaps per feature, plus the missing data points required to meet the blueprint.

## Section 2 — MVP Feature Specs

| Blueprint Feature | Current Coverage | Missing Views/Data Points |
| --- | --- | --- |
| **Dual-Mode Interface** | Mode toggle exposed in `Header.tsx`, theming handled by `ModeTheme`. | Role-aware navigation (tabs per role), persistent selection per account, onboarding explainer modal. |
| **Template Library & Discovery** | `TemplateDiscoveryView` provides search, category filters, and variant cards backed by enriched template schema. | Admin publishing tools, template analytics (usage sparkline), inline CMS editing, taxonomy management UI. |
| **Shopping List & Budget Builder** | `list` screen supports CRUD, quick add modal, totals, merchant matches. | Draft vs. quote totals per price source, excluded items tray, export to PDF/WhatsApp, cap management, inline currency badges. |
| **ZPPA Price Index (Free Tier)** | `ZPPAImportPanel` covers staging → prod validation and mock promotion actions. | File upload flow, detailed diff viewer, rollback confirmation dialogs, audit trail export, data freshness banner on consumer screens. |
| **Merchant Portal & Live Pricing** | `MerchantOnboardingDashboard` + `PriceListManagementBoard` show onboarding status, steppers, uploads, validation feedback. | Merchant self-service upload form, document checklist, reminder scheduling UI, SLA escalations, admin approval queue. |
| **Quote Requests & Auto-Proformas** | `QuotesScreen` with `QuoteThread` delivers multi-message thread, status timeline, merchant list. | Quote creation wizard, merchant selection UX, SLA countdown badges, alternative item suggestions, PDF preview. |
| **Purchase Orders & Fulfillment** | `pos` screen lists active POs with status + totals. | PO generation workflow, fulfillment timeline, offline payment instructions, audit log, quick actions (Mark Fulfilled). |
| **Admin Console (Data & Governance)** | ZPPA import governance partially covered. | Metrics dashboards, feature flags, approvals, system alerts, audit trails per entity. |
| **PDF Export & Sharing** | Basic HTML export for lists. | Branded PDF generation, WhatsApp/Telegram share formatting, reference numbers, source footers. |
| **Notification Management** | Not implemented. | Notification settings screen, category toggles, reminder scheduling, merchant stale-price alerts. |
| **BOQ Scanner (OCR)** | Not implemented. | OCR upload entry point, review queue, confidence indicators. |

## Section 3 — System Requirements (Data + UX)

| Requirement | Current Implementation | Gaps |
| --- | --- | --- |
| **Roles & Access** | Mode toggle implies role context but no enforcement. | Explicit role selection, permission gating, admin 2FA screens. |
| **Data Imports** | Mock ZPPA ingestion pipeline with validation issues, promotion, rollback. | Actual file ingest states, schema editor, diff analyzer, CSV/XLSX uploaders, staging vs. prod snapshot comparisons. |
| **Budget/List Engine** | CRUD operations in list builder with price source tagging. | Item flags tray, excluded items view, total caps, unit taxonomy pickers, per-line audit. |
| **Quotes & POs** | Quote thread with messaging timeline; PO list with statuses. | Full status machine actions, proforma generation, SLA countdown, quote-to-PO conversion UI. |
| **Notifications & Auditability** | Not present. | Notification feed, audit log components for templates, imports, merchants. |
| **Performance/Accessibility** | Lightweight components with semantic headings. | Skeleton loading states, keyboard shortcuts, aria-live regions for async updates. |

## Section 4 — Data Models & Schemas

| Data Model | UI Coverage | Missing Data |
| --- | --- | --- |
| **Merchant Profile** | Dashboard surfaces lifecycle status, freshness metrics, contact info. | Reliability score badges, document lists (CoR, TPIN), admin flags. |
| **Merchant Price List** | Upload cards show filename, status, item count, validation issues. | Delta analysis per SKU, guardrail overrides, last updated timestamp per SKU, admin override logging. |
| **ZPPA Price Index** | Import panel exposes status, validation issues, average delta, promotion time. | Dataset version banner in consumer UI, item-level diff viewer, staging vs. prod comparison. |
| **Budget/List Item** | List builder displays description, qty, unit, price source, totals. | Flags tray, inline category taxonomy picker, price source badges (ZPPA label), audit metadata. |
| **Quote & PO Entities** | Quote thread shows messages + timeline; PO list shows totals/status. | Merchant selection metadata, deadline timers, fulfillment notes, delivery terms. |
| **Metrics Store** | Not implemented. | Event instrumentation UI, usage dashboards. |

## Summary

The refactor introduces dedicated modules for template discovery, ZPPA ingestion, merchant operations, and quote messaging—covering core user journeys for PricePulse (personal) and BudgetPulse (enterprise) modes. Remaining blueprint gaps concentrate on admin tooling, notification/audit surfaces, advanced export flows, and deep data governance (diff viewers, overrides, SLA tracking). These areas require additional UI modules once the corresponding service layers land.
