import { View, Text, Pressable } from "react-native";
import { Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";

interface InsightCardProps {
  insight: {
    id: number;
    title: string;
    description: string;
    category: string | null;
    priority: string | null;
    confidence: string | null;
    suggestedAction: string | null;
    reasoning: string | null;
  };
  onDismiss?: (action?: string) => void;
  onApply?: () => void;
}

export function InsightCard({ insight, onDismiss, onApply }: InsightCardProps) {
  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case "burnout":
        return "#ef4444"; // red
      case "productivity":
        return "#3b82f6"; // blue
      case "scheduling":
        return "#8b5cf6"; // purple
      case "alignment":
        return "#22c55e"; // green
      default:
        return "#6b7280"; // gray
    }
  };

  const getPriorityIcon = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "alert-circle";
      case "medium":
        return "warning";
      default:
        return "information-circle";
    }
  };

  const categoryColor = getCategoryColor(insight.category);

  return (
    <Card className="mx-4 mb-4 p-4 rounded-none">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: `${categoryColor}20` }}
          >
            <Ionicons
              name={getPriorityIcon(insight.priority) as any}
              size={16}
              color={categoryColor}
            />
          </View>
          <View>
            <Text className="font-semibold text-foreground">{insight.title}</Text>
            <Text className="text-xs text-muted-foreground">
              {insight.category} • {insight.confidence} confidence
            </Text>
          </View>
        </View>
      </View>

      <Text className="text-sm text-foreground mb-2">{insight.description}</Text>

      {insight.suggestedAction && (
        <View className="bg-primary/10 rounded-lg p-3 mb-3">
          <Text className="text-xs font-medium text-primary mb-1">Suggested Action</Text>
          <Text className="text-sm text-foreground">{insight.suggestedAction}</Text>
        </View>
      )}

      {insight.reasoning && (
        <Text className="text-xs text-muted-foreground mb-3">Based on: {insight.reasoning}</Text>
      )}

      <View className="flex-row gap-2 mt-2">
        {onApply && (
          <Pressable
            className="flex-1 py-2.5 px-4 rounded-lg bg-primary items-center justify-center"
            onPress={onApply}
          >
            <Text className="text-white font-medium">Apply</Text>
          </Pressable>
        )}
        <Pressable
          className="py-2.5 px-4 rounded-lg border border-divider items-center justify-center"
          onPress={() => onDismiss?.("dismissed")}
        >
          <Text className="text-foreground font-medium">Dismiss</Text>
        </Pressable>
        <Pressable
          className="py-2.5 px-4 rounded-lg border border-divider items-center justify-center"
          onPress={() => onDismiss?.("snoozed")}
        >
          <Text className="text-muted-foreground font-medium">Later</Text>
        </Pressable>
      </View>
    </Card>
  );
}
