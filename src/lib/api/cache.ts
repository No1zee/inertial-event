import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { createLargeDataIDBStorage } from '@/lib/utils/storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

const MEMORY_CACHE = new Map<string, CacheEntry<unknown>>();
const PERSISTENT_CACHE_KEY = 'novastream_api_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour for hard stale
const SWR_DURATION = 15 * 60 * 1000; // 15 minutes for soft stale (revalidate in background)
const CACHE_VERSION = '2.0.0';

const idbStorage = typeof window !== 'undefined' ? createLargeDataIDBStorage('novastream-api-cache') : null;

// Initialize memory cache from IDB on load (Client-side only)
if (typeof window !== 'undefined' && idbStorage) {
  (async () => {
    try {
      // Check legacy localStorage first
      const savedLegacy = localStorage.getItem(PERSISTENT_CACHE_KEY);
      if (savedLegacy) {
        const parsed = JSON.parse(savedLegacy);
        for (const [key, value] of Object.entries(parsed)) {
          await idbStorage.set(key, value);
        }
        localStorage.removeItem(PERSISTENT_CACHE_KEY);
        console.log('📦 Migrated API Cache to IndexedDB');
      }

      const allEntries = await idbStorage.getAll();
      Object.entries(allEntries).forEach(([key, value]) => {
        const entry = value as CacheEntry<unknown>;
        if (entry.version === CACHE_VERSION && Date.now() - entry.timestamp < CACHE_DURATION * 24) {
          MEMORY_CACHE.set(key, entry);
        }
      });
    } catch (e) {
      console.warn('[Cache] Failed to load persistent cache:', e);
    }
  })();
}

async function saveToIDB(key: string, entry: CacheEntry<unknown>) {
  if (idbStorage) {
    try {
      await idbStorage.set(key, entry);
    } catch (e) {
      console.warn('[Cache] IDB write failed:', e);
    }
  }
}

// Global AbortController Manager
const CONTROLLERS = new Map<string, AbortController>();

const originalGet = axios.Axios.prototype.get;

// @ts-expect-error - Overriding axios get for caching and cancellation
axios.Axios.prototype.get = async function <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  // 1. Determine if this request should be managed/canceled
  const isManaged = url.includes('api.themoviedb.org') || url.includes('localhost:5000');
  
  if (!isManaged) {
    return (originalGet as (...args: unknown[]) => Promise<AxiosResponse<T>>).call(this, url, config);
  }

  const cacheKey = `${url}?${JSON.stringify(config?.params || {})}`.replace(/['"]/g, '');
  const cached = MEMORY_CACHE.get(cacheKey) as CacheEntry<T> | undefined;

  const now = Date.now();
  const isHardStale = !cached || now - cached.timestamp > CACHE_DURATION;
  const isSoftStale = cached && now - cached.timestamp > SWR_DURATION;

  // 2. Cancellation Logic: Kill existing request for the same key to avoid duplication
  if (CONTROLLERS.has(cacheKey)) {
    CONTROLLERS.get(cacheKey)?.abort();
    CONTROLLERS.delete(cacheKey);
  }

  const controller = new AbortController();
  CONTROLLERS.set(cacheKey, controller);

  const fetchConfig = {
    ...config,
    signal: config?.signal || controller.signal,
  };

  // 3. Cache Hit Path
  if (cached && !isHardStale) {
    if (isSoftStale) {
      (async () => {
        try {
          const res = await (originalGet as (...args: unknown[]) => Promise<AxiosResponse<T>>).call(this, url, fetchConfig);
          const newEntry = { data: res.data, timestamp: now, version: CACHE_VERSION };
          MEMORY_CACHE.set(cacheKey, newEntry);
          saveToIDB(cacheKey, newEntry);
          CONTROLLERS.delete(cacheKey);
        } catch (e: any) {
          if (e.name !== 'CanceledError') {
            console.debug('[Cache] Background revalidation failed:', e);
          }
        }
      })();
    }

    return Promise.resolve({
      data: cached.data,
      status: 200,
      statusText: 'OK (cached)',
      headers: {},
      config: config || {},
    } as unknown as AxiosResponse<T>);
  }

  // 4. Fresh Fetch Path
  try {
    const response = await (originalGet as (...args: unknown[]) => Promise<AxiosResponse<T>>).call(this, url, fetchConfig);
    const newEntry = {
      data: response.data,
      timestamp: now,
      version: CACHE_VERSION,
    };
    MEMORY_CACHE.set(cacheKey, newEntry);
    saveToIDB(cacheKey, newEntry);
    CONTROLLERS.delete(cacheKey);
    return response;
  } catch (error: any) {
    CONTROLLERS.delete(cacheKey);

    // If fetch fails but we have ANY cached data (even hard-stale), use it as fallback
    if (cached && error.name !== 'CanceledError') {
      console.warn('[Cache] Fetch failed, falling back to expired cache for:', url);
      return Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK (fallback)',
        headers: {},
        config: config || {},
      } as unknown as AxiosResponse<T>);
    }
    throw error;
  }
};

export function clearApiCache(): void {
  MEMORY_CACHE.clear();
  if (typeof window !== 'undefined' && idbStorage) {
    idbStorage.clear();
  }
}

export default axios;
