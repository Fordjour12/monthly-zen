import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  CheckmarkCircle01Icon,
  CircleIcon,
  AlertCircleIcon,
  HelpCircleIcon,
  Circle01Icon,
} from "@hugeicons/core-free-icons";
import { TaskItem as TaskItemType } from "@/hooks/usePlanData";
import Animated, { FadeInRight } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface TaskItemProps {
  task: TaskItemType;
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  index: number;
}

const PriorityBadge = ({ priority }: { priority: TaskItemType["priority"] }) => {
  let color = "var(--muted-foreground)";
  let label = priority || "Normal";

  if (priority === "High") color = "var(--danger)";
  else if (priority === "Medium") color = "var(--warning)";
  else if (priority === "Low") color = "var(--success)";

  return (
    <View className="flex-row items-center gap-x-1.5">
      <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </Text>
    </View>
  );
};

export const TaskItem = memo(({ task, onToggleComplete, index }: TaskItemProps) => {
  const handleToggle = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onToggleComplete(task.id, !task.isCompleted);
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(500)}>
      <View
        className={`flex-row items-center p-4 mb-2 rounded-2xl border ${
          task.isCompleted
            ? "bg-surface/30 border-border/30 opacity-60"
            : "bg-surface border-border/50"
        }`}
      >
        <TouchableOpacity
          onPress={handleToggle}
          className="mr-3 w-8 h-8 items-center justify-center"
        >
          {task.isCompleted ? (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} color="var(--success)" />
          ) : (
            <HugeiconsIcon icon={CircleIcon} size={22} color="var(--border)" />
          )}
        </TouchableOpacity>

        <View className="flex-1">
          <Text
            className={`text-base font-sans-medium ${
              task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
            }`}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <View className="flex-row items-center mt-1 gap-x-3">
            <PriorityBadge priority={task.priority} />
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
              {task.focusArea}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

TaskItem.displayName = "TaskItem";
