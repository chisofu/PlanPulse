import React, { useMemo } from 'react';
import {
  usePlanPulseStore,
  selectTemplates,
  selectTemplateSearchQuery,
  selectTemplateStatusFilter,
  selectTemplateDateRange,
} from '../store/planPulseStore';
import { Template, Mode, TemplateStatusFilter } from '../types';
import { fuzzyIncludes, getTemplateStatus, matchesDateRange } from '../utils/search';

interface TemplatesScreenProps {
  mode: Mode;
  onTemplateSelected: (template: Template) => void;
}

const TemplatesScreen: React.FC<TemplatesScreenProps> = ({ mode, onTemplateSelected }) => {
  const templates = usePlanPulseStore(selectTemplates);
  const templateSearchQuery = usePlanPulseStore(selectTemplateSearchQuery);
  const setTemplateSearchQuery = usePlanPulseStore((state) => state.setTemplateSearchQuery);
  const templateStatusFilter = usePlanPulseStore(selectTemplateStatusFilter);
  const setTemplateStatusFilter = usePlanPulseStore((state) => state.setTemplateStatusFilter);
  const templateDateRange = usePlanPulseStore(selectTemplateDateRange);
  const setTemplateDateRange = usePlanPulseStore((state) => state.setTemplateDateRange);
  const isPricePulse = mode === Mode.PricePulse;
  const accentClass = isPricePulse ? 'hover:border-pricepulse' : 'hover:border-budgetpulse';

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesQuery =
        !templateSearchQuery ||
        fuzzyIncludes(templateSearchQuery, template.name) ||
        fuzzyIncludes(templateSearchQuery, template.description) ||
        template.tags.some((tag) => fuzzyIncludes(templateSearchQuery, tag));
      if (!matchesQuery) return false;
      const status = getTemplateStatus(template);
      if (templateStatusFilter !== 'all' && status !== templateStatusFilter) return false;
      if (!matchesDateRange(template.metrics.lastUsedAt, templateDateRange)) return false;
      return true;
    });
  }, [templates, templateSearchQuery, templateStatusFilter, templateDateRange]);

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Template Library</h2>

      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="templateSearch" className="block text-sm font-medium text-slate-700">
              Search templates
            </label>
            <input
              id="templateSearch"
              type="text"
              value={templateSearchQuery}
              onChange={(event) => setTemplateSearchQuery(event.target.value)}
              placeholder="Search by name, description, or tag"
              className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="templateStatus" className="block text-sm font-medium text-slate-700">
              Freshness
            </label>
            <select
              id="templateStatus"
              value={templateStatusFilter}
              onChange={(event) => setTemplateStatusFilter(event.target.value as TemplateStatusFilter)}
              className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All</option>
              <option value="fresh">Fresh</option>
              <option value="stale">Stale</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="templateFrom" className="block text-sm font-medium text-slate-700">
                Last used after
              </label>
              <input
                id="templateFrom"
                type="date"
                value={templateDateRange.from ?? ''}
                onChange={(event) => setTemplateDateRange({ ...templateDateRange, from: event.target.value || undefined })}
                className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="templateTo" className="block text-sm font-medium text-slate-700">
                Last used before
              </label>
              <input
                id="templateTo"
                type="date"
                value={templateDateRange.to ?? ''}
                onChange={(event) => setTemplateDateRange({ ...templateDateRange, to: event.target.value || undefined })}
                className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <p>
            Showing {filteredTemplates.length} of {templates.length} template{templates.length === 1 ? '' : 's'}
          </p>
          <button
            type="button"
            onClick={() => {
              setTemplateSearchQuery('');
              setTemplateStatusFilter('all');
              setTemplateDateRange({});
            }}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const templateStatus = getTemplateStatus(template);
          const statusBadgeClass =
            templateStatus === 'fresh' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
          return (
            <button
              key={template.id}
              onClick={() => onTemplateSelected(template)}
              className={`bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-transparent text-left ${accentClass}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-800">{template.name}</p>
                  <p className="text-sm text-slate-500">{template.description}</p>
                </div>
                <span className="text-3xl ml-4" aria-hidden>
                  {template.emoji}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500 uppercase font-semibold">
                <span>{template.category}</span>
                <span className={`px-2 py-0.5 rounded-full ${statusBadgeClass}`}>
                  {templateStatus === 'fresh' ? 'Fresh' : 'Stale'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TemplatesScreen;
