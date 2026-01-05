import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

export interface QuotaData {
  id: number;
  userId: string;
  monthYear: string;
  totalAllowed: number;
  generationsUsed: number;
  resetsOn: string;
  isExhausted: boolean;
  remaining: number;
  usagePercentage: number;
}

export function useQuota() {
  const queryClient = useQueryClient();

  const quotaQuery = useQuery(orpc.quota.getCurrent.queryOptions());

  const initializeQuotaMutation = useMutation(
    orpc.quota.initialize.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["quota", "getCurrent"]] });
      },
    }),
  );

  const requestTokensMutation = useMutation(
    orpc.quota.request.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["quota", "getCurrent"]] });
      },
    }),
  );

  const historyQuery = useQuery(
    orpc.quota.getHistory.queryOptions({
      input: { months: 6 },
    }),
  );

  return {
    quota: quotaQuery.data?.data as QuotaData | undefined,
    history: historyQuery.data?.data || [],
    isLoading: quotaQuery.isLoading || historyQuery.isLoading,
    isRefetching: quotaQuery.isRefetching,
    error: quotaQuery.error?.message || null,

    initializeQuota: initializeQuotaMutation.mutateAsync,
    isInitializing: initializeQuotaMutation.isPending,

    requestTokens: requestTokensMutation.mutateAsync,
    isRequesting: requestTokensMutation.isPending,

    refetch: async () => {
      await Promise.all([quotaQuery.refetch(), historyQuery.refetch()]);
    },
  };
}
