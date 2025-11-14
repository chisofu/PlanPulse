import React, { useMemo, useState } from 'react';
import {
  usePlanPulseStore,
  selectTemplates,
  selectTemplateSearchQuery,
  selectTemplateStatusFilter,
  selectTemplateDateRange,
  selectTemplateCategoryFilter,
  selectTemplateVariantFilter,
  selectTemplatePublishFilter,
} from '../store/planPulseStore';
import { Template, Mode, TemplateStatusFilter, TemplateVariant, TemplatePublishStatus } from '../types';
import { fuzzyIncludes, getTemplateStatus, matchesDateRange } from '../utils/search';
import { TemplateVariantCard } from '../components/templates/TemplateVariantCard';
import TemplateEditorModal from '../components/templates/TemplateEditorModal';

interface FilteredTemplate {
  template: Template;
  variants: TemplateVariant[];
  status: 'fresh' | 'stale';
}

interface TemplatesScreenProps {
  mode: Mode;
  onTemplateSelected: (template: Template, variant: TemplateVariant) => void;
}

const TemplatesScreen: React.FC<TemplatesScreenProps> = ({ mode, onTemplateSelected }) => {
  const templates = usePlanPulseStore(selectTemplates);
  const templateSearchQuery = usePlanPulseStore(selectTemplateSearchQuery);
  const setTemplateSearchQuery = usePlanPulseStore((state) => state.setTemplateSearchQuery);
  const templateStatusFilter = usePlanPulseStore(selectTemplateStatusFilter);
  const setTemplateStatusFilter = usePlanPulseStore((state) => state.setTemplateStatusFilter);
  const templateDateRange = usePlanPulseStore(selectTemplateDateRange);
  const setTemplateDateRange = usePlanPulseStore((state) => state.setTemplateDateRange);
  const templateCategoryFilter = usePlanPulseStore(selectTemplateCategoryFilter);
  const setTemplateCategoryFilter = usePlanPulseStore((state) => state.setTemplateCategoryFilter);
  const templateVariantFilter = usePlanPulseStore(selectTemplateVariantFilter);
  const setTemplateVariantFilter = usePlanPulseStore((state) => state.setTemplateVariantFilter);
  const templatePublishFilter = usePlanPulseStore(selectTemplatePublishFilter);
  const setTemplatePublishFilter = usePlanPulseStore((state) => state.setTemplatePublishFilter);
  const upsertTemplate = usePlanPulseStore((state) => state.upsertTemplate);
  const deleteTemplate = usePlanPulseStore((state) => state.deleteTemplate);
  const setTemplatePublishStatus = usePlanPulseStore((state) => state.setTemplatePublishStatus);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorTemplate, setEditorTemplate] = useState<Template | undefined>(undefined);

  const categoryOptions = useMemo(
    () => ['all', ...Array.from(new Set(templates.map((template) => template.category)))],
    [templates],
  );

  const variantOptions = useMemo(
    () =>
      ['all', ...Array.from(new Set(templates.flatMap((template) => template.variants.map((variant) => variant.name))))],
    [templates],
  );

  const publishOptions: (TemplatePublishStatus | 'all')[] = ['all', 'published', 'draft'];

  const filteredTemplates = useMemo<FilteredTemplate[]>(() => {
    return templates
      .map<FilteredTemplate | null>((template) => {
        if (templatePublishFilter !== 'all' && template.status !== templatePublishFilter) {
          return null;
        }
        if (templateCategoryFilter !== 'all' && template.category !== templateCategoryFilter) {
          return null;
        }

        const status = getTemplateStatus(template);
        if (templateStatusFilter !== 'all' && status !== templateStatusFilter) {
          return null;
        }

        if (!matchesDateRange(template.metrics.lastUsedAt, templateDateRange)) {
          return null;
        }

        const matchesTemplateSearch =
          !templateSearchQuery ||
          fuzzyIncludes(templateSearchQuery, template.name) ||
          fuzzyIncludes(templateSearchQuery, template.description) ||
          template.tags.some((tag) => fuzzyIncludes(templateSearchQuery, tag));

        const filteredVariants = template.variants.filter((variant) => {
          const matchesVariantFilter =
            templateVariantFilter === 'all'
              ? true
              : variant.name.toLowerCase() === templateVariantFilter.toLowerCase();

          if (!matchesVariantFilter) {
            return false;
          }

          if (!templateSearchQuery) {
            return true;
          }

          return (
            fuzzyIncludes(templateSearchQuery, variant.name) ||
            fuzzyIncludes(templateSearchQuery, variant.summary) ||
            variant.items.some((item) => fuzzyIncludes(templateSearchQuery, item.description))
          );
        });

        const shouldInclude = matchesTemplateSearch || filteredVariants.length > 0;
        if (!shouldInclude) {
          return null;
        }

        const variantsToRender =
          templateVariantFilter === 'all'
            ? filteredVariants.length > 0
              ? filteredVariants
              : template.variants
            : filteredVariants;

        if (variantsToRender.length === 0) {
          return null;
        }

        return {
          template,
          variants: variantsToRender,
          status,
        };
      })
      .filter((entry): entry is FilteredTemplate => Boolean(entry));
  }, [
    templates,
    templateSearchQuery,
    templateStatusFilter,
    templateDateRange,
    templateCategoryFilter,
    templateVariantFilter,
    templatePublishFilter,
  ]);

  const visibleVariantCount = useMemo(
    () => filteredTemplates.reduce((total, entry) => total + entry.variants.length, 0),
    [filteredTemplates],
  );

  const openCreateModal = () => {
    setEditorTemplate(undefined);
    setIsEditorOpen(true);
  };

  const openEditModal = (template: Template) => {
    setEditorTemplate(template);
    setIsEditorOpen(true);
  };

  const handlePublishToggle = (template: Template) => {
    const nextStatus: TemplatePublishStatus = template.status === 'published' ? 'draft' : 'published';
    const message =
      nextStatus === 'published'
        ? 'Publish this template so teams can start using it?'
        : 'Unpublish this template? It will remain saved as a draft.';
    if (window.confirm(message)) {
      setTemplatePublishStatus(template.id, nextStatus);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Template Library</h2>
          <p className="text-sm text-slate-500">
            Start faster with Essentials/Standard/Full variants or craft your own flows for teams.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Create New Template
          </button>
          <button
            type="button"
            onClick={() => alert('Tour coming soon! Explore filters below to guide your first template selection.')}
            className="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-600 text-sm font-semibold hover:bg-indigo-50"
          >
            Launch Onboarding Tour
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-indigo-900">New to templates?</p>
        <ul className="mt-2 list-disc list-inside space-y-1 text-indigo-900/80">
          <li>Browse curated variants or filter to the exact category, publish status, and freshness you need.</li>
          <li>Use the buttons on each card to preview Essentials/Standard/Full variants before creating a list.</li>
          <li>Ready with your own list? Use “Save as Template” in List Builder to seed new playbooks.</li>
        </ul>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-3">
            <label htmlFor="templateSearch" className="block text-xs font-semibold uppercase text-slate-500">
              Search templates
            </label>
            <input
              id="templateSearch"
              type="text"
              value={templateSearchQuery}
              onChange={(event) => setTemplateSearchQuery(event.target.value)}
              placeholder="School, clinic, groceries, ..."
              className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">Category</label>
            <select
              value={templateCategoryFilter}
              onChange={(event) => setTemplateCategoryFilter(event.target.value as Template['category'] | 'all')}
              className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All categories' : category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">Variant</label>
            <select
              value={templateVariantFilter}
              onChange={(event) => setTemplateVariantFilter(event.target.value)}
              className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {variantOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'Any variant' : option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">Publish status</label>
            <select
              value={templatePublishFilter}
              onChange={(event) => setTemplatePublishFilter(event.target.value as TemplatePublishStatus | 'all')}
              className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {publishOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'Published & drafts' : option === 'published' ? 'Published' : 'Drafts'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500">Freshness</label>
            <select
              value={templateStatusFilter}
              onChange={(event) => setTemplateStatusFilter(event.target.value as TemplateStatusFilter)}
              className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">Fresh or stale</option>
              <option value="fresh">Fresh</option>
              <option value="stale">Stale</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">Used after</label>
              <input
                type="date"
                value={templateDateRange.from ?? ''}
                onChange={(event) =>
                  setTemplateDateRange({ ...templateDateRange, from: event.target.value || undefined })
                }
                className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">Used before</label>
              <input
                type="date"
                value={templateDateRange.to ?? ''}
                onChange={(event) =>
                  setTemplateDateRange({ ...templateDateRange, to: event.target.value || undefined })
                }
                className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-sm text-slate-500">
          <p>
            Showing {filteredTemplates.length} of {templates.length} templates · {visibleVariantCount} variant
            {visibleVariantCount === 1 ? '' : 's'} available
          </p>
          <button
            type="button"
            onClick={() => {
              setTemplateSearchQuery('');
              setTemplateStatusFilter('all');
              setTemplateCategoryFilter('all');
              setTemplateVariantFilter('all');
              setTemplatePublishFilter('all');
              setTemplateDateRange({});
            }}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {filteredTemplates.map(({ template, variants, status }) => {
          const statusBadgeClass =
            status === 'fresh' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
          return (
            <div key={template.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" aria-hidden>
                      {template.emoji}
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">{template.name}</h3>
                      <p className="text-sm text-slate-500">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase font-semibold text-slate-500">
                    <span>{template.category}</span>
                    <span className={`px-2 py-0.5 rounded-full ${statusBadgeClass}`}>
                      {status === 'fresh' ? 'Fresh' : 'Stale'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {template.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {template.variants.length} variant{template.variants.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {template.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-100 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePublishToggle(template)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                      template.status === 'published'
                        ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                        : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {template.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(template)}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Delete this template? This action cannot be undone.')) {
                        deleteTemplate(template.id);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {variants.map((variant) => {
                  const variantPosition = template.variants.findIndex(
                    (entry) => entry.id === variant.id,
                  );
                  return (
                  <TemplateVariantCard
                    key={variant.id}
                    template={template}
                    variant={variant}
                    mode={mode}
                    variantIndex={variantPosition === -1 ? undefined : variantPosition}
                    totalVariants={template.variants.length}
                    onSelect={(selectedTemplate, selectedVariant) =>
                      onTemplateSelected(selectedTemplate, selectedVariant)
                    }
                  />
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-500">
            <p className="font-semibold text-slate-600">No templates match those filters yet.</p>
            <p className="text-sm mt-2">Try adjusting category, publish status, or variant filters to explore more options.</p>
          </div>
        )}
      </div>

      <TemplateEditorModal
        isOpen={isEditorOpen}
        mode={mode}
        initialTemplate={editorTemplate}
        onDismiss={() => setIsEditorOpen(false)}
        onSaveDraft={(template) => {
          upsertTemplate(template);
        }}
        onPublish={(template) => {
          upsertTemplate(template);
        }}
        onUnpublish={(template) => {
          upsertTemplate(template);
        }}
        onDelete={editorTemplate ? (template) => deleteTemplate(template.id) : undefined}
      />
    </div>
  );
};

export default TemplatesScreen;
