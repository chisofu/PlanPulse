import React, { useMemo } from 'react';
import { useParams, useNavigate } from '../vendor/react-router-dom';
import { PurchaseOrder, POStatus } from '../types';
import { usePlanPulseStore, selectPurchaseOrders, selectQuotes } from '../store/planPulseStore';
import { formatCurrency, MOCK_MERCHANTS } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import StatusBadge from '../components/shared/StatusBadge';
import { DataTable } from '../components/shared/DataTable';

export const PurchaseOrdersScreen: React.FC = () => {
  const purchaseOrders = usePlanPulseStore(selectPurchaseOrders);
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Purchase Orders</h2>
        <button
          onClick={() => navigate('../quotes', { replace: false })}
          className="px-4 py-2 text-sm font-semibold text-white bg-budgetpulse rounded-lg shadow-sm hover:bg-opacity-90"
        >
          Request from Quote
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <ul className="divide-y divide-slate-200">
          {purchaseOrders.length > 0 ? (
            purchaseOrders.map((po) => (
              <li key={po.id} className="p-4 hover:bg-slate-50">
                <div className="flex justify-between items-center">
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
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="p-8 text-center text-slate-500">No purchase orders found.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export const POCreationScreen: React.FC = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const quotes = usePlanPulseStore(selectQuotes);
  const upsertPurchaseOrder = usePlanPulseStore((state) => state.upsertPurchaseOrder);

  const quote = quotes.find((q) => q.id === quoteId);

  if (!quote) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <p className="text-slate-600">Quote not found. Please return to the quotes dashboard.</p>
        <button onClick={() => navigate('../quotes')} className="mt-4 px-4 py-2 bg-budgetpulse text-white rounded-lg">
          Back to Quotes
        </button>
      </div>
    );
  }

  const total = useMemo(() => quote.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [quote.items]);
  const seller = quote.merchants[0] || MOCK_MERCHANTS[0];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const newPO: PurchaseOrder = {
      id: uuidv4(),
      reference: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      quoteReference: quote.reference,
      buyer: 'Our Company Inc.',
      seller,
      status: POStatus.Issued,
      issuedAt: new Date().toISOString(),
      total,
    };
    upsertPurchaseOrder(newPO);
    navigate('../purchase-orders');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Create Purchase Order</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg text-slate-700">From Quote: {quote.reference}</h3>
            <p className="text-slate-500">{quote.listName}</p>
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
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrdersScreen;
