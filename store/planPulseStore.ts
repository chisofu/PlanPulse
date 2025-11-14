import { createStore } from './createStore';
import {
  Mode,
  ShoppingList,
  BudgetItem,
  Quote,
  ChatMessage,
  QuoteStatus,
  PurchaseOrder,
  ItemSuggestionMetadata,
} from '../types';
import {
  MOCK_LISTS,
  MOCK_QUOTES,
  MOCK_POS,
  MOCK_TEMPLATES,
  INITIAL_ITEM_SUGGESTIONS,
  DEFAULT_ITEM_CATEGORIES,
} from '../constants';
import { v4 as uuidv4 } from 'uuid';

export type PlanPulseState = {
  mode: Mode;
  lists: ShoppingList[];
  activeListId?: string;
  quotes: Quote[];
  purchaseOrders: PurchaseOrder[];
  templates: typeof MOCK_TEMPLATES;
  itemSuggestions: ItemSuggestionMetadata[];
  categoryTaxonomy: string[];
  setMode: (mode: Mode) => void;
  createList: (name?: string) => ShoppingList;
  upsertList: (list: ShoppingList) => void;
  addItemToList: (listId: string, item: BudgetItem) => void;
  updateItemInList: (listId: string, item: BudgetItem) => void;
  deleteItemFromList: (listId: string, itemId: string) => void;
  setActiveList: (listId?: string) => void;
  addQuoteChatMessage: (quoteId: string, sender: ChatMessage['sender'], text: string) => void;
  updateQuoteStatus: (quoteId: string, status: QuoteStatus) => void;
  upsertPurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  recordItemSuggestion: (item: Omit<BudgetItem, 'id' | 'flags'>) => void;
  upsertCategory: (category: string) => void;
};

export const usePlanPulseStore = createStore<PlanPulseState>((set, get) => {
  const initialLists = [...MOCK_LISTS];
  return {
    mode: Mode.PricePulse,
    lists: initialLists,
    activeListId: initialLists[0]?.id,
    quotes: [...MOCK_QUOTES],
    purchaseOrders: [...MOCK_POS],
    templates: [...MOCK_TEMPLATES],
    itemSuggestions: [...INITIAL_ITEM_SUGGESTIONS],
    categoryTaxonomy: [...DEFAULT_ITEM_CATEGORIES],
    setMode: (mode: Mode) => set({ mode }),
    createList: (name?: string) => {
      const newList: ShoppingList = {
        id: uuidv4(),
        name: name ?? 'New List',
        createdAt: new Date().toISOString(),
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
    setActiveList: (listId?: string) => set({ activeListId: listId }),
    addQuoteChatMessage: (quoteId, sender, text) => {
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
                  },
                ],
              }
            : quote
        ),
      }));
    },
    updateQuoteStatus: (quoteId, status) => {
      set((state) => ({
        quotes: state.quotes.map((quote) =>
          quote.id === quoteId ? { ...quote, status } : quote
        ),
      }));
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
export const selectItemSuggestions = (state: PlanPulseState) => state.itemSuggestions;
export const selectCategoryTaxonomy = (state: PlanPulseState) => state.categoryTaxonomy;
