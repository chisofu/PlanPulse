import { ShoppingList, Template, DateRangeFilter } from '../types';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const normalize = (value: string) => value.toLowerCase();

export const fuzzyIncludes = (needle: string, haystack: string) => {
  const query = needle.trim().toLowerCase();
  if (!query) return true;
  const text = normalize(haystack);
  let searchIndex = 0;
  for (const char of query) {
    const foundIndex = text.indexOf(char, searchIndex);
    if (foundIndex === -1) return false;
    searchIndex = foundIndex + 1;
  }
  return true;
};

export const matchesDateRange = (date: string | undefined, range: DateRangeFilter) => {
  if (!range.from && !range.to) return true;
  if (!date) return false;
  const target = new Date(date).setHours(0, 0, 0, 0);
  if (Number.isNaN(target)) return false;
  if (range.from) {
    const fromValue = new Date(range.from).setHours(0, 0, 0, 0);
    if (!Number.isNaN(fromValue) && target < fromValue) return false;
  }
  if (range.to) {
    const toValue = new Date(range.to).setHours(0, 0, 0, 0);
    if (!Number.isNaN(toValue) && target > toValue) return false;
  }
  return true;
};

export const getListStatus = (list: ShoppingList): 'overdue' | 'dueSoon' | 'onTrack' => {
  if (!list.dueDate) {
    return 'onTrack';
  }
  const due = new Date(list.dueDate).setHours(0, 0, 0, 0);
  if (Number.isNaN(due)) return 'onTrack';
  const today = new Date();
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (due < now) return 'overdue';
  if (due - now <= 7 * ONE_DAY_MS) return 'dueSoon';
  return 'onTrack';
};

const getLatestTemplateRefresh = (template: Template) => {
  const variantRefreshes = template.variants
    .map((variant) => new Date(variant.lastRefreshed).getTime())
    .filter((value) => !Number.isNaN(value));
  const metricLastUsed = new Date(template.metrics.lastUsedAt).getTime();
  const allValues = [...variantRefreshes, metricLastUsed].filter((value) => !Number.isNaN(value));
  return allValues.length ? Math.max(...allValues) : undefined;
};

export const getTemplateStatus = (template: Template): 'fresh' | 'stale' => {
  const latest = getLatestTemplateRefresh(template);
  if (!latest) return 'stale';
  const now = Date.now();
  const daysSince = (now - latest) / ONE_DAY_MS;
  return daysSince <= 45 ? 'fresh' : 'stale';
};
