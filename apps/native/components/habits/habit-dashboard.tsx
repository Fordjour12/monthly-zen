/**
 * Habit Dashboard Component (Native)
 *
 * Main dashboard for habit tracking with FlashList for performance
 */

import React, { useCallback, useMemo, useState } from "react";
import { View, Text, RefreshControl, ActivityIndicator, TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
import { useHabits, type Habit } from "@/hooks/useHabits";
import { HabitStats } from "./habit-stats";
import { HabitCard } from "./habit-card";
import { HabitEmptyState } from "./habit-empty-state";

interface HabitDashboardProps {
  onCreateHabit?: () => void;
  onEditHabit?: (habit: Habit) => void;
}

export function HabitDashboard({ onCreateHabit, onEditHabit }: HabitDashboardProps) {
  const { habits, stats, isLoading, isFetching, isToggling, error, toggleHabit, refetch } =
    useHabits();

  const { primary } = useSemanticColors();
  const [, setEditingHabit] = useState<Habit | null>(null);

  const handleToggle = useCallback(
    async (habitId: number) => {
      await toggleHabit(habitId);
    },
    [toggleHabit],
  );

  const handleEdit = useCallback(
    (habit: Habit) => {
      if (onEditHabit) {
        onEditHabit(habit);
      } else {
        setEditingHabit(habit);
      }
    },
    [onEditHabit],
  );

  const handleDelete = useCallback(async (habitId: number) => {
    // TODO: Add confirmation dialog
    // For now, just log it
    console.log("Delete habit:", habitId);
  }, []);

  // Header component (stats)
  const headerComponent = useMemo(
    () => (
      <View className="pb-2">
        {/* Header Title */}
        <View className="px-4 pt-7 flex-row items-center gap-3">
          <View
            className="w-10 h-10 rounded-lg items-center justify-center"
            style={{ backgroundColor: `${primary}15` }}
          >
            <Ionicons name="leaf" size={22} color={primary} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Habits</Text>
            <Text className="text-sm text-muted">Build consistency one day at a time</Text>
          </View>
          {isFetching && !isLoading && <ActivityIndicator size="small" color={primary} />}
        </View>

        {/* Stats Card */}
        <View className="px-4 mt-4">
          <HabitStats
            totalHabits={stats.totalHabits}
            completedToday={stats.completedToday}
            completionRate={stats.completionRate}
            currentStreak={stats.currentStreak}
            isLoading={isLoading}
          />
        </View>

        {/* Section Title */}
        {!isLoading && habits.length > 0 && (
          <View className="px-4 py-4 flex-row items-center justify-between">
            <Text className="text-xs text-muted uppercase tracking-widest font-bold">
              Your Habits
            </Text>
            <Text className="text-xs text-muted">
              {habits.length} habit{habits.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View className="mx-4 my-2 p-3 bg-danger/10 border border-danger rounded-lg">
            <Text className="text-sm text-danger font-medium">{error}</Text>
          </View>
        )}
      </View>
    ),
    [primary, isFetching, isLoading, stats, habits.length, error],
  );

  // Empty component
  const emptyComponent = useMemo(
    () => <HabitEmptyState onCreateHabit={onCreateHabit || (() => {})} />,
    [onCreateHabit],
  );

  // Footer spacer
  const footerComponent = useMemo(() => <View className="h-20" />, []);

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: Habit }) => (
      <View className="px-4">
        <HabitCard
          habit={item}
          onToggle={handleToggle}
          isUpdating={isToggling}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </View>
    ),
    [handleToggle, isToggling, handleEdit, handleDelete],
  );

  const keyExtractor = useCallback((item: Habit) => item.id.toString(), []);

  return (
    <View className="flex-1 bg-background">
      <FlashList
        data={habits}
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
        estimatedItemSize={80}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Add Habit FAB */}
      {onCreateHabit && (
        <TouchableOpacity
          onPress={onCreateHabit}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
