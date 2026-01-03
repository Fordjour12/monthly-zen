import { useState, useCallback } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const insightsQuery = useQuery(orpc.coaching.getInsights.queryOptions());
  const statsQuery = useQuery(orpc.coaching.getStats.queryOptions());

  const loadCoachingData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([insightsQuery.refetch(), statsQuery.refetch()]);
    } finally {
      setIsLoading(false);
    }
  }, [insightsQuery, statsQuery]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([insightsQuery.refetch(), statsQuery.refetch()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [insightsQuery, statsQuery]);

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
    setIsLoading(true);
    try {
      const response = await generateInsightsMutation.mutateAsync(undefined);
      return response;
    } catch (error) {
      console.error("Failed to generate insights:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
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
    isLoading,
    isRefreshing,
    insightsQuery,
    statsQuery,
    loadCoachingData,
    refresh,
    generateInsights,
    dismissInsight,
    markAsRead,
  };
}
