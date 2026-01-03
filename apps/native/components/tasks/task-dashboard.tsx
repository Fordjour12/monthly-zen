/**
 * Task Dashboard Component (Native)
 *
 * Main dashboard container using FlashList for performance
 * with pull-to-refresh and filtering capabilities.
 */

import React, { useCallback, useMemo } from "react";
import { View, Text, RefreshControl, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
import { useTasks, type Task } from "@/hooks/useTasks";
import { TaskStats } from "./task-stats";
import { TaskFilterBar } from "./task-filter-bar";
import { TaskListItem } from "./task-list-item";
import { TaskEmptyState } from "./task-empty-state";

interface TaskDashboardProps {
  onEditTask?: (task: Task) => void;
  onCreateTask?: () => void;
}

export function TaskDashboard({ onEditTask, onCreateTask }: TaskDashboardProps) {
  const {
    tasks,
    focusAreas,
    stats,
    isLoading,
    isFetching,
    isUpdating,
    error,
    filters,
    updateFilter,
    resetFilters,
    toggleSort,
    toggleTask,
    refetch,
  } = useTasks();

  const { primary } = useSemanticColors();

  const hasFilters = !!(
    filters.focusArea ||
    filters.difficultyLevel ||
    filters.search ||
    (filters.status && filters.status !== "all")
  );

  const renderItem = useCallback(
    ({ item }: { item: Task }) => (
      <TaskListItem task={item} onToggle={toggleTask} onEdit={onEditTask} isUpdating={isUpdating} />
    ),
    [toggleTask, isUpdating, onEditTask],
  );

  const keyExtractor = useCallback((item: Task) => item.id.toString(), []);

  // Header component (stats + filters)
  const headerComponent = useMemo(
    () => (
      <View>
        {/* Header Title */}
        <View className="px-4 pt-7 flex-row items-center gap-3">
          <View className="w-10 h-10 bg-accent/10 rounded-lg items-center justify-center">
            <Ionicons name="checkmark-circle" size={22} color={primary} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Tasks</Text>
            <Text className="text-sm text-muted-foreground">
              Track and manage your monthly tasks
            </Text>
          </View>
          {isFetching && !isLoading && <ActivityIndicator size="small" color={primary} />}
        </View>

        {/* Stats Cards */}
        <TaskStats
          total={stats.total}
          completed={stats.completed}
          pending={stats.pending}
          completionRate={stats.completionRate}
          isLoading={isLoading}
        />

        {/* Filter Bar */}
        <TaskFilterBar
          filters={filters}
          focusAreas={focusAreas}
          onUpdateFilter={updateFilter}
          onResetFilters={resetFilters}
          onToggleSort={toggleSort}
          onAddTask={onCreateTask}
        />

        {/* Error Display */}
        {error && (
          <View className="mx-4 my-2 p-3 bg-danger/10 border border-danger rounded-lg">
            <Text className="text-sm text-danger font-medium">{error}</Text>
          </View>
        )}

        {/* Section Title */}
        {!isLoading && tasks.length > 0 && (
          <View className="px-4 py-2 flex-row items-center justify-between bg-muted/30">
            <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
              {hasFilters ? "Filtered Tasks" : "All Tasks"}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>
    ),
    [
      primary,
      isFetching,
      isLoading,
      stats,
      filters,
      focusAreas,
      updateFilter,
      resetFilters,
      toggleSort,
      error,
      tasks.length,
      hasFilters,
    ],
  );

  // Empty component
  const emptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color={primary} />
          <Text className="text-muted-foreground mt-4">Loading tasks...</Text>
        </View>
      );
    }
    return <TaskEmptyState hasFilters={hasFilters} onResetFilters={resetFilters} />;
  }, [isLoading, hasFilters, resetFilters, primary]);

  // Footer spacer
  const footerComponent = useMemo(() => <View className="h-20" />, []);

  return (
    <View className="flex-1 bg-background">
      <FlashList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={footerComponent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={primary}
          />
        }
      />
    </View>
  );
}
