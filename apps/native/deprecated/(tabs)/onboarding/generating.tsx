import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Container } from "@/components/ui/container";
import { useAuthStore } from "@/stores/auth-store";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  AiChat01Icon,
  CheckmarkCircle01Icon,
  SparklesIcon,
  RocketIcon,
} from "@hugeicons/core-free-icons";
import { Button, Card } from "heroui-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useSemanticColors } from "@/utils/theme";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

const STEPS = [
  { id: 0, label: "Saving your resolutions..." },
  { id: 1, label: "Configuring your AI companion..." },
  { id: 2, label: "Generating your monthly plan..." },
  { id: 3, label: "Finalizing your Zen plan..." },
];

/**
 * Premium Generating Screen for Onboarding.
 * Maintains consistency with the new welcome and goals screens.
 */
export default function GeneratingScreen() {
  const router = useRouter();
  const colors = useSemanticColors();
  const { completeOnboarding } = useAuthStore();
  const params = useLocalSearchParams();

  const mainGoal = params.mainGoal as string;
  const resolutions = params.resolutions ? JSON.parse(params.resolutions as string) : [];
  const coachName = params.coachName as string;
  const coachTone = params.coachTone as "encouraging" | "direct" | "analytical" | "friendly";
  const taskComplexity = params.taskComplexity as "Simple" | "Balanced" | "Ambitious";
  const weekendPreference = params.weekendPreference as "Work" | "Rest" | "Mixed";
  const focusAreas = (params.focusAreas as string) || "personal";

  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const pulseScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      setCurrentStep(0);

      // Step 1: Save yearly resolutions
      if (resolutions.length > 0) {
        await orpc.resolutions.createBatch.call({
          resolutions: resolutions.map((r: any) => ({
            text: r.title,
            category: r.category,
            resolutionType: "yearly" as const,
            priority: 2,
          })),
        });
      }

      // Step 2: Save AI companion & preferences
      setCurrentStep(1);
      await orpc.preferences.update.call({
        coachName,
        coachTone,
        goalsText: mainGoal,
        taskComplexity,
        weekendPreference,
        focusAreas,
      });

      // Step 3: Generate monthly plan
      setCurrentStep(2);
      await orpc.plan.generate.call({
        goalsText: mainGoal,
        taskComplexity,
        focusAreas,
        weekendPreference,
        fixedCommitmentsJson: { commitments: [] },
      });

      // Step 4: Complete
      setCurrentStep(3);
    },
    onSuccess: () => {
      setIsComplete(true);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    generatePlanMutation.mutate();

    // Pulse animation for the AI icon
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // Rotation for the loading state
    rotation.value = withRepeat(
      withTiming(360, { duration: 2500, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const handleContinue = async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  };

  const aiIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulseScale.value },
      { rotate: isComplete ? "0deg" : `${rotation.value}deg` },
    ],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: withTiming(`${((currentStep + 1) / STEPS.length) * 100}%`, { duration: 800 }),
  }));

  return (
    <Container className="bg-background">
      <View className="flex-1 px-8 items-center justify-center">
        {/* Animated Icon Container */}
        <Animated.View
          entering={FadeIn.duration(1000)}
          style={[aiIconStyle]}
          className="w-40 h-40 rounded-full bg-accent/10 items-center justify-center mb-12 border border-accent/20"
        >
          <View className="w-32 h-32 rounded-full bg-accent items-center justify-center shadow-2xl shadow-accent/40">
            <HugeiconsIcon
              icon={isComplete ? CheckmarkCircle01Icon : AiChat01Icon}
              size={64}
              color="white"
              strokeWidth={2}
            />
          </View>
        </Animated.View>

        {/* Status Text */}
        <Animated.View
          key={isComplete ? "complete" : "generating"}
          entering={FadeInDown.duration(600)}
          className="items-center w-full"
        >
          <Text className="text-3xl font-sans-bold text-foreground text-center mb-4 tracking-tight">
            {isComplete ? "Your plan is curated" : "Curating your journey"}
          </Text>

          {error ? (
            <Animated.View entering={FadeInDown} className="w-full">
              <Card className="p-6 bg-danger/10 border-danger/30 items-center justify-center">
                <Text className="text-base font-sans text-danger mb-4 text-center">{error}</Text>
                <Button
                  size="lg"
                  className="h-14 rounded-xl w-full"
                  onPress={() => generatePlanMutation.mutate()}
                >
                  <Text className="text-lg font-sans-semibold text-danger-foreground">
                    Try Again
                  </Text>
                </Button>
              </Card>
            </Animated.View>
          ) : (
            <Text className="text-lg font-sans text-muted-foreground text-center leading-7 px-4 min-h-[60px]">
              {isComplete
                ? "Everything is set. Your path to clarity and focus starts now."
                : STEPS[currentStep]?.label || "Preparing..."}
            </Text>
          )}
        </Animated.View>

        {/* Progress Bar or Button */}
        {!error && (
          <View className="w-full mt-12 overflow-hidden h-16 justify-center">
            {isComplete ? (
              <Animated.View entering={FadeInDown.duration(600)}>
                <Button
                  size="lg"
                  className="h-16 rounded-2xl shadow-xl shadow-accent/20"
                  onPress={handleContinue}
                >
                  <View className="flex-row items-center justify-center gap-x-2">
                    <Text className="text-lg font-sans-semibold text-primary-foreground">
                      Enter Zen Mode
                    </Text>
                    <HugeiconsIcon icon={RocketIcon} size={20} color={colors.foreground} />
                  </View>
                </Button>
              </Animated.View>
            ) : (
              <View>
                <View className="h-2 w-full bg-surface-foreground/5 rounded-full overflow-hidden">
                  <Animated.View style={progressStyle} className="h-full bg-accent" />
                </View>
                <View className="flex-row items-center justify-center mt-4 gap-x-2">
                  <HugeiconsIcon icon={SparklesIcon} size={14} color="var(--accent)" />
                  <Text className="text-xs font-sans-medium text-accent uppercase tracking-widest">
                    AI is crafting...
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </Container>
  );
}
