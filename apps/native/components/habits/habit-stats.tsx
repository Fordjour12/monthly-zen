/**
 * Habit Stats Component
 *
 * Displays habit statistics summary with progress bar
 */

import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";

interface HabitStatsProps {
  totalHabits: number;
  completedToday: number;
  completionRate: number;
  currentStreak: number;
  isLoading?: boolean;
}

export function HabitStats({
  totalHabits,
  completedToday,
  completionRate,
  currentStreak,
  isLoading = false,
}: HabitStatsProps) {
  const { primary, accent } = useSemanticColors();

  const progress = useMemo(() => {
    if (totalHabits === 0) return 0;
    return Math.round((completedToday / totalHabits) * 100);
  }, [completedToday, totalHabits]);

  if (isLoading) {
    return (
      <View className="p-4 rounded-xl bg-surface border border-border">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-primary/20 animate-pulse" />
          <View className="flex-1 gap-2">
            <View className="h-4 w-24 rounded bg-muted animate-pulse" />
            <View className="h-3 w-16 rounded bg-muted/50 animate-pulse" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="p-4 rounded-xl bg-surface border border-border">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: `${primary}20` }}
          >
            <Ionicons name="flame" size={22} color={primary} />
          </View>
          <View>
            <Text className="text-lg font-bold text-foreground">Habits</Text>
            <Text className="text-sm text-muted">
              {completedToday} of {totalHabits} completed today
            </Text>
          </View>
        </View>
        {currentStreak > 0 && (
          <View className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10">
            <Ionicons name="trophy" size={14} color={accent} />
            <Text className="text-sm font-semibold text-accent">{currentStreak} day streak</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View className="h-2 rounded-full bg-muted overflow-hidden mb-2">
        <View
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: primary,
          }}
        />
      </View>

      {/* Stats Row */}
      <View className="flex-row justify-between">
        <View className="items-center">
          <Text className="text-2xl font-bold text-foreground">{completionRate}%</Text>
          <Text className="text-xs text-muted">Weekly Avg</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-foreground">{totalHabits}</Text>
          <Text className="text-xs text-muted">Active</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-foreground">{completedToday}</Text>
          <Text className="text-xs text-muted">Today</Text>
        </View>
      </View>
    </View>
  );
}
