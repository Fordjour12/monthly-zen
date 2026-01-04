import { View, Text, Pressable } from "react-native";
import { Card } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CheckmarkCircle01Icon, CircleIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

const tasks: Task[] = [
  { id: "1", title: "Review monthly architecture", completed: true },
  { id: "2", title: "Draft high-level weekly milestones", completed: false },
  { id: "3", title: "Schedule AI sync for deep work", completed: false },
  { id: "4", title: "Refine personal KPI dashboard", completed: false },
];

export function TodaysTasksCard() {
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <Animated.View entering={FadeInDown.delay(500).duration(600)} className="px-6 mb-8">
      <View className="flex-row items-center justify-between mb-4 px-1">
        <View className="flex-row items-center gap-x-2">
          <Text className="text-sm font-sans-bold text-foreground uppercase tracking-widest">
            Today's Focus
          </Text>
          <View className="bg-success/10 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-sans-bold text-success uppercase">
              {completedCount} / {tasks.length}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push("/tasks")}>
          <Text className="text-xs font-sans-semibold text-accent">View all</Text>
        </TouchableOpacity>
      </View>

      <Card className="p-4 border-none bg-surface/50 rounded-[24px]">
        {tasks.map((task, idx) => (
          <View key={task.id}>
            <Pressable
              className="flex-row items-center gap-x-4 py-3.5"
              onPress={() => router.push("/tasks")}
            >
              <View className="items-center justify-center">
                {task.completed ? (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} color="var(--success)" />
                ) : (
                  <HugeiconsIcon icon={CircleIcon} size={22} color="var(--border)" />
                )}
              </View>
              <View className="flex-1">
                <Text
                  className={`text-base font-sans ${
                    task.completed
                      ? "text-muted-foreground line-through opacity-60"
                      : "text-foreground"
                  }`}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="var(--muted-foreground)" />
            </Pressable>
            {idx < tasks.length - 1 && <View className="h-[1px] bg-border/30 ml-10" />}
          </View>
        ))}
      </Card>
    </Animated.View>
  );
}

import { TouchableOpacity } from "react-native";
