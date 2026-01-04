import { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { Card } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Calendar01Icon, ArrowRight01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { useSemanticColors } from "@/utils/theme";
import Animated, { FadeInDown } from "react-native-reanimated";

export function PlanProgressCard() {
  const router = useRouter();
  const colors = useSemanticColors();

  const { data: planData, isLoading } = useQuery({
    queryKey: ["plan", "current"],
    queryFn: () => orpc.plan.getCurrent.query(),
    staleTime: 1000 * 60 * 5,
  });

  const { progress, weeksLeft, tasksCompleted, totalTasks, monthYear } = useMemo(() => {
    if (!planData?.success || !planData.data) {
      return {
        progress: 0,
        weeksLeft: 0,
        tasksCompleted: 0,
        totalTasks: 0,
        monthYear: "No Active Plan",
      };
    }

    const plan = planData.data;
    const tasks = plan.tasks || [];
    const completedTasks = tasks.filter((t: any) => t.isCompleted).length;
    const total = tasks.length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysLeft = Math.max(0, lastDayOfMonth - now.getDate());
    const weeksLeftCalc = Math.ceil(daysLeft / 7);

    return {
      progress: total > 0 ? completedTasks / total : 0,
      weeksLeft: weeksLeftCalc,
      tasksCompleted: completedTasks,
      totalTasks: total,
      monthYear: plan.monthYear || "Current Plan",
    };
  }, [planData]);

  const handlePress = () => {
    if (planData?.success && planData.data) {
      router.push(`/plans/${planData.data.id}`);
    } else {
      router.push("/(tabs)/planner/create");
    }
  };

  const progressPercent = Math.round(progress * 100);

  if (isLoading) {
    return (
      <View className="px-6 mb-6">
        <View className="h-40 w-full bg-surface rounded-3xl animate-pulse" />
      </View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(600)} className="px-6 mb-8">
      <Pressable onPress={handlePress} activeOpacity={0.9}>
        <Card className="p-6 border-none bg-accent shadow-2xl shadow-accent/30 rounded-[32px]">
          <View className="flex-row items-start justify-between mb-8">
            <View>
              <View className="flex-row items-center gap-x-2 mb-2 p-1 px-3 bg-white/20 rounded-full self-start">
                <HugeiconsIcon icon={Calendar01Icon} size={14} color="white" />
                <Text className="text-[10px] font-sans-bold text-white uppercase tracking-widest">
                  Active Plan
                </Text>
              </View>
              <Text className="text-2xl font-sans-bold text-white">{monthYear}</Text>
            </View>
            <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center">
              <HugeiconsIcon icon={SparklesIcon} size={24} color="white" />
            </View>
          </View>

          <View className="mb-4">
            <View className="flex-row justify-between items-end mb-2">
              <Text className="text-4xl font-sans-bold text-white">{progressPercent}%</Text>
              <Text className="text-sm font-sans-medium text-white/80 mb-1">
                {tasksCompleted} / {totalTasks} tasks
              </Text>
            </View>
            <View className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <View
                className="h-full bg-white rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-sans-medium text-white/80 uppercase tracking-widest">
              {weeksLeft} {weeksLeft === 1 ? "week" : "weeks"} remaining
            </Text>
            <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="white" />
            </View>
          </View>

          {totalTasks === 0 && (
            <View className="mt-6 pt-6 border-t border-white/10">
              <Text className="text-sm font-sans text-white/90 mb-4">
                You haven't generated a plan for this month yet.
              </Text>
              <View className="bg-white py-3 rounded-2xl items-center">
                <Text className="text-accent font-sans-bold">Generate Now</Text>
              </View>
            </View>
          )}
        </Card>
      </Pressable>
    </Animated.View>
  );
}
