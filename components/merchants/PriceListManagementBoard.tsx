import React, { useMemo, useState } from 'react';
import { Mode, PriceListUpload } from '../../types';
import { MOCK_MERCHANT_PROFILES, MOCK_PRICE_LIST_UPLOADS } from '../../constants';
import { getModeTheme } from '../layout/ModeTheme';
import StatusBadge from '../shared/StatusBadge';

const statusBadgeClass: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-600',
  Submitted: 'bg-sky-100 text-sky-700',
  Validating: 'bg-amber-100 text-amber-700',
  Accepted: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
};

const UploadCard: React.FC<{ upload: PriceListUpload }> = ({ upload }) => (
  <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-white shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">{upload.filename}</p>
        <p className="text-xs text-slate-500">Submitted {new Date(upload.submittedAt).toLocaleString()}</p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeClass[upload.status]}`}>
        {upload.status}
      </span>
    </div>
    <p className="text-xs text-slate-500">{upload.itemCount.toLocaleString()} items</p>
    {upload.issues.length > 0 && (
      <div className="space-y-1">
        {upload.issues.map((issue, index) => (
          <div key={`${issue.field}-${index}`} className="text-xs">
            <span className={`font-semibold uppercase ${issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
              {issue.severity}
            </span>{' '}
            <span className="text-slate-600">{issue.message}</span>
            {issue.context && <p className="text-slate-400">{issue.context}</p>}
          </div>
        ))}
      </div>
    )}
  </div>
);

export const PriceListManagementBoard: React.FC<{ mode: Mode }> = ({ mode }) => {
  const theme = getModeTheme(mode);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>(MOCK_MERCHANT_PROFILES[0]?.id ?? '');

  const uploads = useMemo(() => MOCK_PRICE_LIST_UPLOADS[selectedMerchantId] ?? [], [selectedMerchantId]);
  const activeProfile = useMemo(
    () => MOCK_MERCHANT_PROFILES.find((profile) => profile.id === selectedMerchantId),
    [selectedMerchantId],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Price list management</h3>
          <p className="text-sm text-slate-500">Track submissions, validation status, and feedback loops.</p>
        </div>
        <select
          value={selectedMerchantId}
          onChange={(event) => setSelectedMerchantId(event.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm"
        >
          {MOCK_MERCHANT_PROFILES.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
      </div>

      {activeProfile && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-700">{activeProfile.name}</span>
          <StatusBadge status={activeProfile.status} />
          <span className="text-xs text-slate-500">
            Last update {new Date(activeProfile.lastPriceUpdate).toLocaleDateString()}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {uploads.map((upload) => (
          <UploadCard key={upload.id} upload={upload} />
        ))}
        {uploads.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500">
            <p>No uploads yet. Invite the merchant to submit a fresh CSV/XLSX.</p>
          </div>
        )}
      </div>

      <div className={`border border-${theme.accentKey} rounded-xl p-4 bg-white shadow-sm`}>
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Validation playbook</h4>
        <ol className="mt-3 space-y-2 text-sm text-slate-600 list-decimal list-inside">
          <li>Auto-validate schema and bounds immediately after upload.</li>
          <li>Flag ±30% price variance for manual review by admins.</li>
          <li>Promote accepted lists to live catalogues and notify procurement teams.</li>
        </ol>
      </div>
    </div>
  );
};
