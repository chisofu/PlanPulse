import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '../vendor/react-router-dom';
import { Mode, ShoppingList, MerchantStatus } from '../types';
import { DocumentDuplicateIcon, PlusIcon, CheckCircleIcon } from '../components/Icons';
import { Mode, Role, ShoppingList } from '../types';
import {
  DocumentDuplicateIcon,
  PlusIcon,
  CheckCircleIcon,
  ChevronRightIcon,
} from '../components/Icons';
import { themeTokens } from '../styles/tokens';
import {
  usePlanPulseStore,
  selectListSortOrder,
  selectDashboardSearchQuery,
  selectTeamMembers,
  selectRecentActivity,
  selectTemplates,
  selectUserRole,
  selectListStatusFilter,
  selectListDateRange,
} from '../store/planPulseStore';
import { getListStatus } from '../utils/search';
import { getAccentTokensForMode } from '../styles/theme';
import { useThemeAppearance } from '../styles/themeContext';
import { MOCK_MERCHANTS } from '../constants';
import { getListStatus, matchesDateRange } from '../utils/search';

interface DashboardScreenProps {
  mode: Mode;
  lists: ShoppingList[];
  quotesCount: number;
  posCount: number;
}

type Suggestion = {
  id: string;
  label: string;
  description: string;
  type: 'list' | 'template';
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTimeAgo = (timestamp: string) => {
  const value = new Date(timestamp).getTime();
  if (Number.isNaN(value)) {
    return '—';
  }
  const diffMs = Date.now() - value;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const statusStyles: Record<string, string> = {
  onTrack: 'bg-emerald-100 text-emerald-700',
  dueSoon: 'bg-amber-100 text-amber-700',
  overdue: 'bg-rose-100 text-rose-700',
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ mode, lists, quotesCount, posCount }) => {
  const navigate = useNavigate();
  const listSortOrder = usePlanPulseStore(selectListSortOrder);
  const setListSortOrder = usePlanPulseStore((state) => state.setListSortOrder);
  const searchQuery = usePlanPulseStore(selectDashboardSearchQuery);
  const setDashboardSearchQuery = usePlanPulseStore((state) => state.setDashboardSearchQuery);
  const teamMembers = usePlanPulseStore(selectTeamMembers);
  const recentActivity = usePlanPulseStore(selectRecentActivity);
  const templates = usePlanPulseStore(selectTemplates);
  const listStatusFilter = usePlanPulseStore(selectListStatusFilter);
  const setListStatusFilter = usePlanPulseStore((state) => state.setListStatusFilter);
  const listDateRange = usePlanPulseStore(selectListDateRange);
  const setListDateRange = usePlanPulseStore((state) => state.setListDateRange);
  const delegateList = usePlanPulseStore((state) => state.delegateList);
  const delegateItem = usePlanPulseStore((state) => state.delegateItem);
  const createList = usePlanPulseStore((state) => state.createList);
  const setActiveList = usePlanPulseStore((state) => state.setActiveList);
  const userRole = usePlanPulseStore(selectUserRole);
  const setUserRole = usePlanPulseStore((state) => state.setUserRole);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDelegationListId, setSelectedDelegationListId] = useState<string>(lists[0]?.id ?? '');

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isPricePulse = mode === Mode.PricePulse;
  const appearance = useThemeAppearance();
  const accentTokens = getAccentTokensForMode(mode, appearance);

  useEffect(() => {
    if (!lists.length) {
      setSelectedDelegationListId('');
      return;
    }
    if (!selectedDelegationListId || !lists.some((list) => list.id === selectedDelegationListId)) {
      setSelectedDelegationListId(lists[0].id);
    }
  }, [lists, selectedDelegationListId]);

  useEffect(() => {
    if (!normalizedQuery) {
      setShowSuggestions(false);
    }
  }, [normalizedQuery]);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!normalizedQuery) {
      return [];
    }
    const listMatches = lists
      .filter((list) => list.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 3)
      .map<Suggestion>((list) => ({
        id: list.id,
        label: list.name,
        description: `${list.items.length} item${list.items.length === 1 ? '' : 's'}`,
        type: 'list',
      }));
    const templateMatches = templates
      .filter((template) => template.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 3)
      .map<Suggestion>((template) => ({
        id: template.id,
        label: template.name,
        description: `${template.metrics.avgLines} lines • ${template.metrics.adoptionRate * 100}% adoption`,
        type: 'template',
      }));
    return [...listMatches, ...templateMatches].slice(0, 5);
  }, [lists, templates, normalizedQuery]);

  const filteredLists = useMemo(() => {
    return lists.filter((list) => {
      if (listStatusFilter !== 'all' && getListStatus(list) !== listStatusFilter) {
        return false;
      }
      const comparisonDate = list.dueDate ?? list.createdAt;
      if ((listDateRange.from || listDateRange.to) && !matchesDateRange(comparisonDate, listDateRange)) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return (
        list.name.toLowerCase().includes(normalizedQuery) ||
        list.items.some((item) => item.description.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [lists, listStatusFilter, listDateRange, normalizedQuery]);

  const sortedLists = useMemo(() => {
    const sorted = [...filteredLists];
    sorted.sort((a, b) => {
      const first = new Date(a.createdAt).getTime();
      const second = new Date(b.createdAt).getTime();
      if (Number.isNaN(first) || Number.isNaN(second)) {
        return 0;
      }
      return listSortOrder === 'newest' ? second - first : first - second;
    });
    return sorted;
  }, [filteredLists, listSortOrder]);

  const filteredActivity = useMemo(
    () =>
      recentActivity.filter((entry) => {
        if (!normalizedQuery) {
          return true;
        }
        return (
          entry.summary.toLowerCase().includes(normalizedQuery) ||
          (entry.details?.toLowerCase().includes(normalizedQuery) ?? false)
        );
      }),
    [recentActivity, normalizedQuery],
  );

  const dueSoonCount = useMemo(
    () => lists.filter((list) => getListStatus(list) === 'dueSoon').length,
    [lists],
  );
  const overdueCount = useMemo(
    () => lists.filter((list) => getListStatus(list) === 'overdue').length,
    [lists],
  );
  const delegatedItems = useMemo(
    () => lists.reduce((sum, list) => sum + list.items.filter((item) => item.assigneeId).length, 0),
    [lists],
  );
  const unassignedItems = useMemo(
    () => lists.reduce((sum, list) => sum + list.items.filter((item) => !item.assigneeId).length, 0),
    [lists],
  );

  const isFirstTime = lists.length === 0;
  const showDelegationModule =
    mode === Mode.BudgetPulse && (userRole === Role.Procurement || userRole === Role.Admin);

  const selectedDelegationList = lists.find((list) => list.id === selectedDelegationListId) ?? lists[0];

  const handleCreateList = () => {
    const list = createList();
    setActiveList(list.id);
    navigate('lists');
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    if (suggestion.type === 'list') {
      setActiveList(suggestion.id);
      navigate('lists');
    } else {
      navigate('templates');
    }
    setShowSuggestions(false);
  };

  const handleDateChange = (key: 'from' | 'to', value: string) => {
    const nextRange = { ...listDateRange, [key]: value || undefined };
    if (!value) {
      delete nextRange[key];
    }
    setListDateRange(nextRange);
  };

  const getMemberName = (id?: string) =>
    id ? teamMembers.find((member) => member.id === id)?.name ?? '—' : '—';

  const quickActions = [
    {
      title: 'Start from Template',
      subtitle: 'Browse curated blueprints',
      icon: <DocumentDuplicateIcon className="w-6 h-6" />,
      action: () => navigate('templates'),
      show: true,
    },
    {
      title: 'Create New List',
      subtitle: 'Blank workspace with defaults',
      icon: <PlusIcon className="w-6 h-6" />, 
      action: handleCreateList,
      show: true,
    },
    {
      title: 'View My Lists',
      subtitle: `${lists.length} active list${lists.length === 1 ? '' : 's'}`,
      icon: <CheckCircleIcon className="w-6 h-6" />, 
      action: () => navigate('lists'),
      show: lists.length > 0,
    },
    {
      title: 'Manage Quotes',
      subtitle: `${quotesCount} request${quotesCount === 1 ? '' : 's'}`,
      icon: <DocumentDuplicateIcon className="w-6 h-6" />, 
      action: () => navigate('quotes'),
      show: !isPricePulse,
    },
    {
      title: 'Track Purchase Orders',
      subtitle: `${posCount} active PO${posCount === 1 ? '' : 's'}`,
      icon: <CheckCircleIcon className="w-6 h-6" />, 
      action: () => navigate('purchase-orders'),
      show: !isPricePulse,
    },
  ].filter((card) => card.show);

  const kpiCards = [
    {
      title: 'Due soon',
      value: dueSoonCount,
      detail: 'Within the next 7 days',
      action: () => setListStatusFilter('dueSoon'),
    },
    {
      title: 'Overdue lists',
      value: overdueCount,
      detail: 'Need attention',
      action: () => setListStatusFilter('overdue'),
    },
    {
      title: 'Delegated items',
      value: delegatedItems,
      detail: `${unassignedItems} unassigned`,
      action: () => {
        if (showDelegationModule && lists.length) {
          setSelectedDelegationListId(lists[0].id);
        }
      },
    },
  ];

  const merchantStatusDescriptions: Record<MerchantStatus, string> = {
    'Up-to-date': 'Recent price lists and compliance on file.',
    Due: 'Reminders scheduled within the next 14 days.',
    Stale: 'Price data ageing beyond acceptable windows.',
    Suspended: 'Requires admin intervention before trading.',
  };

  const merchantStatusStyles: Record<MerchantStatus, string> = {
    'Up-to-date': 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Due: 'border-amber-200 bg-amber-50 text-amber-700',
    Stale: 'border-orange-200 bg-orange-50 text-orange-700',
    Suspended: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  const merchantStatusSummary = useMemo(() => {
    const summary: Record<MerchantStatus, number> = {
      'Up-to-date': 0,
      Due: 0,
      Stale: 0,
      Suspended: 0,
    };
    MOCK_MERCHANTS.forEach((merchant) => {
      if (merchant.status) {
        summary[merchant.status] += 1;
      }
    });
    return summary;
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            Welcome to {isPricePulse ? 'PricePulse' : 'BudgetPulse'}
          </h2>
          <p className="text-sm text-slate-500">
            Search lists, recent activity, and templates without leaving the dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="role-select" className="text-sm text-slate-500">
            Role context
          </label>
          <select
            id="role-select"
            value={userRole}
            onChange={(event) => setUserRole(event.target.value as Role)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Object.values(Role).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative mt-6">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setDashboardSearchQuery(event.target.value)}
          onFocus={() => normalizedQuery && setShowSuggestions(true)}
          onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
          placeholder="Search lists, team activity, or templates..."
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
            <ul>
              {suggestions.map((suggestion) => (
                <li key={`${suggestion.type}-${suggestion.id}`}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <span>
                      <span className="font-semibold text-slate-900">{suggestion.label}</span>
                      <span className="ml-2 text-xs text-slate-500">{suggestion.description}</span>
                    </span>
                    <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {isFirstTime && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-3xl">
            🪄
          </div>
          <h3 className="text-xl font-semibold text-slate-800">Set up your first list</h3>
          <p className="mt-2 text-sm text-slate-500">
            You don’t have any lists yet. Create a blank workspace or start from a template to see progress and activity here.
          </p>
          <button
            type="button"
            onClick={handleCreateList}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-budgetpulse px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-budgetpulse/90 hover:shadow-lg"
          >
            <PlusIcon className="w-4 h-4" /> Create a list
          </button>
        </div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={card.action}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex items-center space-x-4 w-full text-left border-t-4"
            style={{ borderColor: accentTokens.accentColorBg }}
          >
            <div className="p-3 rounded-full" style={{ backgroundColor: accentTokens.accentSurface }}>
            className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">{card.title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.detail}</p>
            <span className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100">
              View details <ChevronRightIcon className="ml-1 w-4 h-4" />
            </span>
          </button>
        ))}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickActions.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={card.action}
            className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: modeToken.accentSurface }}>
              <div className={isPricePulse ? 'text-pricepulse' : 'text-budgetpulse'}>{card.icon}</div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
              <p className="text-sm text-slate-500">{card.subtitle}</p>
            </div>
          </button>
        ))}
      </section>

      <section className="mt-10">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">Merchant status snapshot</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.entries(merchantStatusSummary) as [MerchantStatus, number][]).map(([status, count]) => (
            <div
              key={status}
              className={`border rounded-xl px-4 py-4 shadow-sm ${merchantStatusStyles[status]}`}
            >
              <p className="text-sm font-semibold">{status}</p>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs mt-1">{merchantStatusDescriptions[status]}</p>
            </div>
          ))}
        </div>
      </section>

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
      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {showDelegationModule && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Delegation center</h3>
                  <p className="text-sm text-slate-500">
                    Assign owners to lists and line items so teammates know what’s next.
                  </p>
                </div>
                <select
                  value={selectedDelegationList?.id ?? ''}
                  onChange={(event) => setSelectedDelegationListId(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedDelegationList ? (
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">List owner</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Choose who is accountable for this shopping list.
                    </p>
                    <select
                      value={selectedDelegationList.ownerId ?? ''}
                      onChange={(event) =>
                        delegateList(
                          selectedDelegationList.id,
                          event.target.value || undefined,
                        )
                      }
                      className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">Collaborators</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Owner plus {selectedDelegationList.collaboratorIds?.length ?? 0} collaborator(s).
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-500">
                      {selectedDelegationList.collaboratorIds?.length ? (
                        selectedDelegationList.collaboratorIds.map((id) => (
                          <span key={id} className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 text-slate-600">
                            • {getMemberName(id)}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-500">
                          Add collaborators from the list details screen.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Add a list to begin delegating work.
                </p>
              )}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-700">Line items</h4>
                <div className="mt-3 grid gap-3">
                  {(selectedDelegationList?.items ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-inner transition hover:border-indigo-200"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800">{item.description}</p>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          {item.status}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs text-slate-500">
                          Qty {item.quantity} • {item.category}
                        </span>
                        <select
                          value={item.assigneeId ?? ''}
                          onChange={(event) =>
                            delegateItem(
                              selectedDelegationList.id,
                              item.id,
                              event.target.value || undefined,
                            )
                          }
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {!selectedDelegationList?.items.length && (
                    <p className="rounded-lg bg-slate-100 px-3 py-4 text-sm text-slate-500">
                      Add items to this list to delegate responsibilities.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Shopping list overview</h3>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={listStatusFilter}
                  onChange={(event) => setListStatusFilter(event.target.value as typeof listStatusFilter)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All statuses</option>
                  <option value="onTrack">On track</option>
                  <option value="dueSoon">Due soon</option>
                  <option value="overdue">Overdue</option>
                </select>
                <input
                  type="date"
                  value={listDateRange.from ?? ''}
                  onChange={(event) => handleDateChange('from', event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="date"
                  value={listDateRange.to ?? ''}
                  onChange={(event) => handleDateChange('to', event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setListSortOrder('newest')}
                    className={`px-3 py-1.5 text-sm font-medium transition ${
                      listSortOrder === 'newest' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Newest
                  </button>
                  <button
                    type="button"
                    onClick={() => setListSortOrder('oldest')}
                    className={`border-l border-slate-200 px-3 py-1.5 text-sm font-medium transition ${
                      listSortOrder === 'oldest' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Oldest
                  </button>
                </div>
              </div>
            </div>
            {sortedLists.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Due
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Owner
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Items
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedLists.map((list) => {
                      const status = getListStatus(list);
                      const statusLabel =
                        status === 'overdue' ? 'Overdue' : status === 'dueSoon' ? 'Due soon' : 'On track';
                      return (
                        <tr key={list.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{list.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(list.createdAt)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(list.dueDate)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{getMemberName(list.ownerId)}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status] ?? ''}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-600">{list.items.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 rounded-lg bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No lists match the current filters. Adjust your status or date filters to see more results.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Recent activity</h3>
            <p className="mt-1 text-sm text-slate-500">
              Updates from your team appear here in real time.
            </p>
            <div className="mt-4 space-y-4">
              {filteredActivity.length > 0 ? (
                filteredActivity.slice(0, 8).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-inner"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800">{entry.summary}</p>
                      <span className="text-xs text-slate-400">{formatTimeAgo(entry.timestamp)}</span>
                    </div>
                    {entry.details && (
                      <p className="mt-1 text-xs text-slate-500">{entry.details}</p>
                    )}
                    {entry.actor && (
                      <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{entry.actor}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="rounded-lg bg-slate-100 px-4 py-6 text-sm text-slate-500">
                  No recent updates match “{searchQuery}”. Try clearing the search to see the full activity log.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardScreen;
