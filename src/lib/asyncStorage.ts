import { StateStorage } from 'zustand/middleware';

const createMemoryCache = (): StateStorage => {
  const cache = new Map<string, string>();

  return {
    getItem: (name: string): string | null => {
      return cache.get(name) ?? null;
    },
    setItem: (name: string, value: string): void => {
      cache.set(name, value);
    },
    removeItem: (name: string): void => {
      cache.delete(name);
    },
  };
};

export const memoryStorage = createMemoryCache();

export const createCachingStorage = (storage: Storage): StateStorage => {
  const cached = new Map<string, string>();

  return {
    getItem: (name: string): string | null => {
      const cachedValue = cached.get(name);
      if (cachedValue) return cachedValue;

      const value = storage.getItem(name);
      if (value) {
        cached.set(name, value);
        return value;
      }
      return null;
    },

    setItem: (name: string, value: string): void => {
      cached.set(name, value);
      storage.setItem(name, value);
    },

    removeItem: (name: string): void => {
      cached.delete(name);
      storage.removeItem(name);
    },
  };
};
