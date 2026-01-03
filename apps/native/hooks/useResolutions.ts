/**
 * useResolutions Hook - Resolution Management for Native
 *
 * Provides comprehensive resolution management including CRUD operations,
 * progress tracking, and completion logging.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import type { Resolution, ResolutionWithProgress } from "@monthly-zen/types";

// ============================================
// TYPES
// ============================================

export interface CreateResolutionInput {
  title: string;
  description?: string;
  category: string;
  targetCount: number;
  year: number;
}

export interface UpdateResolutionInput {
  title?: string;
  description?: string;
  category?: string;
  targetCount?: number;
}

// ============================================
// HOOK
// ============================================

export function useResolutions(year?: number) {
  const queryClient = useQueryClient();
  const currentYear = year || new Date().getFullYear();

  // Resolutions list query
  const resolutionsQuery = useQuery(
    orpc.resolutions.getByYear.queryOptions({
      input: { year: currentYear },
    }),
  );

  // Get by ID query
  const getByIdQuery = useMutation(orpc.resolutions.getById.mutationOptions());

  // Create resolution mutation
  const createMutation = useMutation(
    orpc.resolutions.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["resolutions", "getByYear"] });
      },
    }),
  );

  // Update resolution mutation
  const updateMutation = useMutation(
    orpc.resolutions.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["resolutions", "getByYear"] });
      },
    }),
  );

  // Delete resolution mutation
  const deleteMutation = useMutation(
    orpc.resolutions.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["resolutions", "getByYear"] });
      },
    }),
  );

  // Log completion mutation
  const logCompletionMutation = useMutation(
    orpc.resolutions.logCompletion.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["resolutions", "getByYear"] });
      },
    }),
  );

  // Remove completion mutation
  const removeCompletionMutation = useMutation(
    orpc.resolutions.removeCompletion.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["resolutions", "getByYear"] });
      },
    }),
  );

  // CRUD actions
  const createResolution = useCallback(
    async (input: CreateResolutionInput) => {
      return createMutation.mutateAsync(input);
    },
    [createMutation],
  );

  const updateResolution = useCallback(
    async (id: number, updates: UpdateResolutionInput) => {
      return updateMutation.mutateAsync({ id, ...updates });
    },
    [updateMutation],
  );

  const deleteResolution = useCallback(
    async (id: number) => {
      return deleteMutation.mutateAsync({ id });
    },
    [deleteMutation],
  );

  // Progress actions
  const logCompletion = useCallback(
    async (id: number, notes?: string) => {
      return logCompletionMutation.mutateAsync({ id, notes });
    },
    [logCompletionMutation],
  );

  const removeCompletion = useCallback(
    async (id: number) => {
      return removeCompletionMutation.mutateAsync({ id });
    },
    [removeCompletionMutation],
  );

  const getResolutionById = useCallback(
    async (id: number) => {
      return getByIdQuery.mutateAsync({ id });
    },
    [getByIdQuery],
  );

  // Computed stats
  const stats = useCallback(() => {
    const resolutions = (resolutionsQuery.data?.data as ResolutionWithProgress[]) || [];
    const total = resolutions.length;
    const completed = resolutions.filter((r) => r.progress >= r.targetCount).length;
    const inProgress = total - completed;

    return {
      total,
      completed,
      inProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [resolutionsQuery.data]);

  return {
    // Data
    resolutions: (resolutionsQuery.data?.data as ResolutionWithProgress[]) || [],
    stats: stats(),

    // Loading states
    isLoading: resolutionsQuery.isLoading,
    isFetching: resolutionsQuery.isFetching,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLoggingCompletion: logCompletionMutation.isPending,
    isRemovingCompletion: removeCompletionMutation.isPending,

    // Error states
    error:
      resolutionsQuery.error?.message ||
      createMutation.error?.message ||
      updateMutation.error?.message ||
      null,

    // Actions
    createResolution,
    updateResolution,
    deleteResolution,
    logCompletion,
    removeCompletion,
    getResolutionById,
    refetch: resolutionsQuery.refetch,
  };
}
