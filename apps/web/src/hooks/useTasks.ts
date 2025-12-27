/**
 * useTasks Hook - Task Management for Web
 *
 * Provides task list querying with filters, task status mutations,
 * and focus area fetching for the Task Dashboard.
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

// ============================================
// TYPES
// ============================================

export type TaskStatus = "all" | "completed" | "pending";
export type DifficultyLevel = "simple" | "moderate" | "advanced";
export type SortBy = "date" | "difficulty" | "focusArea";
export type SortOrder = "asc" | "desc";

export interface TaskFilters {
  month?: string;
  status?: TaskStatus;
  focusArea?: string;
  difficultyLevel?: DifficultyLevel;
  search?: string;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

export interface Task {
  id: number;
  planId: number;
  weekNumber: number;
  dayOfWeek: string;
  taskDescription: string;
  focusArea: string;
  difficultyLevel: string;
  schedulingReason: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// HOOK
// ============================================

export function useTasks(initialFilters?: Partial<TaskFilters>) {
  const queryClient = useQueryClient();

  // Filter state
  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    sortBy: "date",
    sortOrder: "asc",
    ...initialFilters,
  });

  // Build query input from filters
  const queryInput = useMemo(() => {
    const input: TaskFilters = {};

    if (filters.month) input.month = filters.month;
    if (filters.status && filters.status !== "all") input.status = filters.status;
    if (filters.focusArea) input.focusArea = filters.focusArea;
    if (filters.difficultyLevel) input.difficultyLevel = filters.difficultyLevel;
    if (filters.search) input.search = filters.search;
    if (filters.sortBy) input.sortBy = filters.sortBy;
    if (filters.sortOrder) input.sortOrder = filters.sortOrder;

    return input;
  }, [filters]);

  // Tasks list query
  const tasksQuery = useQuery(
    orpc.tasks.list.queryOptions({
      input: queryInput,
    }),
  );

  // Focus areas query (for filter dropdown)
  const focusAreasQuery = useQuery(orpc.tasks.getFocusAreas.queryOptions());

  // Task completion toggle mutation
  const toggleTaskMutation = useMutation(
    orpc.tasks.update.mutationOptions({
      onMutate: async ({ taskId, isCompleted }) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["tasks", "list"] });

        // Snapshot previous value
        const previousTasks = queryClient.getQueryData(["tasks", "list", queryInput]);

        // Optimistically update
        queryClient.setQueryData(["tasks", "list", queryInput], (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((task: Task) =>
              task.id === taskId ? { ...task, isCompleted } : task,
            ),
          };
        });

        return { previousTasks };
      },
      onError: (_err, _variables, context) => {
        // Rollback on error
        if (context?.previousTasks) {
          queryClient.setQueryData(["tasks", "list", queryInput], context.previousTasks);
        }
      },
      onSettled: () => {
        // Refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: ["tasks", "list"] });
      },
    }),
  );

  // Filter update helpers
  const updateFilter = useCallback(<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      status: "all",
      sortBy: "date",
      sortOrder: "asc",
    });
  }, []);

  const toggleSort = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Computed stats
  const stats = useMemo(() => {
    const tasks = (tasksQuery.data?.data as Task[]) || [];
    const total = tasks.length;
    const completed = tasks.filter((t) => t.isCompleted).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, completionRate };
  }, [tasksQuery.data]);

  // Toggle task completion
  const toggleTask = useCallback(
    async (taskId: number, isCompleted: boolean) => {
      await toggleTaskMutation.mutateAsync({ taskId, isCompleted });
    },
    [toggleTaskMutation],
  );

  return {
    // Data
    tasks: (tasksQuery.data?.data as Task[]) || [],
    focusAreas: (focusAreasQuery.data?.data as string[]) || [],
    stats,

    // Loading states
    isLoading: tasksQuery.isLoading,
    isFetching: tasksQuery.isFetching,
    isUpdating: toggleTaskMutation.isPending,

    // Error states
    error: tasksQuery.error?.message || null,

    // Filters
    filters,
    updateFilter,
    resetFilters,
    toggleSort,

    // Actions
    toggleTask,
    refetch: tasksQuery.refetch,
  };
}
