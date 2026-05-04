import { openDB } from 'idb';

const DB_NAME = 'novastream-storage';
const STORE_NAME = 'zustand-store';

/**
 * Creates an asynchronous storage engine for Zustand using IndexedDB.
 * This prevents main-thread blocking during state persistence.
 */
export const createIDBStorage = (name: string) => {
  const getDB = async () => {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  };

  return {
    getItem: async (key: string): Promise<string | null> => {
      const db = await getDB();
      const value = await db.get(STORE_NAME, key);
      return value || null;
    },
    setItem: async (key: string, value: string): Promise<void> => {
      const db = await getDB();
      await db.put(STORE_NAME, value, key);
    },
    removeItem: async (key: string): Promise<void> => {
      const db = await getDB();
      await db.delete(STORE_NAME, key);
    },
  };
};

/**
 * Specialized IDB Storage for large data objects (like API Cache)
 */
export const createLargeDataIDBStorage = (dbName: string, storeName: string = 'entries') => {
  const getDB = async () => {
    return openDB(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      },
    });
  };

  return {
    get: async <T>(key: string): Promise<T | null> => {
      const db = await getDB();
      return (await db.get(storeName, key)) || null;
    },
    set: async (key: string, value: any): Promise<void> => {
      const db = await getDB();
      await db.put(storeName, value, key);
    },
    remove: async (key: string): Promise<void> => {
      const db = await getDB();
      await db.delete(storeName, key);
    },
    clear: async (): Promise<void> => {
      const db = await getDB();
      await db.clear(storeName);
    },
    getAll: async (): Promise<Record<string, any>> => {
      const db = await getDB();
      const keys = await db.getAllKeys(storeName);
      const values = await db.getAll(storeName);
      const result: Record<string, any> = {};
      keys.forEach((key, i) => {
        result[key.toString()] = values[i];
      });
      return result;
    }
  };
};
