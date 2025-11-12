# Product Blueprint — PlanPulse (Integrated Final MVP v1.1)

> **Vibe planning before vibe coding — because great builds start with great blueprints.**

## 0) Why this version?
This document merges the strongest ideas from the prior spec and the latest VPM blueprint into one **single source of truth** for handoff. It preserves the **minimal, Google-Keep-Note-style UI**, adds **enterprise-grade procurement flows**, and tightens **data governance** for Zambian merchants and ZPPA price indices. It also clarifies monetization and success metrics.

---

## 1) Executive Summary
**Product:** **PlanPulse** — a unified platform with two modes in one account:
- **PricePulse (Personal):** fast, text-first budgeting and shopping lists with templates and price estimates.
- **BudgetPulse (Enterprise):** quote requests, auto-proformas, and purchase orders (POs) with merchant fulfillment tracking.

**Problem:** People and procurement officers in Zambia struggle to get accurate, current prices and official documents without manual visits, spreadsheets, or paper quotes.

**Solution:** PlanPulse uses the **ZPPA market price index** (quarterly) for free estimates and **live merchant pricing** (admin-verified) for premium precision. Users generate lists, budgets, BOQs, quotes, and POs in minutes — all in **Kwacha (K)** — and export to PDF or chat-ready text.

**Primary Users:** Individuals/families, procurement officers, merchants/suppliers, administrators.

**UVP:** **Planning-first, text-centric UX** that mirrors real human planning; **compliance-ready procurement** powered by verified merchant data and governance tools.

**North Star:** Trusted, current prices that reduce friction and paperwork across Zambia’s procurement and everyday planning.

**MVP Success Targets (first 90 days):**
- **Merchants:** 50–100 verified, with ≤30-day median price update cadence.
- **Usage:** ≥500 generated lists; ≥15–25 quotes/month from procurement users; ≥30% quote→PO conversion.
- **Reliability:** ≤5% import rollbacks; auto-proforma/PO generation ≤5s for ≤200 lines.
- **Love:** NPS ≥30 from pilot cohorts; visible community buzz.

---

## 2) MVP Feature Specs (Integrated)

| # | Feature | User Story | Acceptance Criteria | Priority | Dependencies | UX Notes |
|---|---|---|---|---|---|---|
| 1 | **Dual-Mode Interface** | As a user, I can switch between **PricePulse** and **BudgetPulse** without logging out. | Role-aware menus; persistent data; clear mode indicator (accent color + label). | P0 | Auth & roles | Top-right toggle; onboarding explainer for modes. |
| 2 | **Template Library & Discovery** | As a planner, I can find templates (e.g., *school budget*) with **Essentials/Standard/Full** variants. | Search & category filters; template variants with predefined items/quantities; admin can publish/update templates. | P0 | Template CMS | Keep-like card grid; optional emoji category markers. |
| 3 | **Shopping List & Budget Builder** | As a user, I can edit items/qty, set caps, and see estimates. | Inline editing; Draft Total vs Quote Total; export to PDF/chat; price-source badge (ZPPA vs Merchant). | P0 | Price service; PDF | Minimalist list rows; excluded items tray. |
| 4 | **ZPPA Price Index (Free Tier)** | As a free user, I see estimates from the current ZPPA dataset. | Admin uploads validated CSV/XLSX to staging → promote to prod; visible timestamp/source. | P0 | Admin Console | Always show `K` currency; last-updated label. |
| 5 | **Merchant Portal & Live Pricing** | As a merchant, I can self-onboard and upload price lists. | Stepper onboarding; docs upload; CSV/XLSX validator; admin approval; freshness reminders; status (Up-to-date/Due/Stale/Suspended). | P0 | Validation svc; Scheduler | Dashboard cards; gentle reminders at 14 & 3 days pre-stale; auto-suspend after 60 days. |
| 6 | **Quote Requests & Auto-Proformas** | As a procurement officer, I can submit lists/BOQs to merchants and get proformas. | Select 1–3 merchants; auto-proforma PDF with branded template; status timeline; alternatives for unavailable items when data exists. | P0 | Merchant data; PDF | Timeline view; SLA countdown badges; per-quote chat thread. |
| 7 | **Purchase Orders & Fulfillment** | As a buyer, I can convert finalized quotes to POs and track fulfillment. | Generate PO from quote; offline payment instructions; merchant marks Delivered/Partial/Delayed; audit log. | P0 | PDF; Notifications | Quick actions: *Generate PO*, *Mark Fulfilled*. |
| 8 | **Admin Console (Data & Governance)** | As an admin, I manage imports, approvals, metrics, and flags. | Staging→prod imports with rollback; merchant approvals; audit logs; feature flags; metrics (SLA, conversion, reliability). | P0 | Storage; Analytics | Prominent version banner; validation warnings prior to activation. |
| 9 | **PDF Export & Sharing** | As any user, I export budgets, quotes, and POs. | Branded PDFs (buyer logo for POs), timestamps, reference numbers, and price-source footers; WhatsApp/Telegram text export. | P0 | PDF templates | One-click export; consistent design tokens. |
|10 | **Notification Management** | As a user, I get timely, relevant updates. | App push with consent; categories (quotes, prices, admin); merchant reminders; admin broadcasts. | P1 | Push svc | Settings toggles; concise copy. |
|11 | **BOQ Scanner (OCR)** | As a buyer, I digitize paper BOQs. | Image/file upload → parsed items to list; confidence threshold with manual review. | P2 | OCR API | Add later after MVP stability. |

---

## 3) System Requirements

### 3.1 Functional
- **Roles & Access:** Individual, Merchant, Procurement Officer, Admin. Admins require 2FA.
- **Data Imports:**
  - **ZPPA:** Admin-only CSV/XLSX upload → staging checks (schema, bounds, outliers) → promote to prod → 1-click rollback.
  - **Merchants:** Portal CSV/XLSX upload; schema & bounds validation; large diffs (±30%) require admin override; freshness tracking.
- **Budget/List Engine:** CRUD for items with description, category, unit, qty, unit price, total; Draft vs Quote totals; price source tagging.
- **Quotes & POs:** Status machine: Draft → Submitted → Auto-Proforma → Merchant Acknowledged → Merchant Adjusted (opt) → Finalized → **PO Issued** → Fulfilled/Partial/Delayed → Converted/Expired/Withdrawn. Per-quote chat with moderation and audit trail.
- **Notifications:** Push for quote/PO milestones; merchant stale-price reminders; admin broadcasts. (Email/SMS post-MVP.)
- **Auditability:** Change logs for templates, price lists, quotes, POs, imports, and approvals with actor + timestamp.

### 3.2 Non-Functional
- **Performance:**
  - Auto-proforma/PO generation ≤ **5s** for ≤200 line items.
  - Dashboard loads ≤ **2s** on broadband; list filtering under **2s** for 10k SKUs.
- **Scalability:** Support 10k active lists, 5k quotes, 1k concurrent users; price & PDF services horizontally scalable.
- **Security:** Role-based permissions; 2FA for admins; encrypt docs in transit/at rest; sanitized uploads; virus scans.
- **Data Privacy & Locality:** Follow Zambia data protection norms; capture consent in EULA; **timestamps in Central Africa Time**; redact PII in exports by default.
- **Reliability:** Daily backups; rollback within 5 minutes of issue; SLA monitors with retries every 5 minutes.
- **Accessibility:** WCAG 2.1 AA; keyboard equivalents for swipe actions; text alternatives for emoji icons.

### 3.3 UX Guidelines
- **Design Language:** Minimalist, text-forward, Keep-style card grid; mode-specific accent colors (e.g., teal for PricePulse, indigo for BudgetPulse).
- **Information Architecture:** Tabs (role-aware): Dashboard, Templates, Lists, Quotes, POs, Merchants, Admin.
- **States:** Loading skeletons; Empty guidance; Error with retry; Success confirmations with deep-links.
- **Currency:** Always **Zambian Kwacha** prefixed by **K** (e.g., **K5.20**). Never show other currencies.
- **Progressive Disclosure:** Start simple (list) → deepen (budget) → formalize (quote/PO).

---

## 4) Data Models & Schemas (MVP)

### 4.1 Merchant Profile
- **Fields:** Business Name, Legal Name, Tax ID (optional), Supply Category (from controlled list), Province/Town/District/Address, Phone(s), Email(s), Principal Contact, Documents (CoR, TPIN, etc.), Reliability Score.
- **States:** Pending Docs → In Review → Approved → Live → Suspended.

### 4.2 Merchant Price List (CSV/XLSX)
| Field | Type | Example | Validation |
|---|---|---|---|
| SKU | Text | 100045 | Required, unique per merchant |
| Item Name | Text | Cement 50kg | Required |
| Unit | Enum | Bag | Required |
| Pack Size | Text | 50kg | Optional |
| Category | Enum | Building Materials | From taxonomy |
| Price | Decimal(10,2) | 180.00 | ≥0; ±30% guard vs last upload -> admin review |
| Last Updated | Date | 2025-09-30 | Auto-stamped on acceptance |

**Freshness Rules:** Reminder at **T-14** and **T-3** days before the **60-day** stale threshold; auto-suspend on day 60 if no update.

### 4.3 ZPPA Price Index (CSV/XLSX)
| Field | Type | Example |
|---|---|---|
| Item Name | Text | Cement 50kg |
| Category | Enum | Building Materials |
| Average Price | Decimal(10,2) | 175.00 |
| Source Label | Text | ZPPA 2025 Q1 |
| Last Updated | Date | 2025-03-31 |

### 4.4 Budget/List/BOQ Item
| Field | Type | Notes |
|---|---|---|
| Item ID | UUID | Internal |
| List/BOQ ID | UUID | Owner linkage |
| Description | Text | Free text |
| Category | Enum | Taxonomy-backed |
| Unit | Enum | Bag/Each/Box/etc. |
| Quantity | Decimal(10,2) | ≥0 |
| Unit Price | Decimal(10,2) | From ZPPA or Merchant |
| Price Source | Enum | ZPPA/Merchant |
| Line Total | Decimal(10,2) | Quantity × Unit Price |
| Flags | Set | Crossed/Excluded |

### 4.5 Quote & PO Entities
- **Quote:** id, requester, merchants[1..3], status, items snapshot, generated proforma ref, chat thread id, deadlines/SLA.
- **PO:** id, quote ref, buyer profile/logo, seller profile/logo, delivery terms, payment instructions, fulfillment status + notes.

### 4.6 Metrics Store (MVP)
- Events: template_search, template_instantiate, list_create, item_update, exclude_toggle, export_pdf, quote_submit, proforma_generated, quote_ack, quote_finalize, po_issue, fulfill_update.

---

## 5) Monetization (Hybrid)
- **Free:** Templates, budgets, ZPPA-based estimates, 1 free quote request per month per procurement user.
- **Premium Subscription (Buyer-side):** Live merchant pricing, unlimited quotes, advanced export branding, priority support.
- **Merchant Plan:** Free onboarding + visibility; optional **Pro** for analytics badges and promotion placement (post-MVP).
- **Transaction Fees (Phase 2):** Small fee on PO conversions (subject to legal review).

---

## 6) MVP Roadmap & Roles

### Milestone 0 — Foundation & Risk Spikes (Weeks 0–3)
- CSV/XLSX validators (schema, bounds, outliers, diff checks).
- Data model design (imports, prices, templates, quotes/POs, audit logs).
- Dual-mode skeleton UI and auth/roles.

**Roles:**
- **VPM:** Flow definitions, metric plan, success criteria.
- **UX:** Wireframes (Keep-style), mode toggle, status timelines.
- **Architect:** Data schema, storage, background jobs, audit trail.
- **Codegen:** Validators, import pipeline (staging→prod→rollback), base UI.
- **QA:** Validation suites, accessibility keyboard paths.
- **Ops:** Backups, monitoring, alerting.

### Milestone 1 — Walking Skeleton (Weeks 4–8)
- Template library, list/budget builder, ZPPA imports, merchant onboarding, admin approvals.
- Quote request → auto-proforma; PDF templates; push notifications (quotes only).

### Milestone 2 — Polish & KPI Check (Weeks 9–12)
- PO generation & fulfillment tracking; metrics dashboards; merchant freshness reminders; PDF/chat exports; usability passes.
- Pilot with 20–30 merchants; iterate on reliability score and SLA alerts.

**Go/No-Go Gates:** Auto-proforma ≤5s; ≥5 live merchants with current lists; end-to-end quote→PO path verified; rollback tested.

---

## 7) KPIs, OKRs & Measurement
- **Acquisition/Activation:**
  - *A1:* ≥60% of new users complete template→list flow.
  - *A2:* ≥40% quote acknowledgment within 4 business hours.
- **Engagement/Conversion:**
  - *E1:* ≥500 lists in first quarter; ≥15–25 quotes/month; ≥30% quote→PO conversion.
  - *E2:* Merchant price freshness median ≤30 days; merchant retention ≥70% @90 days.
- **Reliability/Quality:**
  - *R1:* ≤5% import rollbacks; notification opt-out ≤15%.
- **Delight/Advocacy:**
  - *D1:* NPS ≥30; anecdotal social buzz and mentions.

**Instrumentation:** Event tracking for all core flows; admin dashboards with time-series, funnels, and reliability distributions.

---

## 8) Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Merchant verification bottleneck | Med | High | Batch review queue, SLAs, auto-reminders, partial approvals by category. |
| Data staleness erodes trust | Med | High | Visible last-updated, freshness badges, reminders, auto-suspend. |
| Dual-mode complexity confuses users | Med | Med | First-run tutorials, clear color accents, contextual tips. |
| Import failures or bad data | Low | High | Staging validation, rollback, change logs, bounds rules, alerts. |
| Low conversion to PO | Med | Med | Improve auto-alternatives, merchant incentives, buyer education. |
| Legal/privacy gaps | Low | High | EULA consent for data; Zambia compliance review pre-launch. |

---

## 9) Open Questions
1. Finalize controlled taxonomy list (categories & emoji mapping) and governance policy.
2. Confirm quote SLA targets and merchant incentive structure for acknowledgments.
3. Decide on push provider and fallback for web (e.g., browser notifications).
4. Validate offline payment instructions and document storage retention policy with legal.

---

## 10) Handoff Checklist (Engineering & Design)
- ✅ Wireframes for Templates, Lists, Quotes, POs, Merchants, Admin.
- ✅ CSV/XLSX templates (ZPPA & Merchant) with sample data and validator rules.
- ✅ PDF templates (Proforma & PO) + design tokens.
- ✅ Event tracking schema + KPI dashboards (specs & thresholds).
- ✅ Admin workflows: staging→prod import, approvals, rollback, audit logs.

---

**All prices and amounts must be displayed in Zambian Kwacha only — prefixed with `K` (e.g., `K5.20`).**

