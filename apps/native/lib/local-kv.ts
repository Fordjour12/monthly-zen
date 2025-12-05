import { createMMKV } from 'react-native-mmkv';

// Define CacheEntry interface locally since it's not exported from API
export interface CacheEntry<T> {
   data: T;
   timestamp: number;
   ttl: number; // Time to live in milliseconds
}

// Create MMKV instances for different data types
export const storage = createMMKV({
   id: 'my-better-t-app-storage',
   encryptionKey: 'my-encryption-key-123', // In production, use secure key
});

export const secureStorage = createMMKV({
   id: 'my-better-t-app-secure',
   encryptionKey: 'secure-encryption-key-456', // In production, use secure key
});

// Storage categories
export enum StorageCategory {
   CACHE = 'cache',
   USER_PREFS = 'user:prefs',
   SESSION = 'session',
   OFFLINE = 'offline',
   SECURE = 'secure',
}

// TTL constants (in milliseconds)
export const STORAGE_TTL = {
   CACHE_AI_RESPONSE: 2 * 60 * 60 * 1000, // 2 hours
   CACHE_USER_CONTEXT: 15 * 60 * 1000, // 15 minutes
   CACHE_TASKS_DATA: 10 * 60 * 1000, // 10 minutes
   CACHE_HABITS_DATA: 30 * 60 * 1000, // 30 minutes
   SESSION_STATE: 30 * 60 * 1000, // 30 minutes
   USER_PREFERENCES: 0, // Persistent (no expiration)
   OFFLINE_DATA: 0, // Persistent until sync
} as const;

export interface StorageStats {
   totalKeys: number;
   cacheSize: number; // MB
   hitRate: number; // percentage
   missRate: number; // percentage
   evictionCount: number;
   categoryStats: Record<StorageCategory, number>;
}

export interface StorageConfig {
   maxCacheSize?: number; // MB
   cleanupInterval?: number; // ms
   enableMetrics?: boolean;
   compressionEnabled?: boolean;
}

class LocalKVService {
   private config: StorageConfig;
   private stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
   };

   constructor(config: StorageConfig = {}) {
      this.config = {
         maxCacheSize: 50, // 50MB default
         cleanupInterval: 5 * 60 * 1000, // 5 minutes
         enableMetrics: true,
         compressionEnabled: false,
         ...config,
      };

      // Start cleanup interval
      if (this.config.cleanupInterval) {
         setInterval(() => {
            this.cleanup();
         }, this.config.cleanupInterval);
      }
   }

   /**
    * Get value from storage with category and TTL support
    */
   get<T>(key: string, category: StorageCategory = StorageCategory.CACHE): T | null {
      try {
         const fullKey = this.buildKey(key, category);
         const isSecure = category === StorageCategory.SECURE;
         const mmkv = isSecure ? secureStorage : storage;

         // Check if key exists
         if (!mmkv.contains(fullKey)) {
            this.stats.misses++;
            return null;
         }

         // Get the stored entry
         const storedValue = mmkv.getString(fullKey);
         if (!storedValue) {
            this.stats.misses++;
            return null;
         }

         // Parse the entry
         const entry: CacheEntry<T> = JSON.parse(storedValue);

         // Check if entry has expired
         if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl) {
            mmkv.remove(fullKey);
            this.stats.misses++;
            return null;
         }

         this.stats.hits++;
         return entry.data as T;
      } catch (error) {
         console.error('LocalKV get error:', error);
         this.stats.misses++;
         return null;
      }
   }

   /**
    * Set value in storage with TTL
    */
   set<T>(
      key: string,
      data: T,
      ttlMs: number = STORAGE_TTL.CACHE_AI_RESPONSE,
      category: StorageCategory = StorageCategory.CACHE
   ): boolean {
      try {
         const fullKey = this.buildKey(key, category);
         const isSecure = category === StorageCategory.SECURE;
         const mmkv = isSecure ? secureStorage : storage;

         const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttlMs,
         };

         const serialized = JSON.stringify(entry);
         mmkv.set(fullKey, serialized);

         // Check storage size and cleanup if needed
         this.checkStorageSize();

         return true;
      } catch (error) {
         console.error('LocalKV set error:', error);
         return false;
      }
   }

   /**
    * Delete specific key
    */
   delete(key: string, category: StorageCategory = StorageCategory.CACHE): boolean {
      try {
         const fullKey = this.buildKey(key, category);
         const isSecure = category === StorageCategory.SECURE;
         const mmkv = isSecure ? secureStorage : storage;

         return mmkv.remove(fullKey);
      } catch (error) {
         console.error('LocalKV delete error:', error);
         return false;
      }
   }

   /**
    * Clear all keys in a category or all storage
    */
   clear(category?: StorageCategory): boolean {
      try {
         if (category) {
            const isSecure = category === StorageCategory.SECURE;
            const mmkv = isSecure ? secureStorage : storage;
            const prefix = `${category}:`;

            // Get all keys and delete those with the category prefix
            const allKeys = mmkv.getAllKeys();
            const keysToDelete = allKeys.filter(key => key.startsWith(prefix));

            keysToDelete.forEach(key => mmkv.remove(key));
            return true;
         } else {
            storage.clearAll();
            secureStorage.clearAll();
            return true;
         }
      } catch (error) {
         console.error('LocalKV clear error:', error);
         return false;
      }
   }

   /**
    * Clean up expired entries
    */
   cleanup(): number {
      let cleaned = 0;
      const now = Date.now();

      try {
         // Clean regular storage
         cleaned += this.cleanupStorage(storage, now);

         // Clean secure storage
         cleaned += this.cleanupStorage(secureStorage, now);

         this.stats.evictions += cleaned;

         if (cleaned > 0) {
            console.log(`LocalKV cleanup: removed ${cleaned} expired entries`);
         }
      } catch (error) {
         console.error('LocalKV cleanup error:', error);
      }

      return cleaned;
   }

   /**
    * Get storage statistics
    */
   getStats(): StorageStats {
      const totalKeys = storage.getAllKeys().length + secureStorage.getAllKeys().length;
      const totalOperations = this.stats.hits + this.stats.misses;
      const hitRate = totalOperations > 0 ? (this.stats.hits / totalOperations) * 100 : 0;
      const missRate = totalOperations > 0 ? (this.stats.misses / totalOperations) * 100 : 0;

      // Calculate category stats
      const categoryStats: Record<StorageCategory, number> = {
         [StorageCategory.CACHE]: 0,
         [StorageCategory.USER_PREFS]: 0,
         [StorageCategory.SESSION]: 0,
         [StorageCategory.OFFLINE]: 0,
         [StorageCategory.SECURE]: 0,
      };

      // Count keys by category
      storage.getAllKeys().forEach(key => {
         Object.values(StorageCategory).forEach(category => {
            if (key.startsWith(`${category}:`)) {
               categoryStats[category]++;
            }
         });
      });

      secureStorage.getAllKeys().forEach(key => {
         if (key.startsWith(`${StorageCategory.SECURE}:`)) {
            categoryStats[StorageCategory.SECURE]++;
         }
      });

      return {
         totalKeys,
         cacheSize: this.estimateStorageSize(),
         hitRate: Math.round(hitRate * 100) / 100,
         missRate: Math.round(missRate * 100) / 100,
         evictionCount: this.stats.evictions,
         categoryStats,
      };
   }

   /**
    * Check if key exists
    */
   contains(key: string, category: StorageCategory = StorageCategory.CACHE): boolean {
      try {
         const fullKey = this.buildKey(key, category);
         const isSecure = category === StorageCategory.SECURE;
         const mmkv = isSecure ? secureStorage : storage;

         return mmkv.contains(fullKey);
      } catch (error) {
         console.error('LocalKV contains error:', error);
         return false;
      }
   }

   /**
    * Get all keys in a category
    */
   getKeys(category: StorageCategory): string[] {
      try {
         const isSecure = category === StorageCategory.SECURE;
         const mmkv = isSecure ? secureStorage : storage;
         const prefix = `${category}:`;

         return mmkv.getAllKeys()
            .filter(key => key.startsWith(prefix))
            .map(key => key.replace(prefix, ''));
      } catch (error) {
         console.error('LocalKV getKeys error:', error);
         return [];
      }
   }

   /**
    * Migrate data from one key to another
    */
   migrate<T>(
      fromKey: string,
      toKey: string,
      fromCategory: StorageCategory = StorageCategory.CACHE,
      toCategory: StorageCategory = StorageCategory.CACHE
   ): boolean {
      try {
         const data = this.get<T>(fromKey, fromCategory);
         if (data !== null) {
            // Get the original TTL
            const fullFromKey = this.buildKey(fromKey, fromCategory);
            const isSecure = fromCategory === StorageCategory.SECURE;
            const mmkv = isSecure ? secureStorage : storage;

            if (mmkv.contains(fullFromKey)) {
               const storedValue = mmkv.getString(fullFromKey);
               if (storedValue) {
                  const entry: CacheEntry<T> = JSON.parse(storedValue);
                  this.set(toKey, data, entry.ttl, toCategory);
                  this.delete(fromKey, fromCategory);
                  return true;
               }
            }
         }
         return false;
      } catch (error) {
         console.error('LocalKV migrate error:', error);
         return false;
      }
   }

   /**
    * Build full key with category prefix
    */
   private buildKey(key: string, category: StorageCategory): string {
      return `${category}:${key}`;
   }

/**
     * Cleanup expired entries in a storage instance
     */
   private cleanupStorage(mmkv: ReturnType<typeof createMMKV>, now: number): number {
      let cleaned = 0;

      mmkv.getAllKeys().forEach((key: string) => {
         try {
            const storedValue = mmkv.getString(key);
            if (storedValue) {
               const entry: CacheEntry<any> = JSON.parse(storedValue);

               // Check if entry has expired
               if (entry.ttl > 0 && now - entry.timestamp > entry.ttl) {
                  mmkv.remove(key);
                  cleaned++;
               }
            }
         } catch (error) {
            // If we can't parse the entry, remove it
            mmkv.remove(key);
            cleaned++;
         }
      });

      return cleaned;
   }

   /**
    * Estimate storage size in MB
    */
   private estimateStorageSize(): number {
      try {
         // This is a rough estimation
         const regularKeys = storage.getAllKeys();
         const secureKeys = secureStorage.getAllKeys();

         let totalSize = 0;

         regularKeys.forEach(key => {
            const value = storage.getString(key);
            if (value) {
               totalSize += value.length;
            }
         });

         secureKeys.forEach(key => {
            const value = secureStorage.getString(key);
            if (value) {
               totalSize += value.length;
            }
         });

         // Convert to MB (assuming 1 byte per character, rough estimation)
         return Math.round((totalSize / (1024 * 1024)) * 100) / 100;
      } catch (error) {
         console.error('Error estimating storage size:', error);
         return 0;
      }
   }

   /**
    * Check storage size and cleanup if needed
    */
   private checkStorageSize(): void {
      if (this.config.maxCacheSize) {
         const currentSize = this.estimateStorageSize();

         if (currentSize > this.config.maxCacheSize) {
            console.log(`Storage size (${currentSize}MB) exceeds limit (${this.config.maxCacheSize}MB), running cleanup`);

            // First cleanup expired entries
            this.cleanup();

            // If still over limit, remove oldest entries
            const newSize = this.estimateStorageSize();
            if (newSize > this.config.maxCacheSize) {
               this.evictOldestEntries();
            }
         }
      }
   }

   /**
    * Evict oldest entries to free up space
    */
   private evictOldestEntries(): void {
      try {
         const allEntries: Array<{ key: string; timestamp: number; mmkv: ReturnType<typeof createMMKV> }> = [];

         // Collect all entries with their timestamps
         [storage, secureStorage].forEach(mmkv => {
            mmkv.getAllKeys().forEach((key: string) => {
               try {
                  const value = mmkv.getString(key);
                  if (value) {
                     const entry: CacheEntry<any> = JSON.parse(value);
                     allEntries.push({
                        key,
                        timestamp: entry.timestamp,
                        mmkv,
                     });
                  }
               } catch (error) {
                  // Invalid entry, remove it
                  mmkv.remove(key);
               }
            });
         });

         // Sort by timestamp (oldest first)
         allEntries.sort((a, b) => a.timestamp - b.timestamp);

         // Remove oldest entries until we're under the limit
         const targetSize = this.config.maxCacheSize! * 0.8; // 80% of max size
         let currentSize = this.estimateStorageSize();

         for (const entry of allEntries) {
            if (currentSize <= targetSize) break;

            entry.mmkv.remove(entry.key);
            currentSize = this.estimateStorageSize();
            this.stats.evictions++;
         }

         console.log(`Evicted oldest entries to reduce storage size to ${currentSize}MB`);
      } catch (error) {
         console.error('Error evicting oldest entries:', error);
      }
   }
}

// Export singleton instance
export const localKV = new LocalKVService();

// Export convenience functions for common operations
export const cacheAIResponse = <T>(key: string, data: T): boolean => {
   return localKV.set(key, data, STORAGE_TTL.CACHE_AI_RESPONSE, StorageCategory.CACHE);
};

export const getCachedAIResponse = <T>(key: string): T | null => {
   return localKV.get<T>(key, StorageCategory.CACHE);
};

export const setUserPreference = <T>(key: string, data: T): boolean => {
   return localKV.set(key, data, STORAGE_TTL.USER_PREFERENCES, StorageCategory.USER_PREFS);
};

export const getUserPreference = <T>(key: string, defaultValue: T): T => {
   return localKV.get<T>(key, StorageCategory.USER_PREFS) || defaultValue;
};

export const setSecureData = <T>(key: string, data: T): boolean => {
   return localKV.set(key, data, 0, StorageCategory.SECURE);
};

export const getSecureData = <T>(key: string): T | null => {
   return localKV.get<T>(key, StorageCategory.SECURE);
};

export const setOfflineData = <T>(key: string, data: T): boolean => {
   return localKV.set(key, data, STORAGE_TTL.OFFLINE_DATA, StorageCategory.OFFLINE);
};

export const getOfflineData = <T>(key: string): T | null => {
   return localKV.get<T>(key, StorageCategory.OFFLINE);
};
