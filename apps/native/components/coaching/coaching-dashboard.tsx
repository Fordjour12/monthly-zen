import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { InsightCard } from "./insight-card";
import { useCoaching } from "@/hooks/useCoaching";
import type { Insight } from "@/hooks/useCoaching";
import { EmptyState } from "@/components/ui/empty-state";
import { useRouter } from "expo-router";

interface CoachingDashboardProps {
  onNavigateToGoals?: () => void;
}

export function CoachingDashboard({ onNavigateToGoals }: CoachingDashboardProps) {
  const { insights, stats, isLoading, isRefreshing, generateInsights, dismissInsight, refresh } =
    useCoaching();

  const handleApplyInsight = (insightId: number) => {
    // Handle apply action - this could navigate to relevant screens
    console.log("Applying insight:", insightId);
  };

  const handleDismissInsight = (insightId: number, action?: string) => {
    dismissInsight(insightId, action);
  };

  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
    >
      {/* Header */}
      <View className="px-4 py-4 border-b border-divider">
        <Text className="text-2xl font-bold text-foreground">Coaching</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Personalized insights to help you stay on track
        </Text>
      </View>

      {/* Stats Cards */}
      <View className="flex-row flex-wrap p-4 gap-3">
        <Card className="flex-1 min-w-[45%] p-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="bulb" size={20} color="#3b82f6" />
            <Text className="text-sm text-muted-foreground">Total Insights</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">{stats?.totalInsights || 0}</Text>
        </Card>

        <Card className="flex-1 min-w-[45%] p-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text className="text-sm text-muted-foreground">Actions Taken</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">{stats?.actionedInsights || 0}</Text>
        </Card>
      </View>

      {/* Generate New Insights Button */}
      <View className="px-4 mb-4">
        <Pressable
          className="flex-row items-center justify-center gap-2 py-3 rounded-lg bg-primary"
          onPress={generateInsights}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="white" />
              <Text className="text-white font-medium">Generate New Insights</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Insights Section */}
      <View className="px-4 pb-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Active Insights</Text>

        {isLoading && (!insights || insights.length === 0) ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-muted-foreground mt-2">Loading insights...</Text>
          </View>
        ) : !insights || insights.length === 0 ? (
          <EmptyState
            title="No insights yet"
            description="Generate your first coaching insight to get personalized recommendations"
            icon="analytics-outline"
            iconColor="#6b7280"
            actionLabel="Generate Insights"
            actionIcon="sparkles"
            onAction={generateInsights}
            iconBackgroundColor="bg-muted"
          />
        ) : (
          insights.map((insight: Insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onApply={() => handleApplyInsight(insight.id)}
              onDismiss={(action) => handleDismissInsight(insight.id, action)}
            />
          ))
        )}
      </View>

      {/* Coaching Goals Section */}
      <View className="px-4 pb-8">
        <Pressable onPress={onNavigateToGoals}>
          <Card className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                <Ionicons name="flag" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text className="font-semibold text-foreground">Coaching Goals</Text>
                <Text className="text-sm text-muted-foreground">Set and track personal goals</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </Card>
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/task/habit")} className="mt-2">
          <Card className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                <Ionicons name="flag" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text className="font-semibold text-foreground">Habits</Text>
                <Text className="text-sm text-muted-foreground">
                  View & Track personal habit formed
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </Card>
        </Pressable>
      </View>
    </ScrollView>
  );
}
