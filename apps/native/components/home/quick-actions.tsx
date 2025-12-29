import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableFeedback } from "heroui-native";
import { router } from "expo-router";

interface QuickAction {
  icon: string;
  label: string;
  route?: string;
}

const actions: QuickAction[] = [
  { icon: "sparkles", label: "Generate Plan", route: "/generate-plan" },
  { icon: "analytics", label: "Insights" },
  { icon: "calendar", label: "Calendar", route: "/calendar" },
  { icon: "compass", label: "Explore", route: "/explore" },
];

function QuickActionCard({ icon, label, route }: QuickAction) {
  const handlePress = () => {
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <PressableFeedback feedbackVariant="highlight" onPress={handlePress}>
      <View className="flex-1 aspect-square bg-surface rounded-xl p-4 items-center justify-center border border-default-200 dark:border-default-800">
        <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-2">
          <Ionicons name={icon as any} size={24} color="currentColor" className="text-primary" />
        </View>
        <Text className="text-xs text-center text-foreground font-medium">{label}</Text>
      </View>
    </PressableFeedback>
  );
}

export function QuickActions() {
  return (
    <View className="px-4 mb-4">
      <View className="flex-row gap-3">
        {actions.slice(0, 2).map((action, index) => (
          <QuickActionCard key={index} {...action} />
        ))}
      </View>
      <View className="flex-row gap-3 mt-3">
        {actions.slice(2, 4).map((action, index) => (
          <QuickActionCard key={index} {...action} />
        ))}
      </View>
    </View>
  );
}
