import { useMemo, useState, useCallback } from "react";
import { View, Text, RefreshControl, TouchableOpacity, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Skeleton, Surface } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Flag01Icon,
  Task01Icon,
  Calendar03Icon,
  AlertCircleIcon,
  RecordIcon,
  AiMagicIcon,
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
  taskCount: number;
}

function CompactPriorityBadge({ priority }: { priority: "High" | "Medium" | "Low" }) {
  const configs = {
    High: { color: "var(--danger)", label: "H" },
    Medium: { color: "var(--warning)", label: "M" },
    Low: { color: "var(--success)", label: "L" },
  };
  const config = configs[priority];

  return (
    <View className="px-1.5 py-0.5 rounded-md border border-border/10 bg-surface/50">
      <Text className="text-[8px] font-sans-bold" style={{ color: config.color }}>
        {config.label}
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
    Haptics.selectionAsync();
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
      <Container className="bg-background">
        <View className="flex-1 p-6">
          <Skeleton className="h-6 w-32 rounded-full mb-6 opacity-40" />
          <Skeleton className="h-32 w-full rounded-[32px] mb-6" />
          <Skeleton className="h-16 w-full rounded-2xl mb-3" />
          <Skeleton className="h-16 w-full rounded-2xl mb-3" />
          <Skeleton className="h-16 w-full rounded-2xl" />
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
          <Text className="text-foreground font-sans-bold text-center mb-2">Sync Interrupted</Text>
          <Text className="text-muted-foreground font-sans text-xs text-center mb-8 opacity-60">
            Unable to retrieve neural architecture.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="px-8 h-12 bg-foreground rounded-2xl items-center justify-center"
          >
            <Text className="text-background font-sans-bold text-[10px] uppercase tracking-widest">
              Reinitialize
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
          <Surface className="p-6 rounded-[32px] bg-surface border border-border/50 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <View className="flex-row items-center gap-x-2 mb-2">
                  <HugeiconsIcon icon={Calendar03Icon} size={12} color="var(--muted-foreground)" />
                  <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                    Temporal Node
                  </Text>
                </View>
                <Text className="text-2xl font-sans-bold text-foreground tracking-tight">
                  {format(new Date(planInfo.monthYear), "MMMM yyyy")}
                </Text>
              </View>
              <View
                className={`px-4 py-1.5 rounded-full border ${planInfo.status === "CONFIRMED" ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"}`}
              >
                <Text
                  className={`text-[10px] font-sans-bold uppercase tracking-widest ${planInfo.status === "CONFIRMED" ? "text-success" : "text-warning"}`}
                >
                  {planInfo.status}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-x-6 mt-6 pt-6 border-t border-border/10">
              <View className="flex-row items-center gap-x-2">
                <HugeiconsIcon icon={Task01Icon} size={14} color="var(--muted-foreground)" />
                <Text className="text-xs font-sans-medium text-foreground">
                  {totalTasks} <Text className="text-muted-foreground font-sans">Tasks</Text>
                </Text>
              </View>
              <View className="flex-row items-center gap-x-2">
                <HugeiconsIcon icon={Flag01Icon} size={14} color="var(--muted-foreground)" />
                <Text className="text-xs font-sans-medium text-foreground">
                  {totalGoals} <Text className="text-muted-foreground font-sans">Goals</Text>
                </Text>
              </View>
            </View>
          </Surface>
        </Animated.View>

        <View className="gap-y-3">
          {sectionedData.map((week, idx) => (
            <Animated.View
              key={week.weekNumber}
              entering={FadeInDown.delay(idx * 50).duration(600)}
              layout={LinearTransition}
            >
              <TouchableOpacity
                onPress={() => toggleWeek(week.weekNumber)}
                activeOpacity={0.7}
                className={`rounded-[24px] overflow-hidden border ${week.isExpanded ? "bg-surface border-border/50 shadow-sm" : "bg-surface/40 border-border/20"}`}
              >
                <View className="flex-row items-center justify-between p-5">
                  <View className="flex-row items-center gap-x-4">
                    <View
                      className={`w-10 h-10 rounded-2xl items-center justify-center ${week.isExpanded ? "bg-foreground" : "bg-muted/10"}`}
                    >
                      <HugeiconsIcon
                        icon={week.isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
                        size={18}
                        color={week.isExpanded ? "var(--background)" : "var(--muted-foreground)"}
                      />
                    </View>
                    <View>
                      <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                        Segment {week.weekNumber}
                      </Text>
                      <Text className="text-sm font-sans-bold text-foreground">Week Protocol</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs font-sans-bold text-foreground">{week.taskCount}</Text>
                    <Text className="text-[8px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                      Active Units
                    </Text>
                  </View>
                </View>

                {week.isExpanded && (
                  <Animated.View entering={FadeInDown.duration(400)} className="px-5 pb-5 pt-2">
                    <View className="h-px bg-border/10 mb-5" />

                    <View className="gap-y-3 mb-6">
                      {week.goals.slice(0, 3).map((goal, i) => (
                        <View key={i} className="flex-row items-start gap-x-3">
                          <HugeiconsIcon
                            icon={RecordIcon}
                            size={10}
                            color="var(--success)"
                            className="mt-1"
                          />
                          <Text
                            className="text-xs font-sans text-foreground leading-5 flex-1"
                            numberOfLines={2}
                          >
                            {goal}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                      {week.dailyTasks
                        .flatMap((dt) => dt.tasks.slice(0, 1))
                        .map((task, i) => (
                          <View
                            key={task.id}
                            className="flex-row items-center gap-x-2 px-3 py-2 bg-muted/5 rounded-xl border border-border/10"
                          >
                            <Text
                              className="text-[10px] font-sans-medium text-foreground opacity-70"
                              numberOfLines={1}
                            >
                              {task.title.substring(0, 15)}...
                            </Text>
                            <CompactPriorityBadge priority={task.priority} />
                          </View>
                        ))}
                    </View>

                    <TouchableOpacity className="flex-row items-center justify-center gap-x-2 mt-6 py-2">
                      <HugeiconsIcon icon={AiMagicIcon} size={12} color="var(--accent)" />
                      <Text className="text-[10px] font-sans-bold text-accent uppercase tracking-widest">
                        View Full Breakdown
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
}
