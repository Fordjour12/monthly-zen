import React from "react";
import { View, Text } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ActivityIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Analytics01Icon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

interface TaskStatsProps {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  isLoading?: boolean;
}

export function TaskStats({
  total,
  completed,
  pending,
  completionRate,
  isLoading,
}: TaskStatsProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(600)}
      className="flex-row px-4 gap-x-3 my-6"
    >
      <StatCard
        icon={Analytics01Icon}
        label="Completion"
        value={`${Math.round(completionRate)}%`}
        color="text-accent"
        bg="bg-accent/10"
      />
      <StatCard
        icon={CheckmarkCircle01Icon}
        label="Success"
        value={completed}
        color="text-success"
        bg="bg-success/10"
      />
      <StatCard
        icon={Clock01Icon}
        label="Open"
        value={pending}
        color="text-blue-500"
        bg="bg-blue-500/10"
      />
    </Animated.View>
  );
}

function StatCard({ icon, label, value, color, bg }: any) {
  return (
    <View className="flex-1 bg-surface border border-border/50 rounded-[24px] p-4 shadow-sm items-center">
      <View className={`w-8 h-8 rounded-xl ${bg} items-center justify-center mb-3`}>
        <HugeiconsIcon icon={icon} size={16} color="currentColor" className={color} />
      </View>
      <Text className="text-[9px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-1">
        {label}
      </Text>
      <Text className="text-lg font-sans-bold text-foreground">{value}</Text>
    </View>
  );
}
