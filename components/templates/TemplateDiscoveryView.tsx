import React, { useMemo, useState } from 'react';
import { Mode, Template } from '../../types';
import { TemplateVariantCard } from './TemplateVariantCard';
import { getModeTheme } from '../layout/ModeTheme';

interface TemplateDiscoveryViewProps {
  templates: Template[];
  mode: Mode;
  onSelect: (template: Template, variantId: string) => void;
}

export const TemplateDiscoveryView: React.FC<TemplateDiscoveryViewProps> = ({ templates, mode, onSelect }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [toneFilter, setToneFilter] = useState<'All' | 'Personal' | 'Enterprise' | 'Hybrid'>('All');
  const theme = getModeTheme(mode);

  const filteredTemplates = useMemo(() => {
    return templates
      .filter((template) =>
        categoryFilter === 'all' ? true : template.category.toLowerCase() === categoryFilter
      )
      .filter((template) => (toneFilter === 'All' ? true : template.tone === toneFilter))
      .filter((template) => {
        if (!search.trim()) return true;
        const term = search.toLowerCase();
        return (
          template.name.toLowerCase().includes(term) ||
          template.description.toLowerCase().includes(term) ||
          template.tags.some((tag) => tag.toLowerCase().includes(term))
        );
      });
  }, [categoryFilter, templates, toneFilter, search]);

  const categories = useMemo(() => {
    const base = new Set<string>();
    templates.forEach((template) => base.add(template.category.toLowerCase()));
    return ['all', ...Array.from(base.values())];
  }, [templates]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <label htmlFor="template-search" className="block text-sm font-semibold text-slate-600">
              Search templates
            </label>
            <input
              id="template-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="School, groceries, clinic build..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 shadow-sm focus:border-transparent focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-slate-500">Tone</span>
              {(['All', 'Personal', 'Hybrid', 'Enterprise'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setToneFilter(tone)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    toneFilter === tone
                      ? `${theme.accentBgClass} text-white border-transparent`
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border transition-colors ${
                categoryFilter === category
                  ? `${theme.accentBgClass} text-white border-transparent`
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates.map((template) =>
          template.variants.map((variant) => (
            <TemplateVariantCard
              key={`${template.id}-${variant.id}`}
              template={template}
              variant={variant}
              mode={mode}
              onSelect={(selectedTemplate, selectedVariant) =>
                onSelect(selectedTemplate, selectedVariant.id)
              }
            />
          ))
        )}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-8 text-center text-slate-500">
            <p className="font-semibold text-slate-600">No templates match those filters yet.</p>
            <p className="text-sm">Try adjusting tone or search keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
};
