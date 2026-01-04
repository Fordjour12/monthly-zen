import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  CheckmarkCircle01Icon,
  CircleIcon,
  FireIcon,
  AiEditingIcon,
  Delete02Icon,
  ArrowRight01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons";
import { useSemanticColors } from "@/utils/theme";
import type { Habit } from "@/hooks/useHabits";
import Animated, { FadeInRight } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface HabitCardProps {
  habit: Habit;
  onToggle: (habitId: number) => Promise<void>;
  isUpdating?: boolean;
  onEdit?: (habit: Habit) => void;
  onDelete?: (habitId: number) => void;
  index: number;
}

export function HabitCard({ habit, onToggle, isUpdating = false, onEdit, index }: HabitCardProps) {
  const handleToggle = useCallback(async () => {
    if (!isUpdating) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onToggle(habit.id);
    }
  }, [habit.id, onToggle, isUpdating]);

  const handleEdit = useCallback(() => {
    Haptics.selectionAsync();
    onEdit?.(habit);
  }, [habit, onEdit]);

  return (
    <Animated.View entering={FadeInRight.delay(index * 100).duration(600)}>
      <TouchableOpacity
        onPress={handleEdit}
        activeOpacity={0.8}
        className={`mb-4 p-5 rounded-[28px] border flex-row items-center gap-x-4 ${
          habit.isCompletedToday
            ? "bg-surface/30 border-border/30 opacity-60"
            : "bg-surface border-border/60 shadow-sm"
        }`}
      >
        {/* Progress Circle Toggle */}
        <TouchableOpacity
          onPress={handleToggle}
          disabled={isUpdating}
          className="w-10 h-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${habit.color}15` }}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={habit.color} />
          ) : habit.isCompletedToday ? (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={24} color={habit.color} />
          ) : (
            <HugeiconsIcon icon={CircleIcon} size={24} color="var(--border)" />
          )}
        </TouchableOpacity>

        {/* Info */}
        <View className="flex-1">
          <View className="flex-row items-center gap-x-2">
            <Text className="text-base font-sans-bold text-foreground">{habit.name}</Text>
          </View>
          <View className="flex-row items-center gap-x-2 mt-1">
            <HugeiconsIcon icon={Calendar03Icon} size={10} color="var(--muted-foreground)" />
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
              {habit.frequency} • {Math.round(habit.completionRate)}% Efficiency
            </Text>
          </View>
        </View>

        {/* Streak Badge */}
        {habit.currentStreak > 0 && (
          <View className="bg-orange-500/10 px-3 py-1.5 rounded-xl flex-row items-center gap-x-1">
            <HugeiconsIcon icon={FireIcon} size={12} color="#f97316" />
            <Text className="text-xs font-sans-bold text-orange-500">{habit.currentStreak}</Text>
          </View>
        )}

        <View className="w-8 h-8 rounded-full bg-muted/5 items-center justify-center">
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="var(--muted-foreground)" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
