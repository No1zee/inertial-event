import { openDB } from 'idb';
import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

/**
 * Custom IndexedDB persister for React Query.
 * This ensures movie metadata stays on disk between app restarts,
 * enabling instant "Netflix-style" home screen loading.
 */
export function createIndexedDBPersister(idbValidKey: string = 'react-query-cache'): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      const db = await openDB('novastream-cache', 1, {
        upgrade(db) {
          db.createObjectStore('queries');
        },
      });
      await db.put('queries', client, idbValidKey);
    },
    restoreClient: async () => {
      const db = await openDB('novastream-cache', 1, {
        upgrade(db) {
          db.createObjectStore('queries');
        },
      });
      return await db.get('queries', idbValidKey);
    },
    removeClient: async () => {
      const db = await openDB('novastream-cache', 1, {
        upgrade(db) {
          db.createObjectStore('queries');
        },
      });
      await db.delete('queries', idbValidKey);
    },
  };
}
