import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Animated, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Container } from "@/components/ui/container";
import { useAuthStore } from "@/stores/auth-store";
import { Ionicons } from "@expo/vector-icons";

const STEPS = ["Analyzing your goals...", "Creating balanced plan...", "Optimizing schedule..."];

export default function GeneratingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    const timeout = setTimeout(() => {
      setIsGenerating(false);
    }, STEPS.length * 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handleContinue = async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  };

  const isComplete = !isGenerating;

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
          {isComplete ? "Your first plan is ready!" : "Generating Your Plan"}
        </Text>

        <Text className="text-xl text-muted-foreground text-center font-medium mb-8">
          {isComplete ? "Let's start your journey to better productivity." : STEPS[currentStep]}
        </Text>

        {!isGenerating && (
          <View className="w-full gap-4">
            <TouchableOpacity
              onPress={handleContinue}
              className="h-16 rounded-2xl items-center justify-center bg-primary shadow-lg shadow-primary/30"
            >
              <Text className="text-white text-xl font-bold">Start Using Monthly Zen</Text>
            </TouchableOpacity>
          </View>
        )}

        {isGenerating && (
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
