
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

export interface TeamMember {
  id: string;
  name: string;
  role: Role | 'Finance Analyst' | 'Project Lead';
  avatarUrl?: string;
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

export type ItemPriority = 'High' | 'Medium' | 'Low';

export type ItemStatus = 'Planned' | 'In Progress' | 'Ordered' | 'Received';

export interface ItemPriceSnapshot {
  value: number;
  capturedAt: string;
  source?: string;
  note?: string;
}

export interface BudgetItem {
  id: string;
  description: string;
  category: string;
  subcategory?: string;
  unit: string | number;
  quantity: number;
  unitPrice: number;
  priceSource: PriceSource;
  flags: ('Crossed' | 'Excluded' | 'Checked')[];
  priority: ItemPriority;
  completed: boolean;
  status: ItemStatus;
  assigneeId?: string;
  lastUpdatedAt?: string;
  sku?: string;
  comment?: string;
  imageUrl?: string;
  images?: string[];
  excludeFromTotals?: boolean;
  tags?: string[];
  priceHistory?: ItemPriceSnapshot[];
}

export interface ItemSuggestionMetadata {
  description: string;
  category: string;
  unit: string | number;
  unitPrice: number;
  priceSource: PriceSource;
  quantitySuggestion?: number;
  usageCount: number;
  lastUsedAt?: string;
  provenance: 'seed' | 'user';
}

export interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  items: BudgetItem[];
  createdAt: string;
  dueDate?: string;
  ownerId?: string;
  collaboratorIds?: string[];
  lastUpdatedAt?: string;
}

export type ActivityEntityType = 'list' | 'item' | 'template' | 'role' | 'search';

export interface ActivityEntry {
  id: string;
  summary: string;
  timestamp: string;
  actor?: string;
  entityType: ActivityEntityType;
  entityId?: string;
  details?: string;
}

export type SortOrder = 'newest' | 'oldest';

export type ListStatusFilter = 'all' | 'overdue' | 'dueSoon' | 'onTrack';

export type TemplateStatusFilter = 'all' | 'fresh' | 'stale';

export interface DateRangeFilter {
  from?: string;
  to?: string;
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

export interface TemplateItemDefinition
  extends Omit<BudgetItem, 'id' | 'flags' | 'priority' | 'completed' | 'status'> {
  benchmarkSource: PriceSource;
  priority?: ItemPriority;
  completed?: boolean;
  status?: ItemStatus;
}

export type TemplatePublishStatus = 'draft' | 'published';

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
  status: TemplatePublishStatus;
  defaultUnit?: string;
  defaultPriceSource?: PriceSource;
  defaultCategory?: string;
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

export type MerchantStatus = 'Up-to-date' | 'Due' | 'Stale' | 'Suspended';

export interface Merchant {
    id: string;
    name: string;
    logoUrl: string;
    status?: MerchantStatus;
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
    status: MerchantStatus;
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

export interface QuoteAttachment {
    id: string;
    filename: string;
    uploadedBy: string;
    uploadedAt: string;
    url?: string;
}

export interface QuoteTimelineEntry {
    id: string;
    label: string;
    timestamp: string;
    status?: QuoteStatus;
    description?: string;
}

export interface ChatMessage {
    id: string;
    sender: 'Procurement' | 'Merchant';
    text: string;
    timestamp: string;
    attachments?: QuoteAttachment[];
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
    attachments?: QuoteAttachment[];
    timeline?: QuoteTimelineEntry[];
}

export interface POTimelineEntry {
    id: string;
    label: string;
    timestamp: string;
    status?: POStatus;
    description?: string;
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
    timeline?: POTimelineEntry[];
}
