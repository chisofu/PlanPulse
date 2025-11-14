import React, { useMemo } from 'react';
import { Mode } from '../../types';
import { MOCK_MERCHANT_PROFILES } from '../../constants';
import { formatStatusBadge, getFreshnessStatus } from '../../utils/validation';
import { getModeTheme } from '../layout/ModeTheme';

const stepOrder = ['Docs', 'Profile', 'Price List', 'Approval'];

const Stepper: React.FC<{ currentStep: number; mode: Mode }> = ({ currentStep, mode }) => {
  const theme = getModeTheme(mode);

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      {stepOrder.map((step, index) => {
        const reached = index <= currentStep;
        return (
          <React.Fragment key={step}>
            <span
              className={`px-2 py-1 rounded-full font-semibold ${
                reached ? `${theme.accentBgClass} text-white` : 'bg-slate-100 text-slate-500'
              }`}
            >
              {step}
            </span>
            {index < stepOrder.length - 1 && <span className="text-slate-400">›</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const statusToStepIndex = (status: string) => {
  switch (status) {
    case 'Pending Docs':
      return 0;
    case 'In Review':
      return 2;
    case 'Approved':
      return 2;
    case 'Live':
      return 3;
    case 'Suspended':
      return 3;
    default:
      return 0;
  }
};

export const MerchantOnboardingDashboard: React.FC<{ mode: Mode }> = ({ mode }) => {
  const theme = getModeTheme(mode);

  const aggregates = useMemo(() => {
    const totals = {
      live: 0,
      dueSoon: 0,
      suspended: 0,
    };

    MOCK_MERCHANT_PROFILES.forEach((profile) => {
      const freshness = getFreshnessStatus(profile.lastPriceUpdate);
      if (profile.lifecycleStatus === 'Live') totals.live += 1;
      if (freshness === 'Due' || freshness === 'Stale') totals.dueSoon += 1;
      if (profile.lifecycleStatus === 'Suspended') totals.suspended += 1;
    });

    return totals;
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`bg-white border border-${theme.accentKey} rounded-xl p-4 shadow-sm`}>
          <p className="text-xs uppercase text-slate-500 font-semibold">Live merchants</p>
          <p className="text-3xl font-bold text-slate-900">{aggregates.live}</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-500 font-semibold">Refresh due within 30 days</p>
          <p className="text-3xl font-bold text-slate-900">{aggregates.dueSoon}</p>
        </div>
        <div className="bg-white border border-red-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-500 font-semibold">Suspended</p>
          <p className="text-3xl font-bold text-slate-900">{aggregates.suspended}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_MERCHANT_PROFILES.map((profile) => {
          const freshness = getFreshnessStatus(profile.lastPriceUpdate);
          const badge = formatStatusBadge(freshness);
          const reminderDays = Math.max(0, Math.ceil((new Date(profile.nextReminderAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

          return (
            <div key={profile.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={profile.logoUrl} alt={profile.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">{profile.name}</h4>
                    <p className="text-sm text-slate-500">{profile.legalName}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border border-slate-200 text-slate-600`}>
                  {profile.lifecycleStatus}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className={`px-2 py-1 rounded-full font-semibold ${badge.className}`}>{badge.label}</span>
                <span>Last price update {new Date(profile.lastPriceUpdate).toLocaleDateString()}</span>
                <span>Reminder in {reminderDays} day(s)</span>
              </div>

              <div className="text-sm text-slate-600">
                <p>{profile.supplyCategory}</p>
                <p>{profile.location}</p>
                <p>
                  Contact: <span className="font-semibold">{profile.primaryContact}</span> • {profile.contactEmail}
                </p>
              </div>

              <Stepper currentStep={statusToStepIndex(profile.lifecycleStatus)} mode={mode} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
