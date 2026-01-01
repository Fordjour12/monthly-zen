import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, Pressable } from "react-native";
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
  const router = useRouter();

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
      <View>
        <Pressable
          className="pt-9 flex-row gap-2 items-center align-middle"
          onPress={() => router.push("/(tabs)/planner")}
        >
          <HugeiconsIcon icon={ArrowLeft01FreeIcons} size={20} color={accent} />
          <Text className="text-foreground">Back</Text>
        </Pressable>
      </View>
      <PlanView planId={planId} />
    </Container>
  );
}
