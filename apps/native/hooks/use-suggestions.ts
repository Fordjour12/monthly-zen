import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/utils/orpc';
import { getOfflineCachedData, prefetchForOffline } from '@/lib/react-query-persister';

/**
 * Custom hook for fetching AI suggestions with persistence
 */
export function useSuggestions(options: {
   type?: 'plan' | 'briefing' | 'reschedule';
   isApplied?: boolean;
   limit?: number;
   search?: string;
   enabled?: boolean;
} = {}) {
   const queryKey = ['ai', 'suggestions', options] as const;
   
   const {
      data,
      isLoading,
      error,
      refetch,
      isFetching,
   } = useQuery({
      queryKey,
      queryFn: () => orpc.AI.getSuggestions(options),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      enabled: options.enabled !== false,
      retry: 2,
   });

   return {
      suggestions: data?.suggestions || [],
      count: data?.count || 0,
      isLoading,
      error,
      refetch,
      isFetching,
   };
}

/**
 * Custom hook for getting a single suggestion by ID
 */
export function useSuggestion(suggestionId: string, enabled: boolean = true) {
   const queryKey = ['ai', 'suggestion', suggestionId] as const;
   
   const {
      data,
      isLoading,
      error,
      refetch,
   } = useQuery({
      queryKey,
      queryFn: async () => {
         // First try to get from offline cache
         const cached = getOfflineCachedData(queryKey);
         if (cached) {
            return cached;
         }
         
         // If not cached, fetch from server
         return orpc.AI.getSuggestions({}).then(result => 
            result.suggestions.find(s => s.id === suggestionId)
         );
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
      enabled: enabled && !!suggestionId,
   });

   return {
      suggestion: data,
      isLoading,
      error,
      refetch,
   };
}

/**
 * Hook for applying a suggestion
 */
export function useApplySuggestion() {
   const queryClient = useQueryClient();
   
   const applySuggestion = async (suggestionId: string) => {
      try {
         const result = await orpc.AI.applySuggestion({ suggestionId });
         
         // Invalidate and refetch suggestions list
         queryClient.invalidateQueries({ queryKey: ['ai', 'suggestions'] });
         
         // Update the specific suggestion cache
         queryClient.setQueryData(['ai', 'suggestion', suggestionId], result.suggestion);
         
         return result;
      } catch (error) {
         console.error('Failed to apply suggestion:', error);
         throw error;
      }
   };
   
   return {
      applySuggestion,
   };
}

/**
 * Hook for getting plan history
 */
export function usePlanHistory(options: {
   limit?: number;
   month?: string;
   enabled?: boolean;
} = {}) {
   const queryKey = ['ai', 'plan-history', options] as const;
   
   const {
      data,
      isLoading,
      error,
      refetch,
   } = useQuery({
      queryKey,
      queryFn: () => orpc.AI.getPlanHistory(options),
      staleTime: 15 * 60 * 1000, // 15 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
      enabled: options.enabled !== false,
   });

   return {
      plans: data?.plans || [],
      count: data?.count || 0,
      isLoading,
      error,
      refetch,
   };
}

/**
 * Prefetch suggestions for offline use
 */
export function prefetchSuggestions(queryClient: any, options: any = {}) {
   return prefetchForOffline(
      queryClient,
      ['ai', 'suggestions', options],
      () => orpc.AI.getSuggestions(options),
      24 * 60 * 60 * 1000 // 24 hours
   );
}