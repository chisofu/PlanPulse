import { Template, PriceSource, Quote, QuoteStatus, PurchaseOrder, POStatus, ShoppingList, BudgetItem, ChatMessage } from './types';
import { v4 as uuidv4 } from 'uuid';

export const MOCK_TEMPLATES: Template[] = [
  {
    id: 'tpl_school_01',
    name: 'Primary School Supplies',
    description: 'A basic list for a new primary school term.',
    category: 'Education',
    emoji: '🎓',
    variants: {
      name: 'Standard',
      items: [
        { description: 'Exercise Book A4 96pg', category: 'Stationery', unit: 'Each', quantity: 12, unitPrice: 15.50, priceSource: PriceSource.ZPPA },
        { description: 'Blue Ballpoint Pens', category: 'Stationery', unit: 'Box', quantity: 1, unitPrice: 25.00, priceSource: PriceSource.ZPPA },
        { description: 'HB Pencils', category: 'Stationery', unit: 'Box', quantity: 1, unitPrice: 20.00, priceSource: PriceSource.ZPPA },
        { description: 'School Backpack', category: 'Apparel', unit: 'Each', quantity: 1, unitPrice: 250.00, priceSource: PriceSource.ZPPA },
      ]
    }
  },
  {
    id: 'tpl_build_01',
    name: 'Small Building Project',
    description: 'Essential materials for a small construction job.',
    category: 'Construction',
    emoji: '🏗️',
    variants: {
      name: 'Essentials',
      items: [
        { description: 'Cement 50kg', category: 'Building Materials', unit: 'Bag', quantity: 20, unitPrice: 180.00, priceSource: PriceSource.ZPPA },
        { description: 'Building Sand', category: 'Building Materials', unit: 'Tonne', quantity: 2, unitPrice: 350.00, priceSource: PriceSource.ZPPA },
        { description: 'Reinforcement Bars 12mm', category: 'Building Materials', unit: 'Length', quantity: 15, unitPrice: 120.00, priceSource: PriceSource.ZPPA },
      ]
    }
  },
   {
    id: 'tpl_grocery_01',
    name: 'Weekly Groceries',
    description: 'A standard shopping list for a family of four for one week.',
    category: 'Household',
    emoji: '🛒',
    variants: {
        name: 'Standard',
        items: [
            { description: 'Brown Bread', category: 'Bakery', unit: 'Loaf', quantity: 2, unitPrice: 18.00, priceSource: PriceSource.ZPPA },
            { description: 'Fresh Milk', category: 'Dairy', unit: 'Litre', quantity: 3, unitPrice: 22.50, priceSource: PriceSource.ZPPA },
            { description: 'Eggs', category: 'Dairy', unit: 'Dozen', quantity: 1, unitPrice: 35.00, priceSource: PriceSource.ZPPA },
            { description: 'Chicken Pieces', category: 'Meat', unit: 'kg', quantity: 2, unitPrice: 85.00, priceSource: PriceSource.ZPPA },
            { description: 'Mealie Meal 25kg', category: 'Pantry', unit: 'Bag', quantity: 1, unitPrice: 190.00, priceSource: PriceSource.ZPPA },
        ]
    }
  }
];

export const MOCK_ITEM_SUGGESTIONS: Omit<BudgetItem, 'id' | 'flags' | 'quantity'>[] = [
    ...MOCK_TEMPLATES[0].variants.items,
    ...MOCK_TEMPLATES[1].variants.items,
    ...MOCK_TEMPLATES[2].variants.items,
    { description: 'A4 Printing Paper', category: 'Stationery', unit: 'Ream', unitPrice: 110.00, priceSource: PriceSource.Merchant },
    { description: 'Black Toner Cartridge', category: 'Stationery', unit: 'Each', unitPrice: 850.00, priceSource: PriceSource.Merchant },
    { description: 'Whiteboard Markers', category: 'Stationery', unit: 'Pack', unitPrice: 75.00, priceSource: PriceSource.Merchant },
    { description: 'Laptop Charger', category: 'Electronics', unit: 'Each', unitPrice: 450.00, priceSource: PriceSource.Merchant },
    { description: 'Safety Boots', category: 'Apparel', unit: 'Pair', unitPrice: 600.00, priceSource: PriceSource.Merchant },
].reduce((acc, current) => {
    if (!acc.find(item => item.description === current.description)) {
        acc.push(current);
    }
    return acc;
}, [] as Omit<BudgetItem, 'id' | 'flags' | 'quantity'>[]);


export const MOCK_MERCHANTS = [
    { id: 'merch_01', name: 'ZBuild Hardware', logoUrl: 'https://picsum.photos/seed/zbuild/40' },
    { id: 'merch_02', name: 'Kwik-Mart Supplies', logoUrl: 'https://picsum.photos/seed/kwikmart/40' },
    { id: 'merch_03', name: 'Corporate Stationers Ltd', logoUrl: 'https://picsum.photos/seed/corpstat/40' },
];

export const MOCK_LISTS: ShoppingList[] = [
    {
        id: uuidv4(),
        name: 'Office Refresh Q3',
        createdAt: '2023-09-15T10:00:00Z',
        items: [
            { id: uuidv4(), description: 'A4 Printing Paper', category: 'Stationery', unit: 'Ream', quantity: 10, unitPrice: 110.00, priceSource: PriceSource.Merchant, flags: [] },
            { id: uuidv4(), description: 'Black Toner Cartridge', category: 'Stationery', unit: 'Each', quantity: 2, unitPrice: 850.00, priceSource: PriceSource.Merchant, flags: [] },
            { id: uuidv4(), description: 'Whiteboard Markers', category: 'Stationery', unit: 'Pack', quantity: 3, unitPrice: 75.00, priceSource: PriceSource.Merchant, flags: ['Crossed'] },
        ]
    }
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
        items: MOCK_TEMPLATES[1].variants.items.map(i => ({...i, id: uuidv4(), flags: []})),
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