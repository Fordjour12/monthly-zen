import React, { useCallback, useMemo } from "react";
import { View, Text, RefreshControl, ActivityIndicator, TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Tag01Icon,
  PlusSignIcon,
  Search01Icon,
  FilterIcon,
  Sorting01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { useTasks, type Task } from "@/hooks/useTasks";
import { TaskStats } from "./task-stats";
import { TaskFilterBar } from "./task-filter-bar";
import { TaskListItem } from "./task-list-item";
import { TaskEmptyState } from "./task-empty-state";
import { Container } from "@/components/ui/container";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";

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

  const headerComponent = useMemo(
    () => (
      <View className="pt-10">
        {/* Header Title Section */}
        <Animated.View
          entering={FadeInUp.duration(600)}
          className="px-6 flex-row items-center justify-between mb-2"
        >
          <View>
            <Text className="text-sm font-sans-bold text-muted-foreground uppercase tracking-[3px] mb-1">
              Operation
            </Text>
            <Text className="text-3xl font-sans-bold text-foreground">Master Tasks</Text>
          </View>
          <TouchableOpacity
            onPress={onCreateTask}
            className="w-12 h-12 rounded-2xl bg-accent items-center justify-center shadow-lg shadow-accent/20"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {/* Dynamic Activity Summary */}
        <TaskStats
          total={stats.total}
          completed={stats.completed}
          pending={stats.pending}
          completionRate={stats.completionRate}
          isLoading={isLoading}
        />

        {/* Refined Filter Section */}
        <View className="px-4 mb-6">
          <TaskFilterBar
            filters={filters}
            focusAreas={focusAreas}
            onUpdateFilter={updateFilter}
            onResetFilters={resetFilters}
            onToggleSort={toggleSort}
            onAddTask={onCreateTask}
          />
        </View>

        {error && (
          <Animated.View
            entering={FadeInDown}
            className="mx-6 mb-6 p-4 bg-danger/10 rounded-2xl border border-danger/20"
          >
            <Text className="text-sm text-danger font-sans-semibold">{error}</Text>
          </Animated.View>
        )}

        {/* Section Label */}
        {!isLoading && tasks.length > 0 && (
          <View className="px-6 mb-4 flex-row items-center justify-between">
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
              {hasFilters ? "Active Filter" : "System Feed"}
            </Text>
            <View className="bg-surface border border-border/50 px-2 py-0.5 rounded-lg">
              <Text className="text-[10px] font-sans-bold text-foreground uppercase">
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
              </Text>
            </View>
          </View>
        )}
      </View>
    ),
    [
      stats,
      isLoading,
      isFetching,
      error,
      tasks.length,
      hasFilters,
      onCreateTask,
      filters,
      focusAreas,
      updateFilter,
      resetFilters,
      toggleSort,
    ],
  );

  const emptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-24">
          <ActivityIndicator size="large" color="var(--accent)" />
          <Text className="text-muted-foreground font-sans-medium mt-4">Syncing tasks...</Text>
        </View>
      );
    }
    return <TaskEmptyState hasFilters={hasFilters} onResetFilters={resetFilters} />;
  }, [isLoading, hasFilters, resetFilters]);

  const footerComponent = useMemo(() => <View className="h-32" />, []);

  return (
    <Container className="bg-background">
      <FlashList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={footerComponent}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={100}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor="var(--accent)"
          />
        }
      />
    </Container>
  );
}
