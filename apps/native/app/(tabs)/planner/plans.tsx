import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Card, Button, Skeleton } from "heroui-native";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { orpc } from "@/utils/orpc";
import { AddSquareFreeIcons } from "@hugeicons/core-free-icons";
import { useSemanticColors } from "@/utils/theme";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { PlansSkeleton } from "@/components/loading-skeleton";

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
  if (confidence >= 80)
    return (
      <View className="bg-green-500 px-2 py-1 rounded-full">
        <Text className="text-white text-xs font-medium">High</Text>
      </View>
    );
  if (confidence >= 50)
    return (
      <View className="bg-yellow-500 px-2 py-1 rounded-full">
        <Text className="text-white text-xs font-medium">Medium</Text>
      </View>
    );
  return (
    <View className="bg-danger px-2 py-1 rounded-full">
      <Text className="text-white text-xs font-medium">Low</Text>
    </View>
  );
}

function formatMonthYear(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return format(date, "MMMM yyyy");
  } catch {
    return dateStr;
  }
}

function formatDate(date: Date | string) {
  try {
    return format(new Date(date), "MMM d, yyyy");
  } catch {
    return "";
  }
}

function PlansList({
  plans,
  router,
  foreground,
}: {
  plans: PlanListItem[];
  router: any;
  foreground: string;
}) {
  return (
    <ScrollView
      contentContainerClassName="p-4 pb-24"
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
    >
      <View className="mb-6 mt-4">
        <Text className="text-3xl font-bold text-foreground mb-2">My Plans</Text>
        <Text className="text-muted-foreground">View all your generated monthly plans</Text>
      </View>
      <View className="flex-row justify-end mb-4">
        <Button
          onPress={() => router.push("/(tabs)/planner")}
          variant="primary"
          className="rounded-none"
        >
          <HugeiconsIcon icon={AddSquareFreeIcons} size={20} color={foreground} />
          <Text className="text-white font-medium ml-1">New Plan</Text>
        </Button>
      </View>
      <View className="gap-4">
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            onPress={() => router.push(`/(tabs)/planner/${plan.id}`)}
            activeOpacity={0.7}
          >
            <Card className="p-4 rounded-none">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-12 h-12 bg-primary/10 rounded-lg items-center justify-center">
                    <Ionicons name="calendar" size={24} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-lg font-semibold text-foreground">
                        {formatMonthYear(plan.monthYear)}
                      </Text>
                      {getConfidenceBadge(plan.confidence)}
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="time-outline" size={12} color="#6b7280" />
                      <Text className="text-xs text-muted-foreground">
                        Generated {formatDate(plan.generatedAt)}
                      </Text>
                    </View>
                    {plan.summary && (
                      <Text className="text-sm text-muted-foreground mt-1" numberOfLines={1}>
                        {plan.summary}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function ErrorView({ error, refetch }: { error: Error | null; refetch: () => void }) {
  return (
    <View className="flex-1 justify-center items-center p-4">
      <Ionicons name="alert-circle" size={48} color="#ef4444" />
      <Text className="text-danger text-center mt-4">Failed to load plans</Text>
      <Text className="text-muted-foreground text-center mt-2">
        {error?.message || "Unknown error"}
      </Text>
      <Button onPress={refetch} className="mt-6">
        Try Again
      </Button>
    </View>
  );
}

function EmptyView({ router }: { router: any }) {
  return (
    <ScrollView
      contentContainerClassName="p-4 flex-1"
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
    >
      <View className="mb-6 mt-4">
        <Text className="text-3xl font-bold text-foreground mb-2">My Plans</Text>
        <Text className="text-muted-foreground">View all your generated monthly plans</Text>
      </View>
      <EmptyState
        title="No plans yet"
        description="You haven't generated any plans yet. Create your first AI-powered monthly plan to get started."
        actionLabel="Generate Your First Plan"
        onAction={() => router.replace("/(tabs)/planner")}
      />
    </ScrollView>
  );
}

export default function Plans() {
  const router = useRouter();
  const { foreground } = useSemanticColors();
  const { data: result, isLoading, error, refetch } = useQuery(orpc.plan.getPlans.queryOptions());
  const plans = (result?.data as PlanListItem[] | undefined) || [];

  return (
    <Container>
      {isLoading ? (
        <PlansSkeleton />
      ) : error ? (
        <ErrorView error={error as Error | null} refetch={refetch} />
      ) : plans.length === 0 ? (
        <EmptyView router={router} />
      ) : (
        <PlansList plans={plans} router={router} foreground={foreground} />
      )}
    </Container>
  );
}
