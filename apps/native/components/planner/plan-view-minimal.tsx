import { useMemo, useState, useCallback } from "react";
import { View, Text, RefreshControl, TouchableOpacity, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Card, Button, Skeleton, Surface } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { orpc } from "@/utils/orpc";
import { format } from "date-fns";
import { Container } from "@/components/ui/container";
import type { AIResponseWithMetadata, WeeklyBreakdown, TaskDescription } from "@monthly-zen/types";

interface TaskItem {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  focusArea: string;
  isCompleted: boolean;
}

interface DayTasksItem {
  day: string;
  tasks: TaskItem[];
}

interface WeekSectionData {
  weekNumber: number;
  goals: string[];
  dailyTasks: DayTasksItem[];
  isExpanded: boolean;
  taskCount: number;
}

function CompactPriorityBadge({ priority }: { priority: "High" | "Medium" | "Low" }) {
  const colors = {
    High: { bg: "#fef2f2", text: "#dc2626" },
    Medium: { bg: "#fffbeb", text: "#d97706" },
    Low: { bg: "#f0fdf4", text: "#16a34a" },
  };
  const color = colors[priority];

  return (
    <View className="px-1.5 py-0.5 rounded" style={{ backgroundColor: color.bg }}>
      <Text className="text-[10px] font-medium" style={{ color: color.text }}>
        {priority[0]}
      </Text>
    </View>
  );
}

export function PlanViewMinimal({ planId }: { planId: number }) {
  const router = useRouter();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery(
    orpc.plan.getPlanById.queryOptions({
      input: { planId },
    }),
  );

  const structuredData = (result?.data?.parsed as AIResponseWithMetadata | undefined)
    ?.structuredData;
  const planInfo = result?.data?.plan;

  const toggleWeek = useCallback((weekNumber: number) => {
    setExpandedWeek((prev) => (prev === weekNumber ? null : weekNumber));
  }, []);

  const sectionedData = useMemo(() => {
    if (!structuredData?.weekly_breakdown || !Array.isArray(structuredData.weekly_breakdown)) {
      return [];
    }

    return structuredData.weekly_breakdown.map((week: WeeklyBreakdown, index: number) => {
      const weekNum = week.week || index + 1;

      const dailyTasks: DayTasksItem[] = [];
      if (week.daily_tasks) {
        Object.entries(week.daily_tasks).forEach(([day, tasks]) => {
          const taskItems: TaskItem[] = (tasks as TaskDescription[]).map(
            (task: TaskDescription, tIndex: number) => ({
              id: `task-${weekNum}-${day}-${tIndex}`,
              title: task.task_description,
              priority: (task.difficulty_level === "advanced"
                ? "High"
                : task.difficulty_level === "moderate"
                  ? "Medium"
                  : "Low") as "High" | "Medium" | "Low",
              focusArea: task.focus_area,
              isCompleted: false,
            }),
          );
          dailyTasks.push({ day, tasks: taskItems });
        });
      }

      const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      dailyTasks.sort((a, b) => {
        const indexA = dayOrder.indexOf(a.day.substring(0, 3));
        const indexB = dayOrder.indexOf(b.day.substring(0, 3));
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        return 0;
      });

      return {
        weekNumber: weekNum,
        goals: week.goals || [],
        dailyTasks,
        isExpanded: expandedWeek === weekNum,
        taskCount: dailyTasks.reduce((acc, d) => acc + d.tasks.length, 0),
      } as WeekSectionData;
    });
  }, [structuredData, expandedWeek]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const totalTasks = sectionedData.reduce((acc, w) => acc + w.taskCount, 0);
  const totalGoals = sectionedData.reduce((acc, w) => acc + w.goals.length, 0);

  if (isLoading) {
    return (
      <Container>
        <View className="flex-1 p-4">
          <Skeleton className="h-6 w-40 rounded mb-4" />
          <Skeleton className="h-24 w-full rounded-lg mb-3" />
          <Skeleton className="h-20 w-full rounded-lg mb-3" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </View>
      </Container>
    );
  }

  if (error || !result?.success || !planInfo) {
    return (
      <Container>
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="alert-circle" size={40} color="#ef4444" />
          <Text className="text-danger text-center mt-3 text-sm">Failed to load</Text>
          <Button size="sm" onPress={() => refetch()} className="mt-4">
            Retry
          </Button>
        </View>
      </Container>
    );
  }

  if (!structuredData?.weekly_breakdown?.length) {
    return (
      <Container>
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="document-outline" size={40} color="#6b7280" />
          <Text className="text-foreground text-center mt-3 text-sm">No data</Text>
          <Button size="sm" onPress={() => router.back()} className="mt-4">
            Back
          </Button>
        </View>
      </Container>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 pb-24"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
      }
    >
      <Surface className="p-4 rounded-xl mb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-bold text-foreground">
              {format(new Date(planInfo.monthYear), "MMM yyyy")}
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              <Text className="text-xs text-muted-foreground">
                {totalTasks} tasks · {totalGoals} goals
              </Text>
            </View>
          </View>
          <View
            className={`px-2 py-1 rounded ${
              planInfo.status === "CONFIRMED" ? "bg-success/10" : "bg-warning/10"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                planInfo.status === "CONFIRMED" ? "text-success" : "text-warning"
              }`}
            >
              {planInfo.status}
            </Text>
          </View>
        </View>
      </Surface>

      {sectionedData.map((week) => (
        <Surface key={week.weekNumber} className="rounded-lg mb-2 overflow-hidden">
          <TouchableOpacity
            onPress={() => toggleWeek(week.weekNumber)}
            className="flex-row items-center justify-between p-3"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={week.isExpanded ? "chevron-down" : "chevron-forward"}
                size={18}
                color="#6b7280"
              />
              <Text className="font-medium text-foreground">Week {week.weekNumber}</Text>
            </View>
            <Text className="text-xs text-muted-foreground">{week.taskCount} tasks</Text>
          </TouchableOpacity>

          {week.isExpanded && (
            <View className="px-3 pb-3 border-t border-border">
              {week.goals.slice(0, 3).map((goal, i) => (
                <View key={i} className="flex-row items-start gap-2 py-1.5">
                  <Ionicons name="flag-outline" size={12} color="#10b981" />
                  <Text className="text-xs text-foreground flex-1" numberOfLines={1}>
                    {goal}
                  </Text>
                </View>
              ))}

              <View className="flex-row flex-wrap gap-1 mt-2">
                {week.dailyTasks.map((dayTasks) =>
                  dayTasks.tasks.slice(0, 2).map((task) => (
                    <View
                      key={task.id}
                      className="flex-row items-center gap-1 px-2 py-1 bg-surface rounded"
                    >
                      <Text className="text-[10px] text-foreground" numberOfLines={1}>
                        {task.title.substring(0, 20)}
                      </Text>
                      <CompactPriorityBadge priority={task.priority} />
                    </View>
                  )),
                )}
              </View>
            </View>
          )}
        </Surface>
      ))}
    </ScrollView>
  );
}
