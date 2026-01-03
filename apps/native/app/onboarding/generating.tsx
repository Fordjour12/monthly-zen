import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Container } from "@/components/ui/container";
import { useAuthStore } from "@/stores/auth-store";
import { Ionicons } from "@expo/vector-icons";

const STEPS = [
  "Analyzing your goals...",
  "Creating balanced plan...",
  "Optimizing schedule...",
  "Your first plan is ready!",
];

export default function GeneratingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    const timeout = setTimeout(
      () => {
        completeOnboarding();
        router.replace("/(tabs)");
      },
      STEPS.length * 1500 + 1000,
    );

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const isComplete = currentStep === STEPS.length - 1;

  return (
    <Container>
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-32 h-32 bg-primary/10 rounded-full items-center justify-center mb-12">
          {isComplete ? (
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          ) : (
            <ActivityIndicator size="large" color="#3b82f6" style={{ transform: [{ scale: 2 }] }} />
          )}
        </View>

        <Text className="text-2xl font-bold text-foreground text-center mb-4">
          {isComplete ? "Success!" : "Generating Your Plan"}
        </Text>

        <Text className="text-xl text-muted-foreground text-center font-medium">
          {STEPS[currentStep]}
        </Text>

        {!isComplete && (
          <View className="w-full bg-muted/30 h-2 rounded-full mt-12 overflow-hidden">
            <Animated.View
              className="bg-primary h-full"
              style={{
                width: `${((currentStep + 1) / STEPS.length) * 100}%`,
              }}
            />
          </View>
        )}
      </View>
    </Container>
  );
}
