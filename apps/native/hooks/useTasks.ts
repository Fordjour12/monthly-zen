/**
 * useTasks Hook - Task Management for Native
 *
 * Provides comprehensive task management including CRUD operations,
 * reminders, filtering, and statistics.
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
  taskDescription: string;
  focusArea: string;
  startTime: string;
  endTime: string;
  difficultyLevel: string;
  schedulingReason: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  weekNumber?: number;
  dayOfWeek?: string;
  reminder?: TaskReminder | null;
}

export interface TaskReminder {
  id: number;
  taskId: number;
  userId: string;
  reminderTime: string;
  isSent: boolean;
  isAcknowledged: boolean;
  createdAt: string;
}

export interface CreateTaskInput {
  taskDescription: string;
  focusArea: string;
  startTime: string;
  endTime: string;
  difficultyLevel?: DifficultyLevel;
  schedulingReason?: string;
  hasReminder?: boolean;
  reminderTime?: string;
}

export interface UpdateTaskInput {
  taskDescription?: string;
  focusArea?: string;
  startTime?: string;
  endTime?: string;
  difficultyLevel?: DifficultyLevel;
  schedulingReason?: string;
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

  // Focus areas query
  const focusAreasQuery = useQuery(orpc.tasks.getFocusAreas.queryOptions());

  // Reminders query
  const remindersQuery = useQuery(orpc.tasks.getReminders.queryOptions());

  // Create task mutation
  const createTaskMutation = useMutation(
    orpc.tasks.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tasks", "list"] });
        queryClient.invalidateQueries({ queryKey: ["tasks", "reminders"] });
      },
    }),
  );

  // Update task mutation
  const updateTaskMutation = useMutation(
    orpc.tasks.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tasks", "list"] });
      },
    }),
  );

  // Delete task mutation
  const deleteTaskMutation = useMutation(
    orpc.tasks.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tasks", "list"] });
        queryClient.invalidateQueries({ queryKey: ["tasks", "reminders"] });
      },
    }),
  );

  // Toggle task completion mutation
  const toggleTaskMutation = useMutation(
    orpc.tasks.toggle.mutationOptions({
      onMutate: async ({ taskId, isCompleted }: { taskId: number; isCompleted: boolean }) => {
        await queryClient.cancelQueries({ queryKey: ["tasks", "list"] });
        const previousTasks = queryClient.getQueryData(["tasks", "list", queryInput]);
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
      onError: (
        _err: Error,
        _variables: { taskId: number; isCompleted: boolean },
        context?: { previousTasks: unknown },
      ) => {
        if (context?.previousTasks) {
          queryClient.setQueryData(["tasks", "list", queryInput], context.previousTasks);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["tasks", "list"] });
      },
    }),
  );

  // Set reminder mutation
  const setReminderMutation = useMutation(
    orpc.tasks.setReminder.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tasks", "list"] });
        queryClient.invalidateQueries({ queryKey: ["tasks", "reminders"] });
      },
    }),
  );

  // Delete reminder mutation
  const deleteReminderMutation = useMutation(
    orpc.tasks.deleteReminder.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tasks", "list"] });
        queryClient.invalidateQueries({ queryKey: ["tasks", "reminders"] });
      },
    }),
  );

  // Filter helpers
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

  // Task CRUD actions
  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      return createTaskMutation.mutateAsync(input);
    },
    [createTaskMutation],
  );

  const updateTask = useCallback(
    async (taskId: number, updates: UpdateTaskInput) => {
      return updateTaskMutation.mutateAsync({ taskId, ...updates });
    },
    [updateTaskMutation],
  );

  const deleteTask = useCallback(
    async (taskId: number) => {
      return deleteTaskMutation.mutateAsync({ taskId });
    },
    [deleteTaskMutation],
  );

  const toggleTask = useCallback(
    async (taskId: number, isCompleted: boolean) => {
      await toggleTaskMutation.mutateAsync({ taskId, isCompleted });
    },
    [toggleTaskMutation],
  );

  // Reminder actions
  const setReminder = useCallback(
    async (taskId: number, reminderTime: string) => {
      return setReminderMutation.mutateAsync({ taskId, reminderTime });
    },
    [setReminderMutation],
  );

  const deleteReminder = useCallback(
    async (taskId: number) => {
      return deleteReminderMutation.mutateAsync({ taskId });
    },
    [deleteReminderMutation],
  );

  // Computed stats
  const stats = useMemo(() => {
    const tasks = (tasksQuery.data?.data as Task[]) || [];
    const total = tasks.length;
    const completed = tasks.filter((t) => t.isCompleted).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, completionRate };
  }, [tasksQuery.data]);

  // Get pending reminders
  const reminders = useMemo(() => {
    return (remindersQuery.data?.data as TaskReminder[]) || [];
  }, [remindersQuery.data]);

  return {
    // Data
    tasks: (tasksQuery.data?.data as Task[]) || [],
    focusAreas: (focusAreasQuery.data?.data as string[]) || [],
    reminders,
    stats,

    // Loading states
    isLoading: tasksQuery.isLoading,
    isFetching: tasksQuery.isFetching,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isToggling: toggleTaskMutation.isPending,
    isSettingReminder: setReminderMutation.isPending,

    // Error states
    error: tasksQuery.error?.message || null,

    // Filters
    filters,
    updateFilter,
    resetFilters,
    toggleSort,

    // Actions
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    setReminder,
    deleteReminder,
    refetch: tasksQuery.refetch,
  };
}
