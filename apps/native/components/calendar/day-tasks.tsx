import React, { memo } from "react";
import { View, Text } from "react-native";
import { TaskItem } from "../tasks/task-item";
import { DayTasksItem } from "@/hooks/usePlanData";
import Animated, { FadeInUp } from "react-native-reanimated";

interface DayTasksProps {
  dayWithTasks: DayTasksItem;
  onToggleTaskComplete: (id: string, isCompleted: boolean) => void;
}

export const DayTasks = memo(({ dayWithTasks, onToggleTaskComplete }: DayTasksProps) => {
  if (dayWithTasks.tasks.length === 0) {
    return null;
  }

  return (
    <Animated.View entering={FadeInUp.duration(400)} className="mb-6">
      <View className="flex-row items-center gap-4 mb-4 px-2">
        <View className="h-[1px] flex-1 bg-border/40" />
        <Text className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">
          {dayWithTasks.day}
        </Text>
        <View className="h-[1px] flex-1 bg-border/40" />
      </View>
      <View className="gap-3">
        {dayWithTasks.tasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggleComplete={onToggleTaskComplete} />
        ))}
      </View>
    </Animated.View>
  );
});

DayTasks.displayName = "DayTasks";
