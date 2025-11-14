import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from '../vendor/react-router-dom';
import { PurchaseOrder, POStatus, Quote, QuoteStatus, POTimelineEntry } from '../types';
import { usePlanPulseStore, selectPurchaseOrders, selectQuotes } from '../store/planPulseStore';
import { formatCurrency, MOCK_MERCHANTS, MOCK_MERCHANT_PROFILES } from '../constants';
import StatusBadge from '../components/shared/StatusBadge';
import { v4 as uuidv4 } from 'uuid';

const statusLabels: Record<POStatus, string> = {
  [POStatus.Issued]: 'Issued',
  [POStatus.Fulfilled]: 'Fulfilled',
  [POStatus.Partial]: 'Partially Fulfilled',
  [POStatus.Delayed]: 'Delayed',
};

const statusColors: Record<POStatus, string> = {
  [POStatus.Issued]: 'bg-sky-500',
  [POStatus.Fulfilled]: 'bg-emerald-500',
  [POStatus.Partial]: 'bg-amber-500',
  [POStatus.Delayed]: 'bg-rose-500',
};

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const formatDateTime = (isoDate: string) =>
  new Date(isoDate).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const eligibleQuoteStatuses = new Set<QuoteStatus>([
  QuoteStatus.Finalized,
  QuoteStatus.ProformaReady,
  QuoteStatus.Acknowledged,
  QuoteStatus.POIssued,
]);

export const PurchaseOrdersScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as { createFromQuoteId?: string } | undefined) ?? undefined;
  const purchaseOrders = usePlanPulseStore(selectPurchaseOrders);
  const quotes = usePlanPulseStore(selectQuotes);
  const upsertPurchaseOrder = usePlanPulseStore((state) => state.upsertPurchaseOrder);

  const [statusFilter, setStatusFilter] = useState<'all' | POStatus>('all');
  const [sellerFilter, setSellerFilter] = useState<'all' | string>('all');
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalQuoteId, setModalQuoteId] = useState<string | undefined>();

  useEffect(() => {
    if (locationState?.createFromQuoteId) {
      setIsCreateModalOpen(true);
      setModalQuoteId(locationState.createFromQuoteId);
      navigate('.', { replace: true });
    }
  }, [locationState, navigate]);

  const orderedPurchaseOrders = useMemo(
    () =>
      [...purchaseOrders].sort(
        (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
      ),
    [purchaseOrders],
  );

  const filteredPurchaseOrders = useMemo(() => {
    return orderedPurchaseOrders.filter((po) => {
      const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
      const matchesSeller = sellerFilter === 'all' || po.seller.id === sellerFilter;
      return matchesStatus && matchesSeller;
    });
  }, [orderedPurchaseOrders, sellerFilter, statusFilter]);

  useEffect(() => {
    if (filteredPurchaseOrders.length === 0) {
      setSelectedPoId(null);
      return;
    }
    if (!selectedPoId || !filteredPurchaseOrders.some((po) => po.id === selectedPoId)) {
      setSelectedPoId(filteredPurchaseOrders[0].id);
    }
  }, [filteredPurchaseOrders, selectedPoId]);

  const selectedPurchaseOrder = useMemo(
    () => filteredPurchaseOrders.find((po) => po.id === selectedPoId) ?? filteredPurchaseOrders[0] ?? null,
    [filteredPurchaseOrders, selectedPoId],
  );

  const sellerOptions = useMemo(() => {
    const unique = new Map(orderedPurchaseOrders.map((po) => [po.seller.id, po.seller] as const));
    return Array.from(unique.values());
  }, [orderedPurchaseOrders]);

  const availableQuotes = useMemo(() => {
    const eligible = quotes.filter((quote) => eligibleQuoteStatuses.has(quote.status));
    if (modalQuoteId) {
      const matching = quotes.find((quote) => quote.id === modalQuoteId);
      if (matching && !eligible.some((quote) => quote.id === matching.id)) {
        return [...eligible, matching];
      }
    }
    return eligible;
  }, [modalQuoteId, quotes]);

  const totalForFiltered = useMemo(
    () => filteredPurchaseOrders.reduce((sum, po) => sum + po.total, 0),
    [filteredPurchaseOrders],
  );

  const supplierProfile = useMemo(() => {
    if (!selectedPurchaseOrder) return undefined;
    return MOCK_MERCHANT_PROFILES.find((profile) => profile.id === selectedPurchaseOrder.seller.id);
  }, [selectedPurchaseOrder]);

  const matchingQuote = useMemo(() => {
    if (!selectedPurchaseOrder) return undefined;
    return quotes.find((quote) => quote.reference === selectedPurchaseOrder.quoteReference);
  }, [quotes, selectedPurchaseOrder]);

  const handleExportCsv = () => {
    if (filteredPurchaseOrders.length === 0 || typeof window === 'undefined') {
      return;
    }

    const toCsvValue = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const header = ['PO Reference', 'Quote Reference', 'Buyer', 'Seller', 'Status', 'Issued At', 'Total'];
    const rows = filteredPurchaseOrders.map((po) =>
      [
        po.reference,
        po.quoteReference,
        po.buyer,
        po.seller.name,
        statusLabels[po.status],
        formatDateTime(po.issuedAt),
        po.total.toFixed(2),
      ].map(toCsvValue),
    );

    const csvContent = [header.map(toCsvValue).join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `purchase-orders-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreatePurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    upsertPurchaseOrder(purchaseOrder);
    setIsCreateModalOpen(false);
    setModalQuoteId(undefined);
    setSelectedPoId(purchaseOrder.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Purchase Orders</h2>
          <p className="text-sm text-slate-500">Track progress, export history, and issue new POs from finalized quotes.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 text-sm font-semibold text-budgetpulse bg-slate-100 rounded-lg hover:bg-slate-200"
            type="button"
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              setIsCreateModalOpen(true);
              setModalQuoteId(undefined);
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-budgetpulse rounded-lg shadow-sm hover:bg-opacity-90"
            type="button"
          >
            Create Purchase Order
          </button>
          <button
            onClick={() => navigate('../quotes')}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            type="button"
          >
            View Quotes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label htmlFor="po_status_filter" className="text-sm font-medium text-slate-600">
            Filter by status
          </label>
          <select
            id="po_status_filter"
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-budgetpulse"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | POStatus)}
          >
            <option value="all">All statuses</option>
            {Object.values(POStatus).map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="po_seller_filter" className="text-sm font-medium text-slate-600">
            Filter by supplier
          </label>
          <select
            id="po_seller_filter"
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-budgetpulse"
            value={sellerFilter}
            onChange={(event) => setSellerFilter(event.target.value as 'all' | string)}
          >
            <option value="all">All suppliers</option>
            {sellerOptions.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-600">Filtered total</span>
          <span className="mt-1 text-xl font-semibold text-slate-800">{formatCurrency(totalForFiltered)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    PO Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Quote Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Buyer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Issued
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredPurchaseOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      No purchase orders match the selected filters.
                    </td>
                  </tr>
                )}
                {filteredPurchaseOrders.map((po) => {
                  const isSelected = selectedPurchaseOrder?.id === po.id;
                  return (
                    <tr
                      key={po.id}
                      onClick={() => setSelectedPoId(po.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-budgetpulse/10' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{po.reference}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{po.quoteReference}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{po.buyer}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{po.seller.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(po.issuedAt)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-slate-800">
                        {formatCurrency(po.total)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StatusBadge status={po.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {selectedPurchaseOrder ? (
            <>
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-budgetpulse">{po.reference}</p>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span>{po.seller.name}</span>
                      {po.seller.status && <StatusBadge status={po.seller.status} />}
                    </div>
                    <p className="text-sm text-slate-400">Issued: {new Date(po.issuedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{formatCurrency(po.total)}</p>
                    <StatusBadge status={po.status} />
                    <p className="text-sm uppercase text-slate-400">PO Reference</p>
                    <h3 className="text-xl font-bold text-slate-900">{selectedPurchaseOrder.reference}</h3>
                  </div>
                  <StatusBadge status={selectedPurchaseOrder.status} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Issued on {formatDateTime(selectedPurchaseOrder.issuedAt)} for {formatCurrency(selectedPurchaseOrder.total)}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-700">Quote Reference</p>
                  <p className="text-slate-600">{selectedPurchaseOrder.quoteReference}</p>
                  {matchingQuote && (
                    <p className="text-xs text-slate-400 mt-1">
                      Source list: {matchingQuote.listName} • Requester: {matchingQuote.requester}
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Buyer</p>
                  <p className="text-slate-600">{selectedPurchaseOrder.buyer}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Supplier</p>
                  <p className="text-slate-600">{selectedPurchaseOrder.seller.name}</p>
                  {supplierProfile && (
                    <p className="text-xs text-slate-400 mt-1">
                      Contact: {supplierProfile.primaryContact} ({supplierProfile.contactEmail})
                    </p>
                  )}
                </div>
              </div>

              {selectedPurchaseOrder.timeline && selectedPurchaseOrder.timeline.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-700 mb-3">Progress Timeline</p>
                  <PurchaseOrderTimeline events={selectedPurchaseOrder.timeline} />
                </div>
              )}

              <button
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setModalQuoteId(matchingQuote?.id ?? undefined);
                }}
                className="w-full px-4 py-2 text-sm font-semibold text-budgetpulse bg-slate-100 rounded-lg hover:bg-slate-200"
                type="button"
              >
                Issue follow-up PO
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a purchase order to view supplier details and progress.</p>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreatePurchaseOrderModal
          quotes={availableQuotes}
          purchaseOrders={purchaseOrders}
          initialQuoteId={modalQuoteId}
          onClose={() => {
            setIsCreateModalOpen(false);
            setModalQuoteId(undefined);
          }}
          onCreate={handleCreatePurchaseOrder}
        />
      )}
    </div>
  );
};

interface CreatePurchaseOrderModalProps {
  quotes: Quote[];
  purchaseOrders: PurchaseOrder[];
  initialQuoteId?: string;
  onClose: () => void;
  onCreate: (purchaseOrder: PurchaseOrder) => void;
}

const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({
  quotes,
  purchaseOrders,
  initialQuoteId,
  onClose,
  onCreate,
}) => {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(() => initialQuoteId ?? quotes[0]?.id ?? '');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | undefined>();
  const [paymentInstructions, setPaymentInstructions] = useState('Payment upon delivery.');
  const [deliveryTerms, setDeliveryTerms] = useState('Deliver to main office within 7 working days.');

  useEffect(() => {
    if (initialQuoteId) {
      setSelectedQuoteId(initialQuoteId);
    }
  }, [initialQuoteId]);

  const selectedQuote = useMemo(() => quotes.find((quote) => quote.id === selectedQuoteId), [quotes, selectedQuoteId]);

  useEffect(() => {
    if (selectedQuote) {
      setSelectedMerchantId(selectedQuote.merchants[0]?.id);
    }
  }, [selectedQuote]);

  const existingReferences = useMemo(
    () => new Set(purchaseOrders.map((po) => po.quoteReference)),
    [purchaseOrders],
  );

  const selectedMerchant = useMemo(() => {
    if (!selectedQuote) return undefined;
    if (selectedMerchantId) {
      return selectedQuote.merchants.find((merchant) => merchant.id === selectedMerchantId) ?? selectedQuote.merchants[0];
    }
    return selectedQuote.merchants[0] ?? MOCK_MERCHANTS[0];
  }, [selectedMerchantId, selectedQuote]);

  const total = useMemo(() => {
    if (!selectedQuote) return 0;
    return selectedQuote.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [selectedQuote]);

  const generateReference = () => {
    const base = `PO-${new Date().getFullYear()}`;
    let counter = purchaseOrders.length + 1;
    let reference = `${base}-${String(counter).padStart(3, '0')}`;
    const existing = new Set(purchaseOrders.map((po) => po.reference));
    while (existing.has(reference)) {
      counter += 1;
      reference = `${base}-${String(counter).padStart(3, '0')}`;
    }
    return reference;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedQuote || !selectedMerchant) {
      return;
    }

    const reference = generateReference();
    const confirmationMessage = `Issue ${reference} to ${selectedMerchant.name} for ${formatCurrency(total)}?`;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(confirmationMessage);
      if (!confirmed) {
        return;
      }
    }

    const newPurchaseOrder: PurchaseOrder = {
      id: uuidv4(),
      reference,
      quoteReference: selectedQuote.reference,
      buyer: selectedQuote.requester,
      seller: selectedMerchant,
      status: POStatus.Issued,
      issuedAt: new Date().toISOString(),
      total,
      timeline: [
        {
          id: uuidv4(),
          label: 'Purchase order issued',
          timestamp: new Date().toISOString(),
          status: POStatus.Issued,
          description: paymentInstructions,
        },
        {
          id: uuidv4(),
          label: 'Awaiting supplier confirmation',
          timestamp: new Date().toISOString(),
          description: deliveryTerms,
        },
      ],
    };

    onCreate(newPurchaseOrder);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Create Purchase Order</h3>
            <p className="text-sm text-slate-500">Select a finalized quote to seed the purchase order details.</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <h3 className="font-semibold text-lg text-slate-700">Seller: {seller.name}</h3>
              {seller.status && <StatusBadge status={seller.status} />}
            </div>
            <p className="text-slate-500">
              {seller.status === 'Suspended'
                ? 'Trading paused until compliance is restored.'
                : 'Reach out for fulfilment details.'}
            </p>
          </div>
        </div>
        <div className="border-t border-b border-slate-200 py-4">
          <h4 className="font-semibold text-md text-slate-600 mb-2">Order Summary</h4>
          <DataTable
            columns={[
              { key: 'description', header: 'Description' },
              {
                key: 'quantity',
                header: 'Qty',
                align: 'right',
                render: (item) => <span className="text-slate-600">{item.quantity}</span>,
              },
              {
                key: 'unitPrice',
                header: 'Unit Price',
                align: 'right',
                render: (item) => <span>{formatCurrency(item.unitPrice)}</span>,
              },
              {
                key: 'lineTotal',
                header: 'Line Total',
                align: 'right',
                render: (item) => (
                  <span className="font-medium text-slate-800">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                ),
              },
            ]}
            data={quote.items}
            getRowKey={(item) => item.id}
          />
        </div>
        <div className="text-right">
          <p className="text-slate-500">Total Amount</p>
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(total)}</p>
        </div>
        <div>
          <label htmlFor="payment_instructions" className="block text-sm font-medium text-slate-700">
            Payment Instructions
          </label>
          <textarea
            id="payment_instructions"
            rows={3}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            defaultValue="Payment upon delivery."
          />
        </div>
        <div>
          <label htmlFor="delivery_terms" className="block text-sm font-medium text-slate-700">
            Delivery Terms
          </label>
          <textarea
            id="delivery_terms"
            rows={3}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            defaultValue="Deliver to main office within 7 working days."
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="px-8 py-3 bg-budgetpulse text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors">
            Submit Purchase Order
          <button
            onClick={handleClose}
            className="text-2xl font-bold text-slate-400 hover:text-slate-700"
            type="button"
            aria-label="Close create purchase order modal"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quote_selector" className="block text-sm font-medium text-slate-600">
                Source quote
              </label>
              <select
                id="quote_selector"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-budgetpulse"
                value={selectedQuoteId}
                onChange={(event) => setSelectedQuoteId(event.target.value)}
                required
              >
                <option value="" disabled>
                  Select a quote
                </option>
                {quotes.map((quote) => (
                  <option key={quote.id} value={quote.id}>
                    {quote.reference} — {quote.listName}
                    {existingReferences.has(quote.reference) ? ' (PO exists)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="merchant_selector" className="block text-sm font-medium text-slate-600">
                Supplier
              </label>
              <select
                id="merchant_selector"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-budgetpulse"
                value={selectedMerchantId ?? ''}
                onChange={(event) => setSelectedMerchantId(event.target.value)}
                disabled={!selectedQuote || selectedQuote.merchants.length === 0}
              >
                {selectedQuote?.merchants.length ? (
                  selectedQuote.merchants.map((merchant) => (
                    <option key={merchant.id} value={merchant.id}>
                      {merchant.name}
                    </option>
                  ))
                ) : (
                  <option value="">No suppliers listed</option>
                )}
              </select>
            </div>
          </div>

          {selectedQuote ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs uppercase text-slate-400">Quote Reference</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedQuote.reference}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs uppercase text-slate-400">Requester</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedQuote.requester}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs uppercase text-slate-400">Total Amount</p>
                  <p className="text-sm font-semibold text-slate-800">{formatCurrency(total)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">Items ({selectedQuote.items.length})</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Description
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Unit Price
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Line Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {selectedQuote.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm text-slate-700">{item.description}</td>
                          <td className="px-4 py-2 text-sm text-right text-slate-600">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-2 text-sm text-right font-semibold text-slate-800">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-slate-600">
                          Total
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{formatCurrency(total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="payment_instructions" className="block text-sm font-medium text-slate-600">
                    Payment instructions
                  </label>
                  <textarea
                    id="payment_instructions"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-budgetpulse"
                    rows={3}
                    value={paymentInstructions}
                    onChange={(event) => setPaymentInstructions(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="delivery_terms" className="block text-sm font-medium text-slate-600">
                    Delivery expectations
                  </label>
                  <textarea
                    id="delivery_terms"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-budgetpulse"
                    rows={3}
                    value={deliveryTerms}
                    onChange={(event) => setDeliveryTerms(event.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-300 rounded-lg p-6 text-sm text-slate-500 text-center">
              Select a quote to preview the PO details.
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedQuote || !selectedMerchant}
              className="px-6 py-2 text-sm font-semibold text-white bg-budgetpulse rounded-lg shadow hover:bg-opacity-90 disabled:opacity-60"
            >
              Submit Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PurchaseOrderTimeline: React.FC<{ events: POTimelineEntry[] }> = ({ events }) => {
  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const colorClass = event.status ? statusColors[event.status] : 'bg-slate-300';
        return (
          <div key={event.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <span className={`h-3 w-3 rounded-full ${colorClass}`}></span>
              {index < events.length - 1 && <span className="w-px flex-1 bg-slate-200 mt-1"></span>}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{event.label}</p>
              <p className="text-xs text-slate-400">{formatDateTime(event.timestamp)}</p>
              {event.description && <p className="mt-1 text-sm text-slate-600">{event.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const POCreationScreen: React.FC = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate('../purchase-orders', {
      replace: true,
      state: quoteId ? { createFromQuoteId: quoteId } : undefined,
    });
  }, [navigate, quoteId]);

  return null;
};

export default PurchaseOrdersScreen;
