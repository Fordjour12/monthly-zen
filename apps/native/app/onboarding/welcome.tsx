import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Container } from "@/components/ui/container";
import { useAuthStore } from "@/stores/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native";

export default function WelcomeScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuthStore();

  const handleSkip = () => {
    completeOnboarding();
    router.replace("/(tabs)");
  };

  return (
    <Container>
      <View className="flex-1 px-6 pt-20 pb-10 justify-between">
        <View className="items-center">
          <View className="w-24 h-24 bg-primary/10 rounded-3xl items-center justify-center mb-8">
            <Ionicons name="leaf-outline" size={60} color="#3b82f6" />
          </View>
          <Text className="text-4xl font-bold text-foreground text-center mb-4">
            Welcome to Monthly Zen
          </Text>
          <Text className="text-lg text-muted-foreground text-center px-4">
            AI-powered monthly planning to help you achieve your goals without burning out.
          </Text>
        </View>

        <View className="gap-4">
          <Button onPress={() => router.push("/onboarding/goals")} className="rounded-none">
            <Button.Label className="text-xl">Get Started</Button.Label>
          </Button>

          <TouchableOpacity
            onPress={handleSkip}
            className="h-16 rounded-2xl items-center justify-center"
          >
            <Text className="text-muted-foreground text-lg font-medium">I know what I'm doing</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
}
