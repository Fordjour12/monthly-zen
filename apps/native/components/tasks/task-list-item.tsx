/**
 * Task List Item Component (Native)
 *
 * Individual task row with checkbox, badges, and tap to edit.
 */

import React, { memo, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
import * as Haptics from "expo-haptics";
import type { Task } from "@/hooks/useTasks";

interface TaskListItemProps {
  task: Task;
  onToggle: (taskId: number, isCompleted: boolean) => void;
  onEdit?: (task: Task) => void;
  isUpdating?: boolean;
}

function getDifficultyColor(level: string) {
  switch (level?.toLowerCase()) {
    case "simple":
      return { bg: "bg-green-500/10", text: "text-green-500" };
    case "moderate":
      return { bg: "bg-yellow-500/10", text: "text-yellow-500" };
    case "advanced":
      return { bg: "bg-red-500/10", text: "text-red-500" };
    default:
      return { bg: "bg-muted/10", text: "text-muted-foreground" };
  }
}

function formatSchedule(
  startTime: string,
  endTime: string,
  weekNumber?: number,
  dayOfWeek?: string,
) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const timeStr = `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  if (weekNumber && dayOfWeek) {
    return `W${weekNumber} • ${dayOfWeek.trim()} • ${timeStr}`;
  }

  return timeStr;
}

export const TaskListItem = memo(function TaskListItem({
  task,
  onToggle,
  onEdit,
  isUpdating,
}: TaskListItemProps) {
  const { primary, muted } = useSemanticColors();
  const difficultyColors = getDifficultyColor(task.difficultyLevel);

  const handleToggle = useCallback(async () => {
    if (isUpdating) return;

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    onToggle(task.id, !task.isCompleted);
  }, [task.id, task.isCompleted, onToggle, isUpdating]);

  const handlePress = useCallback(async () => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (onEdit) {
      onEdit(task);
    }
  }, [task, onEdit]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isUpdating}
      className={`flex-row items-start p-4 bg-card border-b border-border ${
        task.isCompleted ? "opacity-60" : ""
      }`}
      accessibilityLabel={`Task: ${task.taskDescription}. ${
        task.isCompleted ? "Completed" : "Not completed"
      }. Tap to edit.`}
      accessibilityRole="button"
    >
      {/* Checkbox */}
      <TouchableOpacity
        onPress={handleToggle}
        disabled={isUpdating}
        className="mr-3 p-1"
        accessibilityLabel={`Mark ${task.taskDescription} as ${
          task.isCompleted ? "incomplete" : "complete"
        }`}
      >
        <Ionicons
          name={task.isCompleted ? "checkbox" : "square-outline"}
          size={24}
          color={task.isCompleted ? primary : muted}
        />
      </TouchableOpacity>

      {/* Content */}
      <View className="flex-1">
        <Text
          className={`text-base font-medium ${
            task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
          }`}
          numberOfLines={2}
        >
          {task.taskDescription}
        </Text>

        {/* Meta Info */}
        <View className="flex-row items-center flex-wrap gap-2 mt-2">
          {/* Focus Area Badge */}
          <View className="bg-muted/30 px-2 py-0.5 rounded-full">
            <Text className="text-xs text-muted-foreground font-medium">{task.focusArea}</Text>
          </View>

          {/* Difficulty Badge */}
          <View className={`${difficultyColors.bg} px-2 py-0.5 rounded-full`}>
            <Text className={`text-xs font-medium ${difficultyColors.text}`}>
              {task.difficultyLevel || "normal"}
            </Text>
          </View>

          {/* Schedule Info */}
          <Text className="text-xs text-muted-foreground">
            {formatSchedule(task.startTime, task.endTime, task.weekNumber, task.dayOfWeek)}
          </Text>
        </View>

        {/* Scheduling Reason */}
        {task.schedulingReason && (
          <Text className="text-xs text-muted-foreground mt-2" numberOfLines={2}>
            {task.schedulingReason}
          </Text>
        )}
      </View>

      {/* Edit Indicator */}
      <Ionicons name="chevron-forward" size={20} color={muted} className="ml-2" />
    </TouchableOpacity>
  );
});
