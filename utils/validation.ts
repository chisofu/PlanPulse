export type FreshnessStatus = 'Up-to-date' | 'Due' | 'Stale' | 'Suspended';

export const calculateDaysBetween = (dateIso: string, referenceIso: string = new Date().toISOString()): number => {
  const date = new Date(dateIso);
  const reference = new Date(referenceIso);
  const diffMs = reference.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export const getFreshnessStatus = (lastUpdated: string): FreshnessStatus => {
  const days = calculateDaysBetween(lastUpdated);
  if (days <= 30) return 'Up-to-date';
  if (days <= 57) return 'Due';
  if (days <= 60) return 'Stale';
  return 'Suspended';
};

export const formatStatusBadge = (status: FreshnessStatus): { label: string; className: string } => {
  switch (status) {
    case 'Up-to-date':
      return { label: 'Up-to-date', className: 'bg-emerald-100 text-emerald-700' };
    case 'Due':
      return { label: 'Refresh due soon', className: 'bg-amber-100 text-amber-700' };
    case 'Stale':
      return { label: 'Stale', className: 'bg-red-100 text-red-700' };
    default:
      return { label: 'Suspended', className: 'bg-slate-200 text-slate-600' };
  }
};
