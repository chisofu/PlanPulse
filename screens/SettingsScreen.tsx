import React, { useMemo, useState } from 'react';
import { Mode } from '../types';
import { themeTokens } from '../styles/tokens';

type NotificationSettingKey = 'email' | 'sms' | 'inApp' | 'weeklyDigest';

type NotificationSettings = Record<NotificationSettingKey, boolean>;

type Integration = {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  lastSyncedAt?: string;
};

const defaultNotifications: NotificationSettings = {
  email: true,
  sms: false,
  inApp: true,
  weeklyDigest: true,
};

const integrations: Integration[] = [
  {
    id: 'ifmis',
    name: 'IFMIS Vendor Registry',
    description: 'Sync vendor accreditation data and compliance certificates.',
    connected: true,
    lastSyncedAt: '2025-01-05T08:30:00Z',
  },
  {
    id: 'smartpay',
    name: 'SmartPay Disbursements',
    description: 'Push approved purchase orders directly for payment processing.',
    connected: false,
  },
  {
    id: 'zppa',
    name: 'ZPPA Bulletin',
    description: 'Automate benchmark imports from the quarterly bulletin releases.',
    connected: true,
    lastSyncedAt: '2024-12-29T17:00:00Z',
  },
];

const SettingsScreen: React.FC = () => {
  const [displayName, setDisplayName] = useState('Procurement Lead');
  const [defaultSurface, setDefaultSurface] = useState<Mode>(Mode.PricePulse);
  const [timezone, setTimezone] = useState('Africa/Lusaka');
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);
  const [autoSave, setAutoSave] = useState(true);

  const theme = useMemo(() => themeTokens.modeStyles.pricepulse, []);

  const toggleNotification = (key: NotificationSettingKey) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const formatDate = (value?: string) => {
    if (!value) return 'Never';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Never';
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Workspace Settings</h2>
        <p className="text-slate-500 mt-1 max-w-2xl">
          Tailor how your team collaborates with merchants, receives alerts, and connects PlanPulse to the
          procurement stack.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
        <header>
          <h3 className="text-xl font-semibold text-slate-800">Account preferences</h3>
          <p className="text-sm text-slate-500">Control how your profile appears across shared surfaces.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-slate-600">Display name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Your name"
            />
          </label>
          <label className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-slate-600">Default workspace</span>
            <select
              value={defaultSurface}
              onChange={(event) => setDefaultSurface(event.target.value as Mode)}
              className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value={Mode.PricePulse}>PricePulse</option>
              <option value={Mode.BudgetPulse}>BudgetPulse</option>
            </select>
          </label>
          <label className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-slate-600">Timezone</span>
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="Africa/Lusaka">Africa/Lusaka (GMT+2)</option>
              <option value="Africa/Johannesburg">Africa/Johannesburg (GMT+2)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
            </select>
          </label>
          <label className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-xl bg-slate-50">
            <div>
              <p className="text-sm font-semibold text-slate-700">Auto-save workspace changes</p>
              <p className="text-xs text-slate-500">Persist updates to lists and quotes without manual prompts.</p>
            </div>
            <button
              type="button"
              onClick={() => setAutoSave((value) => !value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                autoSave ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
              aria-pressed={autoSave}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  autoSave ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm"
            style={{ backgroundColor: theme.accentBg }}
          >
            Save preferences
          </button>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
        <header>
          <h3 className="text-xl font-semibold text-slate-800">Notification centre</h3>
          <p className="text-sm text-slate-500">Choose how PlanPulse keeps you in sync with merchant activity.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            Object.entries(notifications) as [NotificationSettingKey, boolean][]
          ).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleNotification(key)}
              className={`flex items-start justify-between border rounded-xl px-4 py-3 text-left transition-colors shadow-sm ${
                value ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
              aria-pressed={value}
            >
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {key === 'email' && 'Email alerts'}
                  {key === 'sms' && 'SMS notifications'}
                  {key === 'inApp' && 'In-app banners'}
                  {key === 'weeklyDigest' && 'Weekly digest'}
                </p>
                <p className="text-xs text-slate-500">
                  {key === 'email' && 'Quote approvals, merchant invitations, and onboarding actions.'}
                  {key === 'sms' && 'Time-sensitive escalations for stalled workflows.'}
                  {key === 'inApp' && 'Surface updates directly in the navigation alerts tray.'}
                  {key === 'weeklyDigest' && 'Summary of merchant performance and outstanding follow-ups.'}
                </p>
              </div>
              <span
                className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                  value ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {value ? 'On' : 'Off'}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">Integrations</h3>
            <p className="text-sm text-slate-500">Connect external systems to keep data flowing in both directions.</p>
          </div>
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm"
            style={{ backgroundColor: theme.accentBg }}
          >
            Browse marketplace
          </button>
        </header>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="border border-slate-200 rounded-xl px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <h4 className="text-lg font-semibold text-slate-800">{integration.name}</h4>
                <p className="text-sm text-slate-500 max-w-xl">{integration.description}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Last synced: {formatDate(integration.lastSyncedAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    integration.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {integration.connected ? 'Connected' : 'Not connected'}
                </span>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                    integration.connected
                      ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      : 'border-transparent text-white'
                  }`}
                  style={{ backgroundColor: integration.connected ? 'transparent' : theme.accentBg }}
                >
                  {integration.connected ? 'Manage' : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SettingsScreen;
