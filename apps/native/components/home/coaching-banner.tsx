import { View, Text, Pressable } from "react-native";
import { Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";

interface CoachingBannerProps {
  onViewAll?: () => void;
}

export function CoachingBanner({ onViewAll }: CoachingBannerProps) {
  const insight = {
    title: "Third Week Drop-off Detected",
    description:
      "Your productivity typically dips in the third week of the month. Consider lighter tasks.",
  };

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

      <Text className="text-lg font-bold text-foreground mb-1">{insight.title}</Text>

      <Text className="text-sm text-muted-foreground mb-3">{insight.description}</Text>

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
