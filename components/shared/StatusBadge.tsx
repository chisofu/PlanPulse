import React from 'react';
import { POStatus, QuoteStatus } from '../../types';

export type StatusBadgeStatus = QuoteStatus | POStatus | string;

const statusColors: Record<string, string> = {
  [QuoteStatus.Draft]: 'bg-slate-500',
  [QuoteStatus.Submitted]: 'bg-blue-500',
  [QuoteStatus.ProformaReady]: 'bg-indigo-500',
  [QuoteStatus.Acknowledged]: 'bg-amber-500',
  [QuoteStatus.Finalized]: 'bg-green-500',
  [QuoteStatus.POIssued]: 'bg-emerald-600',
  [QuoteStatus.Withdrawn]: 'bg-rose-500',
  [POStatus.Issued]: 'bg-blue-500',
  [POStatus.Fulfilled]: 'bg-green-500',
  [POStatus.Partial]: 'bg-amber-500',
  [POStatus.Delayed]: 'bg-rose-500',
  Live: 'bg-emerald-600',
  Approved: 'bg-indigo-600',
  'In Review': 'bg-amber-600',
  'Pending Docs': 'bg-slate-500',
  'Up-to-date': 'bg-emerald-500',
  Due: 'bg-amber-500',
  Stale: 'bg-orange-500',
  Suspended: 'bg-rose-600',
};

interface StatusBadgeProps {
  status: StatusBadgeStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const colorClass = statusColors[status] ?? 'bg-slate-400';
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-white ${colorClass} ${
        className ?? ''
      }`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
