import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '../vendor/react-router-dom';
import { BudgetItem, PriceSource, Quote, QuoteAttachment, QuoteStatus } from '../types';
import { usePlanPulseStore, selectQuotes } from '../store/planPulseStore';
import { formatCurrency } from '../constants';
import { PaperAirplaneIcon } from '../components/Icons';
import StatusBadge from '../components/shared/StatusBadge';
import { DataTable } from '../components/shared/DataTable';
import { v4 as uuidv4 } from 'uuid';

interface QuotesScreenProps {
  onCreatePurchaseOrder: (quote: Quote) => void;
}

const statusSortOrder: Record<QuoteStatus, number> = {
  [QuoteStatus.Draft]: 0,
  [QuoteStatus.Submitted]: 1,
  [QuoteStatus.ProformaReady]: 2,
  [QuoteStatus.Acknowledged]: 3,
  [QuoteStatus.Finalized]: 4,
  [QuoteStatus.POIssued]: 5,
  [QuoteStatus.Withdrawn]: 6,
};

const calculateItemsTotal = (items: BudgetItem[]) =>
  items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

const createBlankItem = (): BudgetItem => ({
  id: uuidv4(),
  description: '',
  category: 'General',
  unit: 'Each',
  quantity: 1,
  unitPrice: 0,
  priceSource: PriceSource.Merchant,
  flags: [],
});

const QuotesScreen: React.FC<QuotesScreenProps> = ({ onCreatePurchaseOrder }) => {
  const quotes = usePlanPulseStore(selectQuotes);
  const addChatMessage = usePlanPulseStore((state) => state.addQuoteChatMessage);
  const addQuoteAttachment = usePlanPulseStore((state) => state.addQuoteAttachment);
  const updateQuoteItems = usePlanPulseStore((state) => state.updateQuoteItems);
  const requestNewQuoteFromExisting = usePlanPulseStore((state) => state.requestNewQuoteFromExisting);

  const [filterStatus, setFilterStatus] = useState<QuoteStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'submittedAt' | 'merchant' | 'status'>('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comparisonSelection, setComparisonSelection] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(searchParams.get('quote') ?? null);

  useEffect(() => {
    const param = searchParams.get('quote');
    setSelectedQuoteId(param);
  }, [searchParams]);

  const selectedQuote = selectedQuoteId
    ? quotes.find((quote) => quote.id === selectedQuoteId) ?? null
    : null;

  const filteredAndSortedQuotes = useMemo(() => {
    let result = [...quotes];

    if (filterStatus !== 'all') {
      result = result.filter((quote) => quote.status === filterStatus);
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter((quote) => new Date(quote.submittedAt).getTime() >= start.getTime());
    }

    if (endDate) {
      const endValue = new Date(endDate);
      endValue.setHours(23, 59, 59, 999);
      result = result.filter((quote) => new Date(quote.submittedAt).getTime() <= endValue.getTime());
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'submittedAt') {
        const dateA = new Date(a.submittedAt).getTime();
        const dateB = new Date(b.submittedAt).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'merchant') {
        const merchantA = a.merchants[0]?.name ?? '';
        const merchantB = b.merchants[0]?.name ?? '';
        comparison = merchantA.localeCompare(merchantB);
      } else if (sortBy === 'status') {
        comparison = (statusSortOrder[a.status] ?? 0) - (statusSortOrder[b.status] ?? 0);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [quotes, filterStatus, sortBy, sortDirection, startDate, endDate]);

  const comparisonQuotes = useMemo(
    () =>
      comparisonSelection
        .map((quoteId) => quotes.find((quote) => quote.id === quoteId) ?? null)
        .filter((quote): quote is Quote => Boolean(quote)),
    [comparisonSelection, quotes],
  );

  const handleOpenQuote = (quote: Quote) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('quote', quote.id);
      return params;
    });
  };

  const handleCloseQuote = () => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete('quote');
      return params;
    });
  };

  const handleSendMessage = (messageText: string, attachments?: QuoteAttachment[]) => {
    if (!selectedQuote) return;
    addChatMessage(selectedQuote.id, 'Procurement', messageText, attachments);
  };

  const handleAttachmentUpload = (quoteId: string, attachment: QuoteAttachment) => {
    addQuoteAttachment(quoteId, attachment);
  };

  const handleItemsUpdate = (quoteId: string, items: BudgetItem[]) => {
    updateQuoteItems(quoteId, items);
  };

  const handleToggleComparison = (quote: Quote) => {
    setComparisonSelection((prev) => {
      if (prev.includes(quote.id)) {
        return prev.filter((id) => id !== quote.id);
      }
      if (prev.length >= 3) {
        window.alert('You can compare up to three quotes at a time.');
        return prev;
      }
      return [...prev, quote.id];
    });
  };

  const handleRequestNewQuote = (quote: Quote) => {
    const created = requestNewQuoteFromExisting(quote.id);
    if (!created) return;
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('quote', created.id);
      return params;
    });
  };

  const handleCreatePO = (quote: Quote) => {
    const confirmed = window.confirm(
      'This quote is finalized. Do you want to create a purchase order from it?'
    );
    if (!confirmed) return;
    onCreatePurchaseOrder(quote);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Quote Requests</h2>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-4 p-4 bg-slate-100 rounded-lg">
        <div className="flex items-center space-x-2">
          <label htmlFor="statusFilter" className="text-sm font-medium text-slate-700">
            Status:
          </label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as QuoteStatus | 'all')}
            className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All</option>
            {Object.values(QuoteStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="sortBy" className="text-sm font-medium text-slate-700">
            Sort by:
          </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="submittedAt">Submitted Date</option>
            <option value="merchant">Merchant</option>
            <option value="status">Status</option>
          </select>
          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as typeof sortDirection)}
            className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">
              End date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <ul className="divide-y divide-slate-200">
          {filteredAndSortedQuotes.length > 0 ? (
            filteredAndSortedQuotes.map((quote) => {
              const isSelectedForComparison = comparisonSelection.includes(quote.id);
              return (
                <li key={quote.id} className="p-4 hover:bg-slate-50 cursor-pointer" onClick={() => handleOpenQuote(quote)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={isSelectedForComparison}
                        onChange={() => handleToggleComparison(quote)}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-1 h-4 w-4 text-budgetpulse border-slate-300 rounded"
                        aria-label={`Select ${quote.reference} for comparison`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-budgetpulse">{quote.reference}</p>
                          <StatusBadge status={quote.status} />
                        </div>
                        <p className="text-slate-600">{quote.listName}</p>
                        <p className="text-sm text-slate-400">
                          Submitted: {new Date(quote.submittedAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-500">
                          Merchants: {quote.merchants.map((merchant) => merchant.name).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-3">
                      <div>
                        <p className="font-bold text-slate-800">{formatCurrency(calculateItemsTotal(quote.items))}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRequestNewQuote(quote);
                          }}
                          className="px-4 py-2 text-sm font-semibold text-budgetpulse bg-slate-100 rounded-lg shadow-sm hover:bg-slate-200"
                        >
                          Request New Quote
                        </button>
                        {quote.status === QuoteStatus.Finalized && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCreatePO(quote);
                            }}
                            className="px-4 py-2 text-sm font-semibold text-white bg-budgetpulse rounded-lg shadow-sm hover:bg-opacity-90 transition-colors"
                          >
                            Create Purchase Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="p-8 text-center text-slate-500">No quotes found matching your criteria.</li>
          )}
        </ul>
      </div>

      {comparisonQuotes.length > 0 && (
        <QuoteComparisonPanel
          quotes={comparisonQuotes}
          onClear={() => setComparisonSelection([])}
          onRemove={(id) => setComparisonSelection((prev) => prev.filter((quoteId) => quoteId !== id))}
        />
      )}

      {selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          onClose={handleCloseQuote}
          onSendMessage={handleSendMessage}
          onAttachmentUpload={(attachment) => handleAttachmentUpload(selectedQuote.id, attachment)}
          onItemsUpdate={(items) => handleItemsUpdate(selectedQuote.id, items)}
          onRequestNewQuote={() => handleRequestNewQuote(selectedQuote)}
        />
      )}
    </div>
  );
};

interface QuoteDetailModalProps {
  quote: Quote;
  onClose: () => void;
  onSendMessage: (messageText: string, attachments?: QuoteAttachment[]) => void;
  onAttachmentUpload: (attachment: QuoteAttachment) => void;
  onItemsUpdate: (items: BudgetItem[]) => void;
  onRequestNewQuote: () => void;
}

const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({
  quote,
  onClose,
  onSendMessage,
  onAttachmentUpload,
  onItemsUpdate,
  onRequestNewQuote,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [messageFiles, setMessageFiles] = useState<File[]>([]);
  const [messageInputKey, setMessageInputKey] = useState(0);
  const [editableItems, setEditableItems] = useState<BudgetItem[]>(quote.items);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setEditableItems(quote.items.map((item) => ({ ...item })));
    setIsDirty(false);
    setNewMessage('');
    setMessageFiles([]);
    setMessageInputKey((key) => key + 1);
  }, [quote]);

  useEffect(() => {
    const original = JSON.stringify(quote.items);
    const current = JSON.stringify(editableItems);
    setIsDirty(original !== current);
  }, [editableItems, quote.items]);

  const total = useMemo(() => calculateItemsTotal(editableItems), [editableItems]);

  const handleItemFieldChange = <K extends keyof BudgetItem>(itemId: string, field: K, value: BudgetItem[K]) => {
    setEditableItems((items) =>
      items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  const handleAddItem = () => {
    setEditableItems((items) => [...items, createBlankItem()]);
  };

  const handleRemoveItem = (itemId: string) => {
    setEditableItems((items) => items.filter((item) => item.id !== itemId));
  };

  const handleSaveItems = () => {
    onItemsUpdate(editableItems);
    setIsDirty(false);
  };

  const handleAttachmentInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const attachment: QuoteAttachment = {
        id: uuidv4(),
        filename: file.name,
        uploadedBy: 'Procurement',
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(file),
      };
      onAttachmentUpload(attachment);
    });
    event.target.value = '';
  };

  const handleMessageFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setMessageFiles(files);
  };

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() && messageFiles.length === 0) return;

    const attachments = messageFiles.map<QuoteAttachment>((file) => ({
      id: uuidv4(),
      filename: file.name,
      uploadedBy: 'Procurement',
      uploadedAt: new Date().toISOString(),
      url: URL.createObjectURL(file),
    }));

    onSendMessage(newMessage.trim(), attachments.length > 0 ? attachments : undefined);
    setNewMessage('');
    setMessageFiles([]);
    setMessageInputKey((key) => key + 1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Quote Details: {quote.reference}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={quote.status} />
              <span className="text-sm text-slate-500">{quote.listName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRequestNewQuote}
              className="px-3 py-2 text-sm font-semibold text-budgetpulse bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Request New Quote
            </button>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 text-3xl font-bold"
              aria-label="Close quote details"
            >
              &times;
            </button>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-3/5 p-6 overflow-y-auto border-r space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-slate-600">Requester:</span> {quote.requester}
              </div>
              <div>
                <span className="font-semibold text-slate-600">Submitted:</span>{' '}
                {new Date(quote.submittedAt).toLocaleString()}
              </div>
              <div className="col-span-2">
                <h3 className="font-semibold text-slate-700 mb-2">Merchants</h3>
                <div className="flex flex-wrap gap-2">
                  {quote.merchants.map((merchant) => (
                    <span key={merchant.id} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                      {merchant.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700">Items</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddItem}
                    className="px-3 py-2 text-sm font-semibold text-budgetpulse bg-slate-100 rounded-lg hover:bg-slate-200"
                  >
                    Add Item
                  </button>
                  <button
                    onClick={handleSaveItems}
                    disabled={!isDirty}
                    className={`px-3 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${
                      isDirty
                        ? 'bg-budgetpulse text-white hover:bg-opacity-90'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
              <DataTable
                columns={[
                  {
                    key: 'description',
                    header: 'Description',
                    render: (item) => (
                      <input
                        type="text"
                        value={item.description}
                        onChange={(event) => handleItemFieldChange(item.id, 'description', event.target.value)}
                        className="w-full border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-budgetpulse"
                        placeholder="Item description"
                      />
                    ),
                  },
                  {
                    key: 'quantity',
                    header: 'Qty',
                    align: 'right',
                    render: (item) => (
                      <input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(event) => handleItemFieldChange(item.id, 'quantity', Number(event.target.value))}
                        className="w-24 border border-slate-200 rounded-md px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-budgetpulse"
                      />
                    ),
                  },
                  {
                    key: 'unitPrice',
                    header: 'Unit Price',
                    align: 'right',
                    render: (item) => (
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) => handleItemFieldChange(item.id, 'unitPrice', Number(event.target.value))}
                        className="w-28 border border-slate-200 rounded-md px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-budgetpulse"
                      />
                    ),
                  },
                  {
                    key: 'total',
                    header: 'Total',
                    align: 'right',
                    render: (item) => <span className="font-semibold text-slate-900">{formatCurrency(item.quantity * item.unitPrice)}</span>,
                  },
                  {
                    key: 'actions',
                    header: '',
                    align: 'right',
                    render: (item) => (
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-sm text-rose-500 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    ),
                  },
                ]}
                data={editableItems}
                getRowKey={(item) => item.id}
              />
              <div className="text-right pt-4">
                <p className="text-slate-500">Grand Total</p>
                <p className="text-3xl font-bold text-slate-900">{formatCurrency(total)}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-700">Attachments</h3>
                <label className="px-3 py-2 text-sm font-semibold text-budgetpulse bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer">
                  Upload
                  <input type="file" multiple className="hidden" onChange={handleAttachmentInput} />
                </label>
              </div>
              <ul className="space-y-2">
                {(quote.attachments ?? []).map((attachment) => (
                  <li key={attachment.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{attachment.filename}</p>
                      <p className="text-xs text-slate-400">
                        Uploaded by {attachment.uploadedBy} on{' '}
                        {new Date(attachment.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    {attachment.url && (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-budgetpulse hover:underline"
                      >
                        View
                      </a>
                    )}
                  </li>
                ))}
                {(quote.attachments ?? []).length === 0 && (
                  <li className="text-sm text-slate-500">No attachments yet.</li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-700 mb-2">Status Timeline</h3>
              <ol className="relative border-l border-slate-200 pl-4 space-y-4">
                {(quote.timeline ?? []).map((entry) => (
                  <li key={entry.id} className="relative">
                    <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-budgetpulse"></span>
                    <div className="ml-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-700">{entry.label}</p>
                        {entry.status && <StatusBadge status={entry.status} />}
                      </div>
                      <p className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleString()}</p>
                      {entry.description && <p className="text-sm text-slate-600 mt-1">{entry.description}</p>}
                    </div>
                  </li>
                ))}
                {(quote.timeline ?? []).length === 0 && (
                  <li className="text-sm text-slate-500">No timeline events recorded.</li>
                )}
              </ol>
            </div>
          </div>
          <div className="w-2/5 flex flex-col bg-slate-100">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {(quote.chatHistory ?? []).map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'Procurement' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl space-y-2 ${
                      msg.sender === 'Procurement'
                        ? 'bg-budgetpulse text-white'
                        : 'bg-white text-slate-800 shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    {(msg.attachments ?? []).length > 0 && (
                      <div className="space-y-1">
                        {(msg.attachments ?? []).map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`block text-xs underline ${
                              msg.sender === 'Procurement' ? 'text-indigo-100 hover:text-white' : 'text-budgetpulse'
                            }`}
                          >
                            📎 {attachment.filename}
                          </a>
                        ))}
                      </div>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender === 'Procurement' ? 'text-indigo-200' : 'text-slate-400'
                      } text-right`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} className="p-4 bg-white border-t flex-shrink-0 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-full focus:ring-2 focus:ring-offset-1 focus:ring-budgetpulse"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-budgetpulse hover:bg-opacity-90"
                  aria-label="Send message"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 flex items-center gap-2 cursor-pointer">
                  <span className="px-2 py-1 bg-slate-100 rounded-md">Attach files</span>
                  <input
                    key={messageInputKey}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleMessageFilesChange}
                  />
                  {messageFiles.length > 0 && (
                    <span className="text-xs text-slate-500">{messageFiles.length} file(s) selected</span>
                  )}
                </label>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

interface QuoteComparisonPanelProps {
  quotes: Quote[];
  onClear: () => void;
  onRemove: (id: string) => void;
}

const QuoteComparisonPanel: React.FC<QuoteComparisonPanelProps> = ({ quotes, onClear, onRemove }) => {
  if (quotes.length === 0) {
    return null;
  }

  const columns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (quote: Quote) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRemove(quote.id)}
            className="text-xs text-rose-500 hover:text-rose-600"
            type="button"
          >
            Remove
          </button>
          <span className="font-semibold text-slate-800">{quote.reference}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (quote: Quote) => <StatusBadge status={quote.status} />,
    },
    {
      key: 'merchants',
      header: 'Merchants',
      render: (quote: Quote) => (
        <span className="text-sm text-slate-600">
          {quote.merchants.map((merchant) => merchant.name).join(', ')}
        </span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (quote: Quote) => new Date(quote.submittedAt).toLocaleDateString(),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right' as const,
      render: (quote: Quote) => <span className="font-semibold">{formatCurrency(calculateItemsTotal(quote.items))}</span>,
    },
  ];

  return (
    <div className="mt-6 bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Quote Comparison</h3>
        <button onClick={onClear} className="text-sm text-budgetpulse hover:underline">
          Clear selection
        </button>
      </div>
      <DataTable columns={columns} data={quotes} getRowKey={(quote) => quote.id} />
      {quotes.length < 2 && (
        <p className="mt-3 text-sm text-slate-500">
          Select at least two quotes from the list above to compare them side by side.
        </p>
      )}
    </div>
  );
};

export default QuotesScreen;
