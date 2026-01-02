import { useMemo, useState, useCallback } from "react";
import { View, Text, RefreshControl, TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
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

function StatusBadge({ status, confidence }: { status: string; confidence?: number | null }) {
  const statusColor = status === "CONFIRMED" ? "#10b981" : "#f59e0b";
  const statusBg = status === "CONFIRMED" ? "#ecfdf5" : "#fffbeb";

  return (
    <View className="flex-row items-center gap-2">
      <View
        className="px-2 py-0.5 rounded-full"
        style={{ backgroundColor: statusBg, borderColor: statusColor, borderWidth: 1 }}
      >
        <Text className="text-xs font-medium" style={{ color: statusColor }}>
          {status}
        </Text>
      </View>
      {confidence !== null && confidence !== undefined && (
        <View
          className="px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "#f3f4f6", borderColor: "#d1d5db", borderWidth: 1 }}
        >
          <Text className="text-xs font-medium text-gray-600">{confidence}% confidence</Text>
        </View>
      )}
    </View>
  );
}

export function PlanView({ planId }: { planId: number }) {
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

          dailyTasks.push({
            day,
            tasks: taskItems,
          });
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

  const renderWeekSection = useCallback(
    ({ item }: { item: WeekSectionData }) => {
      const taskCount = item.dailyTasks.reduce((acc, d) => acc + d.tasks.length, 0);

      return (
        <Card className="m-4 p-4">
          <TouchableOpacity
            onPress={() => toggleWeek(item.weekNumber)}
            className="flex-row items-center justify-between mb-3"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={item.isExpanded ? "chevron-down" : "chevron-forward"}
                size={20}
                color="#6b7280"
              />
              <Text className="text-lg font-semibold text-foreground">Week {item.weekNumber}</Text>
            </View>
            <View className="px-2 py-1 bg-primary/10 rounded">
              <Text className="text-sm text-foreground font-medium">{taskCount} tasks</Text>
            </View>
          </TouchableOpacity>

          {item.isExpanded && (
            <View className="mt-2 pl-6 border-l-2 border-muted">
              {item.goals.length > 0 && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    Goals
                  </Text>
                  {item.goals.map((goal, i) => (
                    <View key={i} className="flex-row items-start gap-2 mb-1">
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text className="text-foreground flex-1">{goal}</Text>
                    </View>
                  ))}
                </View>
              )}

              {item.dailyTasks.map((dayTasks) => (
                <View key={dayTasks.day} className="mb-4">
                  <Text className="text-sm font-medium text-foreground mb-2">{dayTasks.day}</Text>
                  {dayTasks.tasks.map((task) => (
                    <View
                      key={task.id}
                      className="flex-row items-center gap-3 py-2 border-b border-border last:border-0"
                    >
                      <TouchableOpacity
                        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                          task.isCompleted ? "bg-primary border-primary" : "border-muted-foreground"
                        }`}
                      >
                        {task.isCompleted && <Ionicons name="checkmark" size={14} color="white" />}
                      </TouchableOpacity>
                      <View className="flex-1">
                        <Text
                          className={`text-foreground ${
                            task.isCompleted ? "line-through opacity-50" : ""
                          }`}
                        >
                          {task.title}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <PriorityBadge priority={task.priority} />
                          <Text className="text-xs text-muted-foreground">{task.focusArea}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </Card>
      );
    },
    [toggleWeek],
  );

  const ListHeaderComponent = useMemo(() => {
    if (!planInfo) return null;
    return (
      <Card className="m-4 p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-xl font-bold text-foreground">
              {format(new Date(planInfo.monthYear), "MMMM yyyy")}
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              <StatusBadge status={planInfo.status} confidence={planInfo.extractionConfidence} />
            </View>
          </View>
          <View className="w-12 h-12 bg-primary/10 rounded-lg items-center justify-center">
            <Ionicons name="calendar" size={24} color="#3b82f6" />
          </View>
        </View>
        {structuredData?.monthly_summary && (
          <Text className="text-muted-foreground mt-2">{structuredData.monthly_summary}</Text>
        )}
        <View className="flex-row items-center gap-2 mt-4 pt-3 border-t border-border">
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text className="text-xs text-muted-foreground">
            Generated {format(new Date(planInfo.generatedAt), "MMM d, yyyy 'at' h:mm a")}
          </Text>
        </View>
      </Card>
    );
  }, [planInfo, structuredData]);

  if (isLoading) {
    return (
      <Container>
        <View className="flex-1 p-4">
          <View className="mb-4">
            <Skeleton className="h-8 w-48 rounded mb-2" />
            <Skeleton className="h-5 w-32 rounded" />
          </View>
          <Skeleton className="h-48 w-full rounded-lg mb-4" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg mb-4" />
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
          <Text className="text-muted-foreground text-center mt-2">
            {error instanceof Error ? error.message : "Plan not found or no data available"}
          </Text>
          {error && (
            <Text className="text-xs text-muted-foreground text-center mt-2">
              Debug: success={result?.success?.toString()}, hasPlan={!!planInfo}
            </Text>
          )}
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
          <Text className="text-foreground text-center mt-4">No plan data available</Text>
          <Text className="text-muted-foreground text-center mt-2">
            This plan doesn't have any structured data to display.
          </Text>
          <Button onPress={() => router.back()} className="mt-6">
            Go Back
          </Button>
        </View>
      </Container>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlashList
        data={sectionedData}
        renderItem={renderWeekSection}
        keyExtractor={(item) => `week-${item.weekNumber}`}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={
          <View className="p-8 items-center justify-center">
            <Text className="text-muted-foreground">No plan data available</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      />
    </View>
  );
}
