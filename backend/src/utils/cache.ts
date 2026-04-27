import fs from 'fs';
import path from 'path';

interface CacheItem {
  value: unknown;
  expires: number;
}

class PersistentCache {
  private cache: Map<string, CacheItem> = new Map();
  private cacheDir: string;
  private cacheFile: string;
  private dirty = false;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.cacheDir = path.join(process.cwd(), '.cache');
    this.cacheFile = path.join(this.cacheDir, 'app-cache.json');
    this.load();
  }

  private load(): void {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf-8');
        const parsed = JSON.parse(data);
        for (const [key, item] of Object.entries(parsed)) {
          const cacheItem = item as CacheItem;
          if (cacheItem.expires > Date.now()) {
            this.cache.set(key, cacheItem);
          }
        }
        console.log('[Cache] Loaded', this.cache.size, 'items from disk');
      }
    } catch (err) {
      console.error('[Cache] Load error:', err);
    }
  }

  private persist(): void {
    if (!this.dirty) return;
    
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    
    this.saveTimer = setTimeout(() => {
      try {
        const obj: Record<string, CacheItem> = {};
        this.cache.forEach((value, key) => {
          obj[key] = value;
        });
        fs.writeFileSync(this.cacheFile, JSON.stringify(obj, null, 2));
        this.dirty = false;
        console.log('[Cache] Persisted', this.cache.size, 'items to disk');
      } catch (err) {
        console.error('[Cache] Save error:', err);
      }
    }, 5000);
  }

  set(key: string, value: unknown, ttlSeconds: number = 3600): void {
    const expires = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expires });
    this.dirty = true;
    this.persist();
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.dirty = true;
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.dirty = true;
  }

  clear(): void {
    this.cache.clear();
    this.dirty = true;
    this.persist();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cache = new PersistentCache();