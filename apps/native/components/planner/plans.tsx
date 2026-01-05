import { useRouter } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Card } from "heroui-native";
import { orpc } from "@/utils/orpc";
import { PlansSkeleton } from "@/components/loading-skeleton";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Calendar01Icon,
  Clock01Icon,
  ArrowRight01Icon,
  AlertCircleIcon,
  SparklesIcon,
  Note01Icon,
  ArrowRight02Icon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface PlanListItem {
  id: number;
  monthYear: string;
  summary: string | null;
  status: "DRAFT" | "CONFIRMED";
  generatedAt: Date;
  confidence: number | null;
}

function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  if (!confidence) return null;
  let color = "var(--danger)";
  let bg = "bg-danger/10";
  let label = "Low";

  if (confidence >= 80) {
    color = "var(--success)";
    bg = "bg-success/10";
    label = "High";
  } else if (confidence >= 50) {
    color = "var(--warning)";
    bg = "bg-warning/10";
    label = "Mid";
  }

  return (
    <View className={`px-2 py-0.5 rounded-full ${bg} border border-border/10`}>
      <Text className="text-[8px] font-sans-bold uppercase tracking-widest" style={{ color }}>
        {label} Sync
      </Text>
    </View>
  );
}

function PlansList({
  plans,
  router,
  refetch,
}: {
  plans: PlanListItem[];
  router?: any;
  refetch: () => void;
}) {
  const [refreshing, setRefreshing] = (useState || (() => [false, () => {}]))(false);

  const onRefresh = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    refetch();
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-6 pb-32 pt-4"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
    >
      <View className="gap-y-6">
        {plans.map((plan, idx) => (
          <Animated.View
            key={plan.id}
            entering={FadeInDown.delay(idx * 80).duration(600)}
            layout={LinearTransition}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/(tabs)/planner/${plan.id}`);
              }}
              activeOpacity={0.8}
            >
              <Card className="p-7 rounded-[40px] bg-surface border border-border/50 shadow-sm shadow-black/5">
                <View className="flex-row items-center justify-between mb-6">
                  <View className="flex-row items-center gap-x-4">
                    <View className="w-14 h-14 bg-accent/5 border border-accent/10 rounded-[22px] items-center justify-center">
                      <HugeiconsIcon icon={Calendar01Icon} size={28} color="var(--accent)" />
                    </View>
                    <View>
                      <Text className="text-2xl font-sans-bold text-foreground tracking-tight">
                        {format(new Date(plan.monthYear), "MMM yyyy")}
                      </Text>
                      <View className="flex-row items-center gap-x-2 mt-1">
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          size={10}
                          color="var(--muted-foreground)"
                        />
                        <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest opacity-60">
                          {format(new Date(plan.generatedAt), "MMM d")}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <ConfidenceBadge confidence={plan.confidence} />
                </View>

                {plan.summary && (
                  <View className="flex-row items-start gap-x-3 mb-8 bg-muted/5 p-4 rounded-2xl border border-border/5">
                    <HugeiconsIcon
                      icon={Note01Icon}
                      size={14}
                      color="var(--muted-foreground)"
                      className="mt-0.5"
                    />
                    <Text
                      className="text-sm font-sans text-muted-foreground leading-6 flex-1"
                      numberOfLines={2}
                    >
                      {plan.summary}
                    </Text>
                  </View>
                )}

                <View className="flex-row justify-between items-center pt-6 border-t border-border/10">
                  <View className="flex-row items-center gap-x-3">
                    <View
                      className={`w-2.5 h-2.5 rounded-full border-2 border-background ${plan.status === "CONFIRMED" ? "bg-success" : "bg-warning"}`}
                    />
                    <Text
                      className={`text-[10px] font-sans-bold uppercase tracking-[2px] ${plan.status === "CONFIRMED" ? "text-success" : "text-warning"}`}
                    >
                      {plan.status}
                    </Text>
                  </View>
                  <View className="w-10 h-10 rounded-full bg-foreground items-center justify-center shadow-lg shadow-black/20">
                    <HugeiconsIcon icon={ArrowRight02Icon} size={20} color="var(--background)" />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

import { useState } from "react";

export default function MyPlansTab() {
  const router = useRouter();
  const { data: result, isLoading, error, refetch } = useQuery(orpc.plan.getPlans.queryOptions());
  const plans = (result?.data as PlanListItem[] | undefined) || [];

  if (isLoading) return <PlansSkeleton />;

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-10">
        <View className="w-20 h-20 rounded-[32px] bg-danger/10 items-center justify-center mb-8">
          <HugeiconsIcon icon={AlertCircleIcon} size={40} color="var(--danger)" />
        </View>
        <Text className="text-xl font-sans-bold text-foreground text-center mb-4">
          Registry Failure
        </Text>
        <Text className="text-sm font-sans text-muted-foreground text-center mb-10 opacity-60">
          The central archive could not be accessed. System synchronization failed.
        </Text>
        <TouchableOpacity
          className="bg-foreground h-16 w-full rounded-[24px] items-center justify-center"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            refetch();
          }}
        >
          <Text className="text-background font-sans-bold text-xs uppercase tracking-[3px]">
            Reinitialize Sync
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (plans.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-10">
        <View className="w-24 h-24 bg-accent/5 rounded-[40px] items-center justify-center mb-10 border border-accent/10">
          <HugeiconsIcon icon={SparklesIcon} size={48} color="var(--accent)" />
        </View>
        <Text className="text-2xl font-sans-bold text-foreground text-center mb-4">
          System Initialized
        </Text>
        <Text className="text-base font-sans text-muted-foreground text-center mb-14 leading-7 opacity-70">
          Your strategic journey to peak neural operation begins with your first AI-synthesized
          month.
        </Text>
        <TouchableOpacity
          className="bg-accent h-16 w-full rounded-[24px] shadow-2xl shadow-accent/40 items-center justify-center"
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push("/(tabs)/planner/create");
          }}
        >
          <Text className="text-white font-sans-bold text-xs uppercase tracking-[3px]">
            Synthesize Plan
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <PlansList plans={plans} router={router} refetch={refetch} />;
}
