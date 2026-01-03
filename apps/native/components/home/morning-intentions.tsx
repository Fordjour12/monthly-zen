import { View, Text, Pressable } from "react-native";
import { Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";

export function MorningIntentions() {
  const intention = {
    title: "Schedule Deep Work Now",
    reason: "Monday is your most productive day. Save 2-3 hours for challenging tasks.",
    confidence: 85,
    patternType: "peak-energy",
  };

  return (
    <Card className="mx-4 mb-4 p-4 bg-primary/5 border-primary/20">
      <View className="flex-row items-center gap-2 mb-3">
        <Ionicons name="sunny" size={20} color="currentColor" className="text-primary" />
        <Text className="font-semibold text-foreground font-sans">Today's Focus</Text>
      </View>

      <Text className="text-xl font-bold text-foreground mb-2">{intention.title}</Text>

      <Text className="text-sm text-muted-foreground mb-3">{intention.reason}</Text>

      <View className="flex-row items-center gap-2 mb-3">
        <View className="px-2 py-1 bg-success/20 rounded">
          <Text className="text-xs font-medium text-success">
            {intention.confidence}% confident
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground">
          Based on your {intention.patternType} pattern
        </Text>
      </View>

      <Pressable
        className="py-2.5 px-4 rounded-lg bg-success items-center justify-center flex-row gap-2"
        onPress={() => {}}
      >
        <Ionicons name="add" size={18} color="white" />
        <Text className="text-white font-medium">Add to Tasks</Text>
      </Pressable>
    </Card>
  );
}
