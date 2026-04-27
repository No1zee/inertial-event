import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const CACHE_DURATION = 5 * 60 * 1000;

const originalGet = axios.Axios.prototype.get;

// @ts-expect-error - Overriding axios get for caching
axios.Axios.prototype.get = async function <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const cacheKey = `${url}?${JSON.stringify(config?.params || {})}`.replace(/['"]/g, '');

  const cached = memoryCache.get(cacheKey) as CacheEntry<T> | undefined;
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return Promise.resolve({
      data: cached.data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config || {},
    } as unknown as AxiosResponse<T>);
  }

  try {
    const response = await (originalGet as (...args: unknown[]) => Promise<AxiosResponse<T>>).call(this, url, config);
    memoryCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });
    return response;
  } catch (error) {
    if (cached) {
      return Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK (cached)',
        headers: {},
        config: config || {},
      } as unknown as AxiosResponse<T>);
    }
    throw error;
  }
};

export function clearApiCache(): void {
  memoryCache.clear();
}

export default axios;
