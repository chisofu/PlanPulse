import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Mode,
  BudgetItem,
  ShoppingList,
  PriceSource,
  ItemPriority,
  ItemStatus,
} from '../types';
import {
  usePlanPulseStore,
  selectLists,
  selectActiveListId,
} from '../store/planPulseStore';
import { MOCK_ITEM_SUGGESTIONS, formatCurrency } from '../constants';
import { PlusIcon, TrashIcon, PencilIcon, DocumentDuplicateIcon } from '../components/Icons';
import { v4 as uuidv4 } from 'uuid';

interface ListBuilderScreenProps {
  mode: Mode;
}

type ItemSuggestion = Omit<BudgetItem, 'id' | 'flags' | 'quantity'> & {
  priority?: ItemPriority;
  status?: ItemStatus;
  completed?: boolean;
};

const priorityOptions: ItemPriority[] = ['High', 'Medium', 'Low'];
const statusOptions: ItemStatus[] = ['Planned', 'In Progress', 'Ordered', 'Received'];

const priorityBadgeClasses: Record<ItemPriority, string> = {
  High: 'bg-red-100 text-red-700 border border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  Low: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

const statusIndicatorClasses: Record<ItemStatus, string> = {
  Planned: 'bg-slate-200 text-slate-600',
  'In Progress': 'bg-indigo-100 text-indigo-600',
  Ordered: 'bg-sky-100 text-sky-600',
  Received: 'bg-emerald-100 text-emerald-600',
};

const QuickAddItemModal: React.FC<{
  item: Partial<ItemSuggestion> & { description: string };
  onClose: () => void;
  onAdd: (item: BudgetItem) => void;
}> = ({ item, onClose, onAdd }) => {
  const [details, setDetails] = useState({
    quantity: 1,
    unit: item.unit || 'Each',
    category: item.category || 'Uncategorized',
    unitPrice: item.unitPrice || 0,
    priority: item.priority ?? 'Medium',
    status: item.status ?? 'Planned',
  });
  const [errors, setErrors] = useState<{ quantity?: string; unitPrice?: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'quantity' || name === 'unitPrice') {
      setDetails((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
      return;
    }
    setDetails((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onAdd({
        id: uuidv4(),
        description: item.description,
        priceSource: item.priceSource || PriceSource.ZPPA,
        flags: [],
        quantity: details.quantity,
        unit: details.unit,
        category: details.category,
        unitPrice: details.unitPrice,
        priority: details.priority,
        status: details.status,
        completed: false,
      });
      onClose();
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
                value={details.unit}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
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
              value={details.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-slate-700">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={details.priority}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={details.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-budgetpulse text-white font-semibold rounded-lg hover:bg-opacity-90"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfirmDialog: React.FC<{
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 mb-6">{description}</p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-medium hover:bg-slate-300"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

const Toast: React.FC<{
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ message, actionLabel, onAction }) => (
  <div className="fixed bottom-4 right-4 z-50">
    <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
      <span>{message}</span>
      {actionLabel && onAction && (
        <button onClick={onAction} className="underline font-semibold">
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);

interface BudgetItemRowProps {
  item: BudgetItem;
  selected: boolean;
  onSelectChange: (checked: boolean) => void;
  onUpdate: (item: BudgetItem) => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  editing: boolean;
  onFocus: () => void;
  isFocused: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

const BudgetItemRow: React.FC<BudgetItemRowProps> = ({
  item,
  selected,
  onSelectChange,
  onUpdate,
  onDelete,
  onToggleComplete,
  onStartEdit,
  onCancelEdit,
  editing,
  onFocus,
  isFocused,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}) => {
  const [draft, setDraft] = useState<BudgetItem>(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  useEffect(() => {
    if (!editing) {
      setDraft(item);
    }
  }, [editing, item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'quantity' || name === 'unitPrice') {
      setDraft((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
      return;
    }
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdate(draft);
    onCancelEdit();
  };

  if (editing) {
    return (
      <div className="p-4 bg-white border-b-2 border-indigo-200 space-y-3 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Description</label>
            <input
              type="text"
              name="description"
              value={draft.description}
              onChange={handleChange}
              className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Item Description"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Category</label>
            <input
              type="text"
              name="category"
              value={draft.category}
              onChange={handleChange}
              className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Category"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={draft.quantity}
              onChange={handleChange}
              className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Unit</label>
            <input
              type="text"
              name="unit"
              value={draft.unit}
              onChange={handleChange}
              className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Unit Price</label>
            <input
              type="number"
              step="0.01"
              name="unitPrice"
              value={draft.unitPrice}
              onChange={handleChange}
              className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Source</label>
            <select
              name="priceSource"
              value={draft.priceSource}
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
            onClick={onCancelEdit}
            className="px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold bg-budgetpulse text-white rounded-lg hover:bg-opacity-90"
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  const completed = item.completed || item.flags.includes('Crossed');

  return (
    <div
      tabIndex={0}
      onFocus={onFocus}
      className={`flex items-center gap-3 p-3 transition-colors border-b border-slate-200 ${
        completed ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'
      } ${isFocused ? 'ring-2 ring-offset-2 ring-indigo-400' : ''} ${selected ? 'bg-indigo-50' : ''} ${
        isDragOver ? 'border-2 border-dashed border-indigo-400' : ''
      } ${isDragging ? 'opacity-60' : ''}`}
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(item.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(item.id);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => onSelectChange(event.target.checked)}
          className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <input
          type="checkbox"
          checked={completed}
          onChange={onToggleComplete}
          className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          title="Mark completed"
        />
      </div>
      <div className="flex-1">
        <p className={`font-medium ${completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {item.description}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
          <span>
            Qty {item.quantity} {item.unit}
          </span>
          <span>•</span>
          <span>{item.category}</span>
          <span>•</span>
          <span className="font-mono">{item.priceSource}</span>
        </div>
      </div>
      <div className="flex flex-col items-end w-40">
        <span className={`text-sm font-semibold ${completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
          {formatCurrency(item.quantity * item.unitPrice)}
        </span>
        <span className="text-xs text-slate-400">{formatCurrency(item.unitPrice)} each</span>
      </div>
      <div className="flex flex-col items-end gap-1 w-40">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${priorityBadgeClasses[item.priority]}`}
        >
          {item.priority} Priority
        </span>
        <span
          className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold ${statusIndicatorClasses[item.status]}`}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {item.status}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onStartEdit}
          className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
          aria-label="Edit item"
        >
          <PencilIcon />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
          aria-label="Delete item"
        >
          <TrashIcon />
        </button>
        <span className="text-slate-300">
          <DocumentDuplicateIcon className="w-4 h-4" />
        </span>
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
  const deleteItemsFromList = usePlanPulseStore((state) => state.deleteItemsFromList);
  const bulkUpdateItemsInList = usePlanPulseStore((state) => state.bulkUpdateItemsInList);
  const reorderItemsInList = usePlanPulseStore((state) => state.reorderItemsInList);
  const restoreItemsInList = usePlanPulseStore((state) => state.restoreItemsInList);
  const upsertList = usePlanPulseStore((state) => state.upsertList);
  const createList = usePlanPulseStore((state) => state.createList);

  const [newItemDesc, setNewItemDesc] = useState('');
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemForModal, setItemForModal] = useState<ItemSuggestion | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkEdits, setBulkEdits] = useState<{
    priority: '' | ItemPriority;
    category: string;
    priceSource: '' | PriceSource;
    status: '' | ItemStatus;
  }>({ priority: '', category: '', priceSource: '', status: '' });
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    | null
    | {
        listId: string;
        itemIds: string[];
        payload: { item: BudgetItem; index: number }[];
        message: string;
      }
  >(null);
  const [toast, setToast] = useState<null | { message: string; actionLabel?: string; onAction?: () => void }>(null);

  const newItemInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (newItemDesc.length > 1) {
      const filtered = MOCK_ITEM_SUGGESTIONS.filter((item) =>
        item.description.toLowerCase().includes(newItemDesc.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [newItemDesc]);

  const categories = useMemo(() => {
    return Array.from(new Set(activeList?.items.map((item) => item.category) ?? [])).sort();
  }, [activeList?.items]);

  const filteredItems = useMemo(() => {
    if (!activeList) return [] as BudgetItem[];
    if (categoryFilter === 'All') {
      return activeList.items;
    }
    return activeList.items.filter((item) => item.category === categoryFilter);
  }, [activeList, categoryFilter]);

  useEffect(() => {
    if (filteredItems.length === 0) {
      setFocusedItemId(null);
      return;
    }
    if (!focusedItemId || !filteredItems.find((item) => item.id === focusedItemId)) {
      setFocusedItemId(filteredItems[0].id);
    }
  }, [filteredItems, focusedItemId]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      const isFormElement = tag === 'input' || tag === 'textarea' || tag === 'select';
      if (event.key.toLowerCase() === 'n' && !isFormElement) {
        event.preventDefault();
        newItemInputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        if (editingItemId) {
          setEditingItemId(null);
          event.preventDefault();
          return;
        }
        if (selectedIds.length) {
          setSelectedIds([]);
          event.preventDefault();
        }
      }
      if (event.key === 'Enter' && !isFormElement && focusedItemId) {
        event.preventDefault();
        setEditingItemId(focusedItemId);
      }
      if (!filteredItems.length || isFormElement) {
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const index = filteredItems.findIndex((item) => item.id === focusedItemId);
        const next = filteredItems[Math.min(filteredItems.length - 1, index + 1)];
        if (next) setFocusedItemId(next.id);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        const index = filteredItems.findIndex((item) => item.id === focusedItemId);
        const prev = filteredItems[Math.max(0, index - 1)];
        if (prev) setFocusedItemId(prev.id);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filteredItems, focusedItemId, selectedIds.length, editingItemId]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleOpenModal = (item: Partial<ItemSuggestion> & { description: string }) => {
    if (!item.description.trim() || !activeList) return;
    setItemForModal({
      description: item.description,
      category: item.category || 'Uncategorized',
      unit: item.unit || 'Each',
      unitPrice: item.unitPrice || 0,
      priceSource: item.priceSource || PriceSource.ZPPA,
      priority: item.priority ?? 'Medium',
      status: item.status ?? 'Planned',
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
    setToast({ message: `Added “${itemToAdd.description}” to the list.` });
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

  const handleRequestDelete = (ids: string[]) => {
    if (!activeList) return;
    const payload = ids
      .map((id) => {
        const index = activeList.items.findIndex((item) => item.id === id);
        if (index === -1) return null;
        return { item: activeList.items[index], index };
      })
      .filter((entry): entry is { item: BudgetItem; index: number } => Boolean(entry));
    if (!payload.length) return;
    setPendingDelete({
      listId: activeList.id,
      itemIds: ids,
      payload,
      message: payload.length === 1 ? `Delete “${payload[0].item.description}”?` : `Delete ${payload.length} items?`,
    });
  };

  const confirmDeletion = () => {
    if (!pendingDelete) return;
    deleteItemsFromList(pendingDelete.listId, pendingDelete.itemIds);
    setSelectedIds((prev) => prev.filter((id) => !pendingDelete.itemIds.includes(id)));
    const description =
      pendingDelete.payload.length === 1
        ? `Deleted “${pendingDelete.payload[0].item.description}”.`
        : `Deleted ${pendingDelete.payload.length} items.`;
    setToast({
      message: description,
      actionLabel: 'Undo',
      onAction: () => {
        restoreItemsInList(pendingDelete.listId, pendingDelete.payload);
        setToast({ message: 'Restored items.' });
      },
    });
    setPendingDelete(null);
  };

  const handleDeleteItem = (itemId: string) => {
    handleRequestDelete([itemId]);
  };

  const handleBulkDelete = () => {
    handleRequestDelete(selectedIds);
  };

  const handleSaveListMeta = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeList) return;
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('listName') || activeList.name);
    const updatedList: ShoppingList = { ...activeList, name };
    upsertList(updatedList);
    setToast({ message: 'List name saved.' });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredItems.map((item) => item.id) : []);
  };

  const handleSelectChange = (itemId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, itemId]));
      }
      return prev.filter((id) => id !== itemId);
    });
  };

  const allVisibleSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id));

  const handleBulkFieldChange = (name: 'priority' | 'category' | 'priceSource' | 'status', value: string) => {
    setBulkEdits((prev) => ({ ...prev, [name]: value as any }));
  };

  const handleApplyBulkEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeList || !selectedIds.length) return;
    const updates: Partial<BudgetItem> = {};
    if (bulkEdits.priority) updates.priority = bulkEdits.priority;
    if (bulkEdits.category.trim()) updates.category = bulkEdits.category.trim();
    if (bulkEdits.priceSource) updates.priceSource = bulkEdits.priceSource;
    if (bulkEdits.status) updates.status = bulkEdits.status;
    if (Object.keys(updates).length === 0) {
      setIsBulkEditing(false);
      return;
    }
    bulkUpdateItemsInList(activeList.id, selectedIds, updates);
    setIsBulkEditing(false);
    setBulkEdits({ priority: '', category: '', priceSource: '', status: '' });
    setToast({ message: `Updated ${selectedIds.length} items.` });
  };

  const total = useMemo(() => {
    if (!activeList) return 0;
    return activeList.items
      .filter((item) => !(item.completed || item.flags.includes('Crossed')))
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [activeList]);

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

  const handleDragOver = useCallback((id: string) => {
    if (draggingId === id) return;
    setDragOverId(id);
  }, [draggingId]);

  const handleDrop = useCallback(
    (id: string | null) => {
      if (!activeList || !draggingId) return;
      const items = activeList.items;
      const sourceIndex = items.findIndex((item) => item.id === draggingId);
      if (sourceIndex === -1) return;
      const destinationIndex =
        id === null ? items.length - 1 : items.findIndex((item) => item.id === id);
      if (destinationIndex === -1 && id !== null) return;
      let insertIndex = id === null ? items.length : destinationIndex;
      if (insertIndex > sourceIndex) {
        insertIndex -= 1;
      }
      if (insertIndex === sourceIndex) return;
      reorderItemsInList(activeList.id, sourceIndex, insertIndex);
      setDragOverId(null);
      setDraggingId(null);
    },
    [activeList, draggingId, reorderItemsInList],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverId(null);
  }, []);

  const handleExportCsv = () => {
    if (!activeList) return;
    const headers = [
      'Description',
      'Category',
      'Quantity',
      'Unit',
      'Unit Price',
      'Total',
      'Priority',
      'Status',
      'Completed',
      'Price Source',
    ];
    const rows = activeList.items.map((item) => [
      item.description,
      item.category,
      item.quantity,
      item.unit,
      item.unitPrice,
      (item.quantity * item.unitPrice).toFixed(2),
      item.priority,
      item.status,
      item.completed ? 'Yes' : 'No',
      item.priceSource,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeList.name.replace(/\s+/g, '_').toLowerCase()}_items.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ message: 'Exported CSV.' });
  };

  const handlePrint = () => {
    window.print();
  };

  const bulkActionsVisible = selectedIds.length > 0;

  return (
    <div className="flex flex-col">
      {isModalOpen && itemForModal && (
        <QuickAddItemModal
          item={itemForModal}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleConfirmAddItem}
        />
      )}
      {pendingDelete && (
        <ConfirmDialog
          title="Delete items"
          description={pendingDelete.message}
          confirmLabel="Delete"
          onConfirm={confirmDeletion}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      {toast && <Toast {...toast} />}
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
          <button
            type="submit"
            className="px-4 py-2 bg-budgetpulse text-white font-semibold rounded-lg hover:bg-opacity-90"
          >
            Save
          </button>
        </form>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="relative">
          <input
            ref={newItemInputRef}
            type="text"
            value={newItemDesc}
            onChange={(e) => setNewItemDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleOpenModal({ description: newItemDesc })}
            placeholder="Add an item... (press N to focus, Enter to quick add)"
            className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-pricepulse"
          />
          <button
            onClick={() => handleOpenModal({ description: newItemDesc })}
            className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full text-white ${
              mode === Mode.PricePulse ? 'bg-pricepulse' : 'bg-budgetpulse'
            } hover:opacity-90`}
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

      <div className="bg-white border rounded-lg p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(event) => toggleSelectAll(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Select all</span>
          </label>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <span>Category</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-md border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="All">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkEditing((prev) => !prev)}
            disabled={!bulkActionsVisible}
            className={`px-3 py-2 rounded-lg border text-sm font-semibold ${
              bulkActionsVisible
                ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                : 'border-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Bulk edit
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={!bulkActionsVisible}
            className={`px-3 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2 ${
              bulkActionsVisible
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {isBulkEditing && bulkActionsVisible && (
        <div className="bg-white border border-indigo-200 rounded-lg p-4 mb-4">
          <form onSubmit={handleApplyBulkEdits} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Priority</label>
              <select
                value={bulkEdits.priority}
                onChange={(event) => handleBulkFieldChange('priority', event.target.value)}
                className="mt-1 w-full rounded-md border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">No change</option>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Category</label>
              <input
                type="text"
                value={bulkEdits.category}
                onChange={(event) => handleBulkFieldChange('category', event.target.value)}
                placeholder="No change"
                className="mt-1 w-full rounded-md border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Price source</label>
              <select
                value={bulkEdits.priceSource}
                onChange={(event) => handleBulkFieldChange('priceSource', event.target.value)}
                className="mt-1 w-full rounded-md border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">No change</option>
                {Object.values(PriceSource).map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Status</label>
              <select
                value={bulkEdits.status}
                onChange={(event) => handleBulkFieldChange('status', event.target.value)}
                className="mt-1 w-full rounded-md border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">No change</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsBulkEditing(false);
                  setBulkEdits({ priority: '', category: '', priceSource: '', status: '' });
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
              >
                Apply to {selectedIds.length} items
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border rounded-lg divide-y divide-slate-200">
        {activeList && filteredItems.length > 0 ? (
          filteredItems.map((item, index) => {
            const previousCategory = filteredItems[index - 1]?.category;
            const showCategoryHeader = index === 0 || previousCategory !== item.category;
            return (
              <React.Fragment key={item.id}>
                {categoryFilter === 'All' && showCategoryHeader && (
                  <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {item.category}
                  </div>
                )}
                <BudgetItemRow
                  item={item}
                  selected={selectedIds.includes(item.id)}
                  onSelectChange={(checked) => handleSelectChange(item.id, checked)}
                  onUpdate={handleUpdateItem}
                  onDelete={() => handleDeleteItem(item.id)}
                  onToggleComplete={() => handleToggleComplete(item)}
                  onStartEdit={() => setEditingItemId(item.id)}
                  onCancelEdit={() => setEditingItemId(null)}
                  editing={editingItemId === item.id}
                  onFocus={() => setFocusedItemId(item.id)}
                  isFocused={focusedItemId === item.id}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDragging={draggingId === item.id}
                  isDragOver={dragOverId === item.id}
                />
              </React.Fragment>
            );
          })
        ) : (
          <p className="text-center text-slate-500 py-12">Your list is empty. Add an item to get started!</p>
        )}
        {filteredItems.length > 0 && (
          <div
            className="h-4"
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverId(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleDrop(null);
            }}
          />
        )}
      </div>

      <footer className="mt-6 bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-slate-500">Estimated Total</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(total)}</p>
          </div>
          <div className="mt-4 md:mt-0 space-x-3">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300"
            >
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className={`px-6 py-2 rounded-lg font-semibold text-white ${
                mode === Mode.PricePulse ? 'bg-pricepulse' : 'bg-budgetpulse'
              }`}
            >
              Print
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ListBuilderScreen;
