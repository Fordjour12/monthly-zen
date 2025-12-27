import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
import { TaskItem as TaskItemType } from "@/hooks/usePlanData";

interface TaskItemProps {
  task: TaskItemType;
  onToggleComplete: (id: string, isCompleted: boolean) => void;
}

const PriorityBadge = ({ priority }: { priority: TaskItemType["priority"] }) => {
  let bgClass = "bg-muted/10";
  let textClass = "text-muted-foreground";

  if (priority === "High") {
    bgClass = "bg-red-500/10";
    textClass = "text-red-500";
  } else if (priority === "Medium") {
    bgClass = "bg-yellow-500/10";
    textClass = "text-yellow-500";
  } else if (priority === "Low") {
    bgClass = "bg-green-500/10";
    textClass = "text-green-500";
  }

  return (
    <View className={`px-2 py-0.5 rounded-full ${bgClass}`}>
      <Text className={`text-xs font-medium ${textClass}`}>{priority}</Text>
    </View>
  );
};

export const TaskItem = memo(({ task, onToggleComplete }: TaskItemProps) => {
  const { primary, muted } = useSemanticColors();

  return (
    <View className="flex-row items-center p-3 bg-card border-b border-border">
      <TouchableOpacity
        onPress={() => onToggleComplete(task.id, !task.isCompleted)}
        className="mr-3 p-1"
        accessibilityLabel={`Mark ${task.title} as ${task.isCompleted ? "incomplete" : "complete"}`}
      >
        <Ionicons
          name={task.isCompleted ? "checkbox" : "square-outline"}
          size={24}
          color={task.isCompleted ? primary : muted}
        />
      </TouchableOpacity>

      <View className="flex-1">
        <Text
          className={`text-base font-medium ${
            task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {task.title}
        </Text>
        <View className="flex-row items-center mt-1 space-x-2">
          <PriorityBadge priority={task.priority} />
          <Text className="text-xs text-muted-foreground">• {task.focusArea}</Text>
        </View>
      </View>
    </View>
  );
});

TaskItem.displayName = "TaskItem";
