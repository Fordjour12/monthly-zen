import { useMemo, useState, useCallback, useEffect } from "react";
import { View, Text, RefreshControl, TouchableOpacity, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Card, Skeleton, Tabs } from "heroui-native";
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
  Task01Icon,
  Time01Icon,
  AiMagicIcon,
  DashboardCircleIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { orpc } from "@/utils/orpc";
import { format } from "date-fns";
import { Container } from "@/components/ui/container";
import type { AIResponseWithMetadata, WeeklyBreakdown, TaskDescription } from "@monthly-zen/types";
import Animated, {
  FadeInUp,
  FadeInDown,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
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

function StatusBadge({ status, confidence }: { status: string; confidence?: number | null }) {
  const isConfirmed = status === "CONFIRMED";
  return (
    <View className="flex-row items-center gap-x-3">
      <View
        className={`px-3 py-1 rounded-full border ${isConfirmed ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"}`}
      >
        <Text
          className={`text-[9px] font-sans-bold uppercase tracking-widest ${isConfirmed ? "text-success" : "text-warning"}`}
        >
          {status}
        </Text>
      </View>
      {confidence && (
        <View className="flex-row items-center gap-x-1.5 opacity-60">
          <HugeiconsIcon icon={AiMagicIcon} size={10} color="var(--muted-foreground)" />
          <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
            {confidence}% Neural Sync
          </Text>
        </View>
      )}
    </View>
  );
}

function PlanHeader({
  planInfo,
  structuredData,
}: {
  planInfo: any;
  structuredData: AIResponseWithMetadata["structuredData"];
}) {
  return (
    <Animated.View entering={FadeInUp.duration(600)} className="m-6">
      <Card className="p-8 rounded-[40px] bg-surface border border-border/50 shadow-xl shadow-black/5">
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-1 mr-4">
            <View className="flex-row items-center gap-x-2 mb-2">
              <HugeiconsIcon icon={DashboardCircleIcon} size={14} color="var(--accent)" />
              <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-[3px]">
                Mission Control
              </Text>
            </View>
            <Text className="text-3xl font-sans-bold text-foreground tracking-tighter leading-none mb-4">
              {format(new Date(planInfo.monthYear), "MMMM yyyy")}
            </Text>
            <StatusBadge status={planInfo.status} confidence={planInfo.extractionConfidence} />
          </View>
          <View className="w-16 h-16 bg-foreground rounded-[24px] items-center justify-center shadow-2xl shadow-black/20">
            <HugeiconsIcon icon={Calendar03Icon} size={32} color="var(--background)" />
          </View>
        </View>

        {structuredData?.monthly_summary && (
          <View className="bg-muted/5 rounded-[24px] p-6 border border-border/10 mb-8">
            <Text className="text-sm font-sans text-muted-foreground leading-7 opacity-80">
              {structuredData.monthly_summary}
            </Text>
          </View>
        )}

        <View className="flex-row items-center justify-between pt-6 border-t border-border/10">
          <View className="flex-row items-center gap-x-2">
            <HugeiconsIcon icon={Time01Icon} size={14} color="var(--muted-foreground)" />
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
              Generated {format(new Date(planInfo.generatedAt), "MMM d, HH:mm")}
            </Text>
          </View>
          <HugeiconsIcon icon={AiMagicIcon} size={16} color="var(--accent)" />
        </View>
      </Card>
    </Animated.View>
  );
}

function WeekSection({
  item,
  toggleWeek,
}: {
  item: WeekSectionData;
  toggleWeek: (n: number) => void;
}) {
  const taskCount = item.dailyTasks.reduce((acc, d) => acc + d.tasks.length, 0);

  return (
    <Animated.View layout={LinearTransition} className="mx-6 mb-4">
      <Card
        className={`p-6 rounded-[32px] border ${item.isExpanded ? "bg-surface border-border/50 shadow-sm" : "bg-surface/50 border-border/20"}`}
      >
        <TouchableOpacity
          onPress={() => toggleWeek(item.weekNumber)}
          activeOpacity={0.7}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-x-4">
            <View
              className={`w-10 h-10 rounded-2xl items-center justify-center ${item.isExpanded ? "bg-accent/10" : "bg-muted/10"}`}
            >
              <HugeiconsIcon
                icon={item.isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
                size={18}
                color={item.isExpanded ? "var(--accent)" : "var(--muted-foreground)"}
              />
            </View>
            <View>
              <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                Phase {item.weekNumber}
              </Text>
              <Text className="text-base font-sans-bold text-foreground">Weekly Synapse</Text>
            </View>
          </View>
          <View className="px-3 py-1 bg-surface border border-border/50 rounded-xl">
            <Text className="text-[10px] font-sans-bold text-foreground uppercase tracking-tight">
              {taskCount} units
            </Text>
          </View>
        </TouchableOpacity>

        {item.isExpanded && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="mt-8 pt-6 border-t border-border/10"
          >
            {item.goals.length > 0 && (
              <View className="mb-8">
                <View className="flex-row items-center gap-x-2 mb-4 ml-1">
                  <HugeiconsIcon icon={Target01Icon} size={14} color="var(--success)" />
                  <Text className="text-[10px] font-sans-bold text-success uppercase tracking-widest">
                    Target Objectives
                  </Text>
                </View>
                <View className="gap-y-3">
                  {item.goals.map((goal, i) => (
                    <View
                      key={i}
                      className="flex-row items-start gap-x-3 p-4 bg-success/5 rounded-2xl border border-success/10"
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

            <View className="gap-y-8">
              {item.dailyTasks.map((dayTasks) => (
                <View key={dayTasks.day}>
                  <View className="flex-row items-center mb-4">
                    <View className="w-1.5 h-1.5 rounded-full bg-accent mr-3" />
                    <Text className="text-[10px] font-sans-bold text-foreground uppercase tracking-[3px]">
                      {dayTasks.day}
                    </Text>
                  </View>
                  <View className="gap-y-3">
                    {dayTasks.tasks.map((task) => (
                      <TouchableOpacity
                        key={task.id}
                        activeOpacity={0.8}
                        className="flex-row items-center gap-x-4 p-5 bg-muted/5 rounded-[24px] border border-border/10"
                      >
                        <View
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${task.isCompleted ? "bg-success border-success" : "border-border/60"}`}
                        >
                          {task.isCompleted && (
                            <HugeiconsIcon icon={Tick01Icon} size={12} color="var(--background)" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-sm font-sans-medium text-foreground ${task.isCompleted ? "line-through opacity-40" : ""}`}
                          >
                            {task.title}
                          </Text>
                          <View className="flex-row items-center gap-x-3 mt-1.5">
                            <PriorityBadge priority={task.priority} />
                            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase opacity-40">
                              {task.focusArea}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
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
}

export function PlanViewTabs({ planId }: { planId: number }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
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

  const allGoals = useMemo(() => {
    const goals: string[] = [];
    sectionedData.forEach((week) => {
      week.goals.forEach((goal) => {
        if (!goals.includes(goal)) goals.push(goal);
      });
    });
    return goals;
  }, [sectionedData]);

  const allTasks = useMemo(() => {
    const tasks: TaskItem[] = [];
    sectionedData.forEach((week) => {
      week.dailyTasks.forEach((day) => {
        day.tasks.forEach((task) => {
          tasks.push(task);
        });
      });
    });
    return tasks;
  }, [sectionedData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <Container className="bg-background">
        <View className="flex-1 p-8">
          <Skeleton className="h-12 w-3/4 rounded-3xl mb-4" />
          <Skeleton className="h-4 w-1/2 rounded-full mb-10 opacity-40" />
          <Skeleton className="h-64 w-full rounded-[40px] mb-8" />
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[32px] mb-4" />
          ))}
        </View>
      </Container>
    );
  }

  if (error || !result?.success || !planInfo) {
    return (
      <Container className="bg-background items-center justify-center p-10">
        <View className="w-20 h-20 rounded-[32px] bg-danger/10 items-center justify-center mb-8">
          <HugeiconsIcon icon={AlertCircleIcon} size={40} color="var(--danger)" />
        </View>
        <Text className="text-xl font-sans-bold text-foreground text-center mb-4">
          Uplink Interrupted
        </Text>
        <Text className="text-sm font-sans text-muted-foreground text-center mb-10 opacity-60">
          Neural synchronization could not be established with the remote mission node.
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="bg-foreground h-16 w-full rounded-[24px] items-center justify-center"
        >
          <Text className="text-background font-sans-bold text-xs uppercase tracking-[3px]">
            Reinitialize Sync
          </Text>
        </TouchableOpacity>
      </Container>
    );
  }

  return (
    <Container className="bg-background" withScroll={false}>
      <Tabs value={activeTab} onValueChange={setActiveTab} variant="line" className="flex-1">
        <View className="bg-background pt-2">
          <Tabs.List className="border-b border-border/10 px-6">
            <Tabs.ScrollView
              contentContainerClassName="gap-x-8"
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <Tabs.Indicator className="h-1 rounded-full" />
              <Tabs.Trigger value="overview" className="pb-4">
                <Tabs.Label className="text-[10px] font-sans-bold uppercase tracking-[3px]">
                  Overview
                </Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger value="tasks" className="pb-4">
                <Tabs.Label className="text-[10px] font-sans-bold uppercase tracking-[3px]">
                  Tasks • {allTasks.length}
                </Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger value="goals" className="pb-4">
                <Tabs.Label className="text-[10px] font-sans-bold uppercase tracking-[3px]">
                  Goals • {allGoals.length}
                </Tabs.Label>
              </Tabs.Trigger>
            </Tabs.ScrollView>
          </Tabs.List>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-32"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Tabs.Content value="overview">
            <PlanHeader planInfo={planInfo} structuredData={structuredData} />
            <View className="mb-4 px-6">
              <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-[4px] mb-4">
                Phase Sequence
              </Text>
            </View>
            {sectionedData.map((week) => (
              <WeekSection key={week.weekNumber} item={week} toggleWeek={toggleWeek} />
            ))}
          </Tabs.Content>

          <Tabs.Content value="tasks">
            <PlanHeader planInfo={planInfo} structuredData={structuredData} />
            <View className="mx-6">
              <View className="flex-row items-center gap-x-2 mb-6 ml-1">
                <HugeiconsIcon icon={Task01Icon} size={14} color="var(--accent)" />
                <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                  Global Directive Registry
                </Text>
              </View>
              <Card className="p-8 rounded-[40px] bg-surface border border-border/50">
                <View className="gap-y-6">
                  {allTasks.map((task) => (
                    <View
                      key={task.id}
                      className="flex-row items-center gap-x-5 py-4 border-b border-border/10 last:border-0"
                    >
                      <View className="w-6 h-6 rounded-full border border-border/40 items-center justify-center">
                        <HugeiconsIcon icon={CircleIcon} size={8} color="var(--muted-foreground)" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-sans-medium text-foreground">
                          {task.title}
                        </Text>
                        <View className="flex-row items-center gap-x-3 mt-1.5">
                          <PriorityBadge priority={task.priority} />
                          <Text className="text-[9px] font-sans-bold text-muted-foreground uppercase opacity-40 tracking-wider">
                            {task.focusArea}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            </View>
          </Tabs.Content>

          <Tabs.Content value="goals">
            <PlanHeader planInfo={planInfo} structuredData={structuredData} />
            <View className="mx-6">
              <View className="flex-row items-center gap-x-2 mb-6 ml-1">
                <HugeiconsIcon icon={Target01Icon} size={14} color="var(--success)" />
                <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                  Neural Milestone Sequence
                </Text>
              </View>
              <Card className="p-8 rounded-[40px] bg-surface border border-border/50">
                <View className="gap-y-6">
                  {allGoals.map((goal, i) => (
                    <View
                      key={i}
                      className="flex-row items-start gap-x-5 py-6 border-b border-border/10 last:border-0"
                    >
                      <View className="w-10 h-10 rounded-2xl bg-success/5 border border-success/10 items-center justify-center">
                        <HugeiconsIcon icon={Flag01Icon} size={18} color="var(--success)" />
                      </View>
                      <Text className="text-sm font-sans text-foreground flex-1 leading-7">
                        {goal}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            </View>
          </Tabs.Content>
        </ScrollView>
      </Tabs>
    </Container>
  );
}
