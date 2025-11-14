import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Mode, BudgetItem, ShoppingList, PriceSource } from '../types';
import {
  usePlanPulseStore,
  selectLists,
  selectActiveListId,
  selectListSearchQuery,
  selectListStatusFilter,
  selectListDateRange,
} from '../store/planPulseStore';
import { formatCurrency } from '../constants';
import { PlusIcon, TrashIcon, PencilIcon } from '../components/Icons';
import { v4 as uuidv4 } from 'uuid';
import { fuzzyIncludes, getListStatus, matchesDateRange } from '../utils/search';

interface ListBuilderScreenProps {
  mode: Mode;
}

type SortKey = 'description' | 'quantity' | 'unitPrice';
type SortDirection = 'asc' | 'desc';
type VisibilityFilter = 'all' | 'checked' | 'crossed-off';

type ItemValidationErrors = {
  quantity?: string;
  unitPrice?: string;
};

const getSortComparator = (key: SortKey) => {
  switch (key) {
    case 'quantity':
      return (a: BudgetItem, b: BudgetItem) => a.quantity - b.quantity;
    case 'unitPrice':
      return (a: BudgetItem, b: BudgetItem) => a.unitPrice - b.unitPrice;
    default:
      return (a: BudgetItem, b: BudgetItem) => a.description.localeCompare(b.description);
  }
};

const deriveIsChecked = (item: BudgetItem) =>
  item.flags.includes('Crossed') || item.flags.includes('Checked');

const BudgetItemRow: React.FC<{
  item: BudgetItem;
  isEditing: boolean;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onUpdate: (item: BudgetItem) => void;
  onDelete: (id: string) => void;
}> = ({ item, isEditing, onStartEdit, onCancelEdit, onUpdate, onDelete }) => {
  const [draft, setDraft] = useState<BudgetItem>(item);
  const [errors, setErrors] = useState<ItemValidationErrors>({});
  const descriptionInputRef = useRef<HTMLInputElement | null>(null);
  const isCrossed = deriveIsChecked(item) || item.flags.includes('Crossed');

  useEffect(() => {
    setDraft(item);
    setErrors({});
  }, [item]);

  useEffect(() => {
    if (isEditing) {
      setDraft(item);
      setTimeout(() => {
        descriptionInputRef.current?.focus();
      }, 0);
    }
  }, [isEditing, item]);

  const handleToggleChecked = () => {
    const isChecked = deriveIsChecked(item);
    let nextFlags = item.flags.filter((flag) => flag !== 'Crossed' && flag !== 'Checked');
    if (!isChecked) {
      nextFlags = [...nextFlags, 'Crossed', 'Checked'];
    }
    onUpdate({ ...item, flags: nextFlags });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDraft((prev) => {
      if (name === 'quantity') {
        return { ...prev, quantity: Number(value) };
      }
      if (name === 'unitPrice') {
        return { ...prev, unitPrice: Number(value) };
      }
      return { ...prev, [name]: value } as BudgetItem;
    });
  };

  const validate = (): boolean => {
    const nextErrors: ItemValidationErrors = {};
    if (!Number.isFinite(draft.quantity) || draft.quantity < 0) {
      nextErrors.quantity = 'Quantity must be zero or greater.';
    }
    if (!Number.isFinite(draft.unitPrice) || draft.unitPrice <= 0) {
      nextErrors.unitPrice = 'Unit price must be greater than zero.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }
    onUpdate({
      ...draft,
      description: draft.description.trim() || 'Untitled Item',
      quantity: Number(draft.quantity) || 0,
      unitPrice: Number(draft.unitPrice) || 0,
    });
    onCancelEdit();
  };

  if (editing) {
    return (
      <div className="p-3 bg-white border-b-2 border-indigo-100 space-y-3 animate-fade-in">
        <div>
          <label className="text-xs font-medium text-slate-500" htmlFor={`${item.id}-description`}>
            Description
          </label>
          <input
            ref={descriptionInputRef}
            id={`${item.id}-description`}
            type="text"
            name="description"
            value={draft.description}
            onChange={handleChange}
            className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Item description"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor={`${item.id}-quantity`}>
              Quantity
            </label>
            <input
              id={`${item.id}-quantity`}
              type="number"
              name="quantity"
              value={Number.isFinite(draft.quantity) ? draft.quantity : ''}
              onChange={handleChange}
              className={`w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.quantity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="0"
              min={0}
            />
            {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor={`${item.id}-unit`}>
              Unit
            </label>
            <input
              id={`${item.id}-unit`}
              type="text"
              name="unit"
              value={draft.unit}
              onChange={handleChange}
              className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Each"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor={`${item.id}-unitPrice`}>
              Unit price (K)
            </label>
            <input
              id={`${item.id}-unitPrice`}
              type="number"
              name="unitPrice"
              value={Number.isFinite(draft.unitPrice) ? draft.unitPrice : ''}
              onChange={handleChange}
              className={`w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.unitPrice ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              step="0.01"
              min={0}
              placeholder="0.00"
            />
            {errors.unitPrice && <p className="mt-1 text-xs text-red-600">{errors.unitPrice}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor={`${item.id}-source`}>
              Source
            </label>
            <select
              id={`${item.id}-source`}
              name="priceSource"
              value={draft.priceSource}
              onChange={handleChange}
              className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.values(PriceSource).map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Priority</label>
            <select
              name="priority"
              value={draft.priority}
              onChange={handleChange}
              className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Status</label>
            <select
              name="status"
              value={draft.status}
              onChange={handleChange}
              className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center mt-6 space-x-2">
            <input
              id={`completed-${item.id}`}
              type="checkbox"
              checked={draft.completed}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, completed: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor={`completed-${item.id}`} className="text-sm font-medium text-slate-600">
              Mark as completed
            </label>
          </div>
        </div>
        <div className="flex justify-end items-center space-x-2 pt-2">
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold bg-budgetpulse text-white rounded-lg hover:bg-opacity-90"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );

  const completed = item.completed || item.flags.includes('Crossed');

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center p-3 transition-colors group border-b border-slate-200 last:border-0 ${
        isCrossed ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start sm:items-center">
        <input
          type="checkbox"
          checked={deriveIsChecked(item)}
          onChange={handleToggleChecked}
          className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
        />
        <div className="flex-1 ml-3">
          <p className={`font-medium ${isCrossed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {item.description || 'New item'}
          </p>
          <p className={`text-sm ${isCrossed ? 'text-slate-400' : 'text-slate-500'}`}>
            Qty: {item.quantity} {item.unit || '—'} •{' '}
            <span className="font-mono text-xs">{item.priceSource}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end sm:ml-auto sm:space-x-6 mt-3 sm:mt-0 w-full sm:w-auto">
        <div className="text-right">
          <p className={`text-sm ${isCrossed ? 'line-through text-slate-400' : 'text-slate-500'}`}>
            {formatCurrency(item.unitPrice)}
          </p>
          <p className="text-xs text-slate-400">each</p>
        </div>
        <div className="text-right font-semibold w-24">
          <p className={`${isCrossed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
            {formatCurrency(item.quantity * item.unitPrice)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onStartEdit(item.id)}
            className="p-1 text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            aria-label="Edit item"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            aria-label="Delete item"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );

  const containerClasses = `group border-b border-slate-200 ${
    isEditing
      ? 'bg-indigo-50/80 ring-2 ring-indigo-200'
      : isExcluded
      ? 'bg-amber-50/60'
      : isCrossed
      ? 'bg-slate-100'
      : 'bg-white hover:bg-slate-50'
  }`;

  return (
    <div ref={rowRef} className={`p-3 transition-all ${containerClasses}`}>
      {isEditing ? editingContent : viewContent}
      {showHistory && (
        <PriceHistoryModal
          entries={item.priceHistory || []}
          onClose={() => setShowHistory(false)}
          itemDescription={item.description}
        />
      )}
    </div>
  );
};

const ListBuilderScreen: React.FC<ListBuilderScreenProps> = ({ mode }) => {
  const lists = usePlanPulseStore(selectLists);
  const activeListId = usePlanPulseStore(selectActiveListId);
  const setActiveListId = usePlanPulseStore((state) => state.setActiveList);
  const listSearchQuery = usePlanPulseStore(selectListSearchQuery);
  const setListSearchQuery = usePlanPulseStore((state) => state.setListSearchQuery);
  const listStatusFilter = usePlanPulseStore(selectListStatusFilter);
  const setListStatusFilter = usePlanPulseStore((state) => state.setListStatusFilter);
  const listDateRange = usePlanPulseStore(selectListDateRange);
  const setListDateRange = usePlanPulseStore((state) => state.setListDateRange);
  const addItemToList = usePlanPulseStore((state) => state.addItemToList);
  const updateItemInList = usePlanPulseStore((state) => state.updateItemInList);
  const deleteItemsFromList = usePlanPulseStore((state) => state.deleteItemsFromList);
  const bulkUpdateItemsInList = usePlanPulseStore((state) => state.bulkUpdateItemsInList);
  const reorderItemsInList = usePlanPulseStore((state) => state.reorderItemsInList);
  const restoreItemsInList = usePlanPulseStore((state) => state.restoreItemsInList);
  const upsertList = usePlanPulseStore((state) => state.upsertList);
  const createList = usePlanPulseStore((state) => state.createList);
  const recordItemSuggestion = usePlanPulseStore((state) => state.recordItemSuggestion);
  const upsertCategory = usePlanPulseStore((state) => state.upsertCategory);

  const [newItemDesc, setNewItemDesc] = useState('');
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('description');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [visibility, setVisibility] = useState<VisibilityFilter>('all');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');

  useEffect(() => {
    if (!lists.length) {
      const list = createList();
      setActiveListId(list.id);
    }
  }, [lists.length, createList, setActiveListId]);

  useEffect(() => {
    if (!activeListId && lists.length) {
      setActiveListId(lists[0].id);
    }
  }, [activeListId, lists, setActiveListId]);

  const activeList = useMemo<ShoppingList | null>(() => {
    return activeListId ? lists.find((list) => list.id === activeListId) ?? null : lists[0] ?? null;
  }, [activeListId, lists]);

  useEffect(() => {
    setSelectedIds([]);
    setFocusedItemId(activeList?.items[0]?.id ?? null);
  }, [activeList?.id]);

  const filteredLists = useMemo(() => {
    return lists.filter((list) => {
      const matchesQuery =
        !listSearchQuery ||
        fuzzyIncludes(listSearchQuery, list.name) ||
        list.items.some((item) => fuzzyIncludes(listSearchQuery, item.description));
      if (!matchesQuery) return false;
      if (listStatusFilter !== 'all' && getListStatus(list) !== listStatusFilter) return false;
      const comparisonDate = list.dueDate ?? list.createdAt;
      if (!matchesDateRange(comparisonDate, listDateRange)) return false;
      return true;
    });
  }, [lists, listSearchQuery, listStatusFilter, listDateRange]);

  const sortedFilteredLists = useMemo(
    () => [...filteredLists].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [filteredLists],
  );

  const statusStyles: Record<string, string> = {
    onTrack: 'bg-emerald-100 text-emerald-700',
    dueSoon: 'bg-amber-100 text-amber-700',
    overdue: 'bg-rose-100 text-rose-700',
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    if (activeList) {
      setNameDraft(activeList.name);
      setDescriptionDraft(activeList.description ?? '');
    }
  }, [activeList?.id]);

  const handleAddQuickItem = () => {
    if (!activeList) return;
    const trimmed = newItemDesc.trim();
    if (!trimmed) return;
    const newItem: BudgetItem = {
      id: uuidv4(),
      description: trimmed,
      category: 'General',
      unit: 'Each',
      quantity: 1,
      unitPrice: 0,
      priceSource: PriceSource.ZPPA,
      flags: [],
      priority: 'Medium',
      completed: false,
      status: 'Planned',
    };
    addItemToList(activeList.id, newItem);
    setNewItemDesc('');
  };

  const handleAddBlankItem = () => {
    if (!activeList) return;
    const newItem: BudgetItem = {
      id: uuidv4(),
      description: 'New item',
      category: 'General',
      unit: 'Each',
      quantity: 0,
      unitPrice: 0,
      priceSource: PriceSource.ZPPA,
      flags: [],
      priority: 'Medium',
      completed: false,
      status: 'Planned',
    };
    addItemToList(activeList.id, newItem);
    setEditingItemId(newItem.id);
  };

  const handleUpdateItem = (item: BudgetItem) => {
    if (!activeList) return;
    const completed = item.completed || item.flags.includes('Crossed');
    const flags = completed
      ? Array.from(new Set([...(item.flags || []), 'Crossed']))
      : item.flags.filter((flag) => flag !== 'Crossed');
    updateItemInList(activeList.id, { ...item, flags });
    setToast({ message: `Updated “${item.description}”.` });
  };

  const handleToggleComplete = (item: BudgetItem) => {
    if (!activeList) return;
    const completed = !(item.completed || item.flags.includes('Crossed'));
    const flags = completed
      ? Array.from(new Set([...(item.flags || []), 'Crossed']))
      : item.flags.filter((flag) => flag !== 'Crossed');
    updateItemInList(activeList.id, { ...item, completed, flags });
  };

  const handleSaveListName = () => {
    if (!activeList) return;
    const updated: ShoppingList = { ...activeList, name: nameDraft.trim() || 'Untitled List' };
    upsertList(updated);
    setIsEditingName(false);
  };

  const handleSaveListDescription = () => {
    if (!activeList) return;
    const updated: ShoppingList = { ...activeList, description: descriptionDraft.trim() };
    upsertList(updated);
    setIsEditingDescription(false);
  };

  const filteredItems = useMemo(() => {
    if (!activeList) {
      return [] as BudgetItem[];
    }

    const visibilityFilter = (item: BudgetItem) => {
      if (visibility === 'checked') {
        return deriveIsChecked(item);
      }
      if (visibility === 'crossed-off') {
        return item.flags.includes('Crossed');
      }
      return true;
    };

    const searchFilter = (item: BudgetItem) => {
      if (!filterText.trim()) return true;
      const query = filterText.trim().toLowerCase();
      return [item.description, item.unit, String(item.quantity), String(item.unitPrice)]
        .join(' ')
        .toLowerCase()
        .includes(query);
    };

    const sorted = [...activeList.items]
      .filter(visibilityFilter)
      .filter(searchFilter)
      .sort((a, b) => {
        const comparator = getSortComparator(sortKey);
        const value = comparator(a, b);
        return sortDirection === 'asc' ? value : value * -1;
      });

    return sorted;
  }, [activeList, filterText, visibility, sortDirection, sortKey]);

  const draftTotal = useMemo(() => {
    if (!activeList) return 0;
    return activeList.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [activeList]);

  const quoteTotal = useMemo(() => {
    if (!activeList) return 0;
    return activeList.items
      .filter((item) => !item.flags.includes('Crossed') && !item.flags.includes('Checked'))
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [activeList]);

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-white border rounded-lg p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            {isEditingName ? (
              <div className="space-y-3">
                <input
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  className="w-full text-2xl font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setNameDraft(activeList?.name ?? '');
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveListName}
                    className={`px-4 py-2 rounded-lg font-semibold text-white ${
                      mode === Mode.PricePulse ? 'bg-pricepulse' : 'bg-budgetpulse'
                    } hover:opacity-90`}
                  >
                    Save name
                  </button>
                </div>
              </div>
            ) : (
              <div className="group">
                <div className="flex items-start gap-3">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {activeList?.name || 'Untitled List'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(true);
                      setNameDraft(activeList?.name ?? '');
                    }}
                    className="p-2 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Rename list"
                  >
                    <PencilIcon />
                  </button>
                </div>
                <p className="text-sm text-slate-500 mt-1">Hover to rename the list title.</p>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="listDueDate" className="block text-sm font-medium text-slate-700">
              Due date
            </label>
            <input
              id="listDueDate"
              name="listDueDate"
              type="date"
              defaultValue={activeList?.dueDate ?? ''}
              className="mt-1 rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Active list</label>
            <select
              value={activeList?.id || ''}
              onChange={(event) => setActiveListId(event.target.value || undefined)}
              className="mt-1 rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          {isEditingDescription ? (
            <div className="space-y-3">
              <textarea
                value={descriptionDraft}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe what this list is for..."
              />
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingDescription(false);
                    setDescriptionDraft(activeList?.description ?? '');
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveListDescription}
                  className={`px-4 py-2 rounded-lg font-semibold text-white ${
                    mode === Mode.PricePulse ? 'bg-pricepulse' : 'bg-budgetpulse'
                  } hover:opacity-90`}
                >
                  Save description
                </button>
              </div>
            </div>
          ) : (
            <div className="group relative">
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {activeList?.description ? activeList.description : 'Add a short description to give your teammates context.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsEditingDescription(true);
                  setDescriptionDraft(activeList?.description ?? '');
                }}
                className="absolute top-0 right-0 p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Edit description"
              >
                <PencilIcon />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <label htmlFor="quick-add" className="text-sm font-medium text-slate-700">
          Quick add item
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            id="quick-add"
            type="text"
            value={newItemDesc}
            onChange={(event) => setNewItemDesc(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddQuickItem();
              }
            }}
            placeholder="Type an item name and press Enter"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddQuickItem}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white ${
              mode === Mode.PricePulse ? 'bg-pricepulse' : 'bg-budgetpulse'
            } hover:opacity-90`}
          >
            <PlusIcon className="w-4 h-4" />
            Add item
          </button>
        </div>
        <p className="text-xs text-slate-500">Items are created with default values. Use the pencil icon in the list to edit details.</p>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
              placeholder="Filter list items..."
              className="rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-wide text-slate-500">Sort by</label>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="description">Description</option>
              <option value="quantity">Quantity</option>
              <option value="unitPrice">Unit price</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {sortDirection === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {(
              [
                { value: 'all', label: 'All' },
                { value: 'checked', label: 'Checked' },
                { value: 'crossed-off', label: 'Crossed off' },
              ] as { value: VisibilityFilter; label: string }[]
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setVisibility(value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  visibility === value
                    ? mode === Mode.PricePulse
                      ? 'bg-pricepulse text-white'
                      : 'bg-budgetpulse text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 overflow-hidden">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <BudgetItemRow
                key={item.id}
                item={item}
                isEditing={editingItemId === item.id}
                onStartEdit={(id) => setEditingItemId(id)}
                onCancelEdit={() => setEditingItemId(null)}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
              />
            ))
          ) : (
            <p className="text-center text-slate-500 py-12">No items match the current filters.</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddBlankItem}
          className="w-full border-2 border-dashed border-slate-300 rounded-lg py-3 flex items-center justify-center gap-2 text-slate-600 hover:border-indigo-300 hover:text-indigo-500"
        >
          <PlusIcon className="w-5 h-5" /> Add blank row
        </button>
      </div>

      <footer className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg bg-slate-50">
            <p className="text-sm font-medium text-slate-500">Draft total</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(draftTotal)}</p>
            <p className="text-xs text-slate-500 mt-1">Includes all line items regardless of status.</p>
          </div>
          <div className="p-4 border rounded-lg bg-slate-50">
            <p className="text-sm font-medium text-slate-500">Quote total</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(quoteTotal)}</p>
            <p className="text-xs text-slate-500 mt-1">Excludes checked and crossed-off entries.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ListBuilderScreen;
