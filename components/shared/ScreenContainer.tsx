import React from 'react';

export const ScreenContainer: React.FC<{ title: string; description?: string; actions?: React.ReactNode }> = ({
  title,
  description,
  actions,
  children,
}) => (
  <div className="p-4 md:p-8 space-y-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
        {description && <p className="text-sm text-slate-500 max-w-2xl">{description}</p>}
      </div>
      {actions}
    </div>
    {children}
  </div>
);
