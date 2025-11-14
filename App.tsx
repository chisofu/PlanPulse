import React, { useMemo, useState } from 'react';
import {
  Mode,
  Template,
  TemplateVariant,
  ShoppingList,
  BudgetItem,
  PriceSource,
  Quote,
  PurchaseOrder,
} from './types';
import {
  MOCK_TEMPLATES,
  MOCK_LISTS,
  MOCK_QUOTES,
  MOCK_POS,
  MOCK_MERCHANTS,
  MOCK_ITEM_SUGGESTIONS,
  formatCurrency,
} from './constants';
import { Header, Screen } from './components/layout/Header';
import { ScreenContainer } from './components/shared/ScreenContainer';
import { TemplateDiscoveryView } from './components/templates/TemplateDiscoveryView';
import { ZPPAImportPanel } from './components/imports/ZPPAImportPanel';
import { MerchantOnboardingDashboard } from './components/merchants/MerchantOnboardingDashboard';
import { PriceListManagementBoard } from './components/merchants/PriceListManagementBoard';
import { QuoteThread } from './components/quotes/QuoteThread';
import { v4 as uuidv4 } from 'uuid';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from './components/Icons';
import { getModeTheme } from './components/layout/ModeTheme';

const createListFromTemplateVariant = (template: Template, variant: TemplateVariant): ShoppingList => ({
  id: uuidv4(),
  name: `${template.name} — ${variant.name}`,
  createdAt: new Date().toISOString(),
  items: variant.items.map((item) => ({
    id: uuidv4(),
    description: item.description,
    category: item.category,
    unit: item.unit,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    priceSource: item.priceSource,
    flags: [],
  })),
});

type ItemSuggestion = Omit<BudgetItem, 'id' | 'flags' | 'quantity'>;

const QuickAddItemModal: React.FC<{
  item: Partial<ItemSuggestion> & { description: string };
  onClose: () => void;
  onAdd: (item: BudgetItem) => void;
}> = ({ item, onClose, onAdd }) => {
  const [details, setDetails] = useState({
    quantity: 1,
    unit: item.unit || 'Each',
    category: item.category || 'Uncategorized',
    unitPrice: item.unitPrice || 0,
  });
  const [errors, setErrors] = useState<{ quantity?: string; unitPrice?: string }>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setDetails((previous) => ({
      ...previous,
      [name]: name === 'quantity' || name === 'unitPrice' ? parseFloat(value) || 0 : value,
    }));
  };

  const validate = () => {
    const validationErrors: { quantity?: string; unitPrice?: string } = {};
    if (details.quantity <= 0) validationErrors.quantity = 'Quantity must be positive.';
    if (details.unitPrice <= 0) validationErrors.unitPrice = 'Unit price must be positive.';
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    onAdd({
      id: uuidv4(),
      description: item.description,
      priceSource: item.priceSource || PriceSource.ZPPA,
      flags: [],
      ...details,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Add Item Details</h3>
        <p className="text-slate-600 mb-6 font-medium">{item.description}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                value={details.quantity}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.quantity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-slate-700">
                Unit
              </label>
              <input
                type="text"
                name="unit"
                id="unit"
                value={details.unit}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700">
              Category
            </label>
            <input
              type="text"
              name="category"
              id="category"
              value={details.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="unitPrice" className="block text-sm font-medium text-slate-700">
              Unit Price (K)
            </label>
            <input
              type="number"
              step="0.01"
              name="unitPrice"
              id="unitPrice"
              value={details.unitPrice}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.unitPrice ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.unitPrice && <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-budgetpulse text-white font-semibold rounded-lg hover:bg-opacity-90">
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BudgetItemRow: React.FC<{
  item: BudgetItem;
  onUpdate: (item: BudgetItem) => void;
  onDelete: (id: string) => void;
}> = ({ item, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<BudgetItem>(item);
  const isCrossed = item.flags.includes('Crossed');

  const handleToggleCrossed = () => {
    const newFlags = isCrossed ? item.flags.filter((flag) => flag !== 'Crossed') : [...item.flags, 'Crossed'];
    onUpdate({ ...item, flags: newFlags });
  };

  const handleSave = () => {
    onUpdate(editedItem);
    setIsEditing(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    const isNumeric = name === 'quantity' || name === 'unitPrice';
    setEditedItem((previous) => ({ ...previous, [name]: isNumeric ? parseFloat(value) || 0 : value }));
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-white border-b-2 border-indigo-200 space-y-3 animate-fade-in">
        <div>
          <label className="text-xs font-medium text-slate-500">Description</label>
          <input
            type="text"
            name="description"
            value={editedItem.description}
            onChange={handleChange}
            className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={editedItem.quantity}
              onChange={handleChange}
              className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Unit</label>
            <input
              type="text"
              name="unit"
              value={editedItem.unit}
              onChange={handleChange}
              className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Unit Price</label>
            <input
              type="number"
              step="0.01"
              name="unitPrice"
              value={editedItem.unitPrice}
              onChange={handleChange}
              className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Source</label>
            <select
              name="priceSource"
              value={editedItem.priceSource}
              onChange={handleChange}
              className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.values(PriceSource).map((priceSource) => (
                <option key={priceSource} value={priceSource}>
                  {priceSource}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end items-center space-x-2 pt-2">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
          >
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-budgetpulse text-white rounded-lg">
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center p-3 transition-colors group ${isCrossed ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'}`}>
      <input
        type="checkbox"
        checked={isCrossed}
        onChange={handleToggleCrossed}
        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <div className="flex-1 ml-4">
        <p className={`font-medium ${isCrossed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.description}</p>
        <p className={`text-sm ${isCrossed ? 'text-slate-400' : 'text-slate-500'}`}>
          Qty: {item.quantity} {item.unit} • <span className="font-mono text-xs">{item.priceSource}</span>
        </p>
      </div>
      <div className="w-28 text-right px-2">
        <p className={`text-sm ${isCrossed ? 'line-through text-slate-400' : 'text-slate-500'}`}>{formatCurrency(item.unitPrice)}</p>
        <p className={`text-xs ${isCrossed ? 'text-slate-400' : 'text-slate-400'}`}>each</p>
      </div>
      <div className="w-28 text-right px-2 font-semibold">
        <p className={`${isCrossed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
          {formatCurrency(item.quantity * item.unitPrice)}
        </p>
      </div>
      <div className="flex items-center ml-4 space-x-2">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
        >
          <PencilIcon />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};

const generatePdfHtml = (list: ShoppingList): string => {
  const activeItems = list.items.filter((item) => !item.flags.includes('Crossed'));
  const total = activeItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const itemsHtml = activeItems
    .map(
      (item) => `
        <tr>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity} ${item.unit}</td>
          <td class="text-right">${formatCurrency(item.unitPrice)}</td>
          <td class="text-right">${formatCurrency(item.quantity * item.unitPrice)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${list.name}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 2rem; color: #333; }
        h1 { font-size: 2rem; color: #111; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-bottom: 0.5rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f9f9f9; font-weight: 600; }
        tr:nth-child(even) { background-color: #fcfcfc; }
        .text-right { text-align: right; }
        .total-section { margin-top: 2rem; text-align: right; float: right; }
        .total-label { font-size: 1.1rem; color: #555; }
        .total-amount { font-size: 2rem; font-weight: bold; color: #111; margin-top: 0.5rem; }
      </style>
    </head>
    <body>
      <h1>${list.name}</h1>
      <p>Generated on: ${new Date().toLocaleDateString()}</p>
      <table>
        <thead>
          <tr>
            <th>Item Description</th>
            <th class="text-right">Quantity</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div class="total-section">
        <p class="total-label">Estimated Total:</p>
        <p class="total-amount">${formatCurrency(total)}</p>
      </div>
    </body>
    </html>
  `;
};

const downloadPdf = (list: ShoppingList) => {
  const html = generatePdfHtml(list);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${list.name.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const QuotesScreen: React.FC<{
  quotes: Quote[];
  selectedQuoteId: string | null;
  onSelectQuote: (quoteId: string) => void;
  mode: Mode;
}> = ({ quotes, selectedQuoteId, onSelectQuote, mode }) => {
  const selectedQuote = quotes.find((quote) => quote.id === selectedQuoteId) ?? quotes[0];
  const statusTimeline = [
    { label: 'Draft Created', timestamp: '2025-01-02T08:00:00Z' },
    { label: 'Submitted', timestamp: selectedQuote?.submittedAt ?? new Date().toISOString() },
    { label: 'Auto-Proforma Generated', timestamp: '2025-01-02T09:10:00Z' },
    { label: 'Awaiting Merchant Confirmation', timestamp: '2025-01-03T11:15:00Z' },
  ];

  return (
    <ScreenContainer title="Quotes" description="Monitor active requests and collaborate in real time with merchants.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {quotes.map((quote) => (
            <button
              key={quote.id}
              onClick={() => onSelectQuote(quote.id)}
              className={`w-full text-left bg-white rounded-xl border p-4 shadow-sm transition-all ${
                selectedQuote?.id === quote.id ? 'border-budgetpulse' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-sm font-semibold text-slate-800">{quote.reference}</p>
              <p className="text-xs text-slate-500">{quote.listName}</p>
              <p className="text-xs text-slate-500 mt-1">{quote.status}</p>
            </button>
          ))}
        </div>
        <div className="lg:col-span-2">
          {selectedQuote ? (
            <QuoteThread
              threadId={selectedQuote.id}
              initialMessages={selectedQuote.chatHistory ?? []}
              statusTimeline={statusTimeline}
              mode={mode}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-500">
              <p>Select a quote to view the conversation thread.</p>
            </div>
          )}
        </div>
      </div>
    </ScreenContainer>
  );
};

const DashboardCard: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  mode: Mode;
}> = ({ title, subtitle, icon, onClick, mode }) => {
  const theme = getModeTheme(mode);
  return (
    <button
      onClick={onClick}
      className={`bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex items-center space-x-4 w-full text-left border-t-4 border-${theme.accentKey}`}
    >
      <div className={`p-3 rounded-full bg-${theme.accentKey}-light text-${theme.accentKey}`}>{icon}</div>
      <div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-slate-500">{subtitle}</p>
      </div>
      <ChevronRightIcon className="ml-auto text-slate-400" />
    </button>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>(Mode.PricePulse);
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [lists, setLists] = useState<ShoppingList[]>(MOCK_LISTS);
  const [activeListId, setActiveListId] = useState<string | null>(MOCK_LISTS[0]?.id ?? null);
  const [quotes] = useState<Quote[]>(MOCK_QUOTES);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(MOCK_QUOTES[0]?.id ?? null);
  const [purchaseOrders] = useState<PurchaseOrder[]>(MOCK_POS);
  const [quickAddItem, setQuickAddItem] = useState<ItemSuggestion | null>(null);

  const activeList = useMemo(
    () => lists.find((list) => list.id === activeListId) ?? lists[0] ?? null,
    [lists, activeListId]
  );

  const screenTitle = useMemo(() => {
    switch (activeScreen) {
      case 'templates':
        return 'Template Library';
      case 'list':
        return activeList ? activeList.name : 'New List';
      case 'quotes':
        return 'Quotes';
      case 'pos':
        return 'Purchase Orders';
      case 'imports':
        return 'ZPPA Imports';
      case 'merchants':
        return 'Merchant Operations';
      default:
        return undefined;
    }
  }, [activeScreen, activeList]);

  const handleSelectTemplateVariant = (template: Template, variantId: string) => {
    const variant = template.variants.find((entry) => entry.id === variantId) ?? template.variants[0];
    if (!variant) return;
    const newList = createListFromTemplateVariant(template, variant);
    setLists((previous) => [newList, ...previous]);
    setActiveListId(newList.id);
    setActiveScreen('list');
  };

  const handleAddItem = (item: BudgetItem) => {
    if (!activeList) return;
    setLists((previous) =>
      previous.map((list) => (list.id === activeList.id ? { ...list, items: [...list.items, item] } : list))
    );
    setQuickAddItem(null);
  };

  const handleUpdateItem = (updatedItem: BudgetItem) => {
    if (!activeList) return;
    setLists((previous) =>
      previous.map((list) =>
        list.id === activeList.id
          ? { ...list, items: list.items.map((item) => (item.id === updatedItem.id ? updatedItem : item)) }
          : list
      )
    );
  };

  const handleDeleteItem = (itemId: string) => {
    if (!activeList) return;
    setLists((previous) =>
      previous.map((list) =>
        list.id === activeList.id ? { ...list, items: list.items.filter((item) => item.id !== itemId) } : list
      )
    );
  };

  const activeListTotals = useMemo(() => {
    if (!activeList) return { draft: 0, quote: 0 };
    const draft = activeList.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const quote = activeList.items
      .filter((item) => !item.flags.includes('Crossed'))
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    return { draft, quote };
  }, [activeList]);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return (
          <ScreenContainer
            title={`Welcome to ${mode === Mode.PricePulse ? 'PricePulse' : 'BudgetPulse'}`}
            description="Your unified planning cockpit for templates, lists, quotes, imports, and merchant health."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DashboardCard
                title="Start from Template"
                subtitle="Browse curated planning templates"
                icon={<DocumentDuplicateIcon />}
                onClick={() => setActiveScreen('templates')}
                mode={mode}
              />
              <DashboardCard
                title="Create New List"
                subtitle="Start with a blank slate"
                icon={<PlusIcon />}
                onClick={() => {
                  const list: ShoppingList = {
                    id: uuidv4(),
                    name: `Untitled List ${lists.length + 1}`,
                    createdAt: new Date().toISOString(),
                    items: [],
                  };
                  setLists((previous) => [list, ...previous]);
                  setActiveListId(list.id);
                  setActiveScreen('list');
                }}
                mode={mode}
              />
              <DashboardCard
                title="My Shopping Lists"
                subtitle={`${lists.length} list(s)`}
                icon={<CheckCircleIcon />}
                onClick={() => setActiveScreen('list')}
                mode={mode}
              />
              {mode === Mode.BudgetPulse && (
                <>
                  <DashboardCard
                    title="Manage Quotes"
                    subtitle={`${quotes.length} active`}
                    icon={<DocumentDuplicateIcon />}
                    onClick={() => setActiveScreen('quotes')}
                    mode={mode}
                  />
                  <DashboardCard
                    title="Track Purchase Orders"
                    subtitle={`${purchaseOrders.length} active`}
                    icon={<CheckCircleIcon />}
                    onClick={() => setActiveScreen('pos')}
                    mode={mode}
                  />
                  <DashboardCard
                    title="ZPPA Imports"
                    subtitle="Govern staging → prod"
                    icon={<DocumentDuplicateIcon />}
                    onClick={() => setActiveScreen('imports')}
                    mode={mode}
                  />
                  <DashboardCard
                    title="Merchant Ops"
                    subtitle="Onboard & validate"
                    icon={<PaperAirplaneIcon />}
                    onClick={() => setActiveScreen('merchants')}
                    mode={mode}
                  />
                </>
              )}
            </div>
          </ScreenContainer>
        );
      case 'templates':
        return (
          <ScreenContainer
            title="Template Library"
            description="Search, filter, and launch templates with curated variants aligned to ZPPA and merchant data."
          >
            <TemplateDiscoveryView templates={MOCK_TEMPLATES} mode={mode} onSelect={handleSelectTemplateVariant} />
          </ScreenContainer>
        );
      case 'list':
        return activeList ? (
          <ScreenContainer
            title={activeList.name}
            description="Adjust quantities, manage price sources, and export ready-to-share budgets."
            actions={
              <button
                onClick={() => downloadPdf(activeList)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold"
              >
                Export draft
              </button>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  {activeList.items.map((item) => (
                    <BudgetItemRow key={item.id} item={item} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} />
                  ))}
                  {activeList.items.length === 0 && (
                    <div className="p-6 text-center text-slate-500">Start adding items to build your plan.</div>
                  )}
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Quick add from suggestions</h3>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_ITEM_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion.description}
                        onClick={() => setQuickAddItem(suggestion)}
                        className="px-3 py-1 rounded-full border border-slate-200 text-xs text-slate-600 hover:border-slate-300"
                      >
                        {suggestion.description}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <aside className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Totals</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Draft Total</span>
                    <span className="text-lg font-semibold text-slate-900">{formatCurrency(activeListTotals.draft)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Quote Total</span>
                    <span className="text-lg font-semibold text-slate-900">{formatCurrency(activeListTotals.quote)}</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Merchant matches</p>
                  <div className="space-y-2">
                    {MOCK_MERCHANTS.map((merchant) => (
                      <div key={merchant.id} className="flex items-center gap-3">
                        <img src={merchant.logoUrl} alt={merchant.name} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{merchant.name}</p>
                          <p className="text-xs text-slate-500">Live pricing available</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </ScreenContainer>
        ) : (
          <ScreenContainer title="No list selected">
            <p className="text-slate-500">Create or pick a list to get started.</p>
          </ScreenContainer>
        );
      case 'quotes':
        return (
          <QuotesScreen
            quotes={quotes}
            selectedQuoteId={selectedQuoteId}
            onSelectQuote={setSelectedQuoteId}
            mode={mode}
          />
        );
      case 'pos':
        return (
          <ScreenContainer
            title="Purchase Orders"
            description="Follow fulfillment progress for purchase orders converted from quotes."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchaseOrders.map((po) => (
                <div key={po.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-800">{po.reference}</p>
                  <p className="text-xs text-slate-500">Seller: {po.seller.name}</p>
                  <p className="text-xs text-slate-500">Status: {po.status}</p>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(po.total)}</p>
                </div>
              ))}
            </div>
          </ScreenContainer>
        );
      case 'imports':
        return (
          <ScreenContainer
            title="ZPPA Price Index Imports"
            description="Validate, promote, and rollback ZPPA datasets with full audit context."
          >
            <ZPPAImportPanel mode={mode} />
          </ScreenContainer>
        );
      case 'merchants':
        return (
          <ScreenContainer
            title="Merchant Operations"
            description="Keep merchant onboarding healthy, track price list freshness, and guide validation feedback."
          >
            <div className="space-y-8">
              <MerchantOnboardingDashboard mode={mode} />
              <PriceListManagementBoard mode={mode} />
            </div>
          </ScreenContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Header
        mode={mode}
        setMode={setMode}
        activeScreen={activeScreen}
        onBack={() => setActiveScreen('dashboard')}
        screenTitle={screenTitle}
      />
      {renderScreen()}
      {quickAddItem && (
        <QuickAddItemModal
          item={quickAddItem}
          onClose={() => setQuickAddItem(null)}
          onAdd={handleAddItem}
        />
      )}
    </div>
  );
};

export default App;
