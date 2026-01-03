import { useMemo, useState, useCallback } from "react";
import { View, Text, RefreshControl, TouchableOpacity, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Card, Button, Skeleton } from "heroui-native";
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
}

function PriorityBadge({ priority }: { priority: "High" | "Medium" | "Low" }) {
  const colors = {
    High: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
    Medium: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
    Low: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  };
  const color = colors[priority];

  return (
    <View
      className="px-2 py-0.5 rounded-full"
      style={{ backgroundColor: color.bg, borderColor: color.border, borderWidth: 1 }}
    >
      <Text className="text-xs font-medium" style={{ color: color.text }}>
        {priority}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusColor = status === "CONFIRMED" ? "#10b981" : "#f59e0b";
  const statusBg = status === "CONFIRMED" ? "#ecfdf5" : "#fffbeb";

  return (
    <View
      className="px-2 py-0.5 rounded-full"
      style={{ backgroundColor: statusBg, borderColor: statusColor, borderWidth: 1 }}
    >
      <Text className="text-xs font-medium" style={{ color: statusColor }}>
        {status}
      </Text>
    </View>
  );
}

export function PlanViewSimple({ planId }: { planId: number }) {
  const router = useRouter();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
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
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekNumber)) {
        next.delete(weekNumber);
      } else {
        next.add(weekNumber);
      }
      return next;
    });
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

      const dayOrder = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      dailyTasks.sort((a, b) => {
        const indexA = dayOrder.indexOf(a.day);
        const indexB = dayOrder.indexOf(b.day);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        return 0;
      });

      return {
        weekNumber: weekNum,
        goals: week.goals || [],
        dailyTasks,
        isExpanded: expandedWeeks.has(weekNum),
      } as WeekSectionData;
    });
  }, [structuredData, expandedWeeks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <Container>
        <View className="flex-1 p-4">
          <View className="mb-4">
            <Skeleton className="h-8 w-48 rounded mb-2" />
            <Skeleton className="h-5 w-32 rounded" />
          </View>
          <Skeleton className="h-48 w-full rounded-lg mb-4" />
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg mb-4" />
          ))}
        </View>
      </Container>
    );
  }

  if (error || !result?.success || !planInfo) {
    return (
      <Container>
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text className="text-danger text-center mt-4">Failed to load plan</Text>
          <Button onPress={() => refetch()} className="mt-6">
            Try Again
          </Button>
        </View>
      </Container>
    );
  }

  if (!structuredData?.weekly_breakdown?.length) {
    return (
      <Container>
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="document-text-outline" size={48} color="#6b7280" />
          <Text className="text-foreground text-center mt-4">No plan data</Text>
          <Button onPress={() => router.back()} className="mt-6">
            Go Back
          </Button>
        </View>
      </Container>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-24"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
      }
    >
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-foreground">
              {format(new Date(planInfo.monthYear), "MMMM yyyy")}
            </Text>
            <StatusBadge status={planInfo.status} />
          </View>
          <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
            <Ionicons name="calendar" size={20} color="#3b82f6" />
          </View>
        </View>

        {structuredData?.monthly_summary && (
          <Text className="text-muted-foreground mb-4">{structuredData.monthly_summary}</Text>
        )}

        {sectionedData.map((week) => {
          const taskCount = week.dailyTasks.reduce((acc, d) => acc + d.tasks.length, 0);

          return (
            <Card key={week.weekNumber} className="mb-3 p-4">
              <TouchableOpacity
                onPress={() => toggleWeek(week.weekNumber)}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name={week.isExpanded ? "chevron-down" : "chevron-forward"}
                    size={20}
                    color="#6b7280"
                  />
                  <Text className="font-semibold text-foreground">Week {week.weekNumber}</Text>
                </View>
                <Text className="text-sm text-muted-foreground">{taskCount} tasks</Text>
              </TouchableOpacity>

              {week.isExpanded && (
                <View className="mt-3 pl-6 border-l-2 border-muted">
                  {week.goals.slice(0, 2).map((goal, i) => (
                    <View key={i} className="flex-row items-start gap-2 mb-2">
                      <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                      <Text className="text-sm text-foreground flex-1">{goal}</Text>
                    </View>
                  ))}

                  {week.dailyTasks.slice(0, 3).map((dayTasks) => (
                    <View key={dayTasks.day} className="mt-3">
                      <Text className="text-xs font-medium text-muted-foreground mb-1 uppercase">
                        {dayTasks.day}
                      </Text>
                      {dayTasks.tasks.slice(0, 2).map((task) => (
                        <View key={task.id} className="flex-row items-center gap-2 py-1">
                          <View className="w-4 h-4 rounded-full border border-muted" />
                          <Text className="text-sm text-foreground flex-1">{task.title}</Text>
                          <PriorityBadge priority={task.priority} />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}
