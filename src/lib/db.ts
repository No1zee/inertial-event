import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface NovaStreamDB extends DBSchema {
  preferences: {
    key: string;
    value: unknown;
  };
  cache: {
    key: string;
    value: {
      data: unknown;
      timestamp: number;
      ttl?: number;
    };
  };
  userData: {
    key: string;
    value: unknown;
  };
  queries: {
    key: string;
    value: {
      data: unknown;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<NovaStreamDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<NovaStreamDB>('novastream', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences');
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache');
        }
        if (!db.objectStoreNames.contains('userData')) {
          db.createObjectStore('userData');
        }
        if (!db.objectStoreNames.contains('queries')) {
          db.createObjectStore('queries');
        }
      },
    });
  }
  return dbPromise;
};

const createStorage = (storeName: keyof NovaStreamDB) => ({
  getItem: async (name: string): Promise<string | null> => {
    const db = await getDB();
    const item = await db.get(storeName as 'preferences', name);
    return item ? JSON.stringify(item) : null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const db = await getDB();
    await db.put(storeName as 'preferences', JSON.parse(value), name);
  },
  removeItem: async (name: string): Promise<void> => {
    const db = await getDB();
    await db.delete(storeName as 'preferences', name);
  },
});

export const preferencesStorage = createStorage('preferences');
export const userDataStorage = createStorage('userData');
export const cacheStorage = createStorage('cache');
export const queriesStorage = createStorage('queries');

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('preferences');
  await db.clear('cache');
  await db.clear('userData');
  await db.clear('queries');
}

export async function getStorageUsage(): Promise<{
  preferences: number;
  cache: number;
  userData: number;
  queries: number;
}> {
  const db = await getDB();
  return {
    preferences: await db.count('preferences'),
    cache: await db.count('cache'),
    userData: await db.count('userData'),
    queries: await db.count('queries'),
  };
}

export { getDB };
