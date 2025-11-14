
export enum Mode {
  PricePulse = 'PricePulse',
  BudgetPulse = 'BudgetPulse',
}

export enum Role {
  Individual = 'Individual',
  Procurement = 'Procurement',
  Merchant = 'Merchant',
  Admin = 'Admin',
}

export enum PriceSource {
  ZPPA = 'ZPPA',
  Merchant = 'Merchant',
}

export enum QuoteStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  ProformaReady = 'ProformaReady',
  Acknowledged = 'Acknowledged',
  Finalized = 'Finalized',
  POIssued = 'PO Issued',
  Withdrawn = 'Withdrawn',
}

export enum POStatus {
    Issued = 'Issued',
    Fulfilled = 'Fulfilled',
    Partial = 'Partial',
    Delayed = 'Delayed'
}

export interface BudgetItem {
  id: string;
  description: string;
  category: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  priceSource: PriceSource;
  flags: ('Crossed' | 'Excluded')[];
}

export interface ShoppingList {
  id: string;
  name: string;
  items: BudgetItem[];
  createdAt: string;
}

export type TemplateCategory =
  | 'Education'
  | 'Construction'
  | 'Household'
  | 'Office'
  | 'Health'
  | 'Hospitality'
  | 'Community'
  | 'Custom';

export interface TemplateItemDefinition extends Omit<BudgetItem, 'id' | 'flags'> {
  benchmarkSource: PriceSource;
}

export interface TemplateVariant {
  id: string;
  name: 'Essentials' | 'Standard' | 'Full' | string;
  summary: string;
  recommendedFor: string;
  estimatedBudget: number;
  cadence: 'Quarterly' | 'Monthly' | 'Ad-hoc';
  lastRefreshed: string;
  sourceLabel: string;
  items: TemplateItemDefinition[];
}

export interface TemplateMetrics {
  adoptionRate: number;
  avgLines: number;
  lastUsedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  emoji: string;
  tags: string[];
  tone: 'Personal' | 'Enterprise' | 'Hybrid';
  variants: TemplateVariant[];
  metrics: TemplateMetrics;
}

export type ValidationSeverity = 'info' | 'warning' | 'error';

export interface ValidationIssue {
  severity: ValidationSeverity;
  field: string;
  message: string;
  context?: string;
}

export interface ImportValidationSummary {
  status: 'pending' | 'running' | 'passed' | 'warnings' | 'failed';
  issues: ValidationIssue[];
}

export type ImportStatus = 'Staged' | 'Validating' | 'Ready' | 'Failed' | 'Published' | 'RolledBack';

export interface ZPPAImportBatch {
  id: string;
  filename: string;
  uploadedBy: string;
  uploadedAt: string;
  status: ImportStatus;
  recordCount: number;
  priceAverageDelta: number;
  validationSummary: ImportValidationSummary;
  promotedAt?: string;
}

export interface Merchant {
    id: string;
    name: string;
    logoUrl: string;
}

export type MerchantLifecycleStatus = 'Pending Docs' | 'In Review' | 'Approved' | 'Live' | 'Suspended';

export interface MerchantProfileDetail extends Merchant {
    legalName: string;
    supplyCategory: string;
    location: string;
    primaryContact: string;
    contactEmail: string;
    lifecycleStatus: MerchantLifecycleStatus;
    lastPriceUpdate: string;
    nextReminderAt: string;
}

export type PriceListStatus = 'Draft' | 'Submitted' | 'Validating' | 'Accepted' | 'Rejected';

export interface PriceListUpload {
    id: string;
    filename: string;
    submittedAt: string;
    status: PriceListStatus;
    itemCount: number;
    issues: ValidationIssue[];
}

export interface ChatMessage {
    id: string;
    sender: 'Procurement' | 'Merchant';
    text: string;
    timestamp: string;
}

export interface Quote {
    id: string;
    reference: string;
    listName: string;
    requester: string;
    merchants: Merchant[];
    status: QuoteStatus;
    submittedAt: string;
    items: BudgetItem[];
    chatHistory?: ChatMessage[];
}

export interface PurchaseOrder {
    id: string;
    reference: string;
    quoteReference: string;
    buyer: string;
    seller: Merchant;
    status: POStatus;
    issuedAt: string;
    total: number;
}