import React, { memo } from "react";
import { View, Text } from "react-native";
import { TaskItem } from "./task-item";
import { DayTasksItem } from "@/hooks/usePlanData";
import { useSemanticColors } from "@/utils/theme";

interface DayTasksProps {
  dayWithTasks: DayTasksItem;
  onToggleTaskComplete: (id: string, isCompleted: boolean) => void;
}

export const DayTasks = memo(({ dayWithTasks, onToggleTaskComplete }: DayTasksProps) => {
  const { muted } = useSemanticColors();

  if (dayWithTasks.tasks.length === 0) {
    return null;
  }

  return (
    <View className="mb-4">
      <View className="bg-muted/20 py-1 px-3 mb-1">
        <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {dayWithTasks.day}
        </Text>
      </View>
      <View>
        {dayWithTasks.tasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggleComplete={onToggleTaskComplete} />
        ))}
      </View>
    </View>
  );
});

DayTasks.displayName = "DayTasks";
