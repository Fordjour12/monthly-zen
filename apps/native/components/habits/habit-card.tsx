/**
 * Habit Card Component
 *
 * Displays a single habit with completion toggle and streak info
 */

import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
import type { Habit } from "@/hooks/useHabits";

interface HabitCardProps {
  habit: Habit;
  onToggle: (habitId: number) => Promise<void>;
  isUpdating?: boolean;
  onEdit?: (habit: Habit) => void;
  onDelete?: (habitId: number) => void;
}

export function HabitCard({
  habit,
  onToggle,
  isUpdating = false,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const { primary, muted, border } = useSemanticColors();

  const handleToggle = useCallback(async () => {
    if (!isUpdating) {
      await onToggle(habit.id);
    }
  }, [habit.id, onToggle, isUpdating]);

  const frequencyLabel = {
    daily: "Every day",
    weekly: "Selected days",
    custom: "Custom",
  }[habit.frequency];

  return (
    <View
      className="flex-row items-center p-4 rounded-xl bg-surface border border-border mb-3"
      style={{ borderLeftWidth: 4, borderLeftColor: habit.color }}
    >
      {/* Completion Toggle */}
      <TouchableOpacity onPress={handleToggle} disabled={isUpdating} className="mr-4">
        {isUpdating ? (
          <ActivityIndicator size="small" color={primary} />
        ) : (
          <View
            className="w-8 h-8 rounded-full items-center justify-center border-2"
            style={{
              borderColor: habit.isCompletedToday ? habit.color : border,
              backgroundColor: habit.isCompletedToday ? habit.color : "transparent",
            }}
          >
            {habit.isCompletedToday && <Ionicons name="checkmark" size={18} color="white" />}
          </View>
        )}
      </TouchableOpacity>

      {/* Habit Info */}
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg">{habit.icon}</Text>
          <Text className="text-lg font-semibold text-foreground">{habit.name}</Text>
        </View>
        <Text className="text-sm text-muted mt-0.5">{frequencyLabel}</Text>
      </View>

      {/* Streak Info */}
      <View className="items-end mr-4">
        {habit.currentStreak > 0 && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="flame" size={14} color={primary} />
            <Text className="text-sm font-semibold text-foreground">{habit.currentStreak}</Text>
          </View>
        )}
        <Text className="text-xs text-muted">{habit.completionRate}% this week</Text>
      </View>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <View className="flex-row gap-2">
          {onEdit && (
            <TouchableOpacity onPress={() => onEdit(habit)} className="p-2 rounded-lg">
              <Ionicons name="create-outline" size={18} color={muted} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={() => onDelete(habit.id)} className="p-2 rounded-lg">
              <Ionicons name="trash-outline" size={18} color={muted} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
