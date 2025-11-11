
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

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  emoji: string;
  variants: {
    name: 'Essentials' | 'Standard' | 'Full';
    items: Omit<BudgetItem, 'id' | 'flags'>[];
  };
}

export interface Merchant {
    id: string;
    name: string;
    logoUrl: string;
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