import { useRouter } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Card } from "heroui-native";
import { EmptyState } from "@/components/ui/empty-state";
import { orpc } from "@/utils/orpc";
import { PlansSkeleton } from "@/components/loading-skeleton";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Calendar01Icon,
  Clock01Icon,
  ArrowRight01Icon,
  AlertCircleIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

interface PlanListItem {
  id: number;
  monthYear: string;
  summary: string | null;
  status: "DRAFT" | "CONFIRMED";
  generatedAt: Date;
  confidence: number | null;
}

function getConfidenceBadge(confidence: number | null) {
  if (!confidence) return null;
  let colorClass = "text-danger bg-danger/10";
  let label = "Low";

  if (confidence >= 80) {
    colorClass = "text-success bg-success/10";
    label = "High";
  } else if (confidence >= 50) {
    colorClass = "text-warning bg-warning/10";
    label = "Mid";
  }

  return (
    <View className={`px-2 py-0.5 rounded-full ${colorClass.split(" ")[1]}`}>
      <Text
        className={`text-[10px] font-sans-bold uppercase tracking-widest ${colorClass.split(" ")[0]}`}
      >
        {label}
      </Text>
    </View>
  );
}

function PlansList({ plans, router }: { plans: PlanListItem[]; router?: any }) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
    >
      <View className="gap-y-6 mt-4">
        {plans.map((plan, idx) => (
          <Animated.View key={plan.id} entering={FadeInDown.delay(idx * 100).duration(600)}>
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/planner/${plan.id}`)}
              activeOpacity={0.8}
            >
              <Card className="p-6 border-none bg-surface/50 rounded-[32px]">
                <View className="flex-row items-center justify-between mb-5">
                  <View className="flex-row items-center gap-x-3">
                    <View className="w-12 h-12 bg-accent/10 rounded-2xl items-center justify-center">
                      <HugeiconsIcon icon={Calendar01Icon} size={24} color="var(--accent)" />
                    </View>
                    <View>
                      <Text className="text-xl font-sans-bold text-foreground">
                        {format(new Date(plan.monthYear), "MMMM yyyy")}
                      </Text>
                      <View className="flex-row items-center gap-x-2">
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          size={12}
                          color="var(--muted-foreground)"
                        />
                        <Text className="text-[10px] font-sans-medium text-muted-foreground uppercase tracking-widest">
                          {format(new Date(plan.generatedAt), "MMM d, yyyy")}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {getConfidenceBadge(plan.confidence)}
                </View>

                {plan.summary && (
                  <Text
                    className="text-base font-sans text-muted-foreground mb-6 leading-6"
                    numberOfLines={2}
                  >
                    {plan.summary}
                  </Text>
                )}

                <View className="flex-row justify-between items-center pt-5 border-t border-border/30">
                  <View className="flex-row items-center gap-x-2">
                    <View
                      className={`w-2 h-2 rounded-full ${plan.status === "CONFIRMED" ? "bg-success" : "bg-warning"}`}
                    />
                    <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                      {plan.status.toLowerCase()}
                    </Text>
                  </View>
                  <View className="w-10 h-10 rounded-full bg-surface border border-border/50 items-center justify-center">
                    <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="var(--foreground)" />
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

export default function MyPlansTab() {
  const router = useRouter();
  const { data: result, isLoading, error, refetch } = useQuery(orpc.plan.getPlans.queryOptions());
  const plans = (result?.data as PlanListItem[] | undefined) || [];

  if (isLoading) return <PlansSkeleton />;

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <HugeiconsIcon icon={AlertCircleIcon} size={48} color="var(--danger)" />
        <Text className="text-foreground font-sans-bold text-lg mt-4 text-center">
          Failed to load plans
        </Text>
        <Text className="text-muted-foreground font-sans text-sm mt-2 text-center mb-8">
          {error.message || "Something went wrong while fetching your plans."}
        </Text>
        <TouchableOpacity className="bg-foreground py-4 px-8 rounded-2xl" onPress={() => refetch()}>
          <Text className="text-background font-sans-bold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (plans.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-20 h-20 bg-muted/5 rounded-full items-center justify-center mb-6">
          <HugeiconsIcon icon={SparklesIcon} size={40} color="var(--muted-foreground)" />
        </View>
        <Text className="text-2xl font-sans-bold text-foreground text-center mb-2">
          No Plans Yet
        </Text>
        <Text className="text-muted-foreground font-sans text-base text-center mb-10 leading-6">
          Your journey to peak productivity starts with your first AI-powered monthly plan.
        </Text>
        <TouchableOpacity
          className="bg-accent py-4 px-10 rounded-2xl shadow-lg shadow-accent/20"
          onPress={() => router.push("/(tabs)/planner/create")}
        >
          <Text className="text-white font-sans-bold">Generate System</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <PlansList plans={plans} router={router} />;
}
