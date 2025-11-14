import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mode, BudgetItem, ShoppingList, PriceSource, PriceHistoryEntry } from '../types';
import { usePlanPulseStore, selectLists, selectActiveListId } from '../store/planPulseStore';
import { MOCK_ITEM_SUGGESTIONS, formatCurrency } from '../constants';
import { PlusIcon, TrashIcon, PencilIcon } from '../components/Icons';
import { v4 as uuidv4 } from 'uuid';

interface ListBuilderScreenProps {
  mode: Mode;
}

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
    subcategory: item.subcategory || '',
    unitPrice: item.unitPrice || 0,
  });
  const [errors, setErrors] = useState<{ quantity?: string; unitPrice?: string }>({});

  const unitOptions = useMemo(
    () =>
      Array.from(new Set([details.unit, item.unit, ...MOCK_ITEM_SUGGESTIONS.map((suggestion) => suggestion.unit)].filter(Boolean))),
    [details.unit, item.unit]
  );

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [details.category, item.category, item.subcategory, ...MOCK_ITEM_SUGGESTIONS.map((suggestion) => suggestion.category)].filter(
            Boolean
          )
        )
      ),
    [details.category, item.category, item.subcategory]
  );

  const datalistUnitId = `quick-unit-${item.description.replace(/\s+/g, '-')}`;
  const datalistCategoryId = `quick-category-${item.description.replace(/\s+/g, '-')}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: name === 'quantity' || name === 'unitPrice' ? parseFloat(value) || 0 : value }));
  };

  const handleStepper = (field: 'quantity' | 'unitPrice', direction: 1 | -1) => {
    setDetails((prev) => {
      const step = field === 'quantity' ? 1 : 0.5;
      const min = field === 'quantity' ? 0 : 0;
      const nextValue = Math.max(min, parseFloat((prev[field] + direction * step).toFixed(2)));
      return { ...prev, [field]: nextValue };
    });
  };

  const validate = () => {
    const newErrors: { quantity?: string; unitPrice?: string } = {};
    if (details.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than zero.';
    }
    if (details.unitPrice < 0) {
      newErrors.unitPrice = 'Unit price cannot be negative.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onAdd({
        id: uuidv4(),
        description: item.description,
        priceSource: item.priceSource || PriceSource.ZPPA,
        flags: [],
        ...details,
        subcategory: details.subcategory || undefined,
        imageUrl: item.imageUrl,
        privateNotes: '',
        sku: item.sku,
        priceHistory: item.priceHistory,
      });
    }
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
              <div
                className={`mt-1 flex items-center overflow-hidden rounded-md border ${
                  errors.quantity ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleStepper('quantity', -1)}
                  className="h-9 w-9 border-r border-slate-200 text-lg font-semibold text-slate-500 hover:bg-slate-100"
                >
                  −
                </button>
                <input
                  type="number"
                  name="quantity"
                  id="quantity"
                  value={details.quantity}
                  onChange={handleChange}
                  className="h-9 w-full border-0 text-center text-sm text-slate-700 focus:outline-none"
                  min={0}
                />
                <button
                  type="button"
                  onClick={() => handleStepper('quantity', 1)}
                  className="h-9 w-9 border-l border-slate-200 text-lg font-semibold text-slate-500 hover:bg-slate-100"
                >
                  +
                </button>
              </div>
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-slate-700">
                Unit
              </label>
              <>
                <input
                  list={datalistUnitId}
                  type="text"
                  name="unit"
                  id="unit"
                  value={details.unit}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <datalist id={datalistUnitId}>
                  {unitOptions.map((unit) => (
                    <option key={unit} value={unit} />
                  ))}
                </datalist>
              </>
            </div>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700">
              Category
            </label>
            <>
              <input
                list={datalistCategoryId}
                type="text"
                name="category"
                id="category"
                value={details.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <datalist id={datalistCategoryId}>
                {categoryOptions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </>
          </div>
          <div>
            <label htmlFor="subcategory" className="block text-sm font-medium text-slate-700">
              Sub-category
            </label>
            <input
              type="text"
              name="subcategory"
              id="subcategory"
              value={details.subcategory}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="unitPrice" className="block text-sm font-medium text-slate-700">
              Unit Price (K)
            </label>
            <div
              className={`mt-1 flex items-center overflow-hidden rounded-md border ${
                errors.unitPrice ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200'
              }`}
            >
              <button
                type="button"
                onClick={() => handleStepper('unitPrice', -1)}
                className="h-9 w-9 border-r border-slate-200 text-lg font-semibold text-slate-500 hover:bg-slate-100"
              >
                −
              </button>
              <input
                type="number"
                step="0.01"
                name="unitPrice"
                id="unitPrice"
                value={details.unitPrice}
                onChange={handleChange}
                className="h-9 w-full border-0 text-center text-sm text-slate-700 focus:outline-none"
                min={0}
              />
              <button
                type="button"
                onClick={() => handleStepper('unitPrice', 1)}
                className="h-9 w-9 border-l border-slate-200 text-lg font-semibold text-slate-500 hover:bg-slate-100"
              >
                +
              </button>
            </div>
            {errors.unitPrice && <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>}
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

const PriceHistoryModal: React.FC<{
  entries: PriceHistoryEntry[];
  onClose: () => void;
  itemDescription: string;
}> = ({ entries, onClose, itemDescription }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
    <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Price history</p>
          <h3 className="text-lg font-semibold text-slate-800">{itemDescription}</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
        >
          Close
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto px-6 py-4">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">No historical pricing captured yet for this item.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li
                key={`${entry.source}-${entry.date}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">{entry.source}</p>
                  <p className="text-xs text-slate-400">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
                <p className="font-semibold text-slate-900">{formatCurrency(entry.price)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
);

const BudgetItemRow: React.FC<{
  item: BudgetItem;
  onUpdate: (item: BudgetItem) => void;
  onDelete: (id: string) => void;
}> = ({ item, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<BudgetItem>(item);
  const [errors, setErrors] = useState<{ quantity?: string; unitPrice?: string }>({});
  const [showHistory, setShowHistory] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  const isCrossed = item.flags.includes('Crossed');
  const isExcluded = item.flags.includes('Excluded');

  useEffect(() => {
    setEditedItem(item);
    setErrors({});
  }, [item]);

  useEffect(() => {
    if (isEditing) {
      descriptionInputRef.current?.focus();
    }
  }, [isEditing]);

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [
            item.category,
            editedItem.category,
            editedItem.subcategory,
            ...MOCK_ITEM_SUGGESTIONS.map((suggestion) => suggestion.category),
          ].filter(Boolean)
        )
      ),
    [editedItem.category, editedItem.subcategory, item.category]
  );

  const unitOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [item.unit, editedItem.unit, ...MOCK_ITEM_SUGGESTIONS.map((suggestion) => suggestion.unit)].filter(Boolean)
        )
      ),
    [editedItem.unit, item.unit]
  );

  const datalistCategoryId = `category-options-${item.id}`;
  const datalistUnitId = `unit-options-${item.id}`;

  const handleFlagToggle = (flag: 'Crossed' | 'Excluded') => {
    setEditedItem((prev) => {
      const hasFlag = prev.flags.includes(flag);
      const nextFlags = hasFlag ? prev.flags.filter((f) => f !== flag) : [...prev.flags, flag];
      return { ...prev, flags: nextFlags };
    });
  };

  const handleNumberInput = (field: 'quantity' | 'unitPrice', value: number) => {
    setEditedItem((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleStepper = (field: 'quantity' | 'unitPrice', direction: 1 | -1) => {
    const step = field === 'quantity' ? 1 : 0.5;
    const min = field === 'quantity' ? 0 : 0;
    const currentValue = editedItem[field];
    const nextValue = Math.max(min, parseFloat((currentValue + direction * step).toFixed(2)));
    handleNumberInput(field, nextValue);
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    if (name === 'quantity' || name === 'unitPrice') {
      const parsed = parseFloat(value);
      handleNumberInput(name, Number.isFinite(parsed) ? parsed : 0);
      return;
    }
    setEditedItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditedItem((prev) => ({ ...prev, imageUrl: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSkuLookup = () => {
    if (editedItem.sku?.trim()) return;
    const normalized = editedItem.description
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
    const generatedSku = normalized ? `SKU-${normalized}` : `SKU-${item.id.slice(0, 6).toUpperCase()}`;
    setEditedItem((prev) => ({ ...prev, sku: generatedSku }));
  };

  const validate = () => {
    const nextErrors: { quantity?: string; unitPrice?: string } = {};
    if (editedItem.quantity <= 0) {
      nextErrors.quantity = 'Quantity must be greater than zero.';
    }
    if (editedItem.unitPrice < 0) {
      nextErrors.unitPrice = 'Unit price cannot be negative.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }
    onUpdate(editedItem);
    setIsEditing(false);
    setTimeout(() => {
      rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleCancel = () => {
    setEditedItem(item);
    setErrors({});
    setIsEditing(false);
  };

  const handleToggleCrossed = () => {
    const newFlags = isCrossed ? item.flags.filter((f) => f !== 'Crossed') : [...item.flags, 'Crossed'];
    onUpdate({ ...item, flags: newFlags });
  };

  const handleToggleExcluded = () => {
    const newFlags = isExcluded ? item.flags.filter((f) => f !== 'Excluded') : [...item.flags, 'Excluded'];
    onUpdate({ ...item, flags: newFlags });
  };

  const editingContent = (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-500">Description</label>
          <input
            ref={descriptionInputRef}
            type="text"
            name="description"
            value={editedItem.description}
            onChange={handleTextChange}
            className="mt-1 w-full rounded-md border border-indigo-300 bg-white/60 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            placeholder="Item description"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">SKU</label>
          <div className="mt-1 flex rounded-md border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200">
            <input
              type="text"
              name="sku"
              value={editedItem.sku || ''}
              onChange={handleTextChange}
              className="w-full rounded-l-md border-0 bg-transparent px-3 py-2 text-sm focus:outline-none"
              placeholder="Lookup or enter SKU"
            />
            <button
              type="button"
              onClick={handleSkuLookup}
              className="rounded-r-md bg-slate-100 px-3 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-200"
            >
              Lookup
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-slate-500">Quantity</label>
          <div
            className={`mt-1 flex items-center overflow-hidden rounded-md border ${
              errors.quantity ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200'
            }`}
          >
            <button
              type="button"
              onClick={() => handleStepper('quantity', -1)}
              className="h-9 w-9 border-r border-slate-200 text-lg font-semibold text-slate-500 hover:bg-slate-100"
            >
              −
            </button>
            <input
              type="number"
              name="quantity"
              value={editedItem.quantity}
              onChange={handleTextChange}
              className="h-9 w-full border-0 text-center text-sm text-slate-700 focus:outline-none"
              min={0}
            />
            <button
              type="button"
              onClick={() => handleStepper('quantity', 1)}
              className="h-9 w-9 border-l border-slate-200 text-lg font-semibold text-slate-500 hover:bg-slate-100"
            >
              +
            </button>
          </div>
          {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Unit</label>
          <>
            <input
              list={datalistUnitId}
              type="text"
              name="unit"
              value={editedItem.unit}
              onChange={handleTextChange}
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="e.g., kg, box"
            />
            <datalist id={datalistUnitId}>
              {unitOptions.map((unit) => (
                <option key={unit} value={unit} />
              ))}
            </datalist>
          </>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Unit price (K)</label>
          <div
            className={`mt-1 flex items-center overflow-hidden rounded-md border ${
              errors.unitPrice ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200'
            }`}
          >
            <button
              type="button"
              onClick={() => handleStepper('unitPrice', -1)}
              className="h-9 w-9 border-r border-slate-200 text-lg font-semibold text-slate-500 hover:bg-slate-100"
            >
              −
            </button>
            <input
              type="number"
              step="0.01"
              name="unitPrice"
              value={editedItem.unitPrice}
              onChange={handleTextChange}
              className="h-9 w-full border-0 text-center text-sm text-slate-700 focus:outline-none"
              min={0}
            />
            <button
              type="button"
              onClick={() => handleStepper('unitPrice', 1)}
              className="h-9 w-9 border-l border-slate-200 text-lg font-semibold text-slate-500 hover:bg-slate-100"
            >
              +
            </button>
          </div>
          {errors.unitPrice && <p className="mt-1 text-xs text-red-600">{errors.unitPrice}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Price source</label>
          <select
            name="priceSource"
            value={editedItem.priceSource}
            onChange={handleTextChange}
            className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            {Object.values(PriceSource).map((ps) => (
              <option key={ps} value={ps}>
                {ps}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-500">Category</label>
          <input
            list={datalistCategoryId}
            type="text"
            name="category"
            value={editedItem.category}
            onChange={handleTextChange}
            className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            placeholder="Primary category"
          />
          <datalist id={datalistCategoryId}>
            {categoryOptions.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Sub-category</label>
          <input
            type="text"
            name="subcategory"
            value={editedItem.subcategory || ''}
            onChange={handleTextChange}
            className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            placeholder="Optional grouping"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-500">Private comments</label>
          <textarea
            name="privateNotes"
            value={editedItem.privateNotes || ''}
            onChange={handleTextChange}
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            placeholder="Only visible to your team"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Reference image</label>
          <div className="mt-1 flex flex-col items-start gap-2">
            {editedItem.imageUrl ? (
              <img src={editedItem.imageUrl} alt={editedItem.description} className="h-20 w-20 rounded-md object-cover shadow" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-slate-300 text-xs text-slate-400">
                No image
              </div>
            )}
            <label className="inline-flex cursor-pointer items-center rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200">
              Upload
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 p-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Flags</label>
          <button
            type="button"
            onClick={() => handleFlagToggle('Crossed')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              editedItem.flags.includes('Crossed')
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-slate-500 hover:bg-slate-100'
            }`}
          >
            Crossed
          </button>
          <button
            type="button"
            onClick={() => handleFlagToggle('Excluded')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              editedItem.flags.includes('Excluded')
                ? 'bg-amber-100 text-amber-700'
                : 'bg-white text-slate-500 hover:bg-slate-100'
            }`}
          >
            Excluded
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-budgetpulse px-4 py-2 text-sm font-semibold text-white transition hover:bg-opacity-90"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );

  const viewContent = (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="flex items-start gap-3 md:flex-1">
        <div className="flex flex-col items-center gap-2">
          <input
            type="checkbox"
            checked={isCrossed}
            onChange={handleToggleCrossed}
            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            aria-label="Mark item as crossed"
          />
          <button
            type="button"
            onClick={handleToggleExcluded}
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition ${
              isExcluded ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            Excl
          </button>
        </div>
        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.description} className="h-16 w-16 rounded-md object-cover shadow" />
        )}
        <div className="flex-1">
          <p
            className={`font-semibold ${
              isCrossed ? 'line-through text-slate-400' : isExcluded ? 'text-slate-500' : 'text-slate-800'
            }`}
          >
            {item.description}
          </p>
          <p className={`text-xs uppercase tracking-wide ${isExcluded ? 'text-amber-700' : 'text-slate-400'}`}>
            {item.category}
            {item.subcategory ? ` • ${item.subcategory}` : ''}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span>
              Qty: {item.quantity} {item.unit}
            </span>
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="font-mono text-xs text-indigo-600 underline-offset-2 hover:underline"
            >
              {item.priceSource}
            </button>
            {item.sku && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{item.sku}</span>}
          </div>
          {item.privateNotes && (
            <p className="mt-1 text-xs italic text-slate-400">Private note saved</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-6 md:gap-8">
        <div className="text-right">
          <p className={`text-sm ${isCrossed || isExcluded ? 'line-through text-slate-400' : 'text-slate-600'}`}>
            {formatCurrency(item.unitPrice)}
          </p>
          <p className="text-xs text-slate-400">each</p>
        </div>
        <div className="text-right font-semibold">
          <p className={`${isCrossed || isExcluded ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {formatCurrency(item.quantity * item.unitPrice)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-full p-1 text-slate-400 transition hover:text-indigo-500 focus:text-indigo-600"
            aria-label="Edit item"
          >
            <PencilIcon />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="rounded-full p-1 text-slate-400 transition hover:text-red-500 focus:text-red-600"
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
  const addItemToList = usePlanPulseStore((state) => state.addItemToList);
  const updateItemInList = usePlanPulseStore((state) => state.updateItemInList);
  const deleteItemFromList = usePlanPulseStore((state) => state.deleteItemFromList);
  const upsertList = usePlanPulseStore((state) => state.upsertList);
  const createList = usePlanPulseStore((state) => state.createList);

  const [newItemDesc, setNewItemDesc] = useState('');
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemForModal, setItemForModal] = useState<ItemSuggestion | null>(null);

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
    if (newItemDesc.length > 1) {
      const filtered = MOCK_ITEM_SUGGESTIONS.filter((item) => item.description.toLowerCase().includes(newItemDesc.toLowerCase()));
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [newItemDesc]);

  const handleOpenModal = (item: Partial<ItemSuggestion> & { description: string }) => {
    if (!item.description.trim() || !activeList) return;
    setItemForModal({
      description: item.description,
      category: item.category || 'Uncategorized',
      subcategory: item.subcategory,
      unit: item.unit || 'Each',
      unitPrice: item.unitPrice || 0,
      priceSource: item.priceSource || PriceSource.ZPPA,
      imageUrl: item.imageUrl,
      sku: item.sku,
      priceHistory: item.priceHistory,
    });
    setIsModalOpen(true);
  };

  const handleConfirmAddItem = (itemToAdd: BudgetItem) => {
    if (!activeList) return;
    addItemToList(activeList.id, itemToAdd);
    setNewItemDesc('');
    setSuggestions([]);
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

  const total = useMemo(() => {
    if (!activeList) return 0;
    return activeList.items
      .filter((item) => !item.flags.some((flag) => flag === 'Crossed' || flag === 'Excluded'))
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
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
        <QuickAddItemModal item={itemForModal} onClose={() => setIsModalOpen(false)} onAdd={handleConfirmAddItem} />
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
            onKeyDown={(e) => e.key === 'Enter' && handleOpenModal({ description: newItemDesc })}
            placeholder="Add an item..."
            className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-pricepulse"
          />
          <button
            onClick={() => handleOpenModal({ description: newItemDesc })}
            className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full text-white ${mode === Mode.PricePulse ? 'bg-pricepulse' : 'bg-budgetpulse'} hover:opacity-90`}
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-slate-200">
              <ul className="py-1">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={`${suggestion.description}-${index}`}
                    onClick={() => handleOpenModal(suggestion)}
                    className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {suggestion.description}
                  </li>
                ))}
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
