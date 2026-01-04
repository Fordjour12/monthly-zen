import React, { useCallback, useMemo } from "react";
import { View, Text, RefreshControl, ActivityIndicator, TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  PlusSignIcon,
  Analytics01Icon,
  SparklesIcon,
  Compass01Icon,
} from "@hugeicons/core-free-icons";
import { useHabits, type Habit } from "@/hooks/useHabits";
import { HabitStats } from "./habit-stats";
import { HabitCard } from "./habit-card";
import { HabitEmptyState } from "./habit-empty-state";
import { Container } from "@/components/ui/container";
import Animated, { FadeInUp } from "react-native-reanimated";

interface HabitDashboardProps {
  onCreateHabit?: () => void;
  onEditHabit?: (habit: Habit) => void;
}

export function HabitDashboard({ onCreateHabit, onEditHabit }: HabitDashboardProps) {
  const { habits, stats, isLoading, isFetching, isToggling, error, toggleHabit, refetch } =
    useHabits();

  const handleToggle = useCallback(
    async (habitId: number) => {
      await toggleHabit(habitId);
    },
    [toggleHabit],
  );

  const headerComponent = useMemo(
    () => (
      <View className="pt-10">
        {/* Header Section */}
        <Animated.View
          entering={FadeInUp.duration(600)}
          className="px-6 flex-row items-center justify-between mb-2"
        >
          <View>
            <Text className="text-sm font-sans-bold text-muted-foreground uppercase tracking-[3px] mb-1">
              Rituals
            </Text>
            <Text className="text-3xl font-sans-bold text-foreground">Habit Tracker</Text>
          </View>
          <TouchableOpacity
            onPress={onCreateHabit}
            className="w-12 h-12 rounded-2xl bg-accent items-center justify-center shadow-lg shadow-accent/20"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Summary */}
        <View className="px-6">
          <HabitStats
            totalHabits={stats.totalHabits}
            completedToday={stats.completedToday}
            completionRate={stats.completionRate}
            currentStreak={stats.currentStreak}
            isLoading={isLoading}
          />
        </View>

        {error && (
          <View className="mx-6 mt-6 p-4 bg-danger/10 border border-danger/20 rounded-2xl">
            <Text className="text-sm text-danger font-sans-semibold">{error}</Text>
          </View>
        )}

        {/* Section Label */}
        {!isLoading && habits.length > 0 && (
          <View className="px-6 py-6 flex-row items-center justify-between">
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
              Active Rituals
            </Text>
            <View className="bg-surface border border-border/50 px-2 py-0.5 rounded-lg">
              <Text className="text-[10px] font-sans-bold text-foreground uppercase">
                {habits.length} {habits.length === 1 ? "Habit" : "Habits"}
              </Text>
            </View>
          </View>
        )}
      </View>
    ),
    [stats, isLoading, habits.length, error, onCreateHabit],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Habit; index: number }) => (
      <View className="px-6">
        <HabitCard
          habit={item}
          index={index}
          onToggle={handleToggle}
          isUpdating={isToggling}
          onEdit={onEditHabit}
        />
      </View>
    ),
    [handleToggle, isToggling, onEditHabit],
  );

  return (
    <Container className="bg-background">
      <FlashList
        data={habits}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={<HabitEmptyState onCreateHabit={onCreateHabit || (() => {})} />}
        ListFooterComponent={<View className="h-32" />}
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
