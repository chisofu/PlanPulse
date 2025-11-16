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
  ItemSuggestionMetadata,
  DateRangeFilter,
  ListStatusFilter,
  TemplateStatusFilter,
  SortOrder,
  Role,
  TeamMember,
  ActivityEntry,
} from '../types';
import {
  MOCK_LISTS,
  MOCK_QUOTES,
  MOCK_POS,
  MOCK_TEMPLATES,
  MOCK_TEAM_MEMBERS,
  MOCK_ACTIVITY,
} from '../constants';
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
  dashboardSearchQuery: string;
  userRole: Role;
  teamMembers: TeamMember[];
  recentActivity: ActivityEntry[];
  itemSuggestions: ItemSuggestionMetadata[];
  categoryTaxonomy: string[];
  setMode: (mode: Mode) => void;
  setUserRole: (role: Role) => void;
  setListSearchQuery: (query: string) => void;
  setTemplateSearchQuery: (query: string) => void;
  setListStatusFilter: (filter: ListStatusFilter) => void;
  setTemplateStatusFilter: (filter: TemplateStatusFilter) => void;
  setListDateRange: (range: DateRangeFilter) => void;
  setTemplateDateRange: (range: DateRangeFilter) => void;
  setListSortOrder: (order: SortOrder) => void;
  setDashboardSearchQuery: (query: string) => void;
  createList: (name?: string, dueDate?: string) => ShoppingList;
  upsertList: (list: ShoppingList) => void;
  addItemToList: (listId: string, item: BudgetItem) => void;
  updateItemInList: (listId: string, item: BudgetItem) => void;
  deleteItemFromList: (listId: string, itemId: string) => void;
  deleteItemsFromList: (listId: string, itemIds: string[]) => void;
  bulkUpdateItemsInList: (listId: string, itemIds: string[], updates: Partial<BudgetItem>) => void;
  reorderItemsInList: (listId: string, sourceIndex: number, destinationIndex: number) => void;
  restoreItemsInList: (listId: string, entries: { item: BudgetItem; index: number }[]) => void;
  delegateList: (listId: string, memberId?: string) => void;
  delegateItem: (listId: string, itemId: string, memberId?: string) => void;
  logActivity: (entry: Partial<ActivityEntry> & Pick<ActivityEntry, 'summary' | 'entityType'>) => void;
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
  | 'dashboardSearchQuery'
  | 'userRole'
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
  dashboardSearchQuery: state.dashboardSearchQuery,
  userRole: state.userRole,
});

export const persistenceKey = STORAGE_KEY;

export const usePlanPulseStore = createStore<PlanPulseState>((set, get) => {
  const persisted = loadPersistedState();
  const initialLists = persisted?.lists?.length ? persisted.lists : [...MOCK_LISTS];
  const initialActiveList = persisted?.activeListId ?? initialLists[0]?.id;
  const derivedCategories = Array.from(
    new Set(initialLists.flatMap((list) => list.items.map((item) => item.category))),
  ).sort((a, b) => a.localeCompare(b));
  const getActorLabel = () => {
    const role = get().userRole;
    switch (role) {
      case Role.Procurement:
        return 'Procurement Lead';
      case Role.Admin:
        return 'Admin';
      case Role.Merchant:
        return 'Merchant Partner';
      default:
        return 'Personal';
    }
  };
  const normalizeItemForList = (entry: BudgetItem, timestamp: string): BudgetItem => {
    const baseFlags = Array.isArray(entry.flags) ? entry.flags : [];
    const shouldExclude = entry.excludeFromTotals ?? baseFlags.includes('Excluded');
    const flags = shouldExclude
      ? Array.from(new Set([...baseFlags, 'Excluded']))
      : baseFlags.filter((flag) => flag !== 'Excluded');
    const normalizedImages = entry.images ?? (entry.imageUrl ? [entry.imageUrl] : []);
    return {
      ...entry,
      flags,
      excludeFromTotals: shouldExclude,
      priority: entry.priority ?? 'Medium',
      completed: entry.completed ?? false,
      status: entry.status ?? 'Planned',
      images: normalizedImages,
      imageUrl: entry.imageUrl ?? normalizedImages[0],
      tags: entry.tags ?? [],
      priceHistory: entry.priceHistory ?? [],
      lastUpdatedAt: timestamp,
    };
  };
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
    dashboardSearchQuery: persisted?.dashboardSearchQuery ?? '',
    userRole: persisted?.userRole ?? Role.Procurement,
    teamMembers: [...MOCK_TEAM_MEMBERS],
    recentActivity: [...MOCK_ACTIVITY],
    itemSuggestions: [],
    categoryTaxonomy: derivedCategories,
    setMode: (mode: Mode) => set({ mode }),
    setUserRole: (role: Role) => set({ userRole: role }),
    setListSearchQuery: (query: string) => set({ listSearchQuery: query }),
    setTemplateSearchQuery: (query: string) => set({ templateSearchQuery: query }),
    setListStatusFilter: (filter: ListStatusFilter) => set({ listStatusFilter: filter }),
    setTemplateStatusFilter: (filter: TemplateStatusFilter) => set({ templateStatusFilter: filter }),
    setListDateRange: (range: DateRangeFilter) => set({ listDateRange: range }),
    setTemplateDateRange: (range: DateRangeFilter) => set({ templateDateRange: range }),
    setListSortOrder: (order: SortOrder) => set({ listSortOrder: order }),
    setDashboardSearchQuery: (query: string) => set({ dashboardSearchQuery: query }),
    createList: (name?: string, dueDate?: string) => {
      const timestamp = new Date().toISOString();
      const newList: ShoppingList = {
        id: uuidv4(),
        name: name?.trim() || 'Untitled List',
        description: '',
        createdAt: timestamp,
        dueDate,
        items: [],
        ownerId: undefined,
        collaboratorIds: [],
        lastUpdatedAt: timestamp,
      };
      set((state) => ({
        lists: [...state.lists, newList],
        activeListId: newList.id,
      }));
      return newList;
    },
    upsertList: (list: ShoppingList) => {
      const timestamp = list.lastUpdatedAt ?? new Date().toISOString();
      const nextList = { ...list, lastUpdatedAt: timestamp };
      set((state) => ({
        lists: state.lists.some((l) => l.id === nextList.id)
          ? state.lists.map((l) => (l.id === nextList.id ? nextList : l))
          : [...state.lists, nextList],
        activeListId: nextList.id,
      }));
    },
    addItemToList: (listId: string, item: BudgetItem) => {
      const timestamp = new Date().toISOString();
      const nextItem = normalizeItemForList(item, timestamp);
      set((state) => ({
        lists: state.lists.map((list) =>
          list.id === listId
            ? { ...list, items: [...list.items, nextItem], lastUpdatedAt: timestamp }
            : list
        ),
      }));
    },
    updateItemInList: (listId: string, item: BudgetItem) => {
      const timestamp = new Date().toISOString();
      const nextItem = normalizeItemForList(item, timestamp);
      set((state) => ({
        lists: state.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                lastUpdatedAt: timestamp,
                items: list.items.map((existing) => (existing.id === nextItem.id ? nextItem : existing)),
              }
            : list
        ),
      }));
    },
    deleteItemFromList: (listId: string, itemId: string) => {
      const timestamp = new Date().toISOString();
      set((state) => ({
        lists: state.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                items: list.items.filter((item) => item.id !== itemId),
                lastUpdatedAt: timestamp,
              }
            : list
        ),
      }));
    },
    deleteItemsFromList: (listId: string, itemIds: string[]) => {
      const idSet = new Set(itemIds);
      const timestamp = new Date().toISOString();
      set((state) => ({
        lists: state.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                items: list.items.filter((item) => !idSet.has(item.id)),
                lastUpdatedAt: timestamp,
              }
            : list
        ),
      }));
    },
    bulkUpdateItemsInList: (listId: string, itemIds: string[], updates: Partial<BudgetItem>) => {
      const idSet = new Set(itemIds);
      const timestamp = new Date().toISOString();
      set((state) => ({
        lists: state.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                lastUpdatedAt: timestamp,
                items: list.items.map((item) =>
                  idSet.has(item.id)
                    ? normalizeItemForList(
                        {
                          ...item,
                          ...updates,
                          flags: updates.flags ?? item.flags,
                          priority: updates.priority ?? item.priority,
                          completed: updates.completed ?? item.completed,
                          status: updates.status ?? item.status,
                        },
                        timestamp,
                      )
                    : item
                ),
              }
            : list
        ),
      }));
    },
    reorderItemsInList: (listId: string, sourceIndex: number, destinationIndex: number) => {
      const timestamp = new Date().toISOString();
      set((state) => ({
        lists: state.lists.map((list) => {
          if (list.id !== listId) return list;
          const items = [...list.items];
          const [moved] = items.splice(sourceIndex, 1);
          items.splice(destinationIndex, 0, moved);
          return { ...list, items, lastUpdatedAt: timestamp };
        }),
      }));
    },
    restoreItemsInList: (listId: string, entries: { item: BudgetItem; index: number }[]) => {
      const sorted = [...entries].sort((a, b) => a.index - b.index);
      const timestamp = new Date().toISOString();
      set((state) => ({
        lists: state.lists.map((list) => {
          if (list.id !== listId) return list;
          const items = [...list.items];
          sorted.forEach(({ item, index }) => {
            const safeIndex = Math.min(Math.max(index, 0), items.length);
            items.splice(safeIndex, 0, normalizeItemForList(item, timestamp));
          });
          return { ...list, items, lastUpdatedAt: timestamp };
        }),
      }));
    },
    delegateList: (listId: string, memberId?: string) => {
      const timestamp = new Date().toISOString();
      const list = get().lists.find((entry) => entry.id === listId);
      const member = memberId ? get().teamMembers.find((person) => person.id === memberId) : undefined;
      set((state) => ({
        lists: state.lists.map((entry) =>
          entry.id === listId ? { ...entry, ownerId: memberId, lastUpdatedAt: timestamp } : entry,
        ),
      }));
      if (!list) {
        return;
      }
      const actorLabel = getActorLabel();
      const summary = member
        ? `${actorLabel} assigned ${member.name} to ${list.name}`
        : `${actorLabel} cleared owner for ${list.name}`;
      const details = member ? `Owner: ${member.name}` : 'Owner removed';
      get().logActivity({
        summary,
        entityType: 'list',
        entityId: listId,
        details,
        timestamp,
      });
    },
    delegateItem: (listId: string, itemId: string, memberId?: string) => {
      const list = get().lists.find((entry) => entry.id === listId);
      if (!list) {
        return;
      }
      const item = list.items.find((entry) => entry.id === itemId);
      if (!item) {
        return;
      }
      const timestamp = new Date().toISOString();
      const member = memberId ? get().teamMembers.find((person) => person.id === memberId) : undefined;
      set((state) => ({
        lists: state.lists.map((entry) =>
          entry.id === listId
            ? {
                ...entry,
                lastUpdatedAt: timestamp,
                items: entry.items.map((line) =>
                  line.id === itemId
                    ? {
                        ...line,
                        assigneeId: memberId,
                        lastUpdatedAt: timestamp,
                      }
                    : line,
                ),
              }
            : entry,
        ),
      }));
      const actorLabel = getActorLabel();
      const summary = member
        ? `${actorLabel} delegated ${item.description} to ${member.name}`
        : `${actorLabel} cleared assignment for ${item.description}`;
      const details = member ? `Assignee: ${member.name}` : 'Assignee removed';
      get().logActivity({
        summary,
        entityType: 'item',
        entityId: itemId,
        details,
        timestamp,
      });
    },
    logActivity: (entry) => {
      const actor = entry.actor ?? getActorLabel();
      const timestamp = entry.timestamp ?? new Date().toISOString();
      const activity: ActivityEntry = {
        id: entry.id ?? uuidv4(),
        summary: entry.summary,
        timestamp,
        actor,
        entityType: entry.entityType,
        entityId: entry.entityId,
        details: entry.details,
      };
      set((state) => ({
        recentActivity: [activity, ...state.recentActivity].slice(0, 40),
      }));
    },
    setTemplateCategoryFilter: (value: TemplateCategory | 'all') =>
      set({ templateCategoryFilter: value }),
    setTemplateVariantFilter: (value: 'all' | string) => set({ templateVariantFilter: value }),
    setTemplatePublishFilter: (value: TemplatePublishStatus | 'all') =>
      set({ templatePublishFilter: value }),
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
export const selectDashboardSearchQuery = (state: PlanPulseState) => state.dashboardSearchQuery;
export const selectTeamMembers = (state: PlanPulseState) => state.teamMembers;
export const selectRecentActivity = (state: PlanPulseState) => state.recentActivity;
export const selectItemSuggestions = (state: PlanPulseState) => state.itemSuggestions;
export const selectCategoryTaxonomy = (state: PlanPulseState) => state.categoryTaxonomy;
export const selectUserRole = (state: PlanPulseState) => state.userRole;
