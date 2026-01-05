import { useMemo, useState, useCallback } from "react";
import { View, Text, RefreshControl, TouchableOpacity, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Card, Skeleton } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Calendar03Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Tick01Icon,
  RecordIcon,
  CircleIcon,
  AlertCircleIcon,
  Note01Icon,
  Flag01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { orpc } from "@/utils/orpc";
import { format } from "date-fns";
import { Container } from "@/components/ui/container";
import type { AIResponseWithMetadata, WeeklyBreakdown, TaskDescription } from "@monthly-zen/types";
import Animated, { FadeInUp, FadeInDown, LinearTransition } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

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
  const configs = {
    High: { color: "var(--danger)", bg: "bg-danger/10" },
    Medium: { color: "var(--warning)", bg: "bg-warning/10" },
    Low: { color: "var(--success)", bg: "bg-success/10" },
  };
  const config = configs[priority];

  return (
    <View className={`px-2 py-0.5 rounded-full ${config.bg}`}>
      <Text
        className="text-[8px] font-sans-bold uppercase tracking-wider"
        style={{ color: config.color }}
      >
        {priority}
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
    Haptics.selectionAsync();
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
      <Container className="bg-background">
        <View className="flex-1 p-6">
          <Skeleton className="h-10 w-64 rounded-2xl mb-4" />
          <Skeleton className="h-4 w-48 rounded-full mb-8 opacity-40" />
          <Skeleton className="h-48 w-full rounded-[32px] mb-6" />
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[24px] mb-4" />
          ))}
        </View>
      </Container>
    );
  }

  if (error || !result?.success || !planInfo) {
    return (
      <Container className="bg-background">
        <View className="flex-1 justify-center items-center p-8">
          <View className="w-16 h-16 rounded-[24px] bg-danger/10 items-center justify-center mb-6">
            <HugeiconsIcon icon={AlertCircleIcon} size={32} color="var(--danger)" />
          </View>
          <Text className="text-foreground font-sans-bold text-center">Sync Failure</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-6 bg-foreground h-12 px-8 rounded-2xl items-center justify-center"
          >
            <Text className="text-background font-sans-bold text-[10px] uppercase tracking-widest">
              Retry Node Sync
            </Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  return (
    <Container className="bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6 pb-32"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Animated.View entering={FadeInUp.duration(600)} className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-2xl font-sans-bold text-foreground tracking-tight">
                {format(new Date(planInfo.monthYear), "MMMM yyyy")}
              </Text>
              <View className="flex-row items-center gap-x-2 mt-1">
                <View
                  className={`w-2 h-2 rounded-full ${planInfo.status === "CONFIRMED" ? "bg-success" : "bg-warning"}`}
                />
                <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                  {planInfo.status} NODE
                </Text>
              </View>
            </View>
            <View className="w-12 h-12 bg-surface border border-border/50 rounded-2xl items-center justify-center">
              <HugeiconsIcon icon={Calendar03Icon} size={22} color="var(--accent)" />
            </View>
          </View>

          {structuredData?.monthly_summary && (
            <View className="bg-surface/40 rounded-[24px] p-5 border border-border/20">
              <View className="flex-row items-center gap-x-2 mb-3">
                <HugeiconsIcon icon={Note01Icon} size={14} color="var(--muted-foreground)" />
                <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                  Executive Summary
                </Text>
              </View>
              <Text className="text-sm font-sans text-muted-foreground leading-6">
                {structuredData.monthly_summary}
              </Text>
            </View>
          )}
        </Animated.View>

        <View className="gap-y-4">
          {sectionedData.map((week, idx) => {
            const taskCount = week.dailyTasks.reduce((acc, d) => acc + d.tasks.length, 0);

            return (
              <Animated.View
                key={week.weekNumber}
                entering={FadeInDown.delay(idx * 100).duration(600)}
                layout={LinearTransition}
              >
                <Card
                  className={`p-6 rounded-[32px] border ${week.isExpanded ? "bg-surface border-border/50" : "bg-surface/50 border-border/20 opacity-80"}`}
                >
                  <TouchableOpacity
                    onPress={() => toggleWeek(week.weekNumber)}
                    activeOpacity={0.7}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-x-4">
                      <View
                        className={`w-10 h-10 rounded-2xl items-center justify-center ${week.isExpanded ? "bg-accent/10" : "bg-muted/10"}`}
                      >
                        <HugeiconsIcon
                          icon={week.isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
                          size={18}
                          color={week.isExpanded ? "var(--accent)" : "var(--muted-foreground)"}
                        />
                      </View>
                      <View>
                        <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                          Phase {week.weekNumber}
                        </Text>
                        <Text className="text-base font-sans-bold text-foreground">
                          Weekly Directives
                        </Text>
                      </View>
                    </View>
                    <View className="px-3 py-1 bg-surface border border-border/50 rounded-xl">
                      <Text className="text-[10px] font-sans-bold text-foreground uppercase tracking-tight">
                        {taskCount} Units
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {week.isExpanded && (
                    <Animated.View
                      entering={FadeInDown.duration(400)}
                      className="mt-6 pt-6 border-t border-border/10"
                    >
                      {week.goals.length > 0 && (
                        <View className="mb-6">
                          <View className="flex-row items-center gap-x-2 mb-4 ml-1">
                            <HugeiconsIcon icon={Flag01Icon} size={14} color="var(--success)" />
                            <Text className="text-[10px] font-sans-bold text-success uppercase tracking-widest">
                              Success Metrics
                            </Text>
                          </View>
                          <View className="gap-y-3">
                            {week.goals.slice(0, 3).map((goal, i) => (
                              <View
                                key={i}
                                className="flex-row items-start gap-x-3 px-4 py-3 bg-success/5 rounded-2xl border border-success/10"
                              >
                                <HugeiconsIcon
                                  icon={Tick01Icon}
                                  size={14}
                                  color="var(--success)"
                                  className="mt-0.5"
                                />
                                <Text className="text-sm font-sans text-foreground flex-1 leading-5">
                                  {goal}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      <View className="gap-y-6">
                        {week.dailyTasks.map((dayTasks) => (
                          <View key={dayTasks.day}>
                            <View className="flex-row items-center mb-3">
                              <View className="w-1.5 h-1.5 rounded-full bg-accent mr-2" />
                              <Text className="text-[10px] font-sans-bold text-foreground uppercase tracking-[2px]">
                                {dayTasks.day}
                              </Text>
                            </View>
                            <View className="gap-y-2">
                              {dayTasks.tasks.slice(0, 3).map((task) => (
                                <View
                                  key={task.id}
                                  className="flex-row items-center gap-x-3 p-4 bg-muted/5 rounded-[20px] border border-border/10"
                                >
                                  <View className="w-5 h-5 rounded-full border border-border/40 items-center justify-center">
                                    <HugeiconsIcon
                                      icon={CircleIcon}
                                      size={10}
                                      color="var(--muted-foreground)"
                                    />
                                  </View>
                                  <Text
                                    className="text-sm font-sans text-foreground flex-1"
                                    numberOfLines={1}
                                  >
                                    {task.title}
                                  </Text>
                                  <PriorityBadge priority={task.priority} />
                                </View>
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    </Animated.View>
                  )}
                </Card>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </Container>
  );
}
