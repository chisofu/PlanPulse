import {
  Template,
  PriceSource,
  Quote,
  QuoteStatus,
  PurchaseOrder,
  POStatus,
  ShoppingList,
  BudgetItem,
  MerchantProfileDetail,
  PriceListUpload,
  QuoteAttachment,
  QuoteTimelineEntry,
  POTimelineEntry,
  ItemSuggestionMetadata,
  TeamMember,
  Role,
  ActivityEntry,
  MerchantStatus,
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
    status: 'published',
    defaultUnit: 'Each',
    defaultPriceSource: PriceSource.ZPPA,
    defaultCategory: 'Stationery',
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
    status: 'published',
    defaultUnit: 'Each',
    defaultPriceSource: PriceSource.ZPPA,
    defaultCategory: 'Building Materials',
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
    status: 'published',
    defaultUnit: 'Each',
    defaultPriceSource: PriceSource.ZPPA,
    defaultCategory: 'Pantry',
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
  {
    description: 'A4 Printing Paper',
    category: 'Stationery',
    subcategory: 'Paper',
    unit: 'Ream',
    unitPrice: 110,
    priceSource: PriceSource.Merchant,
    sku: 'ST-PRINT-001',
  },
  {
    description: 'Black Toner Cartridge',
    category: 'Stationery',
    subcategory: 'Printing Supplies',
    unit: 'Each',
    unitPrice: 850,
    priceSource: PriceSource.Merchant,
    sku: 'ST-TONER-009',
  },
  {
    description: 'Whiteboard Markers',
    category: 'Stationery',
    subcategory: 'Meeting Room',
    unit: 'Pack',
    unitPrice: 75,
    priceSource: PriceSource.Merchant,
    sku: 'ST-MARK-004',
  },
  {
    description: 'Laptop Charger',
    category: 'Electronics',
    subcategory: 'Accessories',
    unit: 'Each',
    unitPrice: 450,
    priceSource: PriceSource.Merchant,
    sku: 'EL-LAP-002',
  },
  {
    description: 'Safety Boots',
    category: 'Apparel',
    subcategory: 'Protective Gear',
    unit: 'Pair',
    unitPrice: 600,
    priceSource: PriceSource.Merchant,
    sku: 'AP-BOOT-006',
  },
].reduce((acc, current) => {
  if (!acc.find((item) => item.description === current.description)) {
    acc.push(current);
  }
  return acc;
}, [] as Omit<BudgetItem, 'id' | 'flags'>[]);

export const DEFAULT_ITEM_CATEGORIES = Array.from(
  new Set(['Uncategorized', ...MOCK_ITEM_SUGGESTIONS.map((item) => item.category)])
).sort((a, b) => a.localeCompare(b));

export const DEFAULT_ITEM_UNITS = Array.from(
  new Set(
    MOCK_ITEM_SUGGESTIONS.map((item) =>
      typeof item.unit === 'number' ? item.unit.toString() : item.unit,
    ),
  ),
).sort((a, b) => a.localeCompare(b));

export const DEFAULT_PRICE_SOURCES = Object.values(PriceSource);

export const INITIAL_ITEM_SUGGESTIONS: ItemSuggestionMetadata[] = MOCK_ITEM_SUGGESTIONS.map((item) => ({
  description: item.description,
  category: item.category,
  unit: item.unit,
  unitPrice: item.unitPrice,
  priceSource: item.priceSource,
  quantitySuggestion: 'quantity' in item ? Number((item as Partial<BudgetItem>).quantity) || undefined : undefined,
  usageCount: 0,
  provenance: 'seed',
}));


export const MOCK_MERCHANTS = [
  { id: 'merch_01', name: 'ZBuild Hardware', logoUrl: 'https://picsum.photos/seed/zbuild/40', status: 'Up-to-date' },
  { id: 'merch_02', name: 'Kwik-Mart Supplies', logoUrl: 'https://picsum.photos/seed/kwikmart/40', status: 'Due' },
  { id: 'merch_03', name: 'Corporate Stationers Ltd', logoUrl: 'https://picsum.photos/seed/corpstat/40', status: 'Suspended' },
  { id: 'merch_04', name: 'Northern Agro Traders', logoUrl: 'https://picsum.photos/seed/northernagro/40', status: 'Stale' },
];

export const MOCK_MERCHANT_PROFILES: MerchantProfileDetail[] = [
  {
    id: 'merch_01',
    name: 'ZBuild Hardware',
    logoUrl: 'https://picsum.photos/seed/zbuild/80',
    status: 'Up-to-date',
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
    status: 'Due',
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
    status: 'Suspended',
    legalName: 'Corporate Stationers Limited',
    supplyCategory: 'Stationery',
    location: 'Kitwe, River Road',
    primaryContact: 'Hope Chileshe',
    contactEmail: 'hope@corporatestationers.co.zm',
    lifecycleStatus: 'Suspended',
    lastPriceUpdate: '2024-10-01T12:00:00Z',
    nextReminderAt: '2024-12-01T08:00:00Z',
  },
  {
    id: 'merch_04',
    name: 'Northern Agro Traders',
    logoUrl: 'https://picsum.photos/seed/northernagro/80',
    status: 'Stale',
    legalName: 'Northern Agro Traders Cooperative',
    supplyCategory: 'Agricultural Inputs',
    location: 'Kasama, Central Market',
    primaryContact: 'Brighton Chanda',
    contactEmail: 'brighton@northernagro.co.zm',
    lifecycleStatus: 'Approved',
    lastPriceUpdate: '2024-08-12T12:00:00Z',
    nextReminderAt: '2024-09-15T08:00:00Z',
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
  merch_04: [],
};

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm-anne',
    name: 'Anne Mwewa',
    role: Role.Procurement,
    avatarUrl: 'https://i.pravatar.cc/150?u=anne',
  },
  {
    id: 'tm-lubinda',
    name: 'Lubinda Tembo',
    role: 'Project Lead',
    avatarUrl: 'https://i.pravatar.cc/150?u=lubinda',
  },
  {
    id: 'tm-chipo',
    name: 'Chipo Banda',
    role: 'Finance Analyst',
    avatarUrl: 'https://i.pravatar.cc/150?u=chipo',
  },
  {
    id: 'tm-naledi',
    name: 'Naledi Mwila',
    role: Role.Admin,
    avatarUrl: 'https://i.pravatar.cc/150?u=naledi',
  },
];

const withDefaults = (item: Omit<BudgetItem, 'flags' | 'priority' | 'completed' | 'status'> & {
  flags?: BudgetItem['flags'];
  priority?: BudgetItem['priority'];
  completed?: boolean;
  status?: BudgetItem['status'];
}): BudgetItem => ({
  ...item,
  flags: item.flags ?? [],
  priority: item.priority ?? 'Medium',
  completed: item.completed ?? false,
  status: item.status ?? 'Planned',
  images: item.images ?? (item.imageUrl ? [item.imageUrl] : []),
  imageUrl: item.imageUrl ?? item.images?.[0],
  excludeFromTotals: item.excludeFromTotals ?? false,
  tags: item.tags ?? [],
  comment: item.comment,
  priceHistory: item.priceHistory ?? [],
});

export const MOCK_LISTS: ShoppingList[] = [
  {
    id: 'list-office-refresh',
    name: 'Office Refresh Q3',
    description: 'Bulk supplies refresh for the Q3 office readiness initiative.',
    createdAt: '2023-09-15T10:00:00Z',
    dueDate: '2023-09-30',
    ownerId: 'tm-anne',
    collaboratorIds: ['tm-lubinda', 'tm-chipo'],
    lastUpdatedAt: '2023-09-18T15:30:00Z',
    items: [
      withDefaults({
        id: uuidv4(),
        description: 'A4 Printing Paper',
        category: 'Stationery',
        unit: 'Ream',
        quantity: 10,
        unitPrice: 110,
        priceSource: PriceSource.Merchant,
        flags: [],
        assigneeId: 'tm-lubinda',
        lastUpdatedAt: '2023-09-17T11:00:00Z',
      }),
      withDefaults({
        id: uuidv4(),
        description: 'Black Toner Cartridge',
        category: 'Stationery',
        unit: 'Each',
        quantity: 2,
        unitPrice: 850,
        priceSource: PriceSource.Merchant,
        assigneeId: 'tm-chipo',
        priority: 'High',
        lastUpdatedAt: '2023-09-18T09:40:00Z',
      }),
      withDefaults({
        id: uuidv4(),
        description: 'Whiteboard Markers',
        category: 'Stationery',
        unit: 'Pack',
        quantity: 3,
        unitPrice: 75,
        priceSource: PriceSource.Merchant,
        flags: ['Crossed'],
        completed: true,
        assigneeId: 'tm-lubinda',
        status: 'Received',
        lastUpdatedAt: '2023-09-18T10:05:00Z',
      }),
    ],
  },
  {
    id: 'list-clinic-launch',
    name: 'Community Clinic Launch',
    description: 'Starter kit for the new community clinic opening in Kabwe.',
    createdAt: '2024-02-01T08:30:00Z',
    dueDate: '2024-03-15',
    ownerId: 'tm-naledi',
    collaboratorIds: ['tm-anne', 'tm-chipo'],
    lastUpdatedAt: '2024-02-20T13:10:00Z',
    items: [
      withDefaults({
        id: uuidv4(),
        description: 'Hospital Beds',
        category: 'Health',
        unit: 'Each',
        quantity: 6,
        unitPrice: 4200,
        priceSource: PriceSource.ZPPA,
        assigneeId: 'tm-anne',
        priority: 'High',
      }),
      withDefaults({
        id: uuidv4(),
        description: 'Medical Consumables Starter Pack',
        category: 'Health',
        unit: 'Kit',
        quantity: 3,
        unitPrice: 2750,
        priceSource: PriceSource.Merchant,
        assigneeId: 'tm-chipo',
        status: 'In Progress',
      }),
      withDefaults({
        id: uuidv4(),
        description: 'Solar Backup Kit 5kVA',
        category: 'Energy',
        unit: 'Each',
        quantity: 1,
        unitPrice: 23500,
        priceSource: PriceSource.Merchant,
        priority: 'High',
        assigneeId: 'tm-lubinda',
      }),
    ],
  },
  {
    id: 'list-household-january',
    name: 'Household Groceries January',
    description: 'Household essentials for the Musonda family summer break.',
    createdAt: '2024-12-28T07:45:00Z',
    dueDate: '2025-01-05',
    ownerId: 'tm-lubinda',
    collaboratorIds: ['tm-anne'],
    lastUpdatedAt: '2024-12-29T10:20:00Z',
    items: [
      withDefaults({
        id: uuidv4(),
        description: 'Maize Meal 25kg',
        category: 'Groceries',
        unit: 'Bag',
        quantity: 2,
        unitPrice: 175,
        priceSource: PriceSource.Merchant,
        assigneeId: 'tm-lubinda',
      }),
      withDefaults({
        id: uuidv4(),
        description: 'Cooking Oil 5L',
        category: 'Groceries',
        unit: 'Bottle',
        quantity: 1,
        unitPrice: 185,
        priceSource: PriceSource.Merchant,
        assigneeId: 'tm-anne',
        status: 'Ordered',
      }),
      withDefaults({
        id: uuidv4(),
        description: 'Fresh Produce Assortment',
        category: 'Groceries',
        unit: 'Hamper',
        quantity: 1,
        unitPrice: 260,
        priceSource: PriceSource.Merchant,
      }),
    ],
  },
];

export const MOCK_ACTIVITY: ActivityEntry[] = [
  {
    id: uuidv4(),
    summary: 'Anne assigned Lubinda to source solar backup kit',
    timestamp: '2024-02-20T13:15:00Z',
    actor: 'Anne Mwewa',
    entityType: 'item',
    entityId: 'list-clinic-launch',
    details: 'Community Clinic Launch',
  },
  {
    id: uuidv4(),
    summary: 'Naledi reassigned Office Refresh Q3 to Anne',
    timestamp: '2023-09-18T15:45:00Z',
    actor: 'Naledi Mwila',
    entityType: 'list',
    entityId: 'list-office-refresh',
    details: 'Owner updated to Anne Mwewa',
  },
  {
    id: uuidv4(),
    summary: 'Search saved: “Clinic launch solar”',
    timestamp: '2024-02-19T08:12:00Z',
    actor: 'System',
    entityType: 'search',
    details: 'Dashboard quick search history',
  },
];


const attachment = (filename: string, uploadedBy: string, uploadedAt: string): QuoteAttachment => ({
  id: uuidv4(),
  filename,
  uploadedBy,
  uploadedAt,
});

const timelineEntry = (
  label: string,
  timestamp: string,
  status?: QuoteStatus,
  description?: string,
): QuoteTimelineEntry => ({
  id: uuidv4(),
  label,
  timestamp,
  status,
  description,
});

const poTimelineEntry = (
  label: string,
  timestamp: string,
  status?: POStatus,
  description?: string,
): POTimelineEntry => ({
  id: uuidv4(),
  label,
  timestamp,
  status,
  description,
});

export const MOCK_QUOTES: Quote[] = [
  {
    id: 'quote_01',
    reference: 'Q-2023-001',
    listName: 'Office Refresh Q3',
    requester: 'Procurement Dept.',
    merchants: [MOCK_MERCHANTS[1], MOCK_MERCHANTS[2], MOCK_MERCHANTS[3]],
    status: QuoteStatus.Finalized,
    submittedAt: '2023-09-18T14:30:00Z',
    items: MOCK_LISTS[0].items.filter((i) => !i.flags.includes('Crossed')),
    chatHistory: [
      {
        id: uuidv4(),
        sender: 'Procurement',
        text: 'Hi, can you confirm stock for all items?',
        timestamp: '2023-09-18T15:00:00Z',
      },
      {
        id: uuidv4(),
        sender: 'Merchant',
        text: 'Yes, all items are in stock and ready for delivery.',
        timestamp: '2023-09-18T15:05:00Z',
      },
      {
        id: uuidv4(),
        sender: 'Procurement',
        text: 'Great, thank you. We will finalize shortly.',
        timestamp: '2023-09-18T15:06:00Z',
        attachments: [attachment('Stock-confirmation.pdf', 'Procurement', '2023-09-18T15:06:00Z')],
      },
    ],
    attachments: [
      attachment('Office-refresh-specs.xlsx', 'Procurement', '2023-09-17T08:22:00Z'),
      attachment('Merchant-quote.pdf', 'Merchant', '2023-09-18T12:10:00Z'),
    ],
    timeline: [
      timelineEntry('Request drafted', '2023-09-15T09:00:00Z', QuoteStatus.Draft),
      timelineEntry('Submitted to merchants', '2023-09-16T10:05:00Z', QuoteStatus.Submitted),
      timelineEntry('Merchants acknowledged', '2023-09-17T15:20:00Z', QuoteStatus.Acknowledged),
      timelineEntry('Proforma received', '2023-09-18T13:45:00Z', QuoteStatus.ProformaReady),
      timelineEntry('Finalized internally', '2023-09-18T15:15:00Z', QuoteStatus.Finalized),
    ],
  },
  {
    id: 'quote_02',
    reference: 'Q-2023-002',
    listName: 'New Site Setup',
    requester: 'Procurement Dept.',
    merchants: [MOCK_MERCHANTS[0], MOCK_MERCHANTS[3]],
    status: QuoteStatus.Submitted,
    submittedAt: '2023-09-20T09:00:00Z',
    items: MOCK_TEMPLATES[1].variants[0].items.map((i) => ({ ...i, id: uuidv4(), flags: [] })),
    chatHistory: [
      {
        id: uuidv4(),
        sender: 'Procurement',
        text: 'Please confirm expected delivery timelines.',
        timestamp: '2023-09-20T09:15:00Z',
      },
    ],
    attachments: [attachment('Site-drawings.dwg', 'Procurement', '2023-09-19T17:30:00Z')],
    timeline: [
      timelineEntry('Request drafted', '2023-09-18T11:00:00Z', QuoteStatus.Draft),
      timelineEntry('Submitted to merchants', '2023-09-19T08:50:00Z', QuoteStatus.Submitted),
    ],
  },
];

export const MOCK_POS: PurchaseOrder[] = [
  {
    id: 'po_01',
    reference: 'PO-2023-001',
    quoteReference: 'Q-2023-001',
    buyer: MOCK_QUOTES[0].requester,
    seller: MOCK_MERCHANTS[2],
    status: POStatus.Fulfilled,
    issuedAt: '2023-09-22T11:00:00Z',
    total: MOCK_QUOTES[0].items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    timeline: [
      poTimelineEntry('PO issued to Corporate Stationers', '2023-09-22T11:00:00Z', POStatus.Issued),
      poTimelineEntry(
        'Supplier confirmed delivery window',
        '2023-09-23T09:30:00Z',
        undefined,
        'Delivery scheduled within 5 working days.',
      ),
      poTimelineEntry(
        'Goods delivered and receipted',
        '2023-09-28T16:45:00Z',
        POStatus.Fulfilled,
        'All 18 line items received in full.',
      ),
    ],
  },
  {
    id: 'po_02',
    reference: 'PO-2023-002',
    quoteReference: 'Q-2023-002',
    buyer: MOCK_QUOTES[1].requester,
    seller: MOCK_MERCHANTS[0],
    status: POStatus.Partial,
    issuedAt: '2023-10-02T08:15:00Z',
    total: MOCK_QUOTES[1].items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    timeline: [
      poTimelineEntry('PO created for site setup', '2023-10-02T08:15:00Z', POStatus.Issued),
      poTimelineEntry(
        'First delivery received',
        '2023-10-07T17:00:00Z',
        POStatus.Partial,
        'Awaiting structural steel components.',
      ),
    ],
  },
];


export const formatCurrency = (amount: number) => {
    return `K${amount.toFixed(2)}`;
};
