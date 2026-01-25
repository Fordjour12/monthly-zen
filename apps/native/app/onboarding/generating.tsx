import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Container } from "@/components/ui/container";
import { useAuthStore } from "@/stores/auth-store";
import { useUpdatePreferences } from "@/hooks/usePreferences";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  AiChat01Icon,
  CheckmarkCircle01Icon,
  SparklesIcon,
  MailOpen01Icon,
} from "@hugeicons/core-free-icons";
import { Button, Card, useToast } from "heroui-native";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
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
  const updatePreferences = useUpdatePreferences();
  const { toast } = useToast();

  const mainGoal = params.mainGoal as string;
  const coachName = params.coachName as string;
  const coachTone = params.coachTone as "encouraging" | "direct" | "analytical" | "friendly";
  const taskComplexity = params.taskComplexity as "Simple" | "Balanced" | "Ambitious";
  const focusAreas = params.focusAreas as string;
  const weekendPreference = params.weekendPreference as "Work" | "Rest" | "Mixed";
  const rawResolutions = params.resolutions as string;
  const rawCommitments = params.fixedCommitmentsJson as string;

  const parsedResolutions = (() => {
    if (!rawResolutions) return [];
    try {
      const parsed = JSON.parse(rawResolutions);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const parsedCommitments = (() => {
    if (!rawCommitments) return { commitments: [] };
    try {
      const parsed = JSON.parse(rawCommitments);
      return parsed && typeof parsed === "object" ? parsed : { commitments: [] };
    } catch {
      return { commitments: [] };
    }
  })();

  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [planId, setPlanId] = useState<number | null>(null);
  const hasNotified = useRef(false);

  const sampleTasks = [
    `Define what success looks like for "${mainGoal}."`,
    "Block two deep-focus sessions this week.",
    "Close the week with a 10-minute review.",
  ];

  // Animation values
  const pulseScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const startGenerationMutation = useMutation(
    orpc.plan.startFirstGeneration.mutationOptions({
      onSuccess: (result) => {
        if (result.success) {
          setJobId(result.jobId);
        } else {
          setError(result.error || "Failed to start generation");
        }
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "Failed to start generation";
        setError(message);
      },
    }),
  );

  const statusQuery = useQuery({
    ...orpc.plan.getGenerationStatus.queryOptions({ jobId: jobId ?? 0 }),
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (!status || status === "completed" || status === "failed") {
        return false;
      }
      return 1500;
    },
  });

  useEffect(() => {
    setError(null);
    setCurrentStep(0);
    setIsComplete(false);

    const saveAndGenerate = async () => {
      try {
        await updatePreferences.mutateAsync({
          coachName,
          coachTone,
          taskComplexity,
          weekendPreference,
          focusAreas,
          resolutionsJson: { resolutions: parsedResolutions },
          fixedCommitmentsJson: parsedCommitments,
        });

        startGenerationMutation.mutate({
          mainGoal,
          coachName,
          coachTone,
          taskComplexity,
          focusAreas,
          weekendPreference,
          resolutionsJson: { resolutions: parsedResolutions },
          fixedCommitmentsJson: parsedCommitments,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save preferences";
        setError(message);
      }
    };

    saveAndGenerate();

    const timers = [
      setTimeout(() => setCurrentStep(1), 800),
      setTimeout(() => setCurrentStep(2), 1600),
      setTimeout(() => setCurrentStep(3), 2400),
    ];

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

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (statusQuery.data && !statusQuery.data.success) {
      setError(statusQuery.data.error || "Generation failed");
      return;
    }

    const status = statusQuery.data?.data?.status;
    if (status === "failed") {
      setError(statusQuery.data?.data?.errorMessage || "Generation failed");
      return;
    }

    if (status === "completed") {
      const nextPlanId = statusQuery.data?.data?.planId ?? null;
      if (nextPlanId) {
        setPlanId(nextPlanId);
      }
      setIsComplete(true);
    }
  }, [statusQuery.data?.data?.status]);

  useEffect(() => {
    if (!isComplete || hasNotified.current) return;

    hasNotified.current = true;
    toast.show({
      title: "Your plan is ready",
      description: "Open the plan chat to refine or tweak it.",
    });

    const notify = async () => {
      const permissions = await Notifications.requestPermissionsAsync();
      if (permissions.status === "granted") {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Your monthly plan is ready",
            body: "Tap to open your plan chat and refine it.",
          },
          trigger: null,
        });
      }
    };

    notify();
  }, [isComplete, toast]);

  const handleContinue = async () => {
    await completeOnboarding();
    if (planId) {
      router.replace({ pathname: "/chat", params: { planId: String(planId) } });
      return;
    }
    router.replace("/chat");
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
        <View className="self-start mb-8">
          <View className="px-3 py-1 rounded-full bg-surface border border-border/60">
            <Text className="text-xs font-sans-semibold text-muted-foreground tracking-widest">
              STEP 4 OF 4
            </Text>
          </View>
        </View>

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
                  onPress={() => router.replace("/onboarding/goals")}
                >
                  <Text className="text-lg font-sans-semibold text-danger-foreground">
                    Back to edit
                  </Text>
                </Button>
              </Card>
            </Animated.View>
          ) : (
            <Text className="text-lg font-sans text-muted-foreground text-center leading-7 px-4 min-h-14">
              {isComplete
                ? "Everything is set. Next up: your plan chat for final tweaks."
                : STEPS[currentStep]?.label || "Preparing..."}
            </Text>
          )}
        </Animated.View>

        {!error && (
          <View className="w-full mt-8 gap-y-3">
            <Text className="text-xs font-sans-semibold text-muted-foreground uppercase tracking-widest">
              What's happening
            </Text>
            {STEPS.map((step, index) => {
              const isDone = isComplete || index < currentStep;
              const isActive = index === currentStep && !isComplete;

              return (
                <View key={step.id} className="flex-row items-center gap-x-3">
                  <View
                    className={`size-6 rounded-full items-center justify-center border ${
                      isDone
                        ? "bg-accent border-accent"
                        : isActive
                          ? "border-accent"
                          : "border-border"
                    }`}
                  >
                    {isDone && (
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} color="white" />
                    )}
                  </View>
                  <Text
                    className={`text-sm font-sans-medium ${
                      isDone ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {isComplete && !error && (
          <Animated.View entering={FadeInDown.duration(600)} className="w-full mt-10">
            <Card className="p-5 border-none bg-surface/50">
              <Text className="text-xs font-sans-semibold text-muted-foreground uppercase tracking-widest">
                Plan snapshot
              </Text>
              <Text className="text-lg font-sans-semibold text-foreground mt-2">{mainGoal}</Text>
              <Text className="text-sm font-sans text-muted-foreground mt-2">
                Coach tone: {coachTone} · Complexity: {taskComplexity}
              </Text>
              <View className="mt-4 gap-y-2">
                {sampleTasks.map((task) => (
                  <View key={task} className="flex-row items-start gap-x-2">
                    <View className="size-2 rounded-full bg-accent mt-2" />
                    <Text className="text-sm font-sans text-foreground flex-1">{task}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </Animated.View>
        )}

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
                      Open Plan Chat
                    </Text>
                    <HugeiconsIcon icon={MailOpen01Icon} size={20} color={colors.background} />
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
                <Pressable onPress={() => router.replace("/onboarding/goals")} className="mt-4">
                  <Text className="text-xs font-sans-semibold text-muted-foreground uppercase tracking-widest text-center">
                    Back to edit
                  </Text>
                </Pressable>
                <Pressable onPress={() => router.replace("/onboarding/goals")} className="mt-2">
                  <Text className="text-xs font-sans-medium text-muted-foreground text-center">
                    Cancel setup
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </Container>
  );
}
