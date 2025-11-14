import { createStore } from './createStore';
import { Mode, ShoppingList, BudgetItem, Quote, ChatMessage, QuoteStatus, PurchaseOrder } from '../types';
import { MOCK_LISTS, MOCK_QUOTES, MOCK_POS, MOCK_TEMPLATES } from '../constants';
import { v4 as uuidv4 } from 'uuid';

export type PlanPulseState = {
  mode: Mode;
  lists: ShoppingList[];
  activeListId?: string;
  quotes: Quote[];
  purchaseOrders: PurchaseOrder[];
  templates: typeof MOCK_TEMPLATES;
  setMode: (mode: Mode) => void;
  createList: (name?: string) => ShoppingList;
  upsertList: (list: ShoppingList) => void;
  addItemToList: (listId: string, item: BudgetItem) => void;
  updateItemInList: (listId: string, item: BudgetItem) => void;
  deleteItemFromList: (listId: string, itemId: string) => void;
  deleteItemsFromList: (listId: string, itemIds: string[]) => void;
  bulkUpdateItemsInList: (listId: string, itemIds: string[], updates: Partial<BudgetItem>) => void;
  reorderItemsInList: (listId: string, sourceIndex: number, destinationIndex: number) => void;
  restoreItemsInList: (listId: string, entries: { item: BudgetItem; index: number }[]) => void;
  setActiveList: (listId?: string) => void;
  addQuoteChatMessage: (quoteId: string, sender: ChatMessage['sender'], text: string) => void;
  updateQuoteStatus: (quoteId: string, status: QuoteStatus) => void;
  upsertPurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
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
  };
});

export const selectMode = (state: PlanPulseState) => state.mode;
export const selectTemplates = (state: PlanPulseState) => state.templates;
export const selectLists = (state: PlanPulseState) => state.lists;
export const selectActiveListId = (state: PlanPulseState) => state.activeListId;
export const selectQuotes = (state: PlanPulseState) => state.quotes;
export const selectPurchaseOrders = (state: PlanPulseState) => state.purchaseOrders;
