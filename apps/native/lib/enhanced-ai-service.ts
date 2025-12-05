import { localKV, StorageCategory, STORAGE_TTL } from './local-kv';
import { orpc } from '../utils/orpc';

// Enhanced AI service with local KV caching
export class EnhancedAIService {
   private static readonly CACHE_PREFIX = 'ai:';

   /**
    * Generate plan with local caching
    */
   static async generatePlan(
      userGoals: string,
      options: {
         userId?: string;
         model?: string;
         forceRefresh?: boolean;
      } = {}
   ) {
      const { userId = 'anonymous', model, forceRefresh = false } = options;

      // Generate cache key
      const cacheKey = this.buildCacheKey('plan', { userGoals, userId, model });

      // Check local cache first
      if (!forceRefresh) {
         const cached = localKV.get(cacheKey, StorageCategory.CACHE);
         if (cached) {
            console.log('🎯 Using cached AI plan');
            return {
               success: true,
               data: cached,
               cached: true,
            };
         }
      }

      try {
         // Call server API
         const result = await orpc.AI.generatePlan.call({
            userGoals,
            model,
         });

         if (result.suggestionId) {
            // Cache the response locally
            localKV.set(
               cacheKey,
               result.content,
               STORAGE_TTL.CACHE_AI_RESPONSE,
               StorageCategory.CACHE
            );

            console.log('💾 AI plan cached locally');
         }

         return {
            success: true,
            data: result.content,
            cached: false,
            suggestionId: result.suggestionId,
         };
      } catch (error) {
         console.error('❌ Failed to generate plan:', error);

         // Try to return stale cache if available
         const staleCache = localKV.get(cacheKey, StorageCategory.CACHE);
         if (staleCache) {
            console.log('🔄 Using stale cache as fallback');
            return {
               success: true,
               data: staleCache,
               cached: true,
               stale: true,
            };
         }

         return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
         };
      }
   }

   /**
    * Generate plan with progress simulation
    */
   static async generatePlanWithProgress(
      userGoals: string,
      onProgress?: (stage: string, message: string) => void,
      options: {
         userId?: string;
         model?: string;
         forceRefresh?: boolean;
      } = {}
   ) {
      const { userId = 'anonymous', model, forceRefresh = false } = options;

      // Simulate progress stages
      const stages = [
         { type: 'validation', message: 'Validating your goals...', duration: 2000 },
         { type: 'context', message: 'Analyzing your current commitments...', duration: 2000 },
         { type: 'generating', message: 'Creating your personalized plan...', duration: 4000 },
         { type: 'finalizing', message: 'Optimizing your monthly plan...', duration: 2000 }
      ];

      // Execute progress simulation
      for (const stage of stages) {
         onProgress?.(stage.type, stage.message);
         await new Promise(resolve => setTimeout(resolve, stage.duration));
      }

      // Generate the actual plan
      const result = await this.generatePlan(userGoals, { userId, model, forceRefresh });

      // Final progress update
      onProgress?.('complete', 'Plan generated successfully!');

      return result;
   }

   /**
    * Categorize a task with local caching
    */
   static async categorizeTask(
      taskText: string,
      options: {
         userId?: string;
         forceRefresh?: boolean;
      } = {}
   ) {
      const { userId = 'anonymous', forceRefresh = false } = options;

      // Generate cache key
      const cacheKey = this.buildCacheKey('categorize', { taskText, userId });

      // Check local cache first
      if (!forceRefresh) {
         const cached = localKV.get(cacheKey, StorageCategory.CACHE);
         if (cached) {
            console.log('🎯 Using cached task categorization');
            return {
               success: true,
               data: cached,
               cached: true,
            };
         }
      }

      try {
         // Call server API
         const result = await orpc.AI.categorizeTask.call({ text: taskText });

         // Cache the response locally
         localKV.set(
            cacheKey,
            result,
            STORAGE_TTL.CACHE_AI_RESPONSE,
            StorageCategory.CACHE
         );

         console.log('💾 Task categorization cached locally');

         return {
            success: true,
            data: result,
            cached: false,
         };
      } catch (error) {
         console.error('❌ Failed to categorize task:', error);

         // Try to return stale cache if available
         const staleCache = localKV.get(cacheKey, StorageCategory.CACHE);
         if (staleCache) {
            console.log('🔄 Using stale cache as fallback');
            return {
               success: true,
               data: staleCache,
               cached: true,
               stale: true,
            };
         }

         return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
         };
      }
   }

   /**
    * Generate weekly summary with local caching
    */
   static async generateWeeklySummary(
      weekData: any,
      options: {
         userId?: string;
         forceRefresh?: boolean;
      } = {}
   ) {
      const { userId = 'anonymous', forceRefresh = false } = options;

      // Generate cache key
      const cacheKey = this.buildCacheKey('summary', { weekData, userId });

      // Check local cache first
      if (!forceRefresh) {
         const cached = localKV.get(cacheKey, StorageCategory.CACHE);
         if (cached) {
            console.log('🎯 Using cached weekly summary');
            return {
               success: true,
               data: cached,
               cached: true,
            };
         }
      }

      try {
         // Call server API
         const result = await orpc.AI.generateWeeklySummary.call({ weekData });

         // Cache the response locally
         localKV.set(
            cacheKey,
            result,
            STORAGE_TTL.CACHE_AI_RESPONSE,
            StorageCategory.CACHE
         );

         console.log('💾 Weekly summary cached locally');

         return {
            success: true,
            data: result,
            cached: false,
         };
      } catch (error) {
         console.error('❌ Failed to generate weekly summary:', error);

         // Try to return stale cache if available
         const staleCache = localKV.get(cacheKey, StorageCategory.CACHE);
         if (staleCache) {
            console.log('🔄 Using stale cache as fallback');
            return {
               success: true,
               data: staleCache,
               cached: true,
               stale: true,
            };
         }

         return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
         };
      }
   }

   /**
    * Get AI suggestions with local caching
    */
   static async getSuggestions(options: {
      userId?: string;
      type?: 'plan' | 'briefing' | 'reschedule';
      isApplied?: boolean;
      limit?: number;
      search?: string;
      forceRefresh?: boolean;
   } = {}) {
      const {
         userId = 'anonymous',
         type,
         isApplied,
         limit,
         search,
         forceRefresh = false
      } = options;

      // Generate cache key
      const cacheKey = this.buildCacheKey('suggestions', { userId, type, isApplied, limit, search });

      // Check local cache first
      if (!forceRefresh) {
         const cached = localKV.get(cacheKey, StorageCategory.CACHE);
         if (cached) {
            console.log('🎯 Using cached suggestions');
            return {
               success: true,
               data: cached,
               cached: true,
            };
         }
      }

      try {
         // Call server API
         const result = await orpc.AI.getSuggestions.call({
            type,
            isApplied,
            limit,
            search,
         });

         // Cache the response locally
         localKV.set(
            cacheKey,
            result,
            STORAGE_TTL.CACHE_TASKS_DATA,
            StorageCategory.CACHE
         );

         console.log('💾 Suggestions cached locally');

         return {
            success: true,
            data: result,
            cached: false,
         };
      } catch (error) {
         console.error('❌ Failed to get suggestions:', error);

         // Try to return stale cache if available
         const staleCache = localKV.get(cacheKey, StorageCategory.CACHE);
         if (staleCache) {
            console.log('🔄 Using stale cache as fallback');
            return {
               success: true,
               data: staleCache,
               cached: true,
               stale: true,
            };
         }

         return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
         };
      }
   }

   /**
    * Clear AI cache
    */
   static clearCache(type?: 'plan' | 'categorize' | 'summary' | 'suggestions') {
      if (type) {
         // Clear specific type
         const keys = localKV.getKeys(StorageCategory.CACHE);
         const keysToDelete = keys.filter(key =>
            key.startsWith(`${this.CACHE_PREFIX}${type}:`)
         );

         keysToDelete.forEach(key => {
            localKV.delete(key, StorageCategory.CACHE);
         });

         console.log(`🗑️ Cleared ${type} cache (${keysToDelete.length} entries)`);
      } else {
         // Clear all AI cache
         const keys = localKV.getKeys(StorageCategory.CACHE);
         const aiKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

         aiKeys.forEach(key => {
            localKV.delete(key, StorageCategory.CACHE);
         });

         console.log(`🗑️ Cleared all AI cache (${aiKeys.length} entries)`);
      }
   }

   /**
    * Get cache statistics
    */
   static getCacheStats() {
      const keys = localKV.getKeys(StorageCategory.CACHE);
      const aiKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      const stats = {
         totalAICacheEntries: aiKeys.length,
         breakdown: {
            plan: aiKeys.filter(key => key.includes(':plan:')).length,
            categorize: aiKeys.filter(key => key.includes(':categorize:')).length,
            summary: aiKeys.filter(key => key.includes(':summary:')).length,
            suggestions: aiKeys.filter(key => key.includes(':suggestions:')).length,
         },
         storageStats: localKV.getStats(),
      };

      return stats;
   }

   /**
    * Build cache key
    */
   private static buildCacheKey(type: string, params: Record<string, any>): string {
      // Create a simple hash of params for the key
      const paramString = JSON.stringify(params, Object.keys(params).sort());
      const hash = this.simpleHash(paramString);
      return `${this.CACHE_PREFIX}${type}:${hash}`;
   }

   /**
    * Simple hash function for cache keys
    */
   private static simpleHash(input: string): string {
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
         const char = input.charCodeAt(i);
         hash = (hash << 5) - hash + char;
         hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36);
   }
}

// Export convenience functions
export const generatePlan = EnhancedAIService.generatePlan.bind(EnhancedAIService);
export const generatePlanWithProgress = EnhancedAIService.generatePlanWithProgress.bind(EnhancedAIService);
export const categorizeTask = EnhancedAIService.categorizeTask.bind(EnhancedAIService);
export const generateWeeklySummary = EnhancedAIService.generateWeeklySummary.bind(EnhancedAIService);
export const getSuggestions = EnhancedAIService.getSuggestions.bind(EnhancedAIService);
export const clearAICache = EnhancedAIService.clearCache.bind(EnhancedAIService);
export const getAICacheStats = EnhancedAIService.getCacheStats.bind(EnhancedAIService);
