import { Stack, useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PlanView } from "@/components/plans/plan-view";
import { authClient } from "@/lib/auth-client";
import { Container } from "@/components/ui/container";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { AlertCircleFreeIcons, ArrowLeft01FreeIcons } from "@hugeicons/core-free-icons";
import { useSemanticColors } from "@/utils/theme";

export default function PlanDetail() {
  const { accent, danger } = useSemanticColors();
  const { id } = useLocalSearchParams();
  authClient.useSession();

  const planId = Array.isArray(id) ? parseInt(id[0], 10) : parseInt(id || "0", 10);

  if (!planId || isNaN(planId)) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-4">
        <HugeiconsIcon icon={AlertCircleFreeIcons} size={48} color={danger} />
        <Text className="text-danger text-center mt-4">Invalid plan ID</Text>
      </View>
    );
  }

  return (
    <Container>
      <View className="pb-3">
        <HugeiconsIcon icon={ArrowLeft01FreeIcons} size={20} color={accent} />
        <Text>Back</Text>
      </View>
      <PlanView planId={planId} />
    </Container>
  );
}
