export interface PersistenceAdapter<T> {
  read(): Promise<T | null>;
  write(payload: T): Promise<void>;
  clear(): Promise<void>;
}

class MemoryAdapter<T> implements PersistenceAdapter<T> {
  private value: T | null = null;

  constructor(private readonly key: string) {}

  async read(): Promise<T | null> {
    return this.value ? clone(this.value) : null;
  }

  async write(payload: T): Promise<void> {
    this.value = clone(payload);
  }

  async clear(): Promise<void> {
    this.value = null;
  }
}

class BrowserStorageAdapter<T> implements PersistenceAdapter<T> {
  constructor(private readonly key: string, private readonly storage: Storage) {}

  async read(): Promise<T | null> {
    const raw = this.storage.getItem(this.key);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`Failed to parse stored value for ${this.key}`, error);
      return null;
    }
  }

  async write(payload: T): Promise<void> {
    this.storage.setItem(this.key, JSON.stringify(payload));
  }

  async clear(): Promise<void> {
    this.storage.removeItem(this.key);
  }
}

export function createPersistenceAdapter<T>(key: string): PersistenceAdapter<T> {
  if (typeof window !== "undefined" && window?.localStorage) {
    return new BrowserStorageAdapter<T>(key, window.localStorage);
  }
  return new MemoryAdapter<T>(key);
}

export function createMemoryAdapter<T>(key: string): PersistenceAdapter<T> {
  return new MemoryAdapter<T>(key);
}

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}
