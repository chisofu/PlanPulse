import React, { useEffect, useMemo, useState } from 'react';
import { Mode, BudgetItem, ShoppingList, PriceSource } from '../types';
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
    unitPrice: item.unitPrice || 0,
  });
  const [errors, setErrors] = useState<{ quantity?: string; unitPrice?: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: name === 'quantity' || name === 'unitPrice' ? parseFloat(value) || 0 : value }));
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
        ...details,
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
      unit: item.unit || 'Each',
      unitPrice: item.unitPrice || 0,
      priceSource: item.priceSource || PriceSource.ZPPA,
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
