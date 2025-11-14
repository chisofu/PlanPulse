import React, { Fragment, useMemo, useState } from 'react';
import {
  MOCK_MERCHANTS,
  MOCK_MERCHANT_PROFILES,
  MOCK_QUOTES,
  formatCurrency,
} from '../constants';
import StatusBadge from '../components/shared/StatusBadge';
import { MerchantProfileDetail, MerchantStatus } from '../types';

const onboardingSteps = [
  { key: 'company-info', label: 'Company info', description: 'Legal details and tax certificate captured.' },
  { key: 'documents', label: 'Documents', description: 'Compliance documents uploaded and verified.' },
  { key: 'price-list', label: 'Price list', description: 'Catalogue shared in required template.' },
  { key: 'submit', label: 'Submit', description: 'Final approval and go-live handover.' },
];

const lifecycleProgressIndex: Record<string, number> = {
  'Pending Docs': 2,
  'In Review': 3,
  Approved: 4,
  Live: 4,
  Suspended: 4,
};

const stepClassName = (state: 'complete' | 'current' | 'upcoming' | 'suspended') => {
  switch (state) {
    case 'complete':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'current':
      return 'bg-sky-100 text-sky-700 border border-sky-200';
    case 'suspended':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
};

const statusCopy: Record<MerchantStatus, string> = {
  'Up-to-date': 'All submissions current within the last 30 days.',
  Due: 'Follow-up required soon for fresh uploads.',
  Stale: 'Data lapsed beyond 60 days — escalate with merchant.',
  Suspended: 'Merchant suspended until compliance issues are resolved.',
};

const MerchantsScreen: React.FC = () => {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>(MOCK_MERCHANT_PROFILES[0]?.id ?? '');

  const merchantProfilesById = useMemo(() => {
    return new Map(MOCK_MERCHANT_PROFILES.map((profile) => [profile.id, profile]));
  }, []);

  const selectedProfile: MerchantProfileDetail | undefined = merchantProfilesById.get(selectedMerchantId);

  const onboardingStates = useMemo(() => stepStates(selectedProfile), [selectedProfile]);

  const relatedQuotes = useMemo(
    () =>
      MOCK_QUOTES.filter((quote) =>
        quote.merchants.some((merchant) => merchant.id === selectedMerchantId),
      ),
    [selectedMerchantId],
  );

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const stepStates = (profile?: MerchantProfileDetail) => {
    if (!profile) {
      return onboardingSteps.map(() => 'upcoming' as const);
    }

    if (profile.lifecycleStatus === 'Suspended') {
      return onboardingSteps.map((_, index, array) => (index === array.length - 1 ? 'suspended' : 'complete'));
    }

    const activeStep = lifecycleProgressIndex[profile.lifecycleStatus] ?? 1;
    return onboardingSteps.map((_, index) => {
      const stepNumber = index + 1;
      if (activeStep > stepNumber) return 'complete' as const;
      if (activeStep === stepNumber) return 'current' as const;
      return 'upcoming' as const;
    });
  };

  const renderMerchantStatus = (status?: MerchantStatus) => {
    if (!status) return null;
    return (
      <div className="flex items-center gap-2 mt-2">
        <StatusBadge status={status} />
        <span className="text-xs text-slate-500">{statusCopy[status]}</span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Merchants Directory</h2>
          <p className="text-slate-500 max-w-2xl">
            Review merchant onboarding progress, pricing freshness, and follow up on pending actions.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-1/3 space-y-4">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">All merchants</h3>
          <div className="space-y-3">
            {MOCK_MERCHANTS.map((merchant) => {
              const profile = merchantProfilesById.get(merchant.id);
              const isActive = merchant.id === selectedMerchantId;
              return (
                <button
                  key={merchant.id}
                  type="button"
                  onClick={() => setSelectedMerchantId(merchant.id)}
                  className={`w-full text-left border rounded-xl px-4 py-4 shadow-sm transition-all ${
                    isActive ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={merchant.logoUrl} alt={merchant.name} className="h-10 w-10 rounded-full" />
                    <div>
                      <p className="font-semibold text-slate-800">{merchant.name}</p>
                      {profile && <p className="text-xs text-slate-500">{profile.location}</p>}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {merchant.status && <StatusBadge status={merchant.status} />}
                    {profile && (
                      <span className="text-xs text-slate-500">
                        Last update {formatDate(profile.lastPriceUpdate)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="lg:w-2/3 space-y-6">
          {selectedProfile ? (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedProfile.logoUrl}
                      alt={selectedProfile.name}
                      className="h-16 w-16 rounded-full border border-slate-200"
                    />
                    <div>
                      <h3 className="text-2xl font-semibold text-slate-800">{selectedProfile.name}</h3>
                      <p className="text-sm text-slate-500">{selectedProfile.legalName}</p>
                      <p className="text-xs text-slate-400">{selectedProfile.supplyCategory}</p>
                      {selectedProfile.status && renderMerchantStatus(selectedProfile.status)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>
                      <p className="font-semibold text-slate-700">Primary contact</p>
                      <p>{selectedProfile.primaryContact}</p>
                      <p className="text-xs text-indigo-600">{selectedProfile.contactEmail}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">Cadence</p>
                      <p>Last update: {formatDate(selectedProfile.lastPriceUpdate)}</p>
                      <p>Next reminder: {formatDate(selectedProfile.nextReminderAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-800">Onboarding stepper</h4>
                    <p className="text-sm text-slate-500">Track the structured onboarding milestones for this merchant.</p>
                  </div>
                  <StatusBadge status={selectedProfile.lifecycleStatus} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {onboardingSteps.map((step, index) => {
                    const state = onboardingStates[index];
                    return (
                      <Fragment key={step.key}>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${stepClassName(state)}`}>
                          {step.label}
                        </span>
                        {index < onboardingSteps.length - 1 && <span className="text-slate-400">→</span>}
                      </Fragment>
                    );
                  })}
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                  {onboardingSteps.map((step, index) => (
                    <li key={`${step.key}-detail`} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="font-semibold text-slate-700">{step.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{step.description}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        Status: {onboardingStates[index] === 'complete'
                          ? 'Complete'
                          : onboardingStates[index] === 'current'
                          ? 'In progress'
                          : onboardingStates[index] === 'suspended'
                          ? 'Suspended'
                          : 'Pending'}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-800">Past quotes</h4>
                    <p className="text-sm text-slate-500">Recent quote collaborations linked to this merchant.</p>
                  </div>
                  <span className="text-sm text-slate-500">{relatedQuotes.length} record(s)</span>
                </div>
                {relatedQuotes.length > 0 ? (
                  <div className="space-y-3">
                    {relatedQuotes.map((quote) => (
                      <div key={quote.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">{quote.reference}</p>
                          <p className="text-sm text-slate-500">{quote.listName}</p>
                          <p className="text-xs text-slate-400">Submitted {formatDate(quote.submittedAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={quote.status} />
                          <span className="text-sm font-semibold text-slate-700">
                            {formatCurrency(
                              quote.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-sm text-slate-500">
                    No quotes logged yet for this merchant.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center text-slate-500">
              Select a merchant to view details.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MerchantsScreen;
