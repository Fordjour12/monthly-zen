import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Card, Button, Skeleton } from "heroui-native";
import { Container } from "@/components/ui/container";
import { orpc } from "@/utils/orpc";

interface PlanListItem {
  id: number;
  monthYear: string;
  summary: string | null;
  status: "DRAFT" | "CONFIRMED";
  generatedAt: Date;
  confidence: number | null;
}

export default function PlansScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: result, isLoading, error, refetch } = useQuery(orpc.plan.getPlans.queryOptions());

  const plans = (result?.data as PlanListItem[] | undefined) || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatMonthYear = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "MMMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch {
      return "";
    }
  };

  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return null;
    if (confidence >= 80) {
      return (
        <View className="bg-green-500 px-2 py-1 rounded-full">
          <Text className="text-white text-xs font-medium">High</Text>
        </View>
      );
    }
    if (confidence >= 50) {
      return (
        <View className="bg-yellow-500 px-2 py-1 rounded-full">
          <Text className="text-white text-xs font-medium">Medium</Text>
        </View>
      );
    }
    return (
      <View className="bg-red-500 px-2 py-1 rounded-full">
        <Text className="text-white text-xs font-medium">Low</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <Container>
        <Stack.Screen options={{ title: "My Plans", headerShown: false }} />
        <ScrollView
          contentContainerClassName="p-4 pb-24"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="mb-6 mt-4">
            <Skeleton className="h-9 w-48 rounded mb-2" />
            <Skeleton className="h-5 w-64 rounded" />
          </View>

          <View className="flex-row justify-end mb-4">
            <Skeleton className="h-10 w-28 rounded" />
          </View>

          <View className="gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1">
                    <Skeleton className="size-12 rounded-lg" />
                    <View className="flex-1 gap-1">
                      <Skeleton className="h-5 w-32 rounded" />
                      <Skeleton className="h-3 w-24 rounded" />
                      <Skeleton className="h-4 w-full rounded mt-1" />
                    </View>
                  </View>
                  <Skeleton className="size-5 rounded" />
                </View>
              </Card>
            ))}
          </View>
        </ScrollView>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Stack.Screen options={{ title: "My Plans", headerShown: false }} />
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text className="text-danger text-center mt-4">Failed to load plans</Text>
          <Text className="text-muted-foreground text-center mt-2">
            {error instanceof Error ? error.message : "Unknown error"}
          </Text>
          <Button onPress={() => refetch()} className="mt-6">
            Try Again
          </Button>
        </View>
      </Container>
    );
  }

  if (plans.length === 0) {
    return (
      <Container>
        <Stack.Screen options={{ title: "My Plans", headerShown: false }} />
        <ScrollView
          contentContainerClassName="p-4 flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="mb-6 mt-4">
            <Text className="text-3xl font-bold text-foreground mb-2">My Plans</Text>
            <Text className="text-muted-foreground">View all your generated monthly plans</Text>
          </View>

          <Card className="p-8 items-center">
            <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-4">
              <Ionicons name="document-text-outline" size={32} color="#6b7280" />
            </View>
            <Text className="text-xl font-semibold mb-2 text-foreground">No plans yet</Text>
            <Text className="text-muted-foreground text-center mb-6">
              You haven't generated any plans yet. Create your first AI-powered monthly plan to get
              started.
            </Text>
            <Button onPress={() => router.push("/generate-plan")} variant="primary">
              <Ionicons name="sparkles" size={20} color="white" />
              <Text className="text-white font-bold ml-2">Generate Your First Plan</Text>
            </Button>
          </Card>
        </ScrollView>
      </Container>
    );
  }

  return (
    <Container>
      <Stack.Screen options={{ title: "My Plans", headerShown: false }} />
      <ScrollView
        contentContainerClassName="p-4 pb-24"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="mb-6 mt-4">
          <Text className="text-3xl font-bold text-foreground mb-2">My Plans</Text>
          <Text className="text-muted-foreground">View all your generated monthly plans</Text>
        </View>

        <View className="flex-row justify-end mb-4">
          <Button onPress={() => router.push("/generate-plan")} variant="primary" size="sm">
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white font-medium ml-1">New Plan</Text>
          </Button>
        </View>

        <View className="gap-4">
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => router.push(`/plans/${plan.id}`)}
              activeOpacity={0.7}
            >
              <Card className="p-4">
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
    </Container>
  );
}
