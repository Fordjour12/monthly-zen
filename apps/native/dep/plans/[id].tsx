import { Stack, useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PlanView } from "@/components/plans/plan-view";
import { authClient } from "@/lib/auth-client";
import { Container } from "@/components/ui/container";

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams();
  authClient.useSession();

  const planId = Array.isArray(id) ? parseInt(id[0], 10) : parseInt(id || "0", 10);

  if (!planId || isNaN(planId)) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-4">
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text className="text-danger text-center mt-4">Invalid plan ID</Text>
      </View>
    );
  }

  return (
    <Container>
      <Stack.Screen
        options={{
          title: `Plan ${id}`,
          headerShown: true,
        }}
      />

      <PlanView planId={planId} />
    </Container>
  );
}
