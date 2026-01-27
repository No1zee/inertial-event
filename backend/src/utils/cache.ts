class Cache {
    private cache: Map<string, { value: any, expires: number }>;

    constructor() {
        this.cache = new Map();
    }

    set(key: string, value: any, ttlSeconds: number = 3600) {
        const expires = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expires });
    }

    get(key: string): any | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    delete(key: string) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }
}

export const cache = new Cache();
