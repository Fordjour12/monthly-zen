import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localKV, StorageCategory, STORAGE_TTL } from '@/lib/local-kv';
import { orpc } from '@/utils/orpc';

// Custom hook for AI suggestions with local caching
export function useAISuggestions(options: {
   type?: 'plan' | 'briefing' | 'reschedule';
   isApplied?: boolean;
   limit?: number;
   search?: string;
   enabled?: boolean;
} = {}) {
   const { type, isApplied, limit, search, enabled = true } = options;

   return useQuery({
      queryKey: ['ai-suggestions', { type, isApplied, limit, search }],
      queryFn: async () => {
         // Check local cache first
         const cacheKey = `ai-suggestions:${JSON.stringify({ type, isApplied, limit, search })}`;
         const cached = localKV.get(cacheKey, StorageCategory.CACHE);

         if (cached) {
            console.log('🎯 Using cached AI suggestions');
            return cached;
         }

         // Fetch from server
         const result = await orpc.AI.getSuggestions.call({
            type,
            isApplied,
            limit,
            search,
         });

         // Cache the result
         localKV.set(
            cacheKey,
            result,
            STORAGE_TTL.CACHE_TASKS_DATA,
            StorageCategory.CACHE
         );

         return result;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled,
   });
}

// Custom hook for task categorization with local caching
export function useCategorizeTask() {
   return useMutation({
      mutationFn: async ({ text }: { text: string }) => {
         // Check local cache first
         const cacheKey = `categorize:${text}`;
         const cached = localKV.get(cacheKey, StorageCategory.CACHE);

         if (cached) {
            console.log('🎯 Using cached task categorization');
            return cached;
         }

         // Fetch from server
         const result = await orpc.AI.categorizeTask.call({ text });

         // Cache the result
         localKV.set(
            cacheKey,
            result,
            STORAGE_TTL.CACHE_AI_RESPONSE,
            StorageCategory.CACHE
         );

         return result;
      },
   });
}

// Custom hook for generating plans with progress
export function useGeneratePlan() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({
         userGoals,
         onProgress,
         options,
      }: {
         userGoals: string;
         onProgress?: (stage: string, message: string) => void;
         options?: {
            userId?: string;
            model?: string;
         };
      }) => {
         const { userId = 'anonymous', model } = options || {};

         // Simulate progress
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

         try {
            // Always call server API - NO CACHING
            const result = await orpc.AI.generatePlan.call({
               userGoals,
               model,
            });

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });

            return {
               success: true,
               data: result.content,
               cached: false,
               suggestionId: result.suggestionId,
            };
         } catch (error) {
            console.error('❌ Failed to generate plan:', error);

            return {
               success: false,
               error: error instanceof Error ? error.message : 'Unknown error',
            };
         }
      },
   });
}

// Custom hook for regenerating plans with feedback
export function useRegeneratePlan() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({
         originalPlanId,
         regenerationReason,
         onProgress,
         options,
      }: {
         originalPlanId: string;
         regenerationReason: string;
         onProgress?: (stage: string, message: string) => void;
         options?: {
            model?: string;
         };
      }) => {
         const { model } = options || {};

         // Simulate progress
         const stages = [
            { type: 'analyzing', message: 'Analyzing your feedback...', duration: 1500 },
            { type: 'reviewing', message: 'Reviewing original plan...', duration: 1500 },
            { type: 'regenerating', message: 'Regenerating improved plan...', duration: 4000 },
            { type: 'finalizing', message: 'Applying your preferences...', duration: 1500 }
         ];

         // Execute progress simulation
         for (const stage of stages) {
            onProgress?.(stage.type, stage.message);
            await new Promise(resolve => setTimeout(resolve, stage.duration));
         }

         try {
            const result = await orpc.AI.regeneratePlan.call({
               originalPlanId,
               regenerationReason,
               model,
            });

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });

            return {
               success: true,
               data: result.content,
               planId: result.planId,
               improvements: result.improvements,
            };
         } catch (error) {
            console.error('❌ Failed to regenerate plan:', error);

            return {
               success: false,
               error: error instanceof Error ? error.message : 'Unknown error',
            };
         }
      },
   });
}

// Custom hook for user preferences with persistence
export function useUserPreference<T>(key: string, defaultValue: T) {
   const preferenceKey = `user:${key}`;

   return useQuery({
      queryKey: ['user-preference', key],
      queryFn: () => {
         const cached = localKV.get<T>(preferenceKey, StorageCategory.USER_PREFS);
         return cached !== null ? cached : defaultValue;
      },
      staleTime: Infinity, // Never stale for preferences
      initialData: defaultValue,
   });
}

export function useSetUserPreference() {
   const queryClient = useQueryClient();

   return (key: string, value: any) => {
      const preferenceKey = `user:${key}`;

      // Save to local storage
      localKV.set(preferenceKey, value, STORAGE_TTL.USER_PREFERENCES, StorageCategory.USER_PREFS);

      // Update React Query cache
      queryClient.setQueryData(['user-preference', key], value);

      console.log(`💾 User preference saved: ${key} = ${value}`);
   };
}

// Custom hook for offline data management
export function useOfflineData<T>(key: string, queryFn: () => Promise<T>, options: {
   enabled?: boolean;
   staleTime?: number;
} = {}) {
   const { enabled = true, staleTime = 5 * 60 * 1000 } = options;
   const offlineKey = `offline:${key}`;

   return useQuery({
      queryKey: ['offline-data', key],
      queryFn: async () => {
         try {
            // Try to fetch fresh data
            const freshData = await queryFn();

            // Cache for offline use
            localKV.set(offlineKey, freshData, 0, StorageCategory.OFFLINE); // Persistent

            return freshData;
         } catch (error) {
            console.warn('⚠️ Failed to fetch fresh data, trying offline cache');

            // Fallback to offline cache
            const offlineData = localKV.get<T>(offlineKey, StorageCategory.OFFLINE);
            if (offlineData) {
               console.log('📱 Using offline data');
               return offlineData;
            }

            throw error;
         }
      },
      staleTime,
      enabled,
      retry: (failureCount, error) => {
         // Don't retry if we have offline data
         const offlineData = localKV.get<T>(offlineKey, StorageCategory.OFFLINE);
         return failureCount < 3 && !offlineData;
      },
   });
}

// Hook for cache management
export function useCacheManagement() {
   const queryClient = useQueryClient();

   const clearCache = (category?: StorageCategory) => {
      localKV.clear(category);

      // Invalidate all queries if clearing all cache
      if (!category) {
         queryClient.clear();
      } else {
         // Invalidate specific query types based on category
         switch (category) {
            case StorageCategory.CACHE:
               queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
               break;
            case StorageCategory.USER_PREFS:
               queryClient.invalidateQueries({ queryKey: ['user-preference'] });
               break;
            case StorageCategory.OFFLINE:
               queryClient.invalidateQueries({ queryKey: ['offline-data'] });
               break;
         }
      }
   };

   const getStats = () => {
      return localKV.getStats();
   };

   return { clearCache, getStats };
}
