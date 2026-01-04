import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Container } from "@/components/ui/container";
import { useAuthStore } from "@/stores/auth-store";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  AiChat01Icon,
  CheckmarkCircle01Icon,
  SparklesIcon,
  RocketIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "heroui-native";
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

const STEPS = [
  "Analyzing your monthly focus...",
  "Synthesizing actionable steps...",
  "Calibrating your ideal schedule...",
  "Finalizing your Zen plan...",
];

/**
 * Premium Generating Screen for Onboarding.
 * Maintains consistency with the new welcome and goals screens.
 */
export default function GeneratingScreen() {
  const router = useRouter();
  const colors = useSemanticColors();
  const { completeOnboarding } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Animation values
  const pulseScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
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

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 1800);

    const completionTimeout = setTimeout(
      () => {
        setIsComplete(true);
        clearInterval(stepInterval);
      },
      STEPS.length * 1800 + 500,
    );

    return () => {
      clearInterval(stepInterval);
      clearTimeout(completionTimeout);
    };
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
          className="items-center"
        >
          <Text className="text-3xl font-sans-bold text-foreground text-center mb-4 tracking-tight">
            {isComplete ? "Your plan is curated" : "Curating your journey"}
          </Text>
          <Text className="text-lg font-sans text-muted-foreground text-center leading-7 px-4 min-h-[60px]">
            {isComplete
              ? "Everything is set. Your path to clarity and focus starts now."
              : STEPS[currentStep]}
          </Text>
        </Animated.View>

        {/* Progress Bar or Button */}
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
      </View>
    </Container>
  );
}
