import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { format, subDays } from "date-fns";
import { Container } from "@/components/ui/container";
import { Heatmap } from "@/components/ui/heatmap";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  FireIcon,
  Analytics01Icon,
  Trophy01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

export default function HeatMapScreen() {
  const router = useRouter();

  // Fetch task completion data (mocking for now or using available endpoint)
  // In a real app, you'd fetch a larger range of tasks for the heatmap
  const { data: tasksResult, isLoading } = useQuery(
    orpc.calendar.getTasks.queryOptions({
      input: { month: format(new Date(), "yyyy-MM") }, // Fetching current month tasks
    }),
  );

  const heatmapData = useMemo(() => {
    const tasks = tasksResult?.success ? tasksResult.data : [];
    const grouped: Record<string, { completed: number; total: number }> = {};

    // Convert current month tasks into heatmap format
    tasks.forEach((task) => {
      const date = new Date(task.startTime).toDateString();
      if (!grouped[date]) grouped[date] = { completed: 0, total: 0 };
      grouped[date].total += 1;
      if (task.isCompleted) grouped[date].completed += 1;
    });

    // Generate last 90 days for the heatmap
    const result = [];
    const today = new Date();
    for (let i = 90; i >= 0; i--) {
      const date = subDays(today, i);
      const key = date.toDateString();
      const stats = grouped[key] || { completed: 0, total: 0 };
      result.push({ date, ...stats });
    }
    return result;
  }, [tasksResult]);

  const stats = useMemo(() => {
    const completed = heatmapData.reduce((acc, curr) => acc + curr.completed, 0);
    const total = heatmapData.reduce((acc, curr) => acc + curr.total, 0);
    const accuracy = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Simple streak calculation
    let streak = 0;
    for (let i = heatmapData.length - 1; i >= 0; i--) {
      if (heatmapData[i].completed > 0) streak++;
      else if (i < heatmapData.length - 1) break;
    }

    return { completed, accuracy, streak };
  }, [heatmapData]);

  return (
    <Container className="bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="flex-row items-center justify-between mb-8"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 rounded-2xl bg-surface border border-border/50 items-center justify-center"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="var(--foreground)" />
          </TouchableOpacity>
          <Text className="text-lg font-sans-bold text-foreground">Activity Insights</Text>
          <View className="w-12" />
        </Animated.View>

        {/* Hero Heatmap Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mb-8">
          <View className="bg-surface rounded-[32px] p-6 border border-border/50">
            <View className="flex-row items-center gap-x-2 mb-6">
              <View className="w-8 h-8 rounded-lg bg-orange-500/10 items-center justify-center">
                <HugeiconsIcon icon={FireIcon} size={18} color="#f97316" />
              </View>
              <Text className="text-base font-sans-bold text-foreground">Usage Intensity</Text>
            </View>

            <View className="items-center py-2 overflow-hidden">
              <Heatmap data={heatmapData} weeksToShow={13} />
            </View>

            <View className="flex-row justify-between mt-8 pt-6 border-t border-border/30">
              <View className="flex-row items-center gap-x-1">
                <View className="w-2 h-2 rounded-full bg-muted/20" />
                <Text className="text-[10px] font-sans-semibold text-muted-foreground uppercase tracking-widest">
                  None
                </Text>
              </View>
              <View className="flex-row items-center gap-x-1">
                <View className="w-2 h-2 rounded-full bg-success" />
                <Text className="text-[10px] font-sans-semibold text-muted-foreground uppercase tracking-widest">
                  Consistent
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <View className="flex-row gap-x-4 mb-8">
          <StatCard
            icon={Trophy01Icon}
            label="Streak"
            value={`${stats.streak} Days`}
            color="text-orange-500"
            bg="bg-orange-500/10"
            delay={300}
          />
          <StatCard
            icon={Analytics01Icon}
            label="Accuracy"
            value={`${stats.accuracy}%`}
            color="text-blue-500"
            bg="bg-blue-500/10"
            delay={400}
          />
        </View>

        {/* Insights Card */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <View className="bg-accent rounded-[28px] p-6 shadow-xl shadow-accent/20">
            <View className="flex-row items-center gap-x-2 mb-4">
              <HugeiconsIcon icon={SparklesIcon} size={20} color="white" />
              <Text className="text-base font-sans-bold text-white">Focus Trend</Text>
            </View>
            <Text className="text-white/90 text-base font-sans leading-6 mb-4">
              Your productivity peaks on Tuesdays. You usually complete 80% of your tasks before 2
              PM.
            </Text>
            <View className="bg-white/20 h-[1px] w-full mb-4" />
            <Text className="text-white/70 text-xs font-sans-medium uppercase tracking-widest">
              AI Strategy: Try moving complex tasks to Tuesday mornings.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </Container>
  );
}

function StatCard({ icon, label, value, color, bg, delay }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} className="flex-1">
      <View className="bg-surface rounded-3xl p-5 border border-border/50 shadow-sm">
        <View className={`w-10 h-10 rounded-xl ${bg} items-center justify-center mb-4`}>
          <HugeiconsIcon icon={icon} size={20} color="currentColor" className={color} />
        </View>
        <Text className="text-xs font-sans-semibold text-muted-foreground uppercase tracking-wider mb-1">
          {label}
        </Text>
        <Text className="text-xl font-sans-bold text-foreground">{value}</Text>
      </View>
    </Animated.View>
  );
}
