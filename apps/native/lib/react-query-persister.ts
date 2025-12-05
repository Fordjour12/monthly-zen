import { QueryClient, QueryKey } from '@tanstack/react-query';
import { localKV, StorageCategory } from './local-kv';

/**
 * React Query persistence adapter for MMKV
 * Based on https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_REACT_QUERY.md
 */

export interface PersistedQuery {
  queryHash: string;
  queryKey: QueryKey;
  state: {
    data: any;
    dataUpdatedAt: number;
    error: any;
    errorUpdatedAt: number;
    fetchFailureCount: number;
    fetchFailureReason: any;
    fetchMeta: any;
    isInvalidated: boolean;
    isFetching: boolean;
    isPaused: boolean;
    isPlaceholderData: boolean;
    isRefetching: boolean;
    isStale: boolean;
    isLoading: boolean;
    isLoadingError: boolean;
    isFetched: boolean;
    isFetchedAfterMount: boolean;
    isFetchingNextPage: boolean;
    isFetchNextPageError: boolean;
    isRefetchError: boolean;
    isInitialLoading: boolean;
    isPreviousData: boolean;
    refetch: any;
    remove: any;
    status: 'pending' | 'error' | 'success';
    fetchStatus: 'fetching' | 'paused' | 'idle';
  };
}

/**
 * Creates a persistence adapter for React Query using MMKV
 */
export function createMMKVPersister() {
  return {
    persistQuery: ({
      queryKey,
      queryHash,
      state,
    }: {
      queryKey: QueryKey;
      queryHash: string;
      state: any;
    }) => {
      try {
        const persistedQuery: PersistedQuery = {
          queryHash,
          queryKey,
          state,
        };

        // Store with 24-hour TTL for React Query cache
        const ttl = 24 * 60 * 60 * 1000; // 24 hours
        localKV.set(`rq:${queryHash}`, persistedQuery, ttl, StorageCategory.CACHE);
      } catch (error) {
        console.error('Failed to persist query:', error);
      }
    },
    restoreQuery: ({
      queryKey,
      queryHash,
    }: {
      queryKey: QueryKey;
      queryHash: string;
    }) => {
      try {
        const persistedQuery = localKV.get<PersistedQuery>(
          `rq:${queryHash}`,
          StorageCategory.CACHE
        );

        if (persistedQuery) {
          return persistedQuery.state;
        }
        return undefined;
      } catch (error) {
        console.error('Failed to restore query:', error);
        return undefined;
      }
    },
    removeQuery: ({ queryHash }: { queryKey: QueryKey; queryHash: string }) => {
      try {
        localKV.delete(`rq:${queryHash}`, StorageCategory.CACHE);
      } catch (error) {
        console.error('Failed to remove query:', error);
      }
    },
    clear: () => {
      try {
        // Clear all React Query cached data
        const keys = localKV.getKeys(StorageCategory.CACHE);
        const rqKeys = keys.filter(key => key.startsWith('rq:'));
        
        rqKeys.forEach(key => {
          localKV.delete(key, StorageCategory.CACHE);
        });
      } catch (error) {
        console.error('Failed to clear persisted queries:', error);
      }
    },
  };
}

/**
 * Configure React Query with MMKV persistence
 */
export function configureReactQueryWithPersistence(queryClient: QueryClient) {
  const persister = createMMKVPersister();

  // Set up the persister
  queryClient.setQueryDefaults(['ai'], {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (previously cacheTime)
  });

  queryClient.setQueryDefaults(['tasks'], {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  queryClient.setQueryDefaults(['habits'], {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  queryClient.setQueryDefaults(['calendar'], {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Restore persisted queries on app start
  const restoreQueries = () => {
    const keys = localKV.getKeys(StorageCategory.CACHE);
    const rqKeys = keys.filter(key => key.startsWith('rq:'));
    
    rqKeys.forEach(key => {
      const queryHash = key.replace('rq:', '');
      const persistedQuery = localKV.get<PersistedQuery>(key, StorageCategory.CACHE);
      
      if (persistedQuery) {
        queryClient.setQueryData(
          persistedQuery.queryKey,
          persistedQuery.state.data,
          {
            updatedAt: persistedQuery.state.dataUpdatedAt,
          }
        );
      }
    });
  };

  // Restore queries on initialization
  restoreQueries();

  return {
    persister,
    restoreQueries,
  };
}

/**
 * Custom hook for persisted queries
 */
export function usePersistedQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options: {
    staleTime?: number;
    gcTime?: number;
    enabled?: boolean;
    ttl?: number;
  } = {}
) {
  const { ttl = 24 * 60 * 60 * 1000, ...queryOptions } = options;

  return {
    queryKey,
    queryFn,
    staleTime: queryOptions.staleTime || 5 * 60 * 1000,
    gcTime: queryOptions.gcTime || 30 * 60 * 1000,
    enabled: queryOptions.enabled !== false,
    persister: createMMKVPersister(),
  };
}

/**
 * Prefetch and cache data for offline use
 */
export async function prefetchForOffline<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  ttl: number = 24 * 60 * 60 * 1000
) {
  try {
    // Prefetch the data
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: ttl,
    });

    // Also store it directly in local KV for offline access
    const data = await queryFn();
    localKV.set(`offline:${JSON.stringify(queryKey)}`, data, ttl, StorageCategory.OFFLINE);

    return data;
  } catch (error) {
    console.error('Failed to prefetch data:', error);
    throw error;
  }
}

/**
 * Get cached data for offline use
 */
export function getOfflineCachedData<T>(queryKey: QueryKey): T | null {
  try {
    return localKV.get<T>(`offline:${JSON.stringify(queryKey)}`, StorageCategory.OFFLINE);
  } catch (error) {
    console.error('Failed to get offline cached data:', error);
    return null;
  }
}

/**
 * Clear offline cache
 */
export function clearOfflineCache() {
  try {
    localKV.clear(StorageCategory.OFFLINE);
  } catch (error) {
    console.error('Failed to clear offline cache:', error);
  }
}

/**
 * Get storage statistics for React Query cache
 */
export function getReactQueryCacheStats() {
  const keys = localKV.getKeys(StorageCategory.CACHE);
  const rqKeys = keys.filter(key => key.startsWith('rq:'));
  
  return {
    totalQueries: rqKeys.length,
    cacheKeys: rqKeys,
    storageStats: localKV.getStats(),
  };
}