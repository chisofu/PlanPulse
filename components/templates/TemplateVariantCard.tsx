import React from 'react';
import { Mode, Template, TemplateVariant } from '../../types';
import { getModeTheme } from '../layout/ModeTheme';
import { formatCurrency } from '../../constants';

interface TemplateVariantCardProps {
  template: Template;
  variant: TemplateVariant;
  mode: Mode;
  variantIndex?: number;
  totalVariants?: number;
  onSelect: (template: Template, variant: TemplateVariant) => void;
}

export const TemplateVariantCard: React.FC<TemplateVariantCardProps> = ({
  template,
  variant,
  mode,
  variantIndex,
  totalVariants,
  onSelect,
}) => {
  const theme = getModeTheme(mode);

  return (
    <button
      onClick={() => onSelect(template, variant)}
      className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all text-left border border-slate-200 hover:border-transparent"
    >
      <div className={`h-1 rounded-t-xl ${theme.accentBgClass}`} />
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-slate-500 tracking-wide">{template.category}</p>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{template.emoji}</span>
              {template.name}
            </h3>
            <p className="text-sm text-slate-600">{template.description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${theme.toggleBgClass} ${theme.accentTextClass}`}>
            {variant.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500">Summary</p>
            <p>{variant.summary}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500">Recommended For</p>
            <p>{variant.recommendedFor}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500">Est. Budget</p>
            <p className="font-semibold text-slate-900">{formatCurrency(variant.estimatedBudget)}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500">Last Refreshed</p>
            <p>{new Date(variant.lastRefreshed).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {template.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-slate-100 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between">
          <span>
            {variant.items.length} line item{variant.items.length === 1 ? '' : 's'}
            {typeof totalVariants === 'number' && typeof variantIndex === 'number' && (
              <span className="ml-2 font-semibold text-slate-400">
                Variant {variantIndex + 1} of {totalVariants}
              </span>
            )}
          </span>
          <span>{variant.sourceLabel}</span>
        </div>
      </div>
    </button>
  );
};
