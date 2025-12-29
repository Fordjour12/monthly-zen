import { Card } from "heroui-native";
import { View, Text, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

import { Container } from "@/components/container";
import { router } from "expo-router";

export default function Home() {
  const healthQuery = useQuery(orpc.healthCheck.queryOptions());

  return (
    <Container className="p-6">
      <View className="flex-1 justify-center items-center gap-4">
        <Card variant="secondary" className="p-8 items-center w-full">
          <Card.Title className="text-3xl mb-4">Monthly Zen</Card.Title>

          <View className="flex-row items-center gap-2">
            <View
              className={`w-3 h-3 rounded-full ${
                healthQuery.isSuccess
                  ? "bg-green-500"
                  : healthQuery.isPending
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />
            <Text className="text-base text-foreground">
              {healthQuery.isSuccess
                ? "Connected to Server"
                : healthQuery.isPending
                  ? "Connecting..."
                  : "Connection Error"}
            </Text>
          </View>

          {healthQuery.isSuccess && healthQuery.data && (
            <Text className="text-sm text-foreground mt-2">
              Status: {JSON.stringify(healthQuery.data)}
            </Text>
          )}

          {healthQuery.isError && (
            <Text className="text-sm text-danger mt-2">
              {healthQuery.error?.message || "Failed to connect"}
            </Text>
          )}
        </Card>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => {
              router.push("/sign-in");
            }}
          >
            <Text className="text-base text-foreground">Sign in</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              router.push("/sign-up");
            }}
          >
            <Text className="text-base text-foreground">Sign up</Text>
          </Pressable>
        </View>
      </View>
    </Container>
  );
}
