import { createStore } from './createStore';
import {
  Mode,
  ShoppingList,
  BudgetItem,
  Quote,
  ChatMessage,
  QuoteStatus,
  PurchaseOrder,
  QuoteAttachment,
  QuoteTimelineEntry,
  Template,
  TemplateCategory,
  TemplatePublishStatus,
} from '../types';
import { MOCK_LISTS, MOCK_QUOTES, MOCK_POS, MOCK_TEMPLATES } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'planpulse_state_v1';

export type PlanPulseState = {
  mode: Mode;
  lists: ShoppingList[];
  activeListId?: string;
  quotes: Quote[];
  purchaseOrders: PurchaseOrder[];
  templates: typeof MOCK_TEMPLATES;
  listSearchQuery: string;
  templateSearchQuery: string;
  listStatusFilter: ListStatusFilter;
  templateStatusFilter: TemplateStatusFilter;
  templateCategoryFilter: TemplateCategory | 'all';
  templateVariantFilter: 'all' | string;
  templatePublishFilter: 'all' | TemplatePublishStatus;
  listDateRange: DateRangeFilter;
  templateDateRange: DateRangeFilter;
  listSortOrder: SortOrder;
  setMode: (mode: Mode) => void;
  createList: (name?: string, dueDate?: string) => ShoppingList;
  upsertList: (list: ShoppingList) => void;
  addItemToList: (listId: string, item: BudgetItem) => void;
  updateItemInList: (listId: string, item: BudgetItem) => void;
  deleteItemFromList: (listId: string, itemId: string) => void;
  deleteItemsFromList: (listId: string, itemIds: string[]) => void;
  bulkUpdateItemsInList: (listId: string, itemIds: string[], updates: Partial<BudgetItem>) => void;
  reorderItemsInList: (listId: string, sourceIndex: number, destinationIndex: number) => void;
  restoreItemsInList: (listId: string, entries: { item: BudgetItem; index: number }[]) => void;
  setActiveList: (listId?: string) => void;
  setTemplateSearchQuery: (value: string) => void;
  setTemplateStatusFilter: (value: TemplateStatusFilter) => void;
  setTemplateCategoryFilter: (value: TemplateCategory | 'all') => void;
  setTemplateVariantFilter: (value: 'all' | string) => void;
  setTemplatePublishFilter: (value: TemplatePublishStatus | 'all') => void;
  setTemplateDateRange: (value: DateRangeFilter) => void;
  upsertTemplate: (template: Template) => void;
  deleteTemplate: (templateId: string) => void;
  setTemplatePublishStatus: (templateId: string, status: TemplatePublishStatus) => void;
  addQuoteChatMessage: (
    quoteId: string,
    sender: ChatMessage['sender'],
    text: string,
    attachments?: QuoteAttachment[],
  ) => void;
  addQuoteAttachment: (quoteId: string, attachment: QuoteAttachment) => void;
  updateQuoteItems: (quoteId: string, items: BudgetItem[]) => void;
  updateQuoteStatus: (quoteId: string, status: QuoteStatus, note?: string) => void;
  requestNewQuoteFromExisting: (quoteId: string) => Quote | undefined;
  upsertPurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  recordItemSuggestion: (item: Omit<BudgetItem, 'id' | 'flags'>) => void;
  upsertCategory: (category: string) => void;
};

type PersistedState = Pick<
  PlanPulseState,
  | 'lists'
  | 'activeListId'
  | 'listSearchQuery'
  | 'templateSearchQuery'
  | 'listStatusFilter'
  | 'templateStatusFilter'
  | 'templateCategoryFilter'
  | 'templateVariantFilter'
  | 'templatePublishFilter'
  | 'listDateRange'
  | 'templateDateRange'
  | 'listSortOrder'
>;

const loadPersistedState = (): Partial<PersistedState> | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as PersistedState;
  } catch (error) {
    console.warn('Failed to load PlanPulse state from localStorage', error);
    return undefined;
  }
};

export const getPersistableState = (state: PlanPulseState): PersistedState => ({
  lists: state.lists,
  activeListId: state.activeListId,
  listSearchQuery: state.listSearchQuery,
  templateSearchQuery: state.templateSearchQuery,
  listStatusFilter: state.listStatusFilter,
  templateStatusFilter: state.templateStatusFilter,
  templateCategoryFilter: state.templateCategoryFilter,
  templateVariantFilter: state.templateVariantFilter,
  templatePublishFilter: state.templatePublishFilter,
  listDateRange: state.listDateRange,
  templateDateRange: state.templateDateRange,
  listSortOrder: state.listSortOrder,
});

export const persistenceKey = STORAGE_KEY;

export const usePlanPulseStore = createStore<PlanPulseState>((set, get) => {
  const persisted = loadPersistedState();
  const initialLists = persisted?.lists?.length ? persisted.lists : [...MOCK_LISTS];
  const initialActiveList = persisted?.activeListId ?? initialLists[0]?.id;
  return {
    mode: Mode.PricePulse,
    lists: initialLists,
    activeListId: initialActiveList,
    quotes: [...MOCK_QUOTES],
    purchaseOrders: [...MOCK_POS],
    templates: [...MOCK_TEMPLATES],
    listSearchQuery: persisted?.listSearchQuery ?? '',
    templateSearchQuery: persisted?.templateSearchQuery ?? '',
    listStatusFilter: persisted?.listStatusFilter ?? 'all',
    templateStatusFilter: persisted?.templateStatusFilter ?? 'all',
    templateCategoryFilter: persisted?.templateCategoryFilter ?? 'all',
    templateVariantFilter: persisted?.templateVariantFilter ?? 'all',
    templatePublishFilter: persisted?.templatePublishFilter ?? 'all',
    listDateRange: persisted?.listDateRange ?? {},
    templateDateRange: persisted?.templateDateRange ?? {},
    listSortOrder: persisted?.listSortOrder ?? 'newest',
    setMode: (mode: Mode) => set({ mode }),
    createList: (name?: string, dueDate?: string) => {
      const newList: ShoppingList = {
        id: uuidv4(),
        name: name ?? 'New List',
        description: '',
        createdAt: new Date().toISOString(),
        dueDate,
        items: [],
      };
      set((state) => ({
        lists: [...state.lists, newList],
        activeListId: newList.id,
      }));
      return newList;
    },
    upsertList: (list: ShoppingList) => {
      set((state) => ({
        lists: state.lists.some((l) => l.id === list.id)
          ? state.lists.map((l) => (l.id === list.id ? list : l))
          : [...state.lists, list],
        activeListId: list.id,
      }));
    },
    addItemToList: (listId: string, item: BudgetItem) => {
      set((state) => ({
        lists: state.lists.map((list) =>
          list.id === listId ? { ...list, items: [...list.items, item] } : list
        ),
      }));
    },
    updateItemInList: (listId: string, item: BudgetItem) => {
      set((state) => ({
        lists: state.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                items: list.items.map((existing) => (existing.id === item.id ? item : existing)),
              }
            : list
        ),
      }));
    },
    deleteItemFromList: (listId: string, itemId: string) => {
      set((state) => ({
        lists: state.lists.map((list) =>
          list.id === listId
            ? { ...list, items: list.items.filter((item) => item.id !== itemId) }
            : list
        ),
      }));
    },
    deleteItemsFromList: (listId: string, itemIds: string[]) => {
      const idSet = new Set(itemIds);
      set((state) => ({
        lists: state.lists.map((list) =>
          list.id === listId
            ? { ...list, items: list.items.filter((item) => !idSet.has(item.id)) }
            : list
        ),
      }));
    },
    bulkUpdateItemsInList: (listId: string, itemIds: string[], updates: Partial<BudgetItem>) => {
      const idSet = new Set(itemIds);
      set((state) => ({
        lists: state.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                items: list.items.map((item) =>
                  idSet.has(item.id) ? { ...item, ...updates } : item
                ),
              }
            : list
        ),
      }));
    },
    reorderItemsInList: (listId: string, sourceIndex: number, destinationIndex: number) => {
      set((state) => ({
        lists: state.lists.map((list) => {
          if (list.id !== listId) return list;
          const items = [...list.items];
          const [moved] = items.splice(sourceIndex, 1);
          items.splice(destinationIndex, 0, moved);
          return { ...list, items };
        }),
      }));
    },
    restoreItemsInList: (listId: string, entries: { item: BudgetItem; index: number }[]) => {
      const sorted = [...entries].sort((a, b) => a.index - b.index);
      set((state) => ({
        lists: state.lists.map((list) => {
          if (list.id !== listId) return list;
          const items = [...list.items];
          sorted.forEach(({ item, index }) => {
            const safeIndex = Math.min(Math.max(index, 0), items.length);
            items.splice(safeIndex, 0, item);
          });
          return { ...list, items };
        }),
      }));
    },
    setActiveList: (listId?: string) => set({ activeListId: listId }),
    setTemplateSearchQuery: (value: string) => set({ templateSearchQuery: value }),
    setTemplateStatusFilter: (value: TemplateStatusFilter) => set({ templateStatusFilter: value }),
    setTemplateCategoryFilter: (value: TemplateCategory | 'all') =>
      set({ templateCategoryFilter: value }),
    setTemplateVariantFilter: (value: 'all' | string) => set({ templateVariantFilter: value }),
    setTemplatePublishFilter: (value: TemplatePublishStatus | 'all') =>
      set({ templatePublishFilter: value }),
    setTemplateDateRange: (value: DateRangeFilter) => set({ templateDateRange: value }),
    upsertTemplate: (template: Template) => {
      set((state) => {
        const exists = state.templates.some((entry) => entry.id === template.id);
        const templates = exists
          ? state.templates.map((entry) => (entry.id === template.id ? template : entry))
          : [...state.templates, template];
        return { templates };
      });
    },
    deleteTemplate: (templateId: string) => {
      set((state) => ({
        templates: state.templates.filter((template) => template.id !== templateId),
      }));
    },
    setTemplatePublishStatus: (templateId: string, status: TemplatePublishStatus) => {
      set((state) => ({
        templates: state.templates.map((template) =>
          template.id === templateId ? { ...template, status } : template,
        ),
      }));
    },
    addQuoteChatMessage: (quoteId, sender, text, attachments) => {
      set((state) => ({
        quotes: state.quotes.map((quote) =>
          quote.id === quoteId
            ? {
                ...quote,
                chatHistory: [
                  ...(quote.chatHistory ?? []),
                  {
                    id: uuidv4(),
                    sender,
                    text,
                    timestamp: new Date().toISOString(),
                    attachments: attachments?.map((attachment) => ({ ...attachment, id: attachment.id ?? uuidv4() })),
                  },
                ],
              }
            : quote
        ),
      }));
    },
    addQuoteAttachment: (quoteId, attachment) => {
      set((state) => ({
        quotes: state.quotes.map((quote) =>
          quote.id === quoteId
            ? {
                ...quote,
                attachments: [
                  ...(quote.attachments ?? []),
                  {
                    ...attachment,
                    id: attachment.id ?? uuidv4(),
                  },
                ],
              }
            : quote
        ),
      }));
    },
    updateQuoteItems: (quoteId, items) => {
      set((state) => ({
        quotes: state.quotes.map((quote) =>
          quote.id === quoteId
            ? {
                ...quote,
                items,
              }
            : quote
        ),
      }));
    },
    updateQuoteStatus: (quoteId, status, note) => {
      set((state) => ({
        quotes: state.quotes.map((quote) => {
          if (quote.id !== quoteId) return quote;
          const timelineEntry: QuoteTimelineEntry = {
            id: uuidv4(),
            label: `Status changed to ${status}`,
            status,
            timestamp: new Date().toISOString(),
            description: note,
          };
          return {
            ...quote,
            status,
            timeline: [...(quote.timeline ?? []), timelineEntry],
          };
        }),
      }));
    },
    requestNewQuoteFromExisting: (quoteId) => {
      const quoteToClone = get().quotes.find((quote) => quote.id === quoteId);
      if (!quoteToClone) return undefined;
      const clonedItems = quoteToClone.items.map((item) => ({
        ...item,
        id: uuidv4(),
      }));
      const newQuote: Quote = {
        ...quoteToClone,
        id: uuidv4(),
        reference: `Q-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, '0')}`,
        status: QuoteStatus.Draft,
        submittedAt: new Date().toISOString(),
        items: clonedItems,
        chatHistory: [],
        attachments: [],
        timeline: [
          {
            id: uuidv4(),
            label: 'Quote request created',
            timestamp: new Date().toISOString(),
            status: QuoteStatus.Draft,
            description: `Cloned from ${quoteToClone.reference}`,
          },
        ],
      };

      set((state) => ({
        quotes: [newQuote, ...state.quotes],
      }));

      return newQuote;
    },
    upsertPurchaseOrder: (purchaseOrder) => {
      set((state) => ({
        purchaseOrders: state.purchaseOrders.some((po) => po.id === purchaseOrder.id)
          ? state.purchaseOrders.map((po) => (po.id === purchaseOrder.id ? purchaseOrder : po))
          : [...state.purchaseOrders, purchaseOrder],
      }));
    },
    recordItemSuggestion: (item) => {
      const normalizedDescription = item.description.trim().toLowerCase();
      const timestamp = new Date().toISOString();
      set((state) => {
        const existingIndex = state.itemSuggestions.findIndex(
          (suggestion) => suggestion.description.toLowerCase() === normalizedDescription
        );

        const updatedSuggestions = existingIndex >= 0
          ? state.itemSuggestions.map((suggestion, index) =>
              index === existingIndex
                ? {
                    ...suggestion,
                    category: item.category || suggestion.category,
                    unit: item.unit || suggestion.unit,
                    unitPrice: item.unitPrice || suggestion.unitPrice,
                    priceSource: item.priceSource || suggestion.priceSource,
                    quantitySuggestion: item.quantity ?? suggestion.quantitySuggestion,
                    usageCount: suggestion.usageCount + 1,
                    lastUsedAt: timestamp,
                  }
                : suggestion
            )
          : [
              ...state.itemSuggestions,
              {
                description: item.description,
                category: item.category,
                unit: item.unit,
                unitPrice: item.unitPrice,
                priceSource: item.priceSource,
                quantitySuggestion: item.quantity,
                usageCount: 1,
                lastUsedAt: timestamp,
                provenance: 'user',
              },
            ];

        const hasCategory = state.categoryTaxonomy.some(
          (existing) => existing.toLowerCase() === item.category.toLowerCase()
        );

        const categoryTaxonomy = hasCategory
          ? state.categoryTaxonomy
          : [...state.categoryTaxonomy, item.category].sort((a, b) => a.localeCompare(b));

        return {
          itemSuggestions: updatedSuggestions,
          categoryTaxonomy,
        };
      });
    },
    upsertCategory: (category) => {
      const normalized = category.trim();
      if (!normalized) {
        return;
      }
      set((state) => {
        const exists = state.categoryTaxonomy.some(
          (existing) => existing.toLowerCase() === normalized.toLowerCase()
        );
        if (exists) {
          return {};
        }
        return {
          categoryTaxonomy: [...state.categoryTaxonomy, normalized].sort((a, b) => a.localeCompare(b)),
        };
      });
    },
  };
});

export const selectMode = (state: PlanPulseState) => state.mode;
export const selectTemplates = (state: PlanPulseState) => state.templates;
export const selectLists = (state: PlanPulseState) => state.lists;
export const selectActiveListId = (state: PlanPulseState) => state.activeListId;
export const selectQuotes = (state: PlanPulseState) => state.quotes;
export const selectPurchaseOrders = (state: PlanPulseState) => state.purchaseOrders;
export const selectListSearchQuery = (state: PlanPulseState) => state.listSearchQuery;
export const selectTemplateSearchQuery = (state: PlanPulseState) => state.templateSearchQuery;
export const selectListStatusFilter = (state: PlanPulseState) => state.listStatusFilter;
export const selectTemplateStatusFilter = (state: PlanPulseState) => state.templateStatusFilter;
export const selectTemplateCategoryFilter = (state: PlanPulseState) => state.templateCategoryFilter;
export const selectTemplateVariantFilter = (state: PlanPulseState) => state.templateVariantFilter;
export const selectTemplatePublishFilter = (state: PlanPulseState) => state.templatePublishFilter;
export const selectListDateRange = (state: PlanPulseState) => state.listDateRange;
export const selectTemplateDateRange = (state: PlanPulseState) => state.templateDateRange;
export const selectListSortOrder = (state: PlanPulseState) => state.listSortOrder;
