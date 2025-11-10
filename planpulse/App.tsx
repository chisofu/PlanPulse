
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Mode, Template, ShoppingList, BudgetItem, Quote, PurchaseOrder, PriceSource, POStatus, QuoteStatus, ChatMessage } from './types';
import { MOCK_TEMPLATES, MOCK_LISTS, MOCK_QUOTES, MOCK_POS, formatCurrency, MOCK_MERCHANTS, MOCK_ITEM_SUGGESTIONS } from './constants';
import { ArrowLeftIcon, ChevronRightIcon, DocumentDuplicateIcon, PlusIcon, TrashIcon, CheckCircleIcon, PaperAirplaneIcon, PencilIcon } from './components/Icons';
import { v4 as uuidv4 } from 'uuid';

// Define Screens as strings for navigation
type Screen = 'dashboard' | 'templates' | 'list' | 'quotes' | 'pos' | 'po-creation';

// #region Helper Components (defined in one file for simplicity)

interface HeaderProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  activeScreen: Screen;
  onBack: () => void;
  screenTitle?: string;
}

const Header: React.FC<HeaderProps> = ({ mode, setMode, activeScreen, onBack, screenTitle }) => {
  const isPricePulse = mode === Mode.PricePulse;
  const accentColor = isPricePulse ? 'pricepulse' : 'budgetpulse';
  const accentColorText = isPricePulse ? 'text-pricepulse' : 'text-budgetpulse';
  const accentColorBg = isPricePulse ? 'bg-pricepulse' : 'bg-budgetpulse';
  const toggleBg = isPricePulse ? 'bg-pricepulse-light' : 'bg-budgetpulse-light';
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {activeScreen !== 'dashboard' && (
             <button onClick={onBack} className="text-slate-500 hover:text-slate-800">
                <ArrowLeftIcon />
             </button>
          )}
          <div>
            <h1 className={`text-xl font-bold ${accentColorText}`}>PlanPulse</h1>
             {screenTitle && <p className="text-sm text-slate-500 truncate">{screenTitle}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className={`flex items-center p-1 rounded-full ${toggleBg}`}>
            <button
              onClick={() => setMode(Mode.PricePulse)}
              className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${isPricePulse ? `${accentColorBg} text-white` : 'text-slate-600'}`}
            >
              Personal
            </button>
            <button
              onClick={() => setMode(Mode.BudgetPulse)}
              className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${!isPricePulse ? `${accentColorBg} text-white` : 'text-slate-600'}`}
            >
              Enterprise
            </button>
          </div>
          <img src="https://picsum.photos/seed/user/40" alt="User" className="w-10 h-10 rounded-full" />
        </div>
      </div>
    </header>
  );
};

const TemplateCard: React.FC<{ template: Template; onSelect: (template: Template) => void, mode: Mode }> = ({ template, onSelect, mode }) => {
    const accentColorBorder = mode === Mode.PricePulse ? 'hover:border-pricepulse' : 'hover:border-budgetpulse';
    return (
        <div
          onClick={() => onSelect(template)}
          className={`bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border-2 border-transparent ${accentColorBorder}`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-lg font-semibold text-slate-800">{template.name}</p>
                    <p className="text-sm text-slate-500">{template.description}</p>
                </div>
                <span className="text-3xl ml-4">{template.emoji}</span>
            </div>
            <div className="mt-4 text-xs font-semibold text-slate-400 uppercase">{template.category}</div>
        </div>
    );
};

const BudgetItemRow: React.FC<{ item: BudgetItem, onUpdate: (item: BudgetItem) => void, onDelete: (id: string) => void }> = ({ item, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedItem, setEditedItem] = useState<BudgetItem>(item);
    const isCrossed = item.flags.includes('Crossed');

    const handleToggleCrossed = () => {
        const newFlags = isCrossed ? item.flags.filter(f => f !== 'Crossed') : [...item.flags, 'Crossed'];
        onUpdate({ ...item, flags: newFlags });
    };

    const handleEdit = () => {
        setEditedItem(item); // Reset to current item props when editing starts
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = () => {
        onUpdate(editedItem);
        setIsEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = name === 'quantity' || name === 'unitPrice';
        setEditedItem(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
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
                        <input type="number" name="quantity" value={editedItem.quantity} onChange={handleChange} className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Qty" />
                    </div>
                     <div>
                        <label className="text-xs font-medium text-slate-500">Unit</label>
                        <input type="text" name="unit" value={editedItem.unit} onChange={handleChange} className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., kg, box" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Unit Price</label>
                        <input type="number" step="0.01" name="unitPrice" value={editedItem.unitPrice} onChange={handleChange} className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Price" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Source</label>
                        <select name="priceSource" value={editedItem.priceSource} onChange={handleChange} className="w-full mt-1 p-2 text-sm border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            {Object.values(PriceSource).map(ps => <option key={ps} value={ps}>{ps}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end items-center space-x-2 pt-2">
                    <button onClick={handleCancel} className="px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-budgetpulse text-white rounded-lg hover:bg-opacity-90">Save Changes</button>
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
                    Qty: {item.quantity} {item.unit} &bull; <span className="font-mono text-xs">{item.priceSource}</span>
                </p>
            </div>
            <div className="w-28 text-right px-2">
                 <p className={`text-sm ${isCrossed ? 'line-through text-slate-400' : 'text-slate-500'}`}>{formatCurrency(item.unitPrice)}</p>
                 <p className={`text-xs ${isCrossed ? 'text-slate-400' : 'text-slate-400'}`}>each</p>
            </div>
            <div className="w-28 text-right px-2 font-semibold">
                 <p className={`${isCrossed ? 'line-through text-slate-500' : 'text-slate-900'}`}>{formatCurrency(item.quantity * item.unitPrice)}</p>
            </div>
            <div className="flex items-center ml-4 space-x-2">
                 <button onClick={handleEdit} className="p-1 text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                    <PencilIcon />
                </button>
                <button onClick={() => onDelete(item.id)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
};
// #endregion

// #region Screen Components

const DashboardScreen: React.FC<{ setScreen: (screen: Screen) => void, mode: Mode, lists: ShoppingList[], quotesCount: number, posCount: number }> = ({ setScreen, mode, lists, quotesCount, posCount }) => {
    const isPricePulse = mode === Mode.PricePulse;
    const accentColor = isPricePulse ? 'pricepulse' : 'budgetpulse';
    const accentColorText = isPricePulse ? 'text-pricepulse' : 'text-budgetpulse';

    const DashboardCard: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; onClick: () => void; }> = ({ title, subtitle, icon, onClick }) => (
        <button onClick={onClick} className={`bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex items-center space-x-4 w-full text-left border-t-4 border-${accentColor}`}>
            <div className={`p-3 rounded-full bg-${accentColor}-light`}>
                <div className={accentColorText}>{icon}</div>
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <p className="text-slate-500">{subtitle}</p>
            </div>
            <ChevronRightIcon className="ml-auto text-slate-400" />
        </button>
    );

    return (
        <div className="p-4 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">
                Welcome to {isPricePulse ? 'PricePulse' : 'BudgetPulse'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardCard title="Start from Template" subtitle="Browse pre-made lists" icon={<DocumentDuplicateIcon />} onClick={() => setScreen('templates')} />
                <DashboardCard title="Create New List" subtitle="Start with a blank slate" icon={<PlusIcon />} onClick={() => setScreen('list')} />
                 {lists.length > 0 && <DashboardCard title="My Shopping Lists" subtitle={`${lists.length} active list(s)`} icon={<CheckCircleIcon />} onClick={() => setScreen('list')} />}
                {!isPricePulse && <DashboardCard title="Manage Quotes" subtitle={`${quotesCount} requests`} icon={<DocumentDuplicateIcon />} onClick={() => setScreen('quotes')} />}
                {!isPricePulse && <DashboardCard title="Track Purchase Orders" subtitle={`${posCount} active POs`} icon={<CheckCircleIcon />} onClick={() => setScreen('pos')} />}
            </div>
        </div>
    );
};

const TemplatesScreen: React.FC<{ onSelectTemplate: (template: Template) => void, mode: Mode }> = ({ onSelectTemplate, mode }) => {
    return (
        <div className="p-4 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Template Library</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_TEMPLATES.map(template => (
                    <TemplateCard key={template.id} template={template} onSelect={onSelectTemplate} mode={mode} />
                ))}
            </div>
        </div>
    );
};

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
        setDetails(prev => ({ ...prev, [name]: name === 'quantity' || name === 'unitPrice' ? parseFloat(value) || 0 : value }));
    };

    const validate = () => {
        const newErrors: { quantity?: string; unitPrice?: string } = {};
        if (details.quantity <= 0) {
            newErrors.quantity = "Quantity must be a positive number.";
        }
        if (details.unitPrice <= 0) {
            newErrors.unitPrice = "Unit price must be a positive number.";
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
                            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Quantity</label>
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
                            <label htmlFor="unit" className="block text-sm font-medium text-slate-700">Unit</label>
                            <input type="text" name="unit" id="unit" value={details.unit} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-700">Category</label>
                        <input type="text" name="category" id="category" value={details.category} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="unitPrice" className="block text-sm font-medium text-slate-700">Unit Price (K)</label>
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
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-budgetpulse text-white font-semibold rounded-lg hover:bg-opacity-90">Add Item</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const generatePdfHtml = (list: ShoppingList): string => {
    const activeItems = list.items.filter(item => !item.flags.includes('Crossed'));
    const total = activeItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const itemsHtml = activeItems.map(item => `
        <tr>
            <td>${item.description}</td>
            <td class="text-right">${item.quantity} ${item.unit}</td>
            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
            <td class="text-right">${formatCurrency(item.quantity * item.unitPrice)}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${list.name}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 2rem; color: #333; }
                h1 { font-size: 2rem; color: #111; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-bottom: 0.5rem;}
                p { color: #555; }
                table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f9f9f9; font-weight: 600; }
                tr:nth-child(even) { background-color: #fcfcfc; }
                .text-right { text-align: right; }
                .total-section { margin-top: 2rem; text-align: right; float: right; }
                .total-label { font-size: 1.1rem; color: #555; }
                .total-amount { font-size: 2rem; font-weight: bold; color: #111; margin-top: 0.5rem; }
            </style>
        </head>
        <body>
            <h1>${list.name}</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <table>
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th class="text-right">Quantity</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Line Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <div class="total-section">
                <p class="total-label">Estimated Total:</p>
                <p class="total-amount">${formatCurrency(total)}</p>
            </div>
        </body>
        </html>
    `;
};


const ListBuilderScreen: React.FC<{ list: ShoppingList | null, setList: (list: ShoppingList) => void, mode: Mode, setScreen: (screen: Screen) => void }> = ({ list, setList, mode, setScreen }) => {
    const isPricePulse = mode === Mode.PricePulse;
    const accentColorBg = isPricePulse ? 'bg-pricepulse' : 'bg-budgetpulse';
    
    const [newItemDesc, setNewItemDesc] = useState('');
    const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemForModal, setItemForModal] = useState<ItemSuggestion | null>(null);

    const activeList = useMemo(() => {
        if (list) return list;
        return { id: uuidv4(), name: 'New List', createdAt: new Date().toISOString(), items: [] };
    }, [list]);

    useEffect(() => {
        if (newItemDesc.length > 1) {
            const filtered = MOCK_ITEM_SUGGESTIONS.filter(item =>
                item.description.toLowerCase().includes(newItemDesc.toLowerCase())
            );
            setSuggestions(filtered.slice(0, 5));
        } else {
            setSuggestions([]);
        }
    }, [newItemDesc]);

    const handleUpdateItem = (updatedItem: BudgetItem) => {
        const newItems = activeList.items.map(item => item.id === updatedItem.id ? updatedItem : item);
        setList({ ...activeList, items: newItems });
    };

    const handleDeleteItem = (id: string) => {
        const newItems = activeList.items.filter(item => item.id !== id);
        setList({ ...activeList, items: newItems });
    };

    const handleOpenModal = (item: Partial<ItemSuggestion> & { description: string }) => {
        if (!item.description.trim()) return;
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
        setList({ ...activeList, items: [...activeList.items, itemToAdd] });
        setNewItemDesc('');
        setSuggestions([]);
        setIsModalOpen(false);
        setItemForModal(null);
    };

    const total = useMemo(() => {
        return activeList.items
            .filter(item => !item.flags.includes('Crossed'))
            .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }, [activeList.items]);
    
    const handleExportPdf = () => {
        if (!activeList) return;
        const pdfHtml = generatePdfHtml(activeList);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(pdfHtml);
            printWindow.document.close();
            printWindow.print();
        }
    };


    return (
        <div className="flex flex-col h-[calc(100vh-68px)]">
            {isModalOpen && itemForModal && (
                <QuickAddItemModal 
                    item={itemForModal}
                    onClose={() => setIsModalOpen(false)}
                    onAdd={handleConfirmAddItem}
                />
            )}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 bg-white border-b">
                     <div className="relative">
                        <input
                            type="text"
                            value={newItemDesc}
                            onChange={(e) => setNewItemDesc(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleOpenModal({ description: newItemDesc })}
                            placeholder="Add an item..."
                            className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-pricepulse"
                        />
                        <button onClick={() => handleOpenModal({ description: newItemDesc })} className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full text-white ${accentColorBg} hover:opacity-90`}>
                            <PlusIcon className="w-5 h-5" />
                        </button>
                        {suggestions.length > 0 && (
                             <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-slate-200">
                                <ul className="py-1">
                                    {suggestions.map((s, index) => (
                                        <li key={index} 
                                            onClick={() => handleOpenModal(s)}
                                            className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer">
                                            {s.description}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                <div className="divide-y divide-slate-200">
                    {activeList.items.length === 0 ? (
                        <p className="text-center text-slate-500 py-12">Your list is empty. Add an item to get started!</p>
                    ) : (
                        activeList.items.map(item => (
                           <BudgetItemRow key={item.id} item={item} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} />
                        ))
                    )}
                </div>
            </div>

            <footer className="bg-white border-t p-4 shadow-top">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <p className="text-slate-500">Estimated Total</p>
                        <p className="text-3xl font-bold text-slate-900">{formatCurrency(total)}</p>
                    </div>
                    {isPricePulse ? (
                        <button 
                            onClick={handleExportPdf}
                            className={`px-6 py-3 rounded-lg font-semibold text-white ${accentColorBg}`}>
                            Export List
                        </button>
                    ) : (
                        <button 
                            onClick={() => setScreen('quotes')}
                            className={`px-6 py-3 rounded-lg font-semibold text-white ${accentColorBg}`}>
                            Request Quote
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
};

const QuotesScreen: React.FC<{ 
    quotes: Quote[], 
    onCreatePO: (quote: Quote) => void, 
    onViewQuote: (quote: Quote) => void 
}> = ({ quotes, onCreatePO, onViewQuote }) => {
    const [filterStatus, setFilterStatus] = useState<QuoteStatus | 'all'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const filteredAndSortedQuotes = useMemo(() => {
        let result = [...quotes];

        if (filterStatus !== 'all') {
            result = result.filter(quote => quote.status === filterStatus);
        }

        result.sort((a, b) => {
            const dateA = new Date(a.submittedAt).getTime();
            const dateB = new Date(b.submittedAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [quotes, filterStatus, sortOrder]);
    
    return (
        <div className="p-4 md:p-8">
             <h2 className="text-3xl font-bold text-slate-800 mb-6">Quote Requests</h2>
             <div className="flex flex-wrap gap-4 justify-between items-center mb-4 p-4 bg-slate-100 rounded-lg">
                <div className="flex items-center space-x-2">
                    <label htmlFor="statusFilter" className="text-sm font-medium text-slate-700">Status:</label>
                    <select
                        id="statusFilter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as QuoteStatus | 'all')}
                        className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="all">All</option>
                        {Object.values(QuoteStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                 <div className="flex items-center space-x-2">
                    <label htmlFor="sortOrder" className="text-sm font-medium text-slate-700">Sort by:</label>
                    <select
                        id="sortOrder"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                        className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
             </div>
             <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <ul className="divide-y divide-slate-200">
                    {filteredAndSortedQuotes.length > 0 ? (
                        filteredAndSortedQuotes.map(quote => (
                            <li key={quote.id} className="p-4 hover:bg-slate-50 cursor-pointer" onClick={() => onViewQuote(quote)}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-budgetpulse">{quote.reference}</p>
                                        <p className="text-slate-600">{quote.listName}</p>
                                        <p className="text-sm text-slate-400">
                                            Submitted: {new Date(quote.submittedAt).toLocaleDateString()}
                                        </p>
                                        {quote.status === QuoteStatus.Finalized && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCreatePO(quote);
                                                }}
                                                className="mt-3 px-4 py-2 text-sm font-semibold text-white bg-budgetpulse rounded-lg shadow-sm hover:bg-opacity-90 transition-colors"
                                            >
                                                Create Purchase Order
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${quote.status === QuoteStatus.Finalized ? 'bg-green-500' : 'bg-indigo-500'}`}>
                                            {quote.status}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className="p-8 text-center text-slate-500">
                            No quotes found matching your criteria.
                        </li>
                    )}
                </ul>
             </div>
        </div>
    );
};


const POScreen: React.FC<{ pos: PurchaseOrder[] }> = ({ pos }) => {
    return (
        <div className="p-4 md:p-8">
             <h2 className="text-3xl font-bold text-slate-800 mb-6">Purchase Orders</h2>
             <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <ul className="divide-y divide-slate-200">
                     {pos.length > 0 ? pos.map(po => (
                         <li key={po.id} className="p-4 hover:bg-slate-50 cursor-pointer">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-budgetpulse">{po.reference}</p>
                                    <p className="text-slate-600">{po.seller.name}</p>
                                    <p className="text-sm text-slate-400">
                                        Issued: {new Date(po.issuedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-800">{formatCurrency(po.total)}</p>
                                     <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${po.status === POStatus.Fulfilled ? 'bg-green-500' : 'bg-amber-500'}`}>
                                        {po.status}
                                    </span>
                                </div>
                            </div>
                        </li>
                    )) : (
                        <li className="p-8 text-center text-slate-500">
                           No purchase orders found.
                        </li>
                    )}
                </ul>
             </div>
        </div>
    );
};

const POCreationScreen: React.FC<{ quote: Quote, onSubmit: (po: PurchaseOrder) => void }> = ({ quote, onSubmit }) => {
    const total = useMemo(() => {
        return quote.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }, [quote.items]);
    
    // In a real app, this seller would be chosen from the merchants on the quote.
    const seller = quote.merchants[0] || MOCK_MERCHANTS[0];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newPO: PurchaseOrder = {
            id: uuidv4(),
            reference: `PO-2023-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            quoteReference: quote.reference,
            buyer: 'Our Company Inc.',
            seller: seller,
            status: POStatus.Issued,
            issuedAt: new Date().toISOString(),
            total: total
        };
        onSubmit(newPO);
    };

    return (
        <div className="p-4 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Create Purchase Order</h2>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-lg text-slate-700">From Quote: {quote.reference}</h3>
                        <p className="text-slate-500">{quote.listName}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="font-semibold text-lg text-slate-700">Seller: {seller.name}</h3>
                        <p className="text-slate-500">Contact for details</p>
                    </div>
                </div>

                <div className="border-t border-b border-slate-200 py-4">
                    <h4 className="font-semibold text-md text-slate-600 mb-2">Order Summary</h4>
                    <ul className="divide-y divide-slate-100">
                        {quote.items.map(item => (
                            <li key={item.id} className="py-2 flex justify-between">
                                <span className="text-slate-700">{item.description} (x{item.quantity})</span>
                                <span className="font-medium text-slate-800">{formatCurrency(item.quantity * item.unitPrice)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="text-right">
                    <p className="text-slate-500">Total Amount</p>
                    <p className="text-3xl font-bold text-slate-900">{formatCurrency(total)}</p>
                </div>

                <div>
                    <label htmlFor="payment_instructions" className="block text-sm font-medium text-slate-700">
                        Payment Instructions
                    </label>
                    <textarea id="payment_instructions" rows={3} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" defaultValue="Payment upon delivery."></textarea>
                </div>
                 <div>
                    <label htmlFor="delivery_terms" className="block text-sm font-medium text-slate-700">
                        Delivery Terms
                    </label>
                    <textarea id="delivery_terms" rows={3} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" defaultValue="Deliver to main office within 7 working days."></textarea>
                </div>

                <div className="flex justify-end">
                    <button type="submit" className="px-8 py-3 bg-budgetpulse text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors">
                        Submit Purchase Order
                    </button>
                </div>
            </form>
        </div>
    );
};

const QuoteDetailModal: React.FC<{
    quote: Quote;
    onClose: () => void;
    onSendMessage: (messageText: string) => void;
}> = ({ quote, onClose, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [quote.chatHistory]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };
    
    const total = quote.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">Quote Details: {quote.reference}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-3xl font-bold">&times;</button>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Details */}
                    <div className="w-3/5 p-6 overflow-y-auto border-r">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div><span className="font-semibold text-slate-600">Requester:</span> {quote.requester}</div>
                                <div><span className="font-semibold text-slate-600">Status:</span> 
                                    <span className={`ml-2 px-2 py-1 text-xs font-semibold text-white rounded-full ${quote.status === QuoteStatus.Finalized ? 'bg-green-500' : 'bg-indigo-500'}`}>{quote.status}</span>
                                </div>
                                <div><span className="font-semibold text-slate-600">List Name:</span> {quote.listName}</div>
                                <div><span className="font-semibold text-slate-600">Submitted:</span> {new Date(quote.submittedAt).toLocaleString()}</div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-700 mb-2">Merchants</h3>
                                <div className="flex space-x-2">
                                    {quote.merchants.map(m => <span key={m.id} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">{m.name}</span>)}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-700 mb-2">Items</h3>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Unit Price</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {quote.items.map(item => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-800">{item.description}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500 text-right">{item.quantity}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500 text-right">{formatCurrency(item.unitPrice)}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-slate-900 text-right">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                             <div className="text-right pt-4 border-t">
                                <p className="text-slate-500">Grand Total</p>
                                <p className="text-3xl font-bold text-slate-900">{formatCurrency(total)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Chat */}
                    <div className="w-2/5 flex flex-col bg-slate-100">
                        <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                           {(quote.chatHistory || []).map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === 'Procurement' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.sender === 'Procurement' ? 'bg-budgetpulse text-white' : 'bg-white text-slate-800 shadow-sm'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className={`text-xs mt-1 ${msg.sender === 'Procurement' ? 'text-indigo-200' : 'text-slate-400'} text-right`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                           ))}
                        </div>
                        <form onSubmit={handleSend} className="p-4 bg-white border-t flex-shrink-0">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-full focus:ring-2 focus:ring-offset-1 focus:ring-budgetpulse"
                                />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-budgetpulse hover:bg-opacity-90">
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
// #endregion

export default function App() {
  const [mode, setMode] = useState<Mode>(Mode.PricePulse);
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [activeList, setActiveList] = useState<ShoppingList | null>(MOCK_LISTS[0] || null);
  const [quotes, setQuotes] = useState<Quote[]>(MOCK_QUOTES);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(MOCK_POS);
  const [quoteForPO, setQuoteForPO] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);


  const handleSetMode = (newMode: Mode) => {
    setMode(newMode);
    setScreen('dashboard'); // Reset to dashboard on mode change
  };
  
  const handleBack = () => {
      if (screen === 'list' || screen === 'quotes' || screen === 'pos') {
          setScreen('dashboard');
      } else if (screen === 'templates') {
          setScreen('dashboard');
      } else if (screen === 'po-creation') {
          setScreen('quotes');
      }
  };

  const handleSelectTemplate = (template: Template) => {
    const newList: ShoppingList = {
        id: uuidv4(),
        name: template.name,
        createdAt: new Date().toISOString(),
        items: template.variants.items.map(item => ({
            ...item,
            id: uuidv4(),
            flags: []
        }))
    };
    setActiveList(newList);
    setScreen('list');
  };

  const handleCreatePOFromQuote = (quote: Quote) => {
    setQuoteForPO(quote);
    setScreen('po-creation');
  };

  const handlePOSubmit = (newPO: PurchaseOrder) => {
      setPurchaseOrders(prevPOs => [newPO, ...prevPOs]);
      setQuoteForPO(null);
      setScreen('pos');
  };

    const handleSendMessage = (messageText: string) => {
        if (!viewingQuote) return;

        const newMessage: ChatMessage = {
            id: uuidv4(),
            sender: 'Procurement',
            text: messageText,
            timestamp: new Date().toISOString(),
        };

        const updatedQuotes = quotes.map(q => {
            if (q.id === viewingQuote.id) {
                const updatedHistory = [...(q.chatHistory || []), newMessage];
                return { ...q, chatHistory: updatedHistory };
            }
            return q;
        });

        setQuotes(updatedQuotes);
        
        const updatedViewingQuote = updatedQuotes.find(q => q.id === viewingQuote.id);
        if(updatedViewingQuote) {
            setViewingQuote(updatedViewingQuote);
        }
    };

  const getScreenTitle = () => {
    switch(screen) {
        case 'list':
            return activeList?.name;
        case 'po-creation':
            return 'Create Purchase Order';
        default:
            return undefined;
    }
  }


  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return <DashboardScreen setScreen={setScreen} mode={mode} lists={MOCK_LISTS} quotesCount={quotes.length} posCount={purchaseOrders.length} />;
      case 'templates':
        return <TemplatesScreen onSelectTemplate={handleSelectTemplate} mode={mode} />;
      case 'list':
        return <ListBuilderScreen list={activeList} setList={setActiveList} mode={mode} setScreen={setScreen} />;
      case 'quotes':
        return <QuotesScreen quotes={quotes} onCreatePO={handleCreatePOFromQuote} onViewQuote={setViewingQuote} />;
       case 'pos':
        return <POScreen pos={purchaseOrders} />;
       case 'po-creation':
           return quoteForPO ? <POCreationScreen quote={quoteForPO} onSubmit={handlePOSubmit} /> : <p>Error: No quote selected for PO creation.</p>;
      default:
        return <DashboardScreen setScreen={setScreen} mode={mode} lists={MOCK_LISTS} quotesCount={quotes.length} posCount={purchaseOrders.length} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        mode={mode} 
        setMode={handleSetMode} 
        activeScreen={screen} 
        onBack={handleBack}
        screenTitle={getScreenTitle()}
       />
      <main className="max-w-7xl mx-auto">
        {renderScreen()}
      </main>
      {viewingQuote && (
          <QuoteDetailModal 
              quote={viewingQuote}
              onClose={() => setViewingQuote(null)}
              onSendMessage={handleSendMessage}
          />
      )}
    </div>
  );
}
