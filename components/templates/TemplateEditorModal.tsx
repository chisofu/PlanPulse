import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Mode, PriceSource, Template, TemplateCategory, TemplateVariant, TemplateItemDefinition } from '../../types';
import { getModeTheme } from '../layout/ModeTheme';

interface TemplateEditorModalProps {
  isOpen: boolean;
  mode: Mode;
  initialTemplate?: Template;
  onDismiss: () => void;
  onSaveDraft: (template: Template) => void;
  onPublish: (template: Template) => void;
  onUnpublish?: (template: Template) => void;
  onDelete?: (template: Template) => void;
}

const cadenceOptions: TemplateVariant['cadence'][] = ['Monthly', 'Quarterly', 'Ad-hoc'];

const createEmptyVariant = (name: string, defaults: {
  defaultUnit?: string;
  defaultPriceSource?: PriceSource;
  defaultCategory?: string;
}): TemplateVariant => ({
  id: uuidv4(),
  name,
  summary: '',
  recommendedFor: '',
  estimatedBudget: 0,
  cadence: 'Monthly',
  lastRefreshed: new Date().toISOString().slice(0, 10),
  sourceLabel: 'Internal benchmark',
  items: [
    {
      description: '',
      category: defaults.defaultCategory ?? 'General',
      unit: defaults.defaultUnit ?? 'Each',
      quantity: 1,
      unitPrice: 0,
      priceSource: defaults.defaultPriceSource ?? PriceSource.ZPPA,
      benchmarkSource: defaults.defaultPriceSource ?? PriceSource.ZPPA,
    },
  ],
});

const createEmptyTemplate = (mode: Mode): Template => {
  const defaults = {
    defaultUnit: 'Each',
    defaultPriceSource: mode === Mode.PricePulse ? PriceSource.ZPPA : PriceSource.Merchant,
    defaultCategory: 'General',
  };

  const baseVariants: TemplateVariant[] = ['Essentials', 'Standard', 'Full'].map((name) =>
    createEmptyVariant(name, defaults),
  );

  return {
    id: uuidv4(),
    name: '',
    description: '',
    category: 'Custom',
    emoji: '🆕',
    tags: [],
    tone: 'Hybrid',
    status: 'draft',
    defaultUnit: defaults.defaultUnit,
    defaultPriceSource: defaults.defaultPriceSource,
    defaultCategory: defaults.defaultCategory,
    variants: baseVariants,
    metrics: {
      adoptionRate: 0,
      avgLines: baseVariants[0].items.length,
      lastUsedAt: new Date().toISOString(),
    },
  };
};

const normalizeTemplate = (template: Template): Template => {
  const variantCount = template.variants.length || 1;
  const avgLines = Math.round(
    template.variants.reduce((total, variant) => total + variant.items.length, 0) / variantCount,
  );
  return {
    ...template,
    metrics: {
      ...template.metrics,
      avgLines,
    },
  };
};

const formatTags = (tags: string[]) => tags.join(', ');

const parseTags = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  mode,
  initialTemplate,
  onDismiss,
  onSaveDraft,
  onPublish,
  onUnpublish,
  onDelete,
}) => {
  const theme = getModeTheme(mode);
  const [draft, setDraft] = useState<Template>(() =>
    normalizeTemplate(initialTemplate ?? createEmptyTemplate(mode)),
  );
  const [tagsInput, setTagsInput] = useState(() => formatTags(initialTemplate?.tags ?? []));

  useEffect(() => {
    if (isOpen) {
      const base = normalizeTemplate(initialTemplate ?? createEmptyTemplate(mode));
      setDraft(base);
      setTagsInput(formatTags(base.tags));
    }
  }, [initialTemplate, isOpen, mode]);

  const categoryOptions = useMemo<TemplateCategory[]>(
    () =>
      [
        'Education',
        'Construction',
        'Household',
        'Office',
        'Health',
        'Hospitality',
        'Community',
        'Custom',
      ],
    [],
  );

  if (!isOpen) {
    return null;
  }

  const handleVariantChange = <K extends keyof TemplateVariant>(
    variantId: string,
    key: K,
    value: TemplateVariant[K],
  ) => {
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              [key]: key === 'estimatedBudget' ? Number(value) : value,
            }
          : variant,
      ),
    }));
  };

  const handleVariantItemChange = (
    variantId: string,
    index: number,
    updates: Partial<TemplateItemDefinition>,
  ) => {
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => {
        if (variant.id !== variantId) return variant;
        const nextItems = variant.items.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                ...updates,
                quantity:
                  updates.quantity !== undefined ? Number(updates.quantity) : Number(item.quantity),
                unitPrice:
                  updates.unitPrice !== undefined ? Number(updates.unitPrice) : Number(item.unitPrice),
                priceSource:
                  (updates.priceSource as PriceSource | undefined) ?? item.priceSource,
                benchmarkSource:
                  (updates.priceSource as PriceSource | undefined) ?? item.benchmarkSource,
              }
            : item,
        );
        return { ...variant, items: nextItems };
      }),
    }));
  };

  const handleAddVariant = () => {
    setDraft((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        createEmptyVariant(`Variant ${prev.variants.length + 1}`, {
          defaultUnit: prev.defaultUnit,
          defaultPriceSource: prev.defaultPriceSource,
          defaultCategory: prev.defaultCategory,
        }),
      ],
    }));
  };

  const handleRemoveVariant = (variantId: string) => {
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.length > 1 ? prev.variants.filter((variant) => variant.id !== variantId) : prev.variants,
    }));
  };

  const handleAddItem = (variantId: string) => {
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              items: [
                ...variant.items,
                {
                  description: '',
                  category: prev.defaultCategory ?? 'General',
                  unit: prev.defaultUnit ?? 'Each',
                  quantity: 1,
                  unitPrice: 0,
                  priceSource: prev.defaultPriceSource ?? PriceSource.ZPPA,
                  benchmarkSource: prev.defaultPriceSource ?? PriceSource.ZPPA,
                },
              ],
            }
          : variant,
      ),
    }));
  };

  const handleRemoveItem = (variantId: string, index: number) => {
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              items: variant.items.filter((_, itemIndex) => itemIndex !== index),
            }
          : variant,
      ),
    }));
  };

  const updateTemplateField = <K extends keyof Template>(key: K, value: Template[K]) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveDraft = () => {
    const next = normalizeTemplate({
      ...draft,
      status: 'draft',
      tags: parseTags(tagsInput),
    });
    onSaveDraft(next);
    onDismiss();
  };

  const handlePublish = () => {
    if (window.confirm('Publish this template for teams to use?')) {
      const next = normalizeTemplate({
        ...draft,
        status: 'published',
        tags: parseTags(tagsInput),
      });
      onPublish(next);
      onDismiss();
    }
  };

  const handleUnpublish = () => {
    if (!onUnpublish) return;
    if (window.confirm('Unpublish this template? It will remain available as a draft.')) {
      const next = normalizeTemplate({
        ...draft,
        status: 'draft',
        tags: parseTags(tagsInput),
      });
      onUnpublish(next);
      onDismiss();
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (window.confirm('Delete this template? This action cannot be undone.')) {
      onDelete(draft);
      onDismiss();
    }
  };

  const headerTitle = initialTemplate ? 'Edit Template' : 'Create Template';

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className={`px-6 py-4 border-b ${theme.toggleBgClass}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{headerTitle}</h2>
              <p className="text-sm text-slate-600">
                Configure template details, defaults, and variants before sharing with your team.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500">Template Name</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(event) => updateTemplateField('name', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Term launch kit, clinic build, ..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500">Emoji</label>
                <input
                  type="text"
                  value={draft.emoji}
                  onChange={(event) => updateTemplateField('emoji', event.target.value.slice(0, 2))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="🎯"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500">Category</label>
                <select
                  value={draft.category}
                  onChange={(event) => updateTemplateField('category', event.target.value as TemplateCategory)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500">Tone</label>
                <select
                  value={draft.tone}
                  onChange={(event) => updateTemplateField('tone', event.target.value as Template['tone'])}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {(['Personal', 'Hybrid', 'Enterprise'] as const).map((tone) => (
                    <option key={tone} value={tone}>
                      {tone}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">Description</label>
              <textarea
                value={draft.description}
                onChange={(event) => updateTemplateField('description', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                rows={3}
                placeholder="Give planners quick context on what's inside."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500">Default Category</label>
                <input
                  type="text"
                  value={draft.defaultCategory ?? ''}
                  onChange={(event) => updateTemplateField('defaultCategory', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500">Default Unit</label>
                <input
                  type="text"
                  value={draft.defaultUnit ?? ''}
                  onChange={(event) => updateTemplateField('defaultUnit', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500">Default Price Source</label>
                <select
                  value={draft.defaultPriceSource ?? PriceSource.ZPPA}
                  onChange={(event) => updateTemplateField('defaultPriceSource', event.target.value as PriceSource)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {Object.values(PriceSource).map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">Tags</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="school, stationery, uniforms"
              />
              <p className="mt-1 text-xs text-slate-500">Separate tags with commas to help teams discover this template.</p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Variants</h3>
              <button
                type="button"
                onClick={handleAddVariant}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold text-white ${theme.accentBgClass}`}
              >
                Add Variant
              </button>
            </div>
            <div className="space-y-4">
              {draft.variants.map((variant, index) => (
                <div key={variant.id} className="border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase">
                        Variant {index + 1} · {variant.name || 'Untitled'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Configure Essentials/Standard/Full flows and budgets for this variant.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(variant.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                      disabled={draft.variants.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500">Name</label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(event) => handleVariantChange(variant.id, 'name', event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500">Recommended For</label>
                      <input
                        type="text"
                        value={variant.recommendedFor}
                        onChange={(event) =>
                          handleVariantChange(variant.id, 'recommendedFor', event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500">Estimated Budget</label>
                      <input
                        type="number"
                        value={variant.estimatedBudget}
                        onChange={(event) =>
                          handleVariantChange(variant.id, 'estimatedBudget', Number(event.target.value))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500">Summary</label>
                      <textarea
                        value={variant.summary}
                        onChange={(event) => handleVariantChange(variant.id, 'summary', event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500">Cadence</label>
                      <select
                        value={variant.cadence}
                        onChange={(event) =>
                          handleVariantChange(variant.id, 'cadence', event.target.value as TemplateVariant['cadence'])
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      >
                        {cadenceOptions.map((cadence) => (
                          <option key={cadence} value={cadence}>
                            {cadence}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500">Source Label</label>
                      <input
                        type="text"
                        value={variant.sourceLabel}
                        onChange={(event) => handleVariantChange(variant.id, 'sourceLabel', event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500">Last Refreshed</label>
                      <input
                        type="date"
                        value={variant.lastRefreshed.slice(0, 10)}
                        onChange={(event) => handleVariantChange(variant.id, 'lastRefreshed', event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-600">Line Items</p>
                      <button
                        type="button"
                        onClick={() => handleAddItem(variant.id)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Add item
                      </button>
                    </div>
                    <div className="space-y-3">
                      {variant.items.map((item, itemIndex) => (
                        <div
                          key={`${variant.id}-item-${itemIndex}`}
                          className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-50 rounded-lg p-3"
                        >
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-semibold uppercase text-slate-500">
                              Description
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(event) =>
                                handleVariantItemChange(variant.id, itemIndex, {
                                  description: event.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-500">
                              Category
                            </label>
                            <input
                              type="text"
                              value={item.category}
                              onChange={(event) =>
                                handleVariantItemChange(variant.id, itemIndex, {
                                  category: event.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-500">
                              Unit
                            </label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(event) =>
                                handleVariantItemChange(variant.id, itemIndex, {
                                  unit: event.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-500">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={item.quantity}
                              onChange={(event) =>
                                handleVariantItemChange(variant.id, itemIndex, {
                                  quantity: Number(event.target.value),
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-500">
                              Unit Price
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={item.unitPrice}
                              onChange={(event) =>
                                handleVariantItemChange(variant.id, itemIndex, {
                                  unitPrice: Number(event.target.value),
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-500">
                              Price Source
                            </label>
                            <select
                              value={item.priceSource}
                              onChange={(event) =>
                                handleVariantItemChange(variant.id, itemIndex, {
                                  priceSource: event.target.value as PriceSource,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            >
                              {Object.values(PriceSource).map((source) => (
                                <option key={source} value={source}>
                                  {source}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-6 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(variant.id, itemIndex)}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                            >
                              Remove line
                            </button>
                          </div>
                        </div>
                      ))}
                      {variant.items.length === 0 && (
                        <div className="text-xs text-slate-500">
                          No line items yet. Start by adding one above.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-xs text-slate-500">
            Drafts let you iterate privately. Publishing makes the template searchable in the library.
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {onDelete && initialTemplate && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-rose-600 hover:text-rose-800"
              >
                Delete
              </button>
            )}
            {initialTemplate && initialTemplate.status === 'published' && onUnpublish && (
              <button
                type="button"
                onClick={handleUnpublish}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-amber-600 hover:text-amber-800"
              >
                Unpublish
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-400"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handlePublish}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold text-white ${theme.accentBgClass}`}
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorModal;
