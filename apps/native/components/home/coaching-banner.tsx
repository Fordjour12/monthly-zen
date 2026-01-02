import { View, Text, Pressable } from "react-native";
import { Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoaching } from "@/hooks/useCoaching";

interface CoachingBannerProps {
  onViewAll?: () => void;
}

export function CoachingBanner({ onViewAll }: CoachingBannerProps) {
  const { insights, isLoading, generateInsights } = useCoaching();

  // Get the highest priority insight
  const topInsight = insights[0];

  if (isLoading && insights.length === 0) {
    return null; // Don't show banner while loading initial data
  }

  if (insights.length === 0) {
    return (
      <Card className="mx-4 mb-4 p-4 bg-primary/10 border-primary/30">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="sparkles" size={20} color="#3b82f6" />
            <Text className="font-semibold text-foreground">AI Coaching</Text>
          </View>
        </View>
        <Text className="text-sm text-muted-foreground mb-3">
          Get personalized insights to improve your productivity
        </Text>
        <Pressable
          className="py-2.5 px-4 rounded-lg bg-primary items-center justify-center"
          onPress={generateInsights}
        >
          <Text className="text-white font-medium">Generate Insights</Text>
        </Pressable>
      </Card>
    );
  }

  return (
    <Card className="mx-4 mb-4 p-4 bg-warning/10 border-warning/30">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="sparkles" size={20} color="#f59e0b" />
          <Text className="font-semibold text-foreground">AI Coaching</Text>
        </View>
        {onViewAll && (
          <Pressable onPress={onViewAll}>
            <Text className="text-sm text-primary">View All</Text>
          </Pressable>
        )}
      </View>

      <Text className="text-lg font-bold text-foreground mb-1">{topInsight.title}</Text>

      <Text className="text-sm text-muted-foreground mb-3">{topInsight.description}</Text>

      <View className="flex-row gap-2">
        <Pressable
          className="flex-1 py-2.5 px-4 rounded-lg bg-accent items-center justify-center flex-row gap-2"
          onPress={() => {}}
        >
          <Ionicons name="checkmark" size={18} color="white" />
          <Text className="text-white font-medium">Apply</Text>
        </Pressable>

        <Pressable
          className="py-2.5 px-4 rounded-lg border border-danger items-center justify-center"
          onPress={() => {}}
        >
          <Ionicons name="close" size={18} color="white" />
        </Pressable>
      </View>
    </Card>
  );
}
