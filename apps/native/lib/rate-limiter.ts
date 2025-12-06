import { localKV, StorageCategory } from './local-kv';

export interface RateLimitStatus {
   remaining: number;
   limit: number;
   resetTime: number | null;
   isLimited: boolean;
   timeUntilReset: number | null; // in seconds
}

export interface RateLimitConfig {
   limit: number; // Maximum generations allowed
   windowMs: number; // Time window in milliseconds (2 hours)
   key: string; // Storage key for rate limit data
}

class RateLimitService {
   private config: RateLimitConfig;

   constructor(config: RateLimitConfig) {
      this.config = {
         limit: 20, // Default 20 generations
         windowMs: 2 * 60 * 60 * 1000, // 2 hours
         key: 'plan_generation_rate_limit',
         ...config,
      };
   }

   /**
    * Check current rate limit status
    */
   getStatus(): RateLimitStatus {
      const now = Date.now();
      const data = localKV.get<RateLimitData>(this.config.key, StorageCategory.SESSION);

      if (!data) {
         return {
            remaining: this.config.limit,
            limit: this.config.limit,
            resetTime: null,
            isLimited: false,
            timeUntilReset: null,
         };
      }

      // Check if the window has expired
      if (now - data.windowStart >= this.config.windowMs) {
         // Window expired, reset
         return {
            remaining: this.config.limit,
            limit: this.config.limit,
            resetTime: null,
            isLimited: false,
            timeUntilReset: null,
         };
      }

      const resetTime = data.windowStart + this.config.windowMs;
      const timeUntilReset = Math.max(0, Math.ceil((resetTime - now) / 1000));

      return {
         remaining: Math.max(0, this.config.limit - data.count),
         limit: this.config.limit,
         resetTime,
         isLimited: data.count >= this.config.limit,
         timeUntilReset,
      };
   }

   /**
    * Attempt to consume a generation
    * Returns true if allowed, false if rate limited
    */
   consume(): boolean {
      const now = Date.now();
      const data = localKV.get<RateLimitData>(this.config.key, StorageCategory.SESSION);

      // If no existing data, create new window
      if (!data) {
         const newData: RateLimitData = {
            count: 1,
            windowStart: now,
         };
         localKV.set(this.config.key, newData, this.config.windowMs, StorageCategory.SESSION);
         return true;
      }

      // Check if window has expired
      if (now - data.windowStart >= this.config.windowMs) {
         // Start new window
         const newData: RateLimitData = {
            count: 1,
            windowStart: now,
         };
         localKV.set(this.config.key, newData, this.config.windowMs, StorageCategory.SESSION);
         return true;
      }

      // Check if limit exceeded
      if (data.count >= this.config.limit) {
         return false;
      }

      // Increment count
      const updatedData: RateLimitData = {
         count: data.count + 1,
         windowStart: data.windowStart,
      };
      localKV.set(this.config.key, updatedData, this.config.windowMs, StorageCategory.SESSION);
      return true;
   }

   /**
    * Reset the rate limit (for testing or admin use)
    */
   reset(): void {
      localKV.delete(this.config.key, StorageCategory.SESSION);
   }

   /**
    * Get formatted time until reset
    */
   getFormattedTimeUntilReset(): string {
      const status = this.getStatus();
      if (!status.timeUntilReset) return '';

      const hours = Math.floor(status.timeUntilReset / 3600);
      const minutes = Math.floor((status.timeUntilReset % 3600) / 60);
      const seconds = status.timeUntilReset % 60;

      if (hours > 0) {
         return `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
         return `${minutes}m ${seconds}s`;
      } else {
         return `${seconds}s`;
      }
   }
}

interface RateLimitData {
   count: number;
   windowStart: number;
}

// Export singleton instance for plan generation
export const planGenerationRateLimit = new RateLimitService({
   limit: 25, // Allow 25 generations
   windowMs: 2 * 60 * 60 * 1000, // 2 hours
   key: 'plan_generation_rate_limit',
});

// Export convenience functions
export const checkPlanGenerationLimit = (): RateLimitStatus => {
   return planGenerationRateLimit.getStatus();
};

export const consumePlanGeneration = (): boolean => {
   return planGenerationRateLimit.consume();
};

export const resetPlanGenerationLimit = (): void => {
   planGenerationRateLimit.reset();
};

export const getTimeUntilReset = (): string => {
   return planGenerationRateLimit.getFormattedTimeUntilReset();
};