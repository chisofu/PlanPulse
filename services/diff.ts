import type { DiffResult } from "./ingestionTypes";

export function diffByKey<T>(current: T[], next: T[], keySelector: (record: T) => string): DiffResult<T> {
  const currentMap = new Map<string, T>();
  current.forEach((record) => currentMap.set(keySelector(record), record));

  const nextMap = new Map<string, T>();
  next.forEach((record) => nextMap.set(keySelector(record), record));

  const added: T[] = [];
  const removed: T[] = [];
  const updated: { previous: T; next: T }[] = [];

  nextMap.forEach((value, key) => {
    if (!currentMap.has(key)) {
      added.push(value);
    } else {
      const existing = currentMap.get(key)!;
      if (JSON.stringify(existing) !== JSON.stringify(value)) {
        updated.push({ previous: existing, next: value });
      }
    }
  });

  currentMap.forEach((value, key) => {
    if (!nextMap.has(key)) {
      removed.push(value);
    }
  });

  return { added, removed, updated };
}
