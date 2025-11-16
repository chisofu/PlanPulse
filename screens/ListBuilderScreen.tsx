import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Mode,
  BudgetItem,
  ShoppingList,
  PriceSource,
  ItemPriority,
  ItemStatus,
  Template,
} from '../types';
import {
  usePlanPulseStore,
  selectLists,
  selectActiveListId,
  selectItemSuggestions,
  selectCategoryTaxonomy,
} from '../store/planPulseStore';
import {
  formatCurrency,
  MOCK_ITEM_SUGGESTIONS,
  DEFAULT_ITEM_CATEGORIES,
  DEFAULT_ITEM_UNITS,
} from '../constants';
import { PlusIcon, TrashIcon, PencilIcon } from '../components/Icons';
import { v4 as uuidv4 } from 'uuid';
import TemplateEditorModal from '../components/templates/TemplateEditorModal';
import { fuzzyIncludes } from '../utils/search';

type SortKey = 'description' | 'quantity' | 'unitPrice';
type SortDirection = 'asc' | 'desc';
type VisibilityFilter = 'all' | 'checked' | 'crossed-off';

type ItemValidationErrors = {
  quantity?: string;
  unitPrice?: string;
};

type ToastState = {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'info' | 'success' | 'warning';
};

type QuickAddDraft = {
  description: string;
  category: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  priceSource: PriceSource;
  priority: ItemPriority;
  status: ItemStatus;
  sku?: string;
  comment?: string;
  excludeFromTotals?: boolean;
};

type SuggestionCandidate = Omit<BudgetItem, 'id' | 'flags'> & { quantity?: number };

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
};

type AlternativeModalState = {
  item: BudgetItem;
  candidates: SuggestionCandidate[];
};

const priorityOptions: ItemPriority[] = ['High', 'Medium', 'Low'];
const statusOptions: ItemStatus[] = ['Planned', 'In Progress', 'Ordered', 'Received'];

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

const ensureItemImages = (entry: BudgetItem): BudgetItem => ({
  ...entry,
  images: entry.images ?? (entry.imageUrl ? [entry.imageUrl] : []),
  imageUrl: entry.imageUrl ?? entry.images?.[0],
});

const createTemplateFromShoppingList = (list: ShoppingList, mode: Mode): Template => {
  const fallbackItem = list.items[0];
  const defaultUnit = fallbackItem?.unit ?? 'Each';
  const defaultPriceSource = fallbackItem?.priceSource ?? PriceSource.ZPPA;
  const defaultCategory = fallbackItem?.category ?? 'General';
  const estimatedBudget = list.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);

  return {
    id: uuidv4(),
    name: `${list.name} Template`,
    description: list.description || 'Generated from List Builder selections.',
    category: 'Custom',
    emoji: '📝',
    tags: ['list-builder'],
    tone: mode === Mode.PricePulse ? 'Hybrid' : 'Personal',
    status: 'draft',
    defaultUnit,
    defaultPriceSource,
    defaultCategory,
    variants: [
      {
        id: uuidv4(),
        name: 'Standard',
        summary: 'Auto-generated from an existing shopping list.',
        recommendedFor: 'Teams repeating this planning workflow',
        estimatedBudget,
        cadence: 'Ad-hoc',
        lastRefreshed: new Date().toISOString().slice(0, 10),
        sourceLabel: 'List Builder export',
        items: list.items.map((item) => ({
          description: item.description,
          category: item.category,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          priceSource: item.priceSource,
          benchmarkSource: item.priceSource,
        })),
      },
    ],
    metrics: {
      adoptionRate: 0,
      avgLines: list.items.length,
      lastUsedAt: new Date().toISOString(),
    },
  };
};

const defaultQuickAddDraft = (): QuickAddDraft => ({
  description: '',
  category: DEFAULT_ITEM_CATEGORIES[0] ?? 'General',
  unit: DEFAULT_ITEM_UNITS[0] ?? 'Each',
  quantity: 1,
  unitPrice: 0,
  priceSource: PriceSource.ZPPA,
  priority: 'Medium',
  status: 'Planned',
  sku: '',
  comment: '',
  excludeFromTotals: false,
});

const PriceHistoryModal: React.FC<{
  entries: NonNullable<BudgetItem['priceHistory']>;
  itemDescription: string;
  onClose: () => void;
}> = ({ entries, itemDescription, onClose }) => {
  if (!entries.length) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Price history</p>
            <h3 className="text-lg font-bold text-slate-900">{itemDescription}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
            aria-label="Close price history"
          >
            ✕
          </button>
        </div>
        <ul className="divide-y divide-slate-200 max-h-64 overflow-auto">
          {entries.map((entry) => (
            <li key={`${entry.capturedAt}-${entry.value}`} className="py-2 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-slate-800">{formatCurrency(entry.value)}</p>
                <p className="text-xs text-slate-500">
                  {new Date(entry.capturedAt).toLocaleDateString()} {entry.source ? `• ${entry.source}` : ''}
                </p>
              </div>
              {entry.note && <span className="text-xs text-slate-400">{entry.note}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const ConfirmDialog: React.FC<{ state: ConfirmState | null; onClose: () => void }> = ({ state, onClose }) => {
  if (!state) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{state.title}</h3>
          <p className="text-sm text-slate-600 mt-1">{state.description}</p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              state.onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const Toast: React.FC<{ toast: ToastState | null; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const timeoutRef = useRef<number>();
  useEffect(() => {
    if (!toast) return;
    timeoutRef.current = window.setTimeout(onDismiss, 6000);
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [toast, onDismiss]);
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`rounded-lg shadow-lg px-4 py-3 text-sm text-white flex items-center gap-3 ${
          toast.tone === 'warning' ? 'bg-amber-500' : toast.tone === 'success' ? 'bg-emerald-600' : 'bg-slate-900'
        }`}
      >
        <span>{toast.message}</span>
        {toast.actionLabel && (
          <button
            type="button"
            onClick={() => {
              toast.onAction?.();
              onDismiss();
            }}
            className="font-semibold underline"
          >
            {toast.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

const SuggestionDropdown: React.FC<{
  suggestions: SuggestionCandidate[];
  highlightedIndex: number;
  onSelect: (candidate: SuggestionCandidate) => void;
}> = ({ suggestions, highlightedIndex, onSelect }) => {
  if (!suggestions.length) return null;
  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion.description}-${suggestion.category}`}
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            onSelect(suggestion);
          }}
          className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 ${
            highlightedIndex === index ? 'bg-indigo-50' : ''
          }`}
        >
          <p className="font-medium text-slate-900">{suggestion.description}</p>
          <p className="text-xs text-slate-500">
            {suggestion.category} • {suggestion.unit}
          </p>
        </button>
      ))}
    </div>
  );
};
const QuickAddModal: React.FC<{
  isOpen: boolean;
  draft: QuickAddDraft;
  categories: string[];
  units: string[];
  suggestions: SuggestionCandidate[];
  onChange: (draft: QuickAddDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
  onPrefill: (candidate: SuggestionCandidate) => void;
}> = ({ isOpen, draft, categories, units, suggestions, onChange, onClose, onSubmit, onPrefill }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Quick add</p>
            <h3 className="text-2xl font-bold text-slate-900">Capture a new line item</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-900" aria-label="Close quick add">
            ✕
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col text-sm text-slate-600">
            Description
            <input
              type="text"
              value={draft.description}
              onChange={(event) => onChange({ ...draft, description: event.target.value })}
              list="quick-add-descriptions"
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="What do you need?"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            Category
            <input
              type="text"
              value={draft.category}
              onChange={(event) => onChange({ ...draft, category: event.target.value })}
              list="quick-add-categories"
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Start typing to autocomplete"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            Unit
            <input
              type="text"
              value={draft.unit}
              onChange={(event) => onChange({ ...draft, unit: event.target.value })}
              list="quick-add-units"
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            SKU
            <input
              type="text"
              value={draft.sku}
              onChange={(event) => onChange({ ...draft, sku: event.target.value })}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Optional code"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            Quantity
            <input
              type="number"
              min={0}
              value={draft.quantity}
              onChange={(event) => onChange({ ...draft, quantity: Number(event.target.value) })}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            Unit price (K)
            <input
              type="number"
              min={0}
              step="0.01"
              value={draft.unitPrice}
              onChange={(event) => onChange({ ...draft, unitPrice: Number(event.target.value) })}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            Price source
            <select
              value={draft.priceSource}
              onChange={(event) => onChange({ ...draft, priceSource: event.target.value as PriceSource })}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.values(PriceSource).map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            Priority
            <select
              value={draft.priority}
              onChange={(event) => onChange({ ...draft, priority: event.target.value as ItemPriority })}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            Status
            <select
              value={draft.status}
              onChange={(event) => onChange({ ...draft, status: event.target.value as ItemStatus })}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm text-slate-600 md:col-span-2">
            Notes / comments
            <textarea
              value={draft.comment}
              onChange={(event) => onChange({ ...draft, comment: event.target.value })}
              rows={3}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Context for teammates"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={Boolean(draft.excludeFromTotals)}
              onChange={(event) => onChange({ ...draft, excludeFromTotals: event.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Exclude from totals
          </label>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Use a suggestion</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 6).map((suggestion) => (
              <button
                key={`modal-suggestion-${suggestion.description}`}
                type="button"
                onClick={() => onPrefill(suggestion)}
                className="px-3 py-1 text-xs font-medium rounded-full border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
              >
                {suggestion.description}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-500">
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Add item
          </button>
        </div>
      </div>
      <datalist id="quick-add-descriptions">
        {suggestions.map((suggestion) => (
          <option key={`desc-${suggestion.description}`} value={suggestion.description} />
        ))}
      </datalist>
      <datalist id="quick-add-categories">
        {categories.map((category) => (
          <option key={`cat-${category}`} value={category} />
        ))}
      </datalist>
      <datalist id="quick-add-units">
        {units.map((unit) => (
          <option key={`unit-${unit}`} value={unit} />
        ))}
      </datalist>
    </div>
  );
};

const SuggestAlternativesModal: React.FC<{
  state: AlternativeModalState | null;
  onClose: () => void;
  onApply: (candidate: SuggestionCandidate) => void;
}> = ({ state, onClose, onApply }) => {
  if (!state) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Suggest alternatives</p>
            <h3 className="text-xl font-bold text-slate-900">{state.item.description}</h3>
            <p className="text-sm text-slate-500">Based on category {state.item.category}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-900">
            ✕
          </button>
        </div>
        {state.candidates.length ? (
          <ul className="divide-y divide-slate-200 max-h-80 overflow-auto">
            {state.candidates.map((candidate) => (
              <li key={`${candidate.description}-${candidate.unit}`} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{candidate.description}</p>
                  <p className="text-xs text-slate-500">
                    {candidate.category} • {candidate.unit} • {formatCurrency(candidate.unitPrice ?? 0)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onApply(candidate)}
                  className="px-3 py-1 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-full hover:bg-indigo-50"
                >
                  Use this
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No close matches found in the taxonomy just yet.</p>
        )}
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const BulkEditorPanel: React.FC<{
  isOpen: boolean;
  draft: Partial<BudgetItem>;
  onChange: (draft: Partial<BudgetItem>) => void;
  onApply: () => void;
  onClose: () => void;
  disabled: boolean;
}> = ({ isOpen, draft, onChange, onApply, onClose, disabled }) => {
  if (!isOpen) return null;
  return (
    <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">Bulk edit selected items</p>
          <p className="text-xs text-slate-500">Pick which values to update and apply in one go.</p>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
          ✕
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1">
          Priority
          <select
            value={draft.priority ?? ''}
            onChange={(event) => onChange({ ...draft, priority: event.target.value as ItemPriority })}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">—</option>
            {priorityOptions.map((priority) => (
              <option key={`bulk-${priority}`} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1">
          Status
          <select
            value={draft.status ?? ''}
            onChange={(event) => onChange({ ...draft, status: event.target.value as ItemStatus })}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">—</option>
            {statusOptions.map((status) => (
              <option key={`bulk-${status}`} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-500 flex flex-col gap-1">
          Price source
          <select
            value={draft.priceSource ?? ''}
            onChange={(event) => onChange({ ...draft, priceSource: event.target.value as PriceSource })}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">—</option>
            {Object.values(PriceSource).map((source) => (
              <option key={`bulk-${source}`} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <input
            type="checkbox"
            checked={draft.excludeFromTotals ?? false}
            onChange={(event) => onChange({ ...draft, excludeFromTotals: event.target.checked })}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Exclude from totals
        </label>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={disabled}
          onClick={onApply}
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg disabled:opacity-50"
        >
          Apply changes
        </button>
      </div>
    </div>
  );
};
const BudgetItemRow: React.FC<{
  item: BudgetItem;
  index: number;
  isEditing: boolean;
  isSelected: boolean;
  isFocused: boolean;
  categories: string[];
  units: string[];
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onUpdate: (item: BudgetItem) => void;
  onDelete: (id: string) => void;
  onToggleSelect: (id: string, selected: boolean) => void;
  onToggleComplete: (item: BudgetItem) => void;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
}> = ({
  item,
  index,
  isEditing,
  isSelected,
  isFocused,
  categories,
  units,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onToggleSelect,
  onToggleComplete,
  onDragStart,
  onDragEnter,
  onDragEnd,
}) => {
  const [draft, setDraft] = useState<BudgetItem>(() => ensureItemImages(item));
  const [errors, setErrors] = useState<ItemValidationErrors>({});
  const descriptionInputRef = useRef<HTMLInputElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const isCrossed = deriveIsChecked(item) || item.flags.includes('Crossed');
  const isExcluded = item.excludeFromTotals || item.flags.includes('Excluded');
  const editingImages = draft.images ?? [];
  const viewImages = item.images?.length ? item.images : item.imageUrl ? [item.imageUrl] : [];

  useEffect(() => {
    setDraft(ensureItemImages(item));
    setErrors({});
  }, [item]);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        descriptionInputRef.current?.focus();
      }, 50);
    }
  }, [isEditing]);

  useEffect(() => {
    if (isFocused && rowRef.current) {
      rowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [isFocused]);

  const handleToggleChecked = () => {
    const isChecked = deriveIsChecked(item);
    let nextFlags = item.flags.filter((flag) => flag !== 'Crossed' && flag !== 'Checked');
    if (!isChecked) {
      nextFlags = [...nextFlags, 'Crossed', 'Checked'];
    }
    onUpdate({ ...item, flags: nextFlags, completed: !isChecked });
  };

  const handleIncrement = (field: 'quantity' | 'unitPrice', delta: number) => {
    setDraft((prev) => ({ ...prev, [field]: Math.max(0, Number(prev[field]) + delta) }) as BudgetItem);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) {
      return;
    }
    event.target.value = '';
    const readers = files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error ?? new Error('Failed to read image.'));
          reader.readAsDataURL(file);
        }),
    );
    Promise.all(readers)
      .then((newImages) => {
        setDraft((prev) => {
          const existing = prev.images ?? [];
          const nextImages = [...existing, ...newImages];
          return { ...prev, images: nextImages, imageUrl: nextImages[0] };
        });
      })
      .catch((error) => {
        console.error('Unable to read selected files', error);
      });
  };

  const handleRemoveImage = (index: number) => {
    setDraft((prev) => {
      const nextImages = (prev.images ?? []).filter((_, idx) => idx !== index);
      return { ...prev, images: nextImages, imageUrl: nextImages[0] };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'quantity' || name === 'unitPrice') {
      setDraft((prev) => ({ ...prev, [name]: Number(value) }) as BudgetItem);
      return;
    }
    setDraft((prev) => ({ ...prev, [name]: value }) as BudgetItem);
  };

  const handleToggleExclude = (checked: boolean) => {
    const nextFlags = checked
      ? Array.from(new Set([...(draft.flags ?? []), 'Excluded']))
      : (draft.flags ?? []).filter((flag) => flag !== 'Excluded');
    setDraft((prev) => ({ ...prev, excludeFromTotals: checked, flags: nextFlags }));
  };

  const validate = () => {
    const nextErrors: ItemValidationErrors = {};
    if (!Number.isFinite(draft.quantity) || draft.quantity < 0) {
      nextErrors.quantity = 'Quantity must be zero or greater.';
    }
    if (!Number.isFinite(draft.unitPrice) || draft.unitPrice < 0) {
      nextErrors.unitPrice = 'Unit price must be zero or greater.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const sanitizedImages = draft.images?.filter(Boolean) ?? [];
    onUpdate({
      ...draft,
      description: draft.description.trim() || 'Untitled item',
      images: sanitizedImages,
      imageUrl: sanitizedImages[0],
    });
    onCancelEdit();
  };

  const editingContent = (
    <div className="flex flex-col gap-4" ref={rowRef}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col text-xs font-semibold text-slate-500">
          <label htmlFor={`${item.id}-description`} className="text-xs font-semibold text-slate-500">
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
          <div className="mt-3">
            <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-indigo-600 cursor-pointer">
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md">Upload reference photo</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
            </label>
            <p className="mt-1 text-[11px] font-normal text-slate-400">PNG, JPG, or HEIC up to 5 MB each.</p>
          </div>
        </div>
        <label className="text-xs font-semibold text-slate-500">
          SKU
          <input
            id={`${item.id}-sku`}
            type="text"
            name="sku"
            value={draft.sku ?? ''}
            onChange={handleChange}
            className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Optional"
          />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Category
          <input
            id={`${item.id}-category`}
            type="text"
            name="category"
            value={draft.category}
            onChange={handleChange}
            list={`category-options-${item.id}`}
            className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <datalist id={`category-options-${item.id}`}>
            {categories.map((category) => (
              <option key={`category-${item.id}-${category}`} value={category} />
            ))}
          </datalist>
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Unit
          <input
            id={`${item.id}-unit`}
            type="text"
            name="unit"
            value={draft.unit}
            onChange={handleChange}
            list={`unit-options-${item.id}`}
            className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <datalist id={`unit-options-${item.id}`}>
            {units.map((unit) => (
              <option key={`unit-${item.id}-${unit}`} value={unit} />
            ))}
          </datalist>
        </label>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2">Images</p>
        {editingImages.length ? (
          <div className="flex flex-wrap gap-3">
            {editingImages.map((image, index) => (
              <div key={`${item.id}-image-${index}`} className="relative w-20 h-20">
                <img
                  src={image}
                  alt={`${draft.description || 'Item'} reference ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-900/80 text-white text-xs"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No images uploaded yet.</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="text-xs font-semibold text-slate-500">
          Quantity
          <div className="flex mt-1 rounded-md border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500">
            <button type="button" onClick={() => handleIncrement('quantity', -1)} className="px-2 text-slate-500">
              −
            </button>
            <input
              id={`${item.id}-quantity`}
              type="number"
              name="quantity"
              value={Number.isFinite(draft.quantity) ? draft.quantity : ''}
              onChange={handleChange}
              className={`flex-1 p-2 text-sm border-0 focus:ring-0 ${errors.quantity ? 'text-red-600' : ''}`}
              placeholder="0"
              min={0}
            />
            <button type="button" onClick={() => handleIncrement('quantity', 1)} className="px-2 text-slate-500">
              +
            </button>
          </div>
          {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>}
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Unit price (K)
          <div className="flex mt-1 rounded-md border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500">
            <button type="button" onClick={() => handleIncrement('unitPrice', -5)} className="px-2 text-slate-500">
              −
            </button>
            <input
              id={`${item.id}-unitPrice`}
              type="number"
              name="unitPrice"
              value={Number.isFinite(draft.unitPrice) ? draft.unitPrice : ''}
              onChange={handleChange}
              className={`flex-1 p-2 text-sm border-0 focus:ring-0 ${errors.unitPrice ? 'text-red-600' : ''}`}
              step="0.01"
              min={0}
              placeholder="0.00"
            />
            <button type="button" onClick={() => handleIncrement('unitPrice', 5)} className="px-2 text-slate-500">
              +
            </button>
          </div>
          {errors.unitPrice && <p className="mt-1 text-xs text-red-600">{errors.unitPrice}</p>}
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Source
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
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Status
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
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="text-xs font-semibold text-slate-500">
          Priority
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
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Notes
          <textarea
            name="comment"
            value={draft.comment ?? ''}
            onChange={handleChange}
            rows={2}
            className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Add an internal note"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            id={`completed-${item.id}`}
            type="checkbox"
            checked={draft.completed}
            onChange={(event) => setDraft((prev) => ({ ...prev, completed: event.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Mark as completed
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={Boolean(draft.excludeFromTotals)}
            onChange={(event) => handleToggleExclude(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          Exclude from totals
        </label>
      </div>
      <div className="flex justify-between items-center">
        {item.priceHistory?.length ? (
          <button type="button" onClick={() => setShowHistory(true)} className="text-xs font-semibold text-indigo-600">
            View price history
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
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
      {showHistory && item.priceHistory && (
        <PriceHistoryModal entries={item.priceHistory} onClose={() => setShowHistory(false)} itemDescription={item.description} />
      )}
    </div>
  );

  const viewContent = (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(event) => onToggleSelect(item.id, event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <button
            type="button"
            className="cursor-move text-slate-400 hover:text-indigo-500"
            aria-label="Reorder item"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move';
              onDragStart(item.id);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              onDragEnter(item.id);
            }}
            onDragEnd={onDragEnd}
          >
            ☰
          </button>
          <input
            type="checkbox"
            checked={deriveIsChecked(item)}
            onChange={handleToggleChecked}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            title="Mark as checked"
          />
          <input
            type="checkbox"
            checked={item.completed}
            onChange={() => onToggleComplete(item)}
            className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
            title="Completed"
          />
        </div>
        <div className="flex-1">
          <button
            type="button"
            onClick={() => onStartEdit(item.id)}
            className={`text-left transition ${isCrossed ? 'line-through text-slate-400' : 'text-slate-900 hover:text-indigo-600'}`}
            title="Click to edit"
          >
            <span className="font-semibold">{item.description || 'New item'}</span>
          </button>
          <div className="text-xs text-slate-500 flex flex-wrap gap-2">
            <span>
              Qty {item.quantity} {item.unit || '—'}
            </span>
            <span>• {item.priceSource}</span>
            {item.sku && <span>• SKU {item.sku}</span>}
            {item.assigneeId && <span>• Assigned</span>}
          </div>
          {item.comment && <p className="text-xs text-slate-500 line-clamp-2">{item.comment}</p>}
          <div className="flex flex-wrap gap-2 mt-1">
            {item.priority === 'High' && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">High priority</span>
            )}
            {isExcluded && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Excluded</span>
            )}
            {item.status !== 'Planned' && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                {item.status}
              </span>
            )}
          </div>
          {viewImages.length ? (
            <div className="flex gap-2 mt-2">
              {viewImages.slice(0, 3).map((image, index) => (
                <img
                  key={`${item.id}-preview-${index}`}
                  src={image}
                  alt={item.description}
                  className="w-10 h-10 object-cover rounded-md border"
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
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
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
            <button type="button" onClick={() => onStartEdit(item.id)} className="p-1 text-slate-400 hover:text-indigo-500" aria-label="Edit item">
              <PencilIcon />
            </button>
            <button type="button" onClick={() => onDelete(item.id)} className="p-1 text-slate-400 hover:text-red-500" aria-label="Delete item">
              <TrashIcon />
            </button>
          </div>
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
  } ${isFocused ? 'shadow-inner' : ''}`;

  return (
    <div ref={rowRef} className={`p-3 transition-all ${containerClasses}`} draggable={!isEditing}>
      {isEditing ? editingContent : viewContent}
    </div>
  );
};
interface ListBuilderScreenProps {
  mode: Mode;
}

const ListBuilderScreen: React.FC<ListBuilderScreenProps> = ({ mode }) => {
  const lists = usePlanPulseStore(selectLists);
  const activeListId = usePlanPulseStore(selectActiveListId);
  const setActiveListId = usePlanPulseStore((state) => state.setActiveList);
  const addItemToList = usePlanPulseStore((state) => state.addItemToList);
  const updateItemInList = usePlanPulseStore((state) => state.updateItemInList);
  const deleteItemsFromList = usePlanPulseStore((state) => state.deleteItemsFromList);
  const bulkUpdateItemsInList = usePlanPulseStore((state) => state.bulkUpdateItemsInList);
  const reorderItemsInList = usePlanPulseStore((state) => state.reorderItemsInList);
  const restoreItemsInList = usePlanPulseStore((state) => state.restoreItemsInList);
  const upsertList = usePlanPulseStore((state) => state.upsertList);
  const createList = usePlanPulseStore((state) => state.createList);
  const upsertTemplate = usePlanPulseStore((state) => state.upsertTemplate);
  const recordItemSuggestion = usePlanPulseStore((state) => state.recordItemSuggestion);
  const upsertCategory = usePlanPulseStore((state) => state.upsertCategory);
  const itemSuggestionMetadata = usePlanPulseStore(selectItemSuggestions);
  const categoryTaxonomy = usePlanPulseStore(selectCategoryTaxonomy);

  const [newItemDesc, setNewItemDesc] = useState('');
  const [filterText, setFilterText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [priorityFilter, setPriorityFilter] = useState<ItemPriority | 'all'>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'priority'>('none');
  const [sortKey, setSortKey] = useState<SortKey>('description');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [visibility, setVisibility] = useState<VisibilityFilter>('all');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [bulkEditorOpen, setBulkEditorOpen] = useState(false);
  const [bulkDraft, setBulkDraft] = useState<Partial<BudgetItem>>({});
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<Template | undefined>(undefined);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDraft, setQuickAddDraft] = useState<QuickAddDraft>(defaultQuickAddDraft);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [alternativeModal, setAlternativeModal] = useState<AlternativeModalState | null>(null);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
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

  const availableCategories = useMemo(() => {
    if (!activeList) return [];
    const categories = Array.from(
      new Set(
        activeList.items
          .map((item) => (item.category && item.category.trim().length ? item.category : 'Uncategorized'))
          .filter(Boolean),
      ),
    );
    categories.sort((a, b) => a.localeCompare(b));
    return categories;
  }, [activeList]);

  useEffect(() => {
    setSelectedIds([]);
    setFocusedItemId(activeList?.items[0]?.id ?? null);
    if (activeList) {
      setNameDraft(activeList.name);
      setDescriptionDraft(activeList.description ?? '');
    }
  }, [activeList?.id]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => activeList?.items.some((item) => item.id === id)));
  }, [activeList?.items]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsQuickAddOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handleAddQuickItem();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const suggestionPool = useMemo(() => {
    const metadataSuggestions: SuggestionCandidate[] = itemSuggestionMetadata.map((entry) => ({
      description: entry.description,
      category: entry.category,
      unit: entry.unit,
      unitPrice: entry.unitPrice,
      priceSource: entry.priceSource,
      quantity: entry.quantitySuggestion ?? 1,
      sku: entry.description.slice(0, 6).toUpperCase(),
    }));
    const combined = [...MOCK_ITEM_SUGGESTIONS, ...metadataSuggestions];
    const map = new Map<string, SuggestionCandidate>();
    combined.forEach((entry) => {
      const key = entry.description.toLowerCase();
      if (!map.has(key)) {
        map.set(key, entry);
      }
    });
    return Array.from(map.values());
  }, [itemSuggestionMetadata]);

  const filteredQuickSuggestions = useMemo(() => {
    const query = newItemDesc.trim().toLowerCase();
    if (!query) {
      return suggestionPool.slice(0, 5);
    }
    return suggestionPool
      .filter(
        (suggestion) =>
          suggestion.description.toLowerCase().includes(query) ||
          (suggestion.category ?? '').toLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [newItemDesc, suggestionPool]);

  useEffect(() => {
    if (!filteredQuickSuggestions.length) {
      setHighlightedSuggestion(-1);
      return;
    }
    setHighlightedSuggestion((prev) => Math.min(Math.max(prev, 0), filteredQuickSuggestions.length - 1));
  }, [filteredQuickSuggestions.length]);

  const normalizedFilter = filterText.trim();

  const filteredItems = useMemo(() => {
    if (!activeList) return [] as BudgetItem[];

    const visibilityFilterFn = (item: BudgetItem) => {
      if (visibility === 'checked') {
        return deriveIsChecked(item);
      }
      if (visibility === 'crossed-off') {
        return item.flags.includes('Crossed');
      }
      return true;
    };

    const searchFilter = (item: BudgetItem) => {
      if (!normalizedFilter) return true;
      const haystack = [
        item.description,
        item.unit,
        String(item.quantity ?? ''),
        String(item.unitPrice ?? ''),
        item.category,
        item.sku,
      ]
        .filter(Boolean)
        .join(' ');
      return fuzzyIncludes(normalizedFilter, haystack);
    };

    const categoryFilterFn = (item: BudgetItem) => {
      if (categoryFilter === 'all') return true;
      const value = item.category && item.category.trim().length ? item.category : 'Uncategorized';
      return value === categoryFilter;
    };

    const priorityFilterFn = (item: BudgetItem) => {
      if (priorityFilter === 'all') return true;
      return item.priority === priorityFilter;
    };

    return [...activeList.items]
      .filter(visibilityFilterFn)
      .filter(searchFilter)
      .filter(categoryFilterFn)
      .filter(priorityFilterFn)
      .sort((a, b) => {
        const comparator = getSortComparator(sortKey);
        const value = comparator(a, b);
        return sortDirection === 'asc' ? value : value * -1;
      });
  }, [activeList, categoryFilter, normalizedFilter, priorityFilter, sortDirection, sortKey, visibility]);

  const filteredIndexMap = useMemo(() => {
    return new Map(filteredItems.map((item, index) => [item.id, index]));
  }, [filteredItems]);

  const groupedItems = useMemo(() => {
    if (groupBy === 'none') {
      return [] as [string, BudgetItem[]][];
    }
    const groupMap = new Map<string, BudgetItem[]>();
    filteredItems.forEach((item) => {
      const label =
        groupBy === 'category'
          ? item.category && item.category.trim().length
            ? item.category
            : 'Uncategorized'
          : item.priority ?? 'Medium';
      if (!groupMap.has(label)) {
        groupMap.set(label, []);
      }
      groupMap.get(label)!.push(item);
    });
    const entries = Array.from(groupMap.entries());
    if (groupBy === 'category') {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
    } else {
      const priorityOrder = priorityOptions.reduce<Record<ItemPriority, number>>((acc, priority, index) => {
        acc[priority] = index;
        return acc;
      }, {} as Record<ItemPriority, number>);
      entries.sort(
        (a, b) => (priorityOrder[a[0] as ItemPriority] ?? 99) - (priorityOrder[b[0] as ItemPriority] ?? 99),
      );
    }
    return entries;
  }, [filteredItems, groupBy]);

  const hasItemFilters =
    Boolean(normalizedFilter) ||
    visibility !== 'all' ||
    categoryFilter !== 'all' ||
    priorityFilter !== 'all' ||
    groupBy !== 'none';

  const handleResetItemFilters = () => {
    setFilterText('');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setVisibility('all');
    setGroupBy('none');
  };

  const includeInTotals = (item: BudgetItem) => !(item.excludeFromTotals || item.flags.includes('Excluded'));

  const draftTotal = useMemo(() => {
    if (!activeList) return 0;
    return activeList.items.filter(includeInTotals).reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [activeList]);

  const quoteTotal = useMemo(() => {
    if (!activeList) return 0;
    return activeList.items
      .filter(includeInTotals)
      .filter((item) => !item.flags.includes('Crossed') && !item.flags.includes('Checked'))
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [activeList]);

  const filteredDraftTotal = useMemo(() => {
    return filteredItems
      .filter(includeInTotals)
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [filteredItems]);

  const filteredQuoteTotal = useMemo(() => {
    return filteredItems
      .filter(includeInTotals)
      .filter((item) => !item.flags.includes('Crossed') && !item.flags.includes('Checked'))
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [filteredItems]);

  const handleAddQuickItem = useCallback(() => {
    if (!activeList) return;
    const trimmed = (newItemDesc || quickAddDraft.description).trim();
    if (!trimmed) return;
    const draft = { ...quickAddDraft, description: trimmed };
    const newItem: BudgetItem = {
      id: uuidv4(),
      description: draft.description,
      category: draft.category || 'General',
      unit: draft.unit || 'Each',
      quantity: draft.quantity || 1,
      unitPrice: draft.unitPrice || 0,
      priceSource: draft.priceSource,
      flags: draft.excludeFromTotals ? ['Excluded'] : [],
      priority: draft.priority,
      completed: false,
      status: draft.status,
      sku: draft.sku,
      comment: draft.comment,
      excludeFromTotals: draft.excludeFromTotals,
      imageUrl: undefined,
      images: [],
    };
    addItemToList(activeList.id, newItem);
    const { id: _id, flags: _flags, ...suggestionRest } = newItem;
    recordItemSuggestion({ ...suggestionRest, quantity: draft.quantity });
    if (draft.category && !categoryTaxonomy.some((entry) => entry.toLowerCase() === draft.category.toLowerCase())) {
      upsertCategory(draft.category);
    }
    setFocusedItemId(newItem.id);
    setNewItemDesc('');
    setQuickAddDraft(defaultQuickAddDraft());
    setToast({ id: uuidv4(), message: `Added “${newItem.description}”`, tone: 'success' });
  }, [activeList, addItemToList, newItemDesc, quickAddDraft, recordItemSuggestion, categoryTaxonomy, upsertCategory]);
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
      imageUrl: undefined,
      images: [],
    };
    addItemToList(activeList.id, newItem);
    setEditingItemId(newItem.id);
    setFocusedItemId(newItem.id);
  };

  const handleUpdateItem = (item: BudgetItem) => {
    if (!activeList) return;
    updateItemInList(activeList.id, item);
    setToast({ id: uuidv4(), message: `Updated “${item.description}”.` });
  };

  const handleToggleComplete = (item: BudgetItem) => {
    if (!activeList) return;
    updateItemInList(activeList.id, { ...item, completed: !item.completed });
  };

  const handleDeleteItems = (ids: string[]) => {
    if (!activeList || !ids.length) return;
    const entries = ids
      .map((id) => {
        const index = activeList.items.findIndex((item) => item.id === id);
        const item = activeList.items[index];
        return item ? { item, index } : null;
      })
      .filter((entry): entry is { item: BudgetItem; index: number } => Boolean(entry));
    deleteItemsFromList(activeList.id, ids);
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    setToast({
      id: uuidv4(),
      message: `Deleted ${ids.length} item${ids.length > 1 ? 's' : ''}.`,
      actionLabel: 'Undo',
      onAction: () => restoreItemsInList(activeList.id, entries),
      tone: 'warning',
    });
  };

  const handleDeleteItem = (id: string) => {
    setConfirmState({
      title: 'Delete item',
      description: 'This will remove the line item from your list. You can undo afterwards.',
      confirmLabel: 'Delete',
      onConfirm: () => handleDeleteItems([id]),
    });
  };

  const handleBulkDelete = () => {
    setConfirmState({
      title: `Delete ${selectedIds.length} selected`,
      description: 'The items will be removed from the list. Undo will be available.',
      confirmLabel: 'Delete selected',
      onConfirm: () => handleDeleteItems(selectedIds),
    });
  };

  const handleBulkApply = () => {
    if (!activeList || !selectedIds.length) return;
    const updates: Partial<BudgetItem> = {};
    if (bulkDraft.priority) updates.priority = bulkDraft.priority;
    if (bulkDraft.status) updates.status = bulkDraft.status;
    if (bulkDraft.priceSource) updates.priceSource = bulkDraft.priceSource;
    if (typeof bulkDraft.excludeFromTotals === 'boolean') {
      updates.excludeFromTotals = bulkDraft.excludeFromTotals;
      updates.flags = bulkDraft.excludeFromTotals ? ['Excluded'] : [];
    }
    bulkUpdateItemsInList(activeList.id, selectedIds, updates);
    setBulkEditorOpen(false);
    setBulkDraft({});
    setToast({ id: uuidv4(), message: 'Bulk update applied.', tone: 'success' });
  };

  const handleStartBulkEdit = () => {
    if (!selectedIds.length) {
      setToast({ id: uuidv4(), message: 'Select at least one line item first.', tone: 'warning' });
      return;
    }
    setBulkEditorOpen(true);
  };

  const handleSelectAll = () => {
    if (!filteredItems.length) return;
    const filteredIds = filteredItems.map((item) => item.id);
    const allSelected = filteredIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter((id) => !filteredIds.includes(id)) : Array.from(new Set([...selectedIds, ...filteredIds])));
  };

  const handleApplySuggestion = (candidate: SuggestionCandidate) => {
    setQuickAddDraft((prev) => ({
      ...prev,
      description: candidate.description,
      category: candidate.category ?? prev.category,
      unit: candidate.unit ?? prev.unit,
      unitPrice: candidate.unitPrice ?? prev.unitPrice,
      priceSource: candidate.priceSource ?? prev.priceSource,
      sku: candidate.sku ?? prev.sku,
    }));
    setNewItemDesc(candidate.description);
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

  const handleSaveAsTemplate = () => {
    if (!activeList) return;
    const draftTemplate = createTemplateFromShoppingList(activeList, mode);
    setTemplateDraft(draftTemplate);
    setIsTemplateModalOpen(true);
  };

  const handleExportCsv = () => {
    if (!activeList) return;
    const header = ['Description', 'Category', 'Unit', 'Quantity', 'Unit Price', 'Source', 'SKU', 'Excluded'];
    const rows = activeList.items.map((item) => [
      item.description,
      item.category,
      item.unit,
      item.quantity,
      item.unitPrice,
      item.priceSource,
      item.sku ?? '',
      item.excludeFromTotals ? 'Yes' : 'No',
    ]);
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeList.name || 'list'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ id: uuidv4(), message: 'CSV exported.', tone: 'success' });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenSuggestionModal = () => {
    if (!activeList || !selectedIds.length) {
      setToast({ id: uuidv4(), message: 'Select an item to get suggestions.', tone: 'warning' });
      return;
    }
    const target = activeList.items.find((item) => item.id === selectedIds[0]);
    if (!target) return;
    const candidates = suggestionPool
      .filter((suggestion) => suggestion.category === target.category && suggestion.description !== target.description)
      .slice(0, 6);
    setAlternativeModal({ item: target, candidates });
  };

  const handleApplyAlternative = (candidate: SuggestionCandidate) => {
    if (!activeList || !alternativeModal) return;
    const updated: BudgetItem = {
      ...alternativeModal.item,
      description: candidate.description,
      category: candidate.category ?? alternativeModal.item.category,
      unit: candidate.unit ?? alternativeModal.item.unit,
      unitPrice: candidate.unitPrice ?? alternativeModal.item.unitPrice,
      priceSource: candidate.priceSource ?? alternativeModal.item.priceSource,
      sku: candidate.sku ?? alternativeModal.item.sku,
    };
    updateItemInList(activeList.id, updated);
    setAlternativeModal(null);
    setToast({ id: uuidv4(), message: 'Alternative applied.', tone: 'success' });
  };

  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragEnter = (targetId: string) => {
    if (!activeList || !draggingId || draggingId === targetId) return;
    const sourceIndex = activeList.items.findIndex((item) => item.id === draggingId);
    const destinationIndex = activeList.items.findIndex((item) => item.id === targetId);
    if (sourceIndex >= 0 && destinationIndex >= 0 && sourceIndex !== destinationIndex) {
      reorderItemsInList(activeList.id, sourceIndex, destinationIndex);
    }
  };
  const handleDragEnd = () => setDraggingId(null);

  const handleQuickInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredQuickSuggestions.length) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlightedSuggestion((prev) => (prev + 1) % filteredQuickSuggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlightedSuggestion((prev) => (prev - 1 + filteredQuickSuggestions.length) % filteredQuickSuggestions.length);
        return;
      }
      if (event.key === 'Tab' && highlightedSuggestion >= 0) {
        event.preventDefault();
        handleApplySuggestion(filteredQuickSuggestions[highlightedSuggestion]);
        return;
      }
    }
    if (event.key === 'Enter') {
      if (highlightedSuggestion >= 0 && filteredQuickSuggestions[highlightedSuggestion]) {
        event.preventDefault();
        handleApplySuggestion(filteredQuickSuggestions[highlightedSuggestion]);
        handleAddQuickItem();
        return;
      }
      handleAddQuickItem();
    }
  };

  const includeSelectAll = filteredItems.length > 0;
  const allFilteredSelected = includeSelectAll && filteredItems.every((item) => selectedIds.includes(item.id));

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
                    className={`px-4 py-2 rounded-lg font-semibold text-white ${mode === Mode.PricePulse ? 'bg-pricepulse' : 'bg-budgetpulse'} hover:opacity-90`}
                  >
                    Save name
                  </button>
                </div>
              </div>
            ) : (
              <div className="group">
                <div className="flex items-start gap-3">
                  <h2 className="text-2xl font-semibold text-slate-900">{activeList?.name || 'Untitled List'}</h2>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
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
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Template actions</span>
            <button
              type="button"
              onClick={handleSaveAsTemplate}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              disabled={!activeList || activeList.items.length === 0}
            >
              Save as Template
            </button>
            <p className="text-xs text-slate-500">Capture this list as a reusable starting point.</p>
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
                  className={`px-4 py-2 rounded-lg font-semibold text-white ${mode === Mode.PricePulse ? 'bg-pricepulse' : 'bg-budgetpulse'} hover:opacity-90`}
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
                onClick={() => setIsEditingDescription(true)}
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative">
          <input
            id="quick-add"
            type="text"
            value={newItemDesc}
            onChange={(event) => {
              setNewItemDesc(event.target.value);
              setQuickAddDraft((prev) => ({ ...prev, description: event.target.value }));
            }}
            onKeyDown={handleQuickInputKeyDown}
            placeholder="Type an item name and press Enter"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg hover:bg-slate-100"
            >
              Quick Add (⌘K)
            </button>
            <button
              type="button"
              onClick={handleAddQuickItem}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white ${mode === Mode.PricePulse ? 'bg-pricepulse' : 'bg-budgetpulse'} hover:opacity-90`}
            >
              <PlusIcon className="w-4 h-4" />
              Add item
            </button>
          </div>
        </div>
        <SuggestionDropdown
          suggestions={filteredQuickSuggestions}
          highlightedIndex={highlightedSuggestion}
          onSelect={(suggestion) => {
            handleApplySuggestion(suggestion);
            setTimeout(() => handleAddQuickItem(), 0);
          }}
        />
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Use ↑/↓ to navigate suggestions • Enter to add • ⌘+Enter to capture quickly</span>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
              placeholder="Filter list items..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-2 text-xs font-semibold border rounded-lg"
            >
              {allFilteredSelected ? 'Clear selection' : 'Select filtered'}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenSuggestionModal}
              className="px-3 py-2 text-xs font-semibold border rounded-lg hover:bg-slate-50"
            >
              Suggest alternatives
            </button>
            <button type="button" onClick={handleExportCsv} className="px-3 py-2 text-xs font-semibold border rounded-lg">
              Export CSV
            </button>
            <button type="button" onClick={handlePrint} className="px-3 py-2 text-xs font-semibold border rounded-lg">
              Print view
            </button>
            <button
              type="button"
              onClick={handleResetItemFilters}
              disabled={!hasItemFilters}
              className={`px-3 py-2 text-xs font-semibold rounded-lg ${
                hasItemFilters ? 'border border-indigo-200 text-indigo-700 hover:bg-indigo-50' : 'border border-slate-200 text-slate-400'
              }`}
            >
              Reset filters
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Category filter
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All categories</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Priority filter
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as ItemPriority | 'all')}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All priorities</option>
              {priorityOptions.map((priority) => (
                <option key={`filter-${priority}`} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Group items
            <select
              value={groupBy}
              onChange={(event) => setGroupBy(event.target.value as 'none' | 'category' | 'priority')}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="none">No grouping</option>
              <option value="category">Category</option>
              <option value="priority">Priority</option>
            </select>
          </label>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visibility</span>
            <div className="flex flex-wrap gap-2">
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
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
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
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filtered draft total</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(filteredDraftTotal)}</p>
            <p className="text-xs text-slate-500">Matches current filters, excludes items flagged from totals.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filtered quote total</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(filteredQuoteTotal)}</p>
            <p className="text-xs text-slate-500">Excludes checked/crossed items and excluded lines.</p>
          </div>
        </div>
      </div>
        {selectedIds.length > 0 && (
          <div className="flex flex-col gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <p>
                <span className="font-semibold">{selectedIds.length}</span> selected
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={handleStartBulkEdit} className="px-3 py-1 text-xs font-semibold border rounded-lg">
                  Bulk edit
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-3 py-1 text-xs font-semibold border border-rose-200 text-rose-600 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
            <BulkEditorPanel
              isOpen={bulkEditorOpen}
              draft={bulkDraft}
              onChange={setBulkDraft}
              onApply={handleBulkApply}
              onClose={() => setBulkEditorOpen(false)}
              disabled={!bulkDraft.priority && !bulkDraft.status && !bulkDraft.priceSource && typeof bulkDraft.excludeFromTotals !== 'boolean'}
            />
          </div>
        )}

        <div className="rounded-lg border border-slate-200 overflow-hidden">
          {filteredItems.length > 0 ? (
            groupBy === 'none' ? (
              filteredItems.map((item, index) => (
                <BudgetItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  isEditing={editingItemId === item.id}
                  isSelected={selectedIds.includes(item.id)}
                  isFocused={focusedItemId === item.id}
                  categories={categoryTaxonomy.length ? categoryTaxonomy : DEFAULT_ITEM_CATEGORIES}
                  units={DEFAULT_ITEM_UNITS}
                  onStartEdit={(id) => {
                    setEditingItemId(id);
                    setFocusedItemId(id);
                  }}
                  onCancelEdit={() => setEditingItemId(null)}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onToggleSelect={(id, selected) =>
                    setSelectedIds((prev) =>
                      selected ? [...prev, id] : prev.filter((existing) => existing !== id),
                    )
                  }
                  onToggleComplete={handleToggleComplete}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                />
              ))
            ) : (
              groupedItems.map(([label, items]) => (
                <div key={`${groupBy}-${label}`} className="border-t border-slate-200 first:border-t-0">
                  <div className="flex items-center justify-between bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>
                      {groupBy === 'category' ? label : `Priority: ${label}`}
                    </span>
                    <span>{items.length} item{items.length === 1 ? '' : 's'}</span>
                  </div>
                  {items.map((item) => (
                    <BudgetItemRow
                      key={item.id}
                      item={item}
                      index={filteredIndexMap.get(item.id) ?? 0}
                      isEditing={editingItemId === item.id}
                      isSelected={selectedIds.includes(item.id)}
                      isFocused={focusedItemId === item.id}
                      categories={categoryTaxonomy.length ? categoryTaxonomy : DEFAULT_ITEM_CATEGORIES}
                      units={DEFAULT_ITEM_UNITS}
                      onStartEdit={(id) => {
                        setEditingItemId(id);
                        setFocusedItemId(id);
                      }}
                      onCancelEdit={() => setEditingItemId(null)}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onToggleSelect={(id, selected) =>
                        setSelectedIds((prev) =>
                          selected ? [...prev, id] : prev.filter((existing) => existing !== id),
                        )
                      }
                      onToggleComplete={handleToggleComplete}
                      onDragStart={handleDragStart}
                      onDragEnter={handleDragEnter}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              ))
            )
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

      <footer className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg bg-slate-50">
            <p className="text-sm font-medium text-slate-500">List draft total</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(draftTotal)}</p>
            <p className="text-xs text-slate-500 mt-1">Represents every item in the list minus excluded lines.</p>
          </div>
          <div className="p-4 border rounded-lg bg-slate-50">
            <p className="text-sm font-medium text-slate-500">List quote total</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(quoteTotal)}</p>
            <p className="text-xs text-slate-500 mt-1">Skips checked/crossed-off lines and anything excluded from totals.</p>
          </div>
        </div>
      </footer>

      <QuickAddModal
        isOpen={isQuickAddOpen}
        draft={quickAddDraft}
        categories={categoryTaxonomy.length ? categoryTaxonomy : DEFAULT_ITEM_CATEGORIES}
        units={DEFAULT_ITEM_UNITS}
        suggestions={suggestionPool}
        onChange={setQuickAddDraft}
        onClose={() => setIsQuickAddOpen(false)}
        onSubmit={() => {
          handleAddQuickItem();
          setIsQuickAddOpen(false);
        }}
        onPrefill={handleApplySuggestion}
      />
      <SuggestAlternativesModal
        state={alternativeModal}
        onClose={() => setAlternativeModal(null)}
        onApply={handleApplyAlternative}
      />
      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <TemplateEditorModal
        isOpen={isTemplateModalOpen}
        mode={mode}
        initialTemplate={templateDraft}
        onDismiss={() => {
          setIsTemplateModalOpen(false);
          setTemplateDraft(undefined);
        }}
        onSaveDraft={(template) => {
          upsertTemplate(template);
          setIsTemplateModalOpen(false);
        }}
        onPublish={(template) => {
          upsertTemplate(template);
          setIsTemplateModalOpen(false);
        }}
      />
    </div>
  );
};

export default ListBuilderScreen;
