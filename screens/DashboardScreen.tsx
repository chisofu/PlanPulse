import React, { useMemo } from 'react';
import { useNavigate } from '../vendor/react-router-dom';
import { Mode, ShoppingList } from '../types';
import { DocumentDuplicateIcon, PlusIcon, CheckCircleIcon } from '../components/Icons';
import {
  usePlanPulseStore,
  selectListSortOrder,
} from '../store/planPulseStore';
import { getListStatus } from '../utils/search';
import { getAccentTokensForMode } from '../styles/theme';
import { useThemeAppearance } from '../styles/themeContext';

interface DashboardScreenProps {
  mode: Mode;
  lists: ShoppingList[];
  quotesCount: number;
  posCount: number;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ mode, lists, quotesCount, posCount }) => {
  const navigate = useNavigate();
  const listSortOrder = usePlanPulseStore(selectListSortOrder);
  const setListSortOrder = usePlanPulseStore((state) => state.setListSortOrder);
  const isPricePulse = mode === Mode.PricePulse;
  const appearance = useThemeAppearance();
  const accentTokens = getAccentTokensForMode(mode, appearance);

  const goTo = (path: string) => navigate(path);

  const cards = [
    {
      title: 'Start from Template',
      subtitle: 'Browse pre-made lists',
      icon: <DocumentDuplicateIcon />,
      action: () => goTo('templates'),
      show: true,
    },
    {
      title: 'Create New List',
      subtitle: 'Start with a blank slate',
      icon: <PlusIcon />,
      action: () => goTo('lists'),
      show: true,
    },
    {
      title: 'My Shopping Lists',
      subtitle: `${lists.length} active list(s)`,
      icon: <CheckCircleIcon />,
      action: () => goTo('lists'),
      show: lists.length > 0,
    },
    {
      title: 'Manage Quotes',
      subtitle: `${quotesCount} requests`,
      icon: <DocumentDuplicateIcon />,
      action: () => goTo('quotes'),
      show: !isPricePulse,
    },
    {
      title: 'Track Purchase Orders',
      subtitle: `${posCount} active POs`,
      icon: <CheckCircleIcon />,
      action: () => goTo('purchase-orders'),
      show: !isPricePulse,
    },
  ].filter((card) => card.show);

  const sortedLists = useMemo(() => {
    const sorted = [...lists];
    sorted.sort((a, b) => {
      const first = new Date(a.createdAt).getTime();
      const second = new Date(b.createdAt).getTime();
      if (Number.isNaN(first) || Number.isNaN(second)) {
        return 0;
      }
      return listSortOrder === 'newest' ? second - first : first - second;
    });
    return sorted;
  }, [lists, listSortOrder]);

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusStyles: Record<string, string> = {
    onTrack: 'bg-emerald-100 text-emerald-700',
    dueSoon: 'bg-amber-100 text-amber-700',
    overdue: 'bg-rose-100 text-rose-700',
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800 mb-6">
        Welcome to {isPricePulse ? 'PricePulse' : 'BudgetPulse'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <button
            key={card.title}
            onClick={card.action}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex items-center space-x-4 w-full text-left border-t-4"
            style={{ borderColor: accentTokens.accentColorBg }}
          >
            <div className="p-3 rounded-full" style={{ backgroundColor: accentTokens.accentSurface }}>
              <div className={isPricePulse ? 'text-pricepulse' : 'text-budgetpulse'}>{card.icon}</div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{card.title}</h3>
              <p className="text-slate-500">{card.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
          <h3 className="text-xl font-semibold text-slate-800">Shopping list overview</h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-500">Sort by</span>
            <div className="inline-flex rounded-md shadow-sm border border-slate-200 overflow-hidden" role="group">
              <button
                type="button"
                onClick={() => setListSortOrder('newest')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  listSortOrder === 'newest'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
                aria-pressed={listSortOrder === 'newest'}
              >
                Newest
              </button>
              <button
                type="button"
                onClick={() => setListSortOrder('oldest')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-slate-200 ${
                  listSortOrder === 'oldest'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
                aria-pressed={listSortOrder === 'oldest'}
              >
                Oldest
              </button>
            </div>
          </div>
        </div>

        {sortedLists.length > 0 ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedLists.map((list) => {
                  const status = getListStatus(list);
                  const statusLabel =
                    status === 'overdue' ? 'Overdue' : status === 'dueSoon' ? 'Due soon' : 'On track';
                  return (
                    <tr key={list.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{list.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(list.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(list.dueDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[status] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-right">{list.items.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">Create your first shopping list to see it appear here.</p>
        )}
      </section>
    </div>
  );
};

export default DashboardScreen;
