import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '../vendor/react-router-dom';
import { Quote, QuoteStatus } from '../types';
import { usePlanPulseStore, selectQuotes } from '../store/planPulseStore';
import { formatCurrency } from '../constants';
import { PaperAirplaneIcon } from '../components/Icons';

interface QuotesScreenProps {
  onCreatePurchaseOrder: (quote: Quote) => void;
}

const QuotesScreen: React.FC<QuotesScreenProps> = ({ onCreatePurchaseOrder }) => {
  const quotes = usePlanPulseStore(selectQuotes);
  const addChatMessage = usePlanPulseStore((state) => state.addQuoteChatMessage);
  const [filterStatus, setFilterStatus] = useState<QuoteStatus | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(searchParams.get('quote') ?? null);

  useEffect(() => {
    const param = searchParams.get('quote');
    setSelectedQuoteId(param);
  }, [searchParams]);

  const selectedQuote = selectedQuoteId ? quotes.find((quote) => quote.id === selectedQuoteId) ?? null : null;

  const filteredAndSortedQuotes = useMemo(() => {
    let result = [...quotes];

    if (filterStatus !== 'all') {
      result = result.filter((quote) => quote.status === filterStatus);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.submittedAt).getTime();
      const dateB = new Date(b.submittedAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [quotes, filterStatus, sortOrder]);

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

  const handleSendMessage = (messageText: string) => {
    if (!selectedQuote) return;
    addChatMessage(selectedQuote.id, 'Procurement', messageText);
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
          <label htmlFor="sortOrder" className="text-sm font-medium text-slate-700">
            Sort by:
          </label>
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
            filteredAndSortedQuotes.map((quote) => (
              <li key={quote.id} className="p-4 hover:bg-slate-50 cursor-pointer" onClick={() => handleOpenQuote(quote)}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-budgetpulse">{quote.reference}</p>
                    <p className="text-slate-600">{quote.listName}</p>
                    <p className="text-sm text-slate-400">Submitted: {new Date(quote.submittedAt).toLocaleDateString()}</p>
                    {quote.status === QuoteStatus.Finalized && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreatePurchaseOrder(quote);
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
            <li className="p-8 text-center text-slate-500">No quotes found matching your criteria.</li>
          )}
        </ul>
      </div>

      {selectedQuote && (
        <QuoteDetailModal quote={selectedQuote} onClose={handleCloseQuote} onSendMessage={handleSendMessage} />
      )}
    </div>
  );
};

interface QuoteDetailModalProps {
  quote: Quote;
  onClose: () => void;
  onSendMessage: (messageText: string) => void;
}

const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({ quote, onClose, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const total = useMemo(() => quote.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [quote.items]);

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Quote Details: {quote.reference}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-3xl font-bold" aria-label="Close quote details">
            &times;
          </button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-3/5 p-6 overflow-y-auto border-r">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-slate-600">Requester:</span> {quote.requester}
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold text-white rounded-full ${quote.status === QuoteStatus.Finalized ? 'bg-green-500' : 'bg-indigo-500'}`}>
                    {quote.status}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">List Name:</span> {quote.listName}
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Submitted:</span> {new Date(quote.submittedAt).toLocaleString()}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">Merchants</h3>
                <div className="flex space-x-2">
                  {quote.merchants.map((merchant) => (
                    <span key={merchant.id} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                      {merchant.name}
                    </span>
                  ))}
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
                      {quote.items.map((item) => (
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
          <div className="w-2/5 flex flex-col bg-slate-100">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {(quote.chatHistory || []).map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'Procurement' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.sender === 'Procurement' ? 'bg-budgetpulse text-white' : 'bg-white text-slate-800 shadow-sm'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'Procurement' ? 'text-indigo-200' : 'text-slate-400'} text-right`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

export default QuotesScreen;
