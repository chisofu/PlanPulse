import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Mode, BudgetItem, ShoppingList, PriceSource, ItemSuggestionMetadata } from '../types';
import {
  usePlanPulseStore,
  selectLists,
  selectActiveListId,
  selectItemSuggestions,
  selectCategoryTaxonomy,
} from '../store/planPulseStore';
import { DEFAULT_ITEM_UNITS, DEFAULT_PRICE_SOURCES, formatCurrency } from '../constants';
import { PlusIcon, TrashIcon, PencilIcon } from '../components/Icons';
import { v4 as uuidv4 } from 'uuid';

interface ListBuilderScreenProps {
  mode: Mode;
}

type SuggestionMatch = ItemSuggestionMetadata & { matchType: 'exact' | 'partial'; matchScore: number };

type QuickAddDraft = Partial<ItemSuggestionMetadata> & { description: string; quantitySuggestion?: number };

const QuickAddItemModal: React.FC<{
  item: QuickAddDraft;
  onClose: () => void;
  onAdd: (item: BudgetItem) => void;
  categoryOptions: string[];
  unitOptions: string[];
  priceSourceOptions: PriceSource[];
  onCreateCategory: (category: string) => void;
}> = ({ item, onClose, onAdd, categoryOptions, unitOptions, priceSourceOptions, onCreateCategory }) => {
  const [details, setDetails] = useState({
    quantity: item.quantitySuggestion ?? 1,
    unit: item.unit || unitOptions[0] || 'Each',
    category: item.category || categoryOptions[0] || 'Uncategorized',
    unitPrice: item.unitPrice || 0,
    priceSource: item.priceSource || priceSourceOptions[0] || PriceSource.ZPPA,
  });
  const [errors, setErrors] = useState<{ quantity?: string; unitPrice?: string }>({});
  const [categoryCreated, setCategoryCreated] = useState(false);

  const categoryListId = React.useId();
  const unitListId = React.useId();

  useEffect(() => {
    setDetails({
      quantity: item.quantitySuggestion ?? 1,
      unit: item.unit || unitOptions[0] || 'Each',
      category: item.category || categoryOptions[0] || 'Uncategorized',
      unitPrice: item.unitPrice || 0,
      priceSource: item.priceSource || priceSourceOptions[0] || PriceSource.ZPPA,
    });
    setErrors({});
    setCategoryCreated(false);
  }, [item, categoryOptions, unitOptions, priceSourceOptions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDetails((prev) => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unitPrice'
        ? parseFloat(value) || 0
        : name === 'priceSource'
        ? (value as PriceSource)
        : value,
    }));
    if (name === 'category') {
      setCategoryCreated(false);
    }
  };

  const validate = () => {
    const newErrors: { quantity?: string; unitPrice?: string } = {};
    if (details.quantity <= 0) {
      newErrors.quantity = 'Quantity must be a positive number.';
    }
    if (details.unitPrice <= 0) {
      newErrors.unitPrice = 'Unit price must be a positive number.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const normalizedCategory = details.category.trim();
  const categoryExists = categoryOptions.some(
    (existing) => existing.toLowerCase() === normalizedCategory.toLowerCase()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    if (normalizedCategory && !categoryExists) {
      onCreateCategory(normalizedCategory);
    }
    onAdd({
      id: uuidv4(),
      description: item.description,
      priceSource: details.priceSource,
      flags: [],
      quantity: details.quantity,
      unit: details.unit,
      category: details.category,
      unitPrice: details.unitPrice,
    });
  };

  const handleCreateCategoryClick = () => {
    if (!normalizedCategory) return;
    onCreateCategory(normalizedCategory);
    setCategoryCreated(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Add Item Details</h3>
        <p className="text-slate-600 mb-4 font-medium">{item.description}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">
                Quantity
                {item.quantitySuggestion && (
                  <span className="ml-2 text-xs text-slate-400">Suggested: {item.quantitySuggestion}</span>
                )}
              </label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                value={details.quantity}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.quantity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
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
                list={unitListId}
                value={details.unit}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <datalist id={unitListId}>
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
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
              list={categoryListId}
              value={details.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <datalist id={categoryListId}>
              {categoryOptions.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            {!categoryExists && normalizedCategory && (
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCreateCategoryClick}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Add “{normalizedCategory}” to categories
                </button>
                {categoryCreated && <span className="text-[10px] uppercase text-emerald-600">Added</span>}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
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
                className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.unitPrice ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.unitPrice && <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>}
            </div>
            <div>
              <label htmlFor="priceSource" className="block text-sm font-medium text-slate-700">
                Price source
              </label>
              <select
                id="priceSource"
                name="priceSource"
                value={details.priceSource}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {priceSourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">
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

  useEffect(() => {
    setEditedItem(item);
  }, [item]);

  const handleToggleCrossed = () => {
    const newFlags = isCrossed ? item.flags.filter((f) => f !== 'Crossed') : [...item.flags, 'Crossed'];
    onUpdate({ ...item, flags: newFlags });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = name === 'quantity' || name === 'unitPrice';
    setEditedItem((prev) => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
  };

  const handleSave = () => {
    onUpdate(editedItem);
    setIsEditing(false);
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
            placeholder="Item Description"
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
              placeholder="Qty"
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
              placeholder="e.g., kg, box"
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
              placeholder="Price"
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
              {Object.values(PriceSource).map((ps) => (
                <option key={ps} value={ps}>
                  {ps}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end items-center space-x-2 pt-2">
          <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-budgetpulse text-white rounded-lg hover:bg-opacity-90">
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center p-3 transition-colors group ${isCrossed ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'}`}>
      <input type="checkbox" checked={isCrossed} onChange={handleToggleCrossed} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
      <div className="flex-1 ml-4">
        <p className={`font-medium ${isCrossed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.description}</p>
        <p className={`text-sm ${isCrossed ? 'text-slate-400' : 'text-slate-500'}`}>
          Qty: {item.quantity} {item.unit} • <span className="font-mono text-xs">{item.priceSource}</span>
        </p>
      </div>
      <div className="w-28 text-right px-2">
        <p className={`text-sm ${isCrossed ? 'line-through text-slate-400' : 'text-slate-500'}`}>{formatCurrency(item.unitPrice)}</p>
        <p className="text-xs text-slate-400">each</p>
      </div>
      <div className="w-28 text-right px-2 font-semibold">
        <p className={`${isCrossed ? 'line-through text-slate-500' : 'text-slate-900'}`}>{formatCurrency(item.quantity * item.unitPrice)}</p>
      </div>
      <div className="flex items-center ml-4 space-x-2">
        <button onClick={() => setIsEditing(true)} className="p-1 text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
          <PencilIcon />
        </button>
        <button onClick={() => onDelete(item.id)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};

const ListBuilderScreen: React.FC<ListBuilderScreenProps> = ({ mode }) => {
  const lists = usePlanPulseStore(selectLists);
  const activeListId = usePlanPulseStore(selectActiveListId);
  const setActiveListId = usePlanPulseStore((state) => state.setActiveList);
  const addItemToList = usePlanPulseStore((state) => state.addItemToList);
  const updateItemInList = usePlanPulseStore((state) => state.updateItemInList);
  const deleteItemFromList = usePlanPulseStore((state) => state.deleteItemFromList);
  const upsertList = usePlanPulseStore((state) => state.upsertList);
  const createList = usePlanPulseStore((state) => state.createList);
  const suggestionsCatalog = usePlanPulseStore(selectItemSuggestions);
  const categoryTaxonomy = usePlanPulseStore(selectCategoryTaxonomy);
  const recordItemSuggestion = usePlanPulseStore((state) => state.recordItemSuggestion);
  const upsertCategory = usePlanPulseStore((state) => state.upsertCategory);

  const [newItemDesc, setNewItemDesc] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionMatch[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemForModal, setItemForModal] = useState<QuickAddDraft | null>(null);

  const priceSourceOptions = useMemo(() => [...DEFAULT_PRICE_SOURCES], []);
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set([...categoryTaxonomy, ...suggestionsCatalog.map((suggestion) => suggestion.category)])
      ).sort((a, b) => a.localeCompare(b)),
    [categoryTaxonomy, suggestionsCatalog]
  );
  const unitOptions = useMemo(
    () =>
      Array.from(new Set([...DEFAULT_ITEM_UNITS, ...suggestionsCatalog.map((suggestion) => suggestion.unit)])).sort((a, b) =>
        a.localeCompare(b)
      ),
    [suggestionsCatalog]
  );

  const parsePriceQuery = useCallback((input: string) => {
    let cleaned = input;
    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    const rangeMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      minPrice = parseFloat(rangeMatch[1]);
      maxPrice = parseFloat(rangeMatch[2]);
      cleaned = cleaned.replace(rangeMatch[0], ' ');
    }

    const lteMatch = cleaned.match(/(?:<=|≤)\s*(\d+(?:\.\d+)?)/);
    if (lteMatch) {
      maxPrice = parseFloat(lteMatch[1]);
      cleaned = cleaned.replace(lteMatch[0], ' ');
    }

    const gteMatch = cleaned.match(/(?:>=|≥)\s*(\d+(?:\.\d+)?)/);
    if (gteMatch) {
      minPrice = parseFloat(gteMatch[1]);
      cleaned = cleaned.replace(gteMatch[0], ' ');
    }

    if (minPrice === undefined && maxPrice === undefined) {
      const kwachaMatch = cleaned.match(/k(\d+(?:\.\d+)?)/);
      if (kwachaMatch) {
        const value = parseFloat(kwachaMatch[1]);
        minPrice = value * 0.9;
        maxPrice = value * 1.1;
        cleaned = cleaned.replace(kwachaMatch[0], ' ');
      }
    }

    if (minPrice === undefined && maxPrice === undefined) {
      const approxMatch = cleaned.match(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s|$)/);
      if (approxMatch) {
        const value = parseFloat(approxMatch[1]);
        minPrice = value * 0.9;
        maxPrice = value * 1.1;
        cleaned = cleaned.replace(approxMatch[0], ' ');
      }
    }

    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

    return { cleanedQuery: cleaned, minPrice, maxPrice };
  }, []);

  const computeSuggestionMatches = useCallback(
    (rawInput: string) => {
      const lowered = rawInput.toLowerCase();
      const { cleanedQuery, minPrice, maxPrice } = parsePriceQuery(lowered);
      const keywords = cleanedQuery.split(/\s+/).filter(Boolean);

      return suggestionsCatalog
        .map((suggestion) => {
          const normalizedDescription = suggestion.description.toLowerCase();
          const normalizedCategory = suggestion.category.toLowerCase();
          const normalizedUnit = suggestion.unit.toLowerCase();
          const fields = [normalizedDescription, normalizedCategory, normalizedUnit];
          const matchedKeywords = keywords.filter((keyword) =>
            fields.some((field) => field.includes(keyword))
          );
          const textMatch = keywords.length === 0 ? true : matchedKeywords.length > 0;
          const priceMatch =
            minPrice === undefined && maxPrice === undefined
              ? true
              : suggestion.unitPrice >= (minPrice ?? 0) &&
                suggestion.unitPrice <= (maxPrice ?? Number.POSITIVE_INFINITY);

          if (!textMatch || !priceMatch) {
            return null;
          }

          const isExact = cleanedQuery.length > 0 && normalizedDescription === cleanedQuery;
          const startsWith = cleanedQuery.length > 0 && normalizedDescription.startsWith(cleanedQuery);
          const matchScore =
            (isExact ? 1000 : 0) +
            (startsWith ? 150 : 0) +
            matchedKeywords.length * 60 +
            suggestion.usageCount * 20 +
            (priceMatch ? 10 : 0);

          return {
            ...suggestion,
            matchType: isExact ? 'exact' : 'partial',
            matchScore,
          };
        })
        .filter((value): value is SuggestionMatch => value !== null)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 8);
    },
    [suggestionsCatalog, parsePriceQuery]
  );

  const suggestionToDraft = useCallback(
    (suggestion: SuggestionMatch): QuickAddDraft => ({
      description: suggestion.description,
      category: suggestion.category,
      unit: suggestion.unit,
      unitPrice: suggestion.unitPrice,
      priceSource: suggestion.priceSource,
      quantitySuggestion: suggestion.quantitySuggestion,
    }),
    []
  );

  const suggestionListId = 'quick-add-suggestions';

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

  const activeList = activeListId ? lists.find((list) => list.id === activeListId) ?? null : lists[0] ?? null;

  useEffect(() => {
    const trimmed = newItemDesc.trim();
    if (!trimmed) {
      setSuggestions([]);
      setHighlightedIndex(-1);
      return;
    }
    const matches = computeSuggestionMatches(trimmed);
    setSuggestions(matches);
    setHighlightedIndex(matches.length ? 0 : -1);
  }, [newItemDesc, computeSuggestionMatches]);

  const handleOpenModal = useCallback(
    (draft: QuickAddDraft) => {
      const description = draft.description.trim();
      if (!description || !activeList) {
        return;
      }

      const normalizedDescription = description.toLowerCase();
      const catalogMatch = suggestionsCatalog.find(
        (suggestion) => suggestion.description.toLowerCase() === normalizedDescription
      );
      const recentItem =
        activeList.items
          .slice()
          .reverse()
          .find((existing) => existing.description.toLowerCase() === normalizedDescription) ?? null;

      const quantitySuggestion =
        draft.quantitySuggestion ??
        recentItem?.quantity ??
        catalogMatch?.quantitySuggestion ??
        1;

      setItemForModal({
        description,
        category:
          draft.category ??
          recentItem?.category ??
          catalogMatch?.category ??
          categoryOptions[0] ??
          'Uncategorized',
        unit:
          draft.unit ??
          recentItem?.unit ??
          catalogMatch?.unit ??
          unitOptions[0] ??
          'Each',
        unitPrice:
          draft.unitPrice ??
          recentItem?.unitPrice ??
          catalogMatch?.unitPrice ??
          0,
        priceSource:
          draft.priceSource ??
          recentItem?.priceSource ??
          catalogMatch?.priceSource ??
          priceSourceOptions[0] ??
          PriceSource.ZPPA,
        quantitySuggestion,
      });
      setSuggestions([]);
      setIsModalOpen(true);
      setHighlightedIndex(-1);
    },
    [activeList, suggestionsCatalog, categoryOptions, unitOptions, priceSourceOptions]
  );

  const handleConfirmAddItem = (itemToAdd: BudgetItem) => {
    if (!activeList) return;
    addItemToList(activeList.id, itemToAdd);
    const { id: _id, flags: _flags, ...suggestionPayload } = itemToAdd;
    recordItemSuggestion(suggestionPayload);
    setNewItemDesc('');
    setSuggestions([]);
    setHighlightedIndex(-1);
    setIsModalOpen(false);
    setItemForModal(null);
  };

  const handleUpdateItem = (item: BudgetItem) => {
    if (!activeList) return;
    updateItemInList(activeList.id, item);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!activeList) return;
    deleteItemFromList(activeList.id, itemId);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      if (!suggestions.length) {
        return;
      }
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      if (!suggestions.length) {
        return;
      }
      event.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleOpenModal(suggestionToDraft(suggestions[highlightedIndex]));
      } else {
        handleOpenModal({ description: newItemDesc.trim() });
      }
    } else if (event.key === 'Escape') {
      setSuggestions([]);
      setHighlightedIndex(-1);
    }
  };

  const total = useMemo(() => {
    if (!activeList) return 0;
    return activeList.items.filter((item) => !item.flags.includes('Crossed')).reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [activeList]);

  const handleSaveListMeta = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeList) return;
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('listName') || activeList.name);
    const updatedList: ShoppingList = { ...activeList, name };
    upsertList(updatedList);
  };

  return (
    <div className="flex flex-col">
      {isModalOpen && itemForModal && (
        <QuickAddItemModal
          item={itemForModal}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleConfirmAddItem}
          categoryOptions={categoryOptions}
          unitOptions={unitOptions}
          priceSourceOptions={priceSourceOptions}
          onCreateCategory={upsertCategory}
        />
      )}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <form onSubmit={handleSaveListMeta} className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-3 md:space-y-0">
          <div className="flex-1">
            <label htmlFor="listName" className="block text-sm font-medium text-slate-700">
              List name
            </label>
            <input
              id="listName"
              name="listName"
              defaultValue={activeList?.name || ''}
              className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
          <button type="submit" className="px-4 py-2 bg-budgetpulse text-white font-semibold rounded-lg hover:bg-opacity-90">
            Save
          </button>
        </form>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="relative">
          <input
            type="text"
            value={newItemDesc}
            onChange={(e) => setNewItemDesc(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Add an item..."
            aria-autocomplete="list"
            aria-controls={suggestions.length ? suggestionListId : undefined}
            aria-expanded={suggestions.length > 0}
            aria-activedescendant={
              highlightedIndex >= 0 && suggestions[highlightedIndex]
                ? `${suggestionListId}-${highlightedIndex}`
                : undefined
            }
            className={`w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-2 ${
              mode === Mode.PricePulse ? 'focus:ring-pricepulse' : 'focus:ring-budgetpulse'
            }`}
          />
          <button
            type="button"
            onClick={() => handleOpenModal({ description: newItemDesc.trim() })}
            className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full text-white ${
              mode === Mode.PricePulse ? 'bg-pricepulse' : 'bg-budgetpulse'
            } hover:opacity-90`}
            aria-label="Add item"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          {suggestions.length > 0 && (
            <div
              id={suggestionListId}
              role="listbox"
              className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-slate-200"
            >
              <ul className="py-1 max-h-72 overflow-y-auto">
                {suggestions.map((suggestion, index) => {
                  const isActive = index === highlightedIndex;
                  return (
                    <li
                      key={`${suggestion.description}-${index}`}
                      id={`${suggestionListId}-${index}`}
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => handleOpenModal(suggestionToDraft(suggestion))}
                      className={`px-4 py-2 text-sm transition-colors cursor-pointer ${
                        isActive ? 'bg-indigo-50 text-slate-900' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{suggestion.description}</span>
                        <span
                          className={`text-[10px] font-semibold tracking-wide uppercase ${
                            suggestion.matchType === 'exact' ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {suggestion.matchType === 'exact' ? 'Exact match' : 'Partial match'}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500 flex flex-wrap gap-x-2 gap-y-1 items-center">
                        <span>{suggestion.category}</span>
                        <span>• {suggestion.unit}</span>
                        <span>• {formatCurrency(suggestion.unitPrice)}</span>
                        <span>• {suggestion.priceSource}</span>
                        <span className="uppercase tracking-wide text-[10px] text-slate-400">
                          Uses {suggestion.usageCount}
                        </span>
                      </div>
                      {suggestion.quantitySuggestion && (
                        <div className="mt-1 text-[11px] text-slate-400">
                          Typical qty: {suggestion.quantitySuggestion}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-lg divide-y divide-slate-200">
        {activeList && activeList.items.length > 0 ? (
          activeList.items.map((item) => <BudgetItemRow key={item.id} item={item} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} />)
        ) : (
          <p className="text-center text-slate-500 py-12">Your list is empty. Add an item to get started!</p>
        )}
      </div>

      <footer className="mt-6 bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-slate-500">Estimated Total</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(total)}</p>
          </div>
          <div className="mt-4 md:mt-0 space-x-3">
            <button className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Export CSV</button>
            <button className={`px-6 py-2 rounded-lg font-semibold text-white ${mode === Mode.PricePulse ? 'bg-pricepulse' : 'bg-budgetpulse'}`}>
              Export PDF
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ListBuilderScreen;
