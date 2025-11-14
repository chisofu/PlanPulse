import {
  Template,
  PriceSource,
  Quote,
  QuoteStatus,
  PurchaseOrder,
  POStatus,
  ShoppingList,
  BudgetItem,
  ChatMessage,
  MerchantProfileDetail,
  PriceListUpload,
} from './types';
import { v4 as uuidv4 } from 'uuid';

export const MOCK_TEMPLATES: Template[] = [
  {
    id: 'tpl_school_01',
    name: 'Primary School Term Launch',
    description:
      'Everything a Zambian learner needs for the first week of a new term, aligned to ZPPA pricing.',
    category: 'Education',
    emoji: '🎓',
    tags: ['textbooks', 'stationery', 'uniform'],
    tone: 'Hybrid',
    metrics: { adoptionRate: 0.64, avgLines: 18, lastUsedAt: '2025-01-04T09:00:00Z' },
    variants: [
      {
        id: 'tpl_school_01_ess',
        name: 'Essentials',
        summary: 'Core stationery plus uniform basics for public schools.',
        recommendedFor: 'Families planning a public school learner',
        estimatedBudget: 1850,
        cadence: 'Quarterly',
        lastRefreshed: '2024-12-20T00:00:00Z',
        sourceLabel: 'ZPPA 2024 Q4',
        items: [
          {
            description: 'Exercise Book A4 96pg',
            category: 'Stationery',
            unit: 'Each',
            quantity: 12,
            unitPrice: 15.5,
            priceSource: PriceSource.ZPPA,
            benchmarkSource: PriceSource.ZPPA,
          },
          {
            description: 'Blue Ballpoint Pens',
            category: 'Stationery',
            unit: 'Box',
            quantity: 1,
            unitPrice: 25,
            priceSource: PriceSource.ZPPA,
            benchmarkSource: PriceSource.ZPPA,
          },
          {
            description: 'HB Pencils',
            category: 'Stationery',
            unit: 'Box',
            quantity: 1,
            unitPrice: 20,
            priceSource: PriceSource.ZPPA,
            benchmarkSource: PriceSource.ZPPA,
          },
          {
            description: 'School Backpack',
            category: 'Apparel',
            unit: 'Each',
            quantity: 1,
            unitPrice: 250,
            priceSource: PriceSource.ZPPA,
            benchmarkSource: PriceSource.ZPPA,
          },
        ],
      },
      {
        id: 'tpl_school_01_full',
        name: 'Full',
        summary: 'Adds sports kit, extra notebooks, and exam prep materials.',
        recommendedFor: 'Private school learners or boarding schools',
        estimatedBudget: 3200,
        cadence: 'Quarterly',
        lastRefreshed: '2024-12-20T00:00:00Z',
        sourceLabel: 'Merchant verified',
        items: [
          {
            description: 'Sports Kit Bundle',
            category: 'Apparel',
            unit: 'Set',
            quantity: 1,
            unitPrice: 450,
            priceSource: PriceSource.Merchant,
            benchmarkSource: PriceSource.ZPPA,
          },
          {
            description: 'Exam Preparation Guides',
            category: 'Books',
            unit: 'Set',
            quantity: 1,
            unitPrice: 320,
            priceSource: PriceSource.Merchant,
            benchmarkSource: PriceSource.ZPPA,
          },
        ],
      },
    ],
  },
  {
    id: 'tpl_build_01',
    name: 'Small Clinic Build Phase 1',
    description:
      'A construction bill of quantities starter for rural clinic build-outs, aligned to ZPPA guardrails.',
    category: 'Construction',
    emoji: '🏗️',
    tags: ['boq', 'health', 'construction'],
    tone: 'Enterprise',
    metrics: { adoptionRate: 0.41, avgLines: 42, lastUsedAt: '2025-01-02T08:35:00Z' },
    variants: [
      {
        id: 'tpl_build_01_ess',
        name: 'Essentials',
        summary: 'Foundation, framing, and roofing inputs only.',
        recommendedFor: 'District-level procurement units',
        estimatedBudget: 98500,
        cadence: 'Ad-hoc',
        lastRefreshed: '2024-11-15T00:00:00Z',
        sourceLabel: 'ZPPA 2024 Q3',
        items: [
          {
            description: 'Cement 50kg',
            category: 'Building Materials',
            unit: 'Bag',
            quantity: 20,
            unitPrice: 180,
            priceSource: PriceSource.ZPPA,
            benchmarkSource: PriceSource.ZPPA,
          },
          {
            description: 'Building Sand',
            category: 'Building Materials',
            unit: 'Tonne',
            quantity: 2,
            unitPrice: 350,
            priceSource: PriceSource.ZPPA,
            benchmarkSource: PriceSource.ZPPA,
          },
          {
            description: 'Reinforcement Bars 12mm',
            category: 'Building Materials',
            unit: 'Length',
            quantity: 15,
            unitPrice: 120,
            priceSource: PriceSource.ZPPA,
            benchmarkSource: PriceSource.ZPPA,
          },
        ],
      },
      {
        id: 'tpl_build_01_full',
        name: 'Full',
        summary: 'Adds finishes, fixtures, and solar backup kit for compliance.',
        recommendedFor: 'Provincial-level procurement',
        estimatedBudget: 185400,
        cadence: 'Ad-hoc',
        lastRefreshed: '2024-11-15T00:00:00Z',
        sourceLabel: 'Hybrid merchant + ZPPA',
        items: [
          {
            description: 'Hospital Doors Solid Core',
            category: 'Fixtures',
            unit: 'Each',
            quantity: 8,
            unitPrice: 850,
            priceSource: PriceSource.Merchant,
            benchmarkSource: PriceSource.ZPPA,
          },
          {
            description: 'Solar Backup Kit 5kVA',
            category: 'Energy',
            unit: 'Each',
            quantity: 1,
            unitPrice: 23500,
            priceSource: PriceSource.Merchant,
            benchmarkSource: PriceSource.ZPPA,
          },
        ],
      },
    ],
  },
  {
    id: 'tpl_grocery_01',
    name: 'Weekly Groceries',
    description: 'Household essentials for a family of four with Zambian staples.',
    category: 'Household',
    emoji: '🛒',
    tags: ['food', 'family', 'household'],
    tone: 'Personal',
    metrics: { adoptionRate: 0.78, avgLines: 24, lastUsedAt: '2025-01-06T18:00:00Z' },
    variants: [
      {
        id: 'tpl_grocery_01_std',
        name: 'Standard',
        summary: 'Balanced pantry for a mid-sized family.',
        recommendedFor: 'Urban families tracking weekly spend',
        estimatedBudget: 1650,
        cadence: 'Monthly',
        lastRefreshed: '2025-01-03T00:00:00Z',
        sourceLabel: 'ZPPA 2025 Q1',
        items: [
          {
            description: 'Brown Bread',
            category: 'Bakery',
            unit: 'Loaf',
            quantity: 2,
            unitPrice: 18,
            priceSource: PriceSource.ZPPA,
            benchmarkSource: PriceSource.ZPPA,
          },
          {
            description: 'Fresh Milk',
            category: 'Dairy',
            unit: 'Litre',
            quantity: 3,
            unitPrice: 22.5,
            priceSource: PriceSource.ZPPA,
            benchmarkSource: PriceSource.ZPPA,
          },
          {
            description: 'Eggs',
            category: 'Dairy',
            unit: 'Dozen',
            quantity: 1,
            unitPrice: 35,
            priceSource: PriceSource.ZPPA,
            benchmarkSource: PriceSource.ZPPA,
          },
          {
            description: 'Chicken Pieces',
            category: 'Meat',
            unit: 'kg',
            quantity: 2,
            unitPrice: 85,
            priceSource: PriceSource.ZPPA,
            benchmarkSource: PriceSource.ZPPA,
          },
          {
            description: 'Mealie Meal 25kg',
            category: 'Pantry',
            unit: 'Bag',
            quantity: 1,
            unitPrice: 190,
            priceSource: PriceSource.ZPPA,
            benchmarkSource: PriceSource.ZPPA,
          },
        ],
      },
    ],
  },
];

export const MOCK_ITEM_SUGGESTIONS: (Omit<BudgetItem, 'id' | 'flags' | 'quantity'> & {
  priority?: BudgetItem['priority'];
  completed?: boolean;
  status?: BudgetItem['status'];
})[] = [
  ...MOCK_TEMPLATES.flatMap((template) =>
    template.variants.flatMap((variant) =>
      variant.items.map(({ benchmarkSource: _benchmarkSource, ...rest }) => rest)
    )
  ),
  { description: 'A4 Printing Paper', category: 'Stationery', unit: 'Ream', unitPrice: 110, priceSource: PriceSource.Merchant },
  { description: 'Black Toner Cartridge', category: 'Stationery', unit: 'Each', unitPrice: 850, priceSource: PriceSource.Merchant },
  { description: 'Whiteboard Markers', category: 'Stationery', unit: 'Pack', unitPrice: 75, priceSource: PriceSource.Merchant },
  { description: 'Laptop Charger', category: 'Electronics', unit: 'Each', unitPrice: 450, priceSource: PriceSource.Merchant },
  { description: 'Safety Boots', category: 'Apparel', unit: 'Pair', unitPrice: 600, priceSource: PriceSource.Merchant },
].reduce((acc, current) => {
  if (!acc.find((item) => item.description === current.description)) {
    acc.push(current);
  }
  return acc;
}, [] as Omit<BudgetItem, 'id' | 'flags' | 'quantity'>[]);


export const MOCK_MERCHANTS = [
    { id: 'merch_01', name: 'ZBuild Hardware', logoUrl: 'https://picsum.photos/seed/zbuild/40' },
    { id: 'merch_02', name: 'Kwik-Mart Supplies', logoUrl: 'https://picsum.photos/seed/kwikmart/40' },
    { id: 'merch_03', name: 'Corporate Stationers Ltd', logoUrl: 'https://picsum.photos/seed/corpstat/40' },
];

export const MOCK_MERCHANT_PROFILES: MerchantProfileDetail[] = [
  {
    id: 'merch_01',
    name: 'ZBuild Hardware',
    logoUrl: 'https://picsum.photos/seed/zbuild/80',
    legalName: 'ZBuild Hardware & Supplies Ltd',
    supplyCategory: 'Building Materials',
    location: 'Lusaka, Chelston',
    primaryContact: 'Denzel Mwale',
    contactEmail: 'denzel@zbuild.co.zm',
    lifecycleStatus: 'Live',
    lastPriceUpdate: '2024-12-20T09:00:00Z',
    nextReminderAt: '2025-01-15T08:00:00Z',
  },
  {
    id: 'merch_02',
    name: 'Kwik-Mart Supplies',
    logoUrl: 'https://picsum.photos/seed/kwikmart/80',
    legalName: 'Kwik-Mart Supplies Ltd',
    supplyCategory: 'Office & Stationery',
    location: 'Ndola, Town Centre',
    primaryContact: 'Pamela Zulu',
    contactEmail: 'pamela@kwikmart.co.zm',
    lifecycleStatus: 'In Review',
    lastPriceUpdate: '2024-11-29T10:30:00Z',
    nextReminderAt: '2025-01-08T08:00:00Z',
  },
  {
    id: 'merch_03',
    name: 'Corporate Stationers Ltd',
    logoUrl: 'https://picsum.photos/seed/corpstat/80',
    legalName: 'Corporate Stationers Limited',
    supplyCategory: 'Stationery',
    location: 'Kitwe, River Road',
    primaryContact: 'Hope Chileshe',
    contactEmail: 'hope@corporatestationers.co.zm',
    lifecycleStatus: 'Suspended',
    lastPriceUpdate: '2024-10-01T12:00:00Z',
    nextReminderAt: '2024-12-01T08:00:00Z',
  },
];

export const MOCK_PRICE_LIST_UPLOADS: Record<string, PriceListUpload[]> = {
  merch_01: [
    {
      id: 'upl_01',
      filename: 'zbuild_prices_december.xlsx',
      submittedAt: '2024-12-20T09:00:00Z',
      status: 'Accepted',
      itemCount: 312,
      issues: [],
    },
    {
      id: 'upl_02',
      filename: 'zbuild_prices_january.xlsx',
      submittedAt: '2025-01-05T10:45:00Z',
      status: 'Validating',
      itemCount: 324,
      issues: [
        {
          severity: 'warning',
          field: 'Price Variance',
          message: 'Rebar 12mm increased by 35% vs previous upload.',
          context: 'Requires admin review',
        },
      ],
    },
  ],
  merch_02: [
    {
      id: 'upl_03',
      filename: 'kwikmart_q4_prices.csv',
      submittedAt: '2024-11-29T10:30:00Z',
      status: 'Submitted',
      itemCount: 188,
      issues: [],
    },
  ],
  merch_03: [
    {
      id: 'upl_04',
      filename: 'corpstat_october_prices.csv',
      submittedAt: '2024-10-01T12:00:00Z',
      status: 'Rejected',
      itemCount: 210,
      issues: [
        {
          severity: 'error',
          field: 'Missing Columns',
          message: 'Pack size column missing for 42 rows.',
          context: 'Template v2.1 required',
        },
      ],
    },
  ],
};

export const MOCK_LISTS: ShoppingList[] = [
  {
    id: uuidv4(),
    name: 'Office Refresh Q3',
    createdAt: '2023-09-15T10:00:00Z',
    items: [
      {
        id: uuidv4(),
        description: 'A4 Printing Paper',
        category: 'Stationery',
        unit: 'Ream',
        quantity: 10,
        unitPrice: 110,
        priceSource: PriceSource.Merchant,
        flags: [],
        priority: 'High',
        completed: false,
        status: 'Planned',
      },
      {
        id: uuidv4(),
        description: 'Black Toner Cartridge',
        category: 'Stationery',
        unit: 'Each',
        quantity: 2,
        unitPrice: 850,
        priceSource: PriceSource.Merchant,
        flags: [],
        priority: 'Medium',
        completed: false,
        status: 'In Progress',
      },
      {
        id: uuidv4(),
        description: 'Whiteboard Markers',
        category: 'Stationery',
        unit: 'Pack',
        quantity: 3,
        unitPrice: 75,
        priceSource: PriceSource.Merchant,
        flags: ['Crossed'],
        priority: 'Low',
        completed: true,
        status: 'Ordered',
      },
    ],
  },
];

export const MOCK_QUOTES: Quote[] = [
    {
        id: 'quote_01',
        reference: 'Q-2023-001',
        listName: 'Office Refresh Q3',
        requester: 'Procurement Dept.',
        merchants: [MOCK_MERCHANTS[1], MOCK_MERCHANTS[2]],
        status: QuoteStatus.Finalized,
        submittedAt: '2023-09-18T14:30:00Z',
        items: MOCK_LISTS[0].items.filter(i => !i.flags.includes('Crossed')),
        chatHistory: [
            { id: uuidv4(), sender: 'Procurement', text: 'Hi, can you confirm stock for all items?', timestamp: '2023-09-18T15:00:00Z' },
            { id: uuidv4(), sender: 'Merchant', text: 'Yes, all items are in stock and ready for delivery.', timestamp: '2023-09-18T15:05:00Z' },
            { id: uuidv4(), sender: 'Procurement', text: 'Great, thank you. We will finalize shortly.', timestamp: '2023-09-18T15:06:00Z' },
        ]
    },
    {
        id: 'quote_02',
        reference: 'Q-2023-002',
        listName: 'New Site Setup',
        requester: 'Procurement Dept.',
        merchants: [MOCK_MERCHANTS[0]],
        status: QuoteStatus.Submitted,
        submittedAt: '2023-09-20T09:00:00Z',
        items: MOCK_TEMPLATES[1].variants[0].items.map((i) => ({
            ...i,
            id: uuidv4(),
            flags: [],
            priority: i.priority ?? 'Medium',
            completed: i.completed ?? false,
            status: i.status ?? 'Planned',
        })),
    }
];

export const MOCK_POS: PurchaseOrder[] = [
    {
        id: 'po_01',
        reference: 'PO-2023-001',
        quoteReference: 'Q-2023-001',
        buyer: 'Our Company Inc.',
        seller: MOCK_MERCHANTS[2],
        status: POStatus.Fulfilled,
        issuedAt: '2023-09-22T11:00:00Z',
        total: MOCK_QUOTES[0].items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
    }
];


export const formatCurrency = (amount: number) => {
    return `K${amount.toFixed(2)}`;
};