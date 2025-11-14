import { createStore } from './createStore';
import {
  Mode,
  ShoppingList,
  BudgetItem,
  Quote,
  ChatMessage,
  QuoteStatus,
  PurchaseOrder,
  SortOrder,
  ListStatusFilter,
  TemplateStatusFilter,
  DateRangeFilter,
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
  listDateRange: DateRangeFilter;
  templateDateRange: DateRangeFilter;
  listSortOrder: SortOrder;
  setMode: (mode: Mode) => void;
  createList: (name?: string, dueDate?: string) => ShoppingList;
  upsertList: (list: ShoppingList) => void;
  addItemToList: (listId: string, item: BudgetItem) => void;
  updateItemInList: (listId: string, item: BudgetItem) => void;
  deleteItemFromList: (listId: string, itemId: string) => void;
  setActiveList: (listId?: string) => void;
  setListSearchQuery: (value: string) => void;
  setTemplateSearchQuery: (value: string) => void;
  setListStatusFilter: (value: ListStatusFilter) => void;
  setTemplateStatusFilter: (value: TemplateStatusFilter) => void;
  setListDateRange: (range: DateRangeFilter) => void;
  setTemplateDateRange: (range: DateRangeFilter) => void;
  setListSortOrder: (order: SortOrder) => void;
  addQuoteChatMessage: (quoteId: string, sender: ChatMessage['sender'], text: string) => void;
  updateQuoteStatus: (quoteId: string, status: QuoteStatus) => void;
  upsertPurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
};

type PersistedState = Pick<
  PlanPulseState,
  | 'lists'
  | 'activeListId'
  | 'listSearchQuery'
  | 'templateSearchQuery'
  | 'listStatusFilter'
  | 'templateStatusFilter'
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
    listDateRange: persisted?.listDateRange ?? {},
    templateDateRange: persisted?.templateDateRange ?? {},
    listSortOrder: persisted?.listSortOrder ?? 'newest',
    setMode: (mode: Mode) => set({ mode }),
    createList: (name?: string, dueDate?: string) => {
      const newList: ShoppingList = {
        id: uuidv4(),
        name: name ?? 'New List',
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
    setActiveList: (listId?: string) => set({ activeListId: listId }),
    setListSearchQuery: (value) => set({ listSearchQuery: value }),
    setTemplateSearchQuery: (value) => set({ templateSearchQuery: value }),
    setListStatusFilter: (value) => set({ listStatusFilter: value }),
    setTemplateStatusFilter: (value) => set({ templateStatusFilter: value }),
    setListDateRange: (range) => set({ listDateRange: range }),
    setTemplateDateRange: (range) => set({ templateDateRange: range }),
    setListSortOrder: (order) => set({ listSortOrder: order }),
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
export const selectListSearchQuery = (state: PlanPulseState) => state.listSearchQuery;
export const selectTemplateSearchQuery = (state: PlanPulseState) => state.templateSearchQuery;
export const selectListStatusFilter = (state: PlanPulseState) => state.listStatusFilter;
export const selectTemplateStatusFilter = (state: PlanPulseState) => state.templateStatusFilter;
export const selectListDateRange = (state: PlanPulseState) => state.listDateRange;
export const selectTemplateDateRange = (state: PlanPulseState) => state.templateDateRange;
export const selectListSortOrder = (state: PlanPulseState) => state.listSortOrder;
