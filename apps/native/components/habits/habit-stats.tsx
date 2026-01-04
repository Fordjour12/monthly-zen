import React from "react";
import { View, Text } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  FireIcon,
  CheckmarkCircle01Icon,
  Analytics01Icon,
  Trophy01Icon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

interface HabitStatsProps {
  totalHabits: number;
  completedToday: number;
  completionRate: number;
  currentStreak: number;
  isLoading?: boolean;
}

export function HabitStats({
  totalHabits,
  completedToday,
  completionRate,
  currentStreak,
}: HabitStatsProps) {
  return (
    <Animated.View entering={FadeInDown.delay(100).duration(600)} className="flex-row gap-x-3 mt-6">
      <StatCard
        icon={FireIcon}
        label="Streak"
        value={`${currentStreak} Days`}
        color="text-orange-500"
        bg="bg-orange-500/10"
      />
      <StatCard
        icon={Analytics01Icon}
        label="Efficiency"
        value={`${Math.round(completionRate)}%`}
        color="text-accent"
        bg="bg-accent/10"
      />
      <StatCard
        icon={CheckmarkCircle01Icon}
        label="Today"
        value={`${completedToday}/${totalHabits}`}
        color="text-success"
        bg="bg-success/10"
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
