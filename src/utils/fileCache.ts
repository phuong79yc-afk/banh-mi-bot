// LRU cache for JSON files with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class FileCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private ttl: number; // milliseconds
  private maxSize: number;
  
  constructor(ttl: number = 5000, maxSize: number = 100) {
    this.cache = new Map();
    this.ttl = ttl;
    this.maxSize = maxSize;
  }
  
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key: string, data: T): void {
    // LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // Stats for debugging
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}

export const coinsCache = new FileCache<any>(5000); // 5s TTL
export const inventoryCache = new FileCache<any>(5000);
export const cooldownCache = new FileCache<any>(10000); // 10s TTL
