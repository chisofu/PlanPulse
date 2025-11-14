import React from 'react';
import { Mode } from '../../types';
import { useZPPAImport } from '../../hooks/useZPPAImport';
import { getModeTheme } from '../layout/ModeTheme';
import { ValidationIssue } from '../../types';

const renderSeverityBadge = (issue: ValidationIssue) => {
  const base = 'px-2 py-1 rounded-full text-xs font-semibold';
  switch (issue.severity) {
    case 'error':
      return <span className={`${base} bg-red-100 text-red-700`}>Error</span>;
    case 'warning':
      return <span className={`${base} bg-amber-100 text-amber-700`}>Warning</span>;
    default:
      return <span className={`${base} bg-slate-100 text-slate-600`}>Info</span>;
  }
};

export const ZPPAImportPanel: React.FC<{ mode: Mode }> = ({ mode }) => {
  const { batches, isLoading, activeBatch, promote, refresh, rollback, triggerValidation, selectBatch } =
    useZPPAImport();
  const theme = getModeTheme(mode);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">ZPPA Imports</h3>
          <button
            onClick={refresh}
            className={`text-sm font-semibold px-3 py-1 rounded-lg border border-slate-200 hover:border-${theme.accentKey}`}
          >
            Refresh
          </button>
        </div>
        <p className="text-sm text-slate-600">Audit trail of staging → production imports with validation states.</p>
        <div className="space-y-3">
          {batches.map((batch) => (
            <button
              key={batch.id}
              onClick={() => selectBatch(batch.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                activeBatch?.id === batch.id ? `${theme.accentBgClass} bg-opacity-10 border-${theme.accentKey}` : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-sm font-semibold text-slate-700">{batch.filename}</p>
              <p className="text-xs text-slate-500">Uploaded {new Date(batch.uploadedAt).toLocaleString()}</p>
              <p className="text-xs mt-1 font-semibold uppercase text-slate-500">{batch.status}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {activeBatch ? (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h4 className="text-xl font-semibold text-slate-900">{activeBatch.filename}</h4>
                <p className="text-sm text-slate-500">
                  {activeBatch.recordCount.toLocaleString()} records • Average delta{' '}
                  {activeBatch.priceAverageDelta > 0 ? '+' : ''}
                  {(activeBatch.priceAverageDelta * 100).toFixed(1)}%
                </p>
                {activeBatch.promotedAt && (
                  <p className="text-xs text-slate-400">Promoted {new Date(activeBatch.promotedAt).toLocaleString()}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => triggerValidation(activeBatch.id)}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                    isLoading ? 'opacity-60' : `border-${theme.accentKey} text-${theme.accentKey}`
                  }`}
                >
                  Run validation
                </button>
                <button
                  onClick={() => promote(activeBatch.id)}
                  disabled={isLoading || activeBatch.status === 'Published'}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                    isLoading || activeBatch.status === 'Published'
                      ? 'bg-slate-200 text-slate-500'
                      : `${theme.accentBgClass} text-white`
                  }`}
                >
                  Promote to production
                </button>
                <button
                  onClick={() => rollback(activeBatch.id)}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-red-200 text-red-600 hover:border-red-300"
                >
                  Rollback
                </button>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Validation Summary</h5>
              <div className="mt-3 space-y-3">
                {activeBatch.validationSummary.issues.length === 0 ? (
                  <p className="text-sm text-emerald-600 font-semibold">All checks passed with no outstanding warnings.</p>
                ) : (
                  activeBatch.validationSummary.issues.map((issue, index) => (
                    <div
                      key={`${issue.field}-${index}`}
                      className="border border-slate-200 rounded-lg p-3 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">{issue.field}</span>
                        {renderSeverityBadge(issue)}
                      </div>
                      <p className="text-sm text-slate-600">{issue.message}</p>
                      {issue.context && <p className="text-xs text-slate-400">{issue.context}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs uppercase font-semibold text-slate-500">Uploaded By</p>
                <p className="font-semibold text-slate-800">{activeBatch.uploadedBy}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs uppercase font-semibold text-slate-500">Uploaded At</p>
                <p>{new Date(activeBatch.uploadedAt).toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs uppercase font-semibold text-slate-500">Current Status</p>
                <p className="font-semibold text-slate-800">{activeBatch.status}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-500">
            <p className="font-semibold text-slate-600">Select a batch to see validation details.</p>
          </div>
        )}
      </div>
    </div>
  );
};
