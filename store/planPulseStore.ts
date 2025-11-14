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
} from '../types';
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
  setActiveList: (listId?: string) => void;
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
    setActiveList: (listId?: string) => set({ activeListId: listId }),
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
  };
});

export const selectMode = (state: PlanPulseState) => state.mode;
export const selectTemplates = (state: PlanPulseState) => state.templates;
export const selectLists = (state: PlanPulseState) => state.lists;
export const selectActiveListId = (state: PlanPulseState) => state.activeListId;
export const selectQuotes = (state: PlanPulseState) => state.quotes;
export const selectPurchaseOrders = (state: PlanPulseState) => state.purchaseOrders;
