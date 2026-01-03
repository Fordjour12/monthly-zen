import { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { useSemanticColors } from "@/utils/theme";

export function PlanProgressCard() {
  const router = useRouter();
  const { primary } = useSemanticColors();

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
      monthYear: plan.monthYear || "December Plan",
    };
  }, [planData]);

  const handlePress = () => {
    if (planData?.success && planData.data) {
      router.push(`/plans/${planData.data.id}`);
    } else {
      router.push("/(tabs)/generate-plan");
    }
  };

  const progressPercent = Math.round(progress * 100);
  const filledBlocks = Math.floor(progressPercent / 10);
  const emptyBlocks = Math.max(0, 10 - filledBlocks);
  const progressBar = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);

  if (isLoading) {
    return (
      <Card className="mx-4 mb-4 p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="w-5 h-5 rounded-full bg-muted animate-pulse" />
            <View className="w-32 h-5 rounded bg-muted animate-pulse" />
          </View>
          <View className="w-12 h-6 rounded bg-muted animate-pulse" />
        </View>
        <View className="h-6 bg-surface rounded mb-2 overflow-hidden">
          <View className="h-full bg-primary/30 rounded" style={{ width: "60%" }} />
        </View>
        <View className="flex-row justify-between">
          <View className="w-24 h-4 rounded bg-muted animate-pulse" />
          <View className="w-20 h-4 rounded bg-muted animate-pulse" />
        </View>
      </Card>
    );
  }

  return (
    <Pressable onPress={handlePress} className="w-full">
      <Card className="w-full p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center">
              <Ionicons name="calendar" size={18} color={primary} />
            </View>
            <Text className="font-semibold text-foreground text-lg">{monthYear}</Text>
          </View>
          <View className="bg-primary/10 px-3 py-1 rounded">
            <Text className="text-sm font-bold text-primary">{progressPercent}%</Text>
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-xl font-bold text-foreground tracking-wider font-mono">
            {progressBar}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm text-muted-foreground">
            {weeksLeft} {weeksLeft === 1 ? "week" : "weeks"} left
          </Text>
          <Text className="text-muted-foreground">•</Text>
          <Text className="text-sm text-muted-foreground">
            {tasksCompleted}/{totalTasks} tasks
          </Text>
        </View>

        {totalTasks === 0 && (
          <Pressable
            className="mt-3 py-2.5 px-4 bg-primary/10 rounded-lg items-center"
            onPress={() => router.push("/(tabs)/generate-plan")}
          >
            <Text className="text-sm font-semibold text-primary">Generate Plan</Text>
          </Pressable>
        )}
      </Card>
    </Pressable>
  );
}
