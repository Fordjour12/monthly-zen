import { useCallback } from "react";
import { orpc } from "@/utils/orpc";
import { useMutation, useQuery } from "@tanstack/react-query";

export interface Insight {
  id: number;
  userId: string;
  type: string;
  title: string;
  description: string;
  reasoning: string | null;
  suggestedAction: string | null;
  confidence: string | null;
  priority: string | null;
  category: string | null;
  triggerData: unknown;
  actionsJson: {
    actions: Array<{ label: string; value: string; type: "primary" | "secondary" | "destructive" }>;
  } | null;
  isRead: boolean;
  isArchived: boolean;
  dismissedAt: Date | null;
  actionTaken: string | null;
  generatedAt: Date;
  expiresAt: Date | null;
}

export interface CoachingStats {
  totalInsights: number;
  archivedInsights: number;
  actionedInsights: number;
}

export function useCoaching() {
  const insightsQuery = useQuery(orpc.coaching.getInsights.queryOptions());
  const statsQuery = useQuery(orpc.coaching.getStats.queryOptions());

  const generateInsightsMutation = useMutation({
    ...orpc.coaching.generateInsights.mutationOptions(),
    onSuccess: () => {
      insightsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (err: Error) => {
      console.error("Failed to generate insights:", err);
    },
  });

  const dismissMutation = useMutation({
    ...orpc.coaching.dismiss.mutationOptions(),
    onSuccess: () => {
      insightsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (err: Error) => {
      console.error("Failed to dismiss insight:", err);
    },
  });

  const markAsReadMutation = useMutation({
    ...orpc.coaching.markAsRead.mutationOptions(),
    onSuccess: () => {
      insightsQuery.refetch();
    },
    onError: (err: Error) => {
      console.error("Failed to mark insight as read:", err);
    },
  });

  const generateInsights = useCallback(async () => {
    const response = await generateInsightsMutation.mutateAsync(undefined);
    return response;
  }, [generateInsightsMutation]);

  const dismissInsight = useCallback(
    async (insightId: number, action?: string) => {
      await dismissMutation.mutateAsync({ insightId, action });
    },
    [dismissMutation],
  );

  const markAsRead = useCallback(
    async (insightId: number) => {
      await markAsReadMutation.mutateAsync({ insightId });
    },
    [markAsReadMutation],
  );

  return {
    insights: insightsQuery.data?.data as unknown as Insight[] | undefined,
    stats: statsQuery.data?.data as unknown as CoachingStats | undefined,
    isLoading: generateInsightsMutation.isPending,
    isRefreshing: insightsQuery.isRefetching || statsQuery.isRefetching,
    insightsQuery,
    statsQuery,
    refresh: useCallback(async () => {
      await Promise.all([insightsQuery.refetch(), statsQuery.refetch()]);
    }, [insightsQuery, statsQuery]),
    generateInsights,
    dismissInsight,
    markAsRead,
  };
}
