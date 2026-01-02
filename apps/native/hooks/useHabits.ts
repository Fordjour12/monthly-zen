/**
 * useHabits Hook - Habit Management for Native
 *
 * Provides habit list querying, CRUD operations, and completion tracking
 * for the Habit Dashboard in the native app.
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

// ============================================
// TYPES
// ============================================

export type HabitFrequency = "daily" | "weekly" | "custom";

export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface Habit {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  frequency: HabitFrequency;
  targetDays: WeekDay[];
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  isCompletedToday: boolean;
  currentStreak: number;
  completionRate: number;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  frequency: HabitFrequency;
  targetDays?: string[];
  color: string;
  icon: string;
}

export interface HabitStats {
  totalHabits: number;
  completedToday: number;
  completionRate: number;
  currentStreak: number;
}

// ============================================
// HOOK
// ============================================

export function useHabits() {
  const queryClient = useQueryClient();

  // Habits list query
  const habitsQuery = useQuery(orpc.habits.list.queryOptions());

  // Habit statistics query
  const statsQuery = useQuery(orpc.habits.getStats.queryOptions());

  // Create habit mutation
  const createHabitMutation = useMutation(
    orpc.habits.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["habits", "list"] });
        queryClient.invalidateQueries({ queryKey: ["habits", "stats"] });
      },
    }),
  );

  // Update habit mutation
  const updateHabitMutation = useMutation(
    orpc.habits.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["habits", "list"] });
      },
    }),
  );

  // Delete habit mutation
  const deleteHabitMutation = useMutation(
    orpc.habits.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["habits", "list"] });
        queryClient.invalidateQueries({ queryKey: ["habits", "stats"] });
      },
    }),
  );

  // Toggle habit completion mutation
  const toggleHabitMutation = useMutation(
    orpc.habits.toggle.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["habits", "list"] });
        queryClient.invalidateQueries({ queryKey: ["habits", "stats"] });
      },
    }),
  );

  // Create a new habit
  const createHabit = useCallback(
    async (input: CreateHabitInput) => {
      return createHabitMutation.mutateAsync(input);
    },
    [createHabitMutation],
  );

  // Update an existing habit
  const updateHabit = useCallback(
    async (habitId: number, updates: Partial<CreateHabitInput>) => {
      return updateHabitMutation.mutateAsync({ habitId, ...updates });
    },
    [updateHabitMutation],
  );

  // Delete a habit
  const deleteHabit = useCallback(
    async (habitId: number) => {
      return deleteHabitMutation.mutateAsync({ habitId });
    },
    [deleteHabitMutation],
  );

  // Toggle habit completion for today
  const toggleHabit = useCallback(
    async (habitId: number, date?: string, notes?: string) => {
      return toggleHabitMutation.mutateAsync({ habitId, date, notes });
    },
    [toggleHabitMutation],
  );

  // Computed values
  const habits = (habitsQuery.data?.data as Habit[]) || [];
  const stats = (statsQuery.data?.data as HabitStats) || {
    totalHabits: 0,
    completedToday: 0,
    completionRate: 0,
    currentStreak: 0,
  };

  const activeHabits = habits.filter((h) => !h.isArchived);
  const todayProgress =
    stats.totalHabits > 0 ? Math.round((stats.completedToday / stats.totalHabits) * 100) : 0;

  return {
    // Data
    habits: activeHabits,
    stats,

    // Computed
    todayProgress,
    isLoading: habitsQuery.isLoading,
    isFetching: habitsQuery.isFetching,
    isCreating: createHabitMutation.isPending,
    isUpdating: updateHabitMutation.isPending,
    isDeleting: deleteHabitMutation.isPending,
    isToggling: toggleHabitMutation.isPending,

    // Error states
    error: habitsQuery.error?.message || null,

    // Actions
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabit,
    refetch: habitsQuery.refetch,
  };
}
