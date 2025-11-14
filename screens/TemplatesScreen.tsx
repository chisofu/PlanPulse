import React from 'react';
import { usePlanPulseStore, selectTemplates } from '../store/planPulseStore';
import { Template, Mode } from '../types';

interface TemplatesScreenProps {
  mode: Mode;
  onTemplateSelected: (template: Template) => void;
}

const TemplatesScreen: React.FC<TemplatesScreenProps> = ({ mode, onTemplateSelected }) => {
  const templates = usePlanPulseStore(selectTemplates);
  const isPricePulse = mode === Mode.PricePulse;
  const accentClass = isPricePulse ? 'hover:border-pricepulse' : 'hover:border-budgetpulse';

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Template Library</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
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
            <div className="mt-4 text-xs font-semibold text-slate-400 uppercase">{template.category}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TemplatesScreen;
