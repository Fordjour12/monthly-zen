import React, { memo, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  CheckmarkCircle01Icon,
  CircleIcon,
  ArrowRight01Icon,
  Clock01Icon,
  Tag01Icon,
  FlashIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { useSemanticColors } from "@/utils/theme";
import * as Haptics from "expo-haptics";
import type { Task } from "@/hooks/useTasks";
import Animated, { FadeInRight } from "react-native-reanimated";

interface TaskListItemProps {
  task: Task;
  onToggle: (taskId: number, isCompleted: boolean) => void;
  onEdit?: (task: Task) => void;
  isUpdating?: boolean;
}

function getDifficultyIcon(level: string) {
  switch (level?.toLowerCase()) {
    case "advanced":
    case "hard":
    case "ambitious":
      return { icon: StarIcon, color: "#f59e0b", bg: "bg-amber-500/10", label: "Hard" };
    case "moderate":
    case "balanced":
      return { icon: FlashIcon, color: "#3b82f6", bg: "bg-blue-500/10", label: "Balanced" };
    case "simple":
      return { icon: FlashIcon, color: "#22c55e", bg: "bg-emerald-500/10", label: "Simple" };
    default:
      return { icon: FlashIcon, color: "#6b7280", bg: "bg-muted/10", label: level || "Normal" };
  }
}

function formatSchedule(startTime: string, endTime: string, weekNumber?: number) {
  try {
    const start = new Date(startTime);
    const timeStr = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return weekNumber ? `Week ${weekNumber} • ${timeStr}` : timeStr;
  } catch (e) {
    return "";
  }
}

export const TaskListItem = memo(function TaskListItem({
  task,
  onToggle,
  onEdit,
  isUpdating,
}: TaskListItemProps) {
  const diff = getDifficultyIcon(task.difficultyLevel || "");

  const handleToggle = useCallback(async () => {
    if (isUpdating) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onToggle(task.id, !task.isCompleted);
  }, [task.id, task.isCompleted, onToggle, isUpdating]);

  const handlePress = useCallback(async () => {
    Haptics.selectionAsync();
    onEdit?.(task);
  }, [task, onEdit]);

  return (
    <Animated.View entering={FadeInRight.duration(500)}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={isUpdating}
        activeOpacity={0.8}
        className={`mx-4 mb-4 p-5 rounded-[28px] border flex-row items-center gap-x-4 ${
          task.isCompleted
            ? "bg-surface/30 border-border/30 opacity-60"
            : "bg-surface border-border/60 shadow-sm"
        }`}
      >
        {/* Status Indicator */}
        <TouchableOpacity
          onPress={handleToggle}
          disabled={isUpdating}
          className="w-8 h-8 items-center justify-center"
        >
          {task.isCompleted ? (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={24} color="var(--success)" />
          ) : (
            <HugeiconsIcon icon={CircleIcon} size={24} color="var(--border)" />
          )}
        </TouchableOpacity>

        {/* Content */}
        <View className="flex-1">
          <Text
            className={`text-base font-sans-semibold ${
              task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
            }`}
            numberOfLines={1}
          >
            {task.taskDescription}
          </Text>

          <View className="flex-row items-center gap-x-3 mt-1.5">
            <View className="flex-row items-center gap-x-1">
              <View className="w-1.5 h-1.5 rounded-full bg-accent" />
              <Text className="text-[10px] font-sans-bold text-accent uppercase tracking-widest">
                {task.focusArea}
              </Text>
            </View>

            <View className="flex-row items-center gap-x-1">
              <HugeiconsIcon icon={Clock01Icon} size={10} color="var(--muted-foreground)" />
              <Text className="text-[10px] font-sans-medium text-muted-foreground uppercase">
                {formatSchedule(task.startTime, task.endTime, task.weekNumber)}
              </Text>
            </View>
          </View>
        </View>

        {/* Difficulty Info */}
        <View className={`${diff.bg} p-2 rounded-xl`}>
          <HugeiconsIcon icon={diff.icon} size={14} color={diff.color} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});
