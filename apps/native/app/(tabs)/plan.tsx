import { View, Text } from "react-native";
import { useSemanticColors } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { PlanDashboard } from "@/components/plan-dashboard";
import { authClient } from "@/lib/auth-client";

export default function PlanScreen() {
  const { primary } = useSemanticColors();
  authClient.useSession();

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="border-b border-border px-4 py-6 bg-background z-10">
        <View className="flex items-center gap-3 flex-row">
          <View className="h-10 w-10 bg-primary/10 rounded-lg items-center justify-center">
            <Ionicons name="bulb" size={20} color={primary} />
          </View>
          <View>
            <Text className="text-2xl font-bold tracking-tight text-foreground">Monthly Zen</Text>
            <Text className="text-sm text-muted-foreground">AI-Powered Planning</Text>
          </View>
        </View>
      </View>

      <PlanDashboard />
    </View>
  );
}
