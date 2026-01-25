import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Container } from "@/components/ui/container";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  AiChat01Icon,
  Target01Icon,
  SparklesIcon,
  ChampionIcon,
  PlusSignIcon,
  Delete02Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  FavouriteIcon,
  Briefcase01Icon,
  BookOpen01Icon,
  Money01Icon,
  UserGroupIcon,
  UserIcon,
  Task01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { Button, TextField, Card } from "heroui-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSemanticColors } from "@/utils/theme";
import {
  useOnboardingStore,
  type FixedCommitment,
  type Resolution,
  type TaskComplexity,
  type WeekendPreference,
} from "@/stores/onboarding-store";
import { useShallow } from "zustand/react/shallow";

const COACH_TONES = [
  { key: "encouraging", label: "Encouraging" },
  { key: "direct", label: "Direct" },
  { key: "analytical", label: "Analytical" },
  { key: "friendly", label: "Friendly" },
];

const ONBOARDING_STEPS = ["Pillars", "Coach", "Blocks", "Goal"];

const GOAL_EXAMPLES = [
  "Launch my portfolio site",
  "Cut screen time by 30%",
  "Train for a 10K",
  "Ship my side project MVP",
];

const COACH_PROFILES = [
  {
    id: "strict",
    title: "Strict Coach",
    name: "Beerus",
    tone: "direct",
    pitch: "Keeps you on track with firm accountability.",
  },
  {
    id: "friendly",
    title: "Friendly Coach",
    name: "Sunny",
    tone: "friendly",
    pitch: "Supportive tone that boosts motivation and momentum.",
  },
  {
    id: "analytical",
    title: "Analytical Coach",
    name: "Atlas",
    tone: "analytical",
    pitch: "Data-focused guidance in measurable steps.",
  },
  {
    id: "direct",
    title: "Direct Coach",
    name: "Nova",
    tone: "direct",
    pitch: "Concise, no-fluff guidance for fast decisions.",
  },
];

const RESOLUTION_CATEGORIES = [
  { key: "health", label: "Health", icon: FavouriteIcon },
  { key: "career", label: "Career", icon: Briefcase01Icon },
  { key: "learning", label: "Learning", icon: BookOpen01Icon },
  { key: "finance", label: "Finance", icon: Money01Icon },
  { key: "relationships", label: "Social", icon: UserGroupIcon },
  { key: "personal", label: "Personal", icon: UserIcon },
  { key: "productivity", label: "Work", icon: Task01Icon },
  { key: "other", label: "Other", icon: MoreHorizontalIcon },
];

/**
 * Premium Onboarding Goals screen.
 * Features:
 * - Single monthly focus
 * - Planning pillars
 * - AI Coach personalization
 */
export default function GoalsScreen() {
  const router = useRouter();
  const colors = useSemanticColors();

  // State
  const {
    mainGoal,
    resolutions,
    selectedCoachId,
    coachName,
    coachTone,
    fixedCommitments,
    taskComplexity,
    weekendPreference,
    stepIndex,
    setMainGoal,
    addResolution: addResolutionToStore,
    removeResolution: removeResolutionFromStore,
    setCoachProfile,
    addCommitment: addCommitmentToStore,
    removeCommitment: removeCommitmentFromStore,
    setTaskComplexity,
    setWeekendPreference,
    setStepIndex,
  } = useOnboardingStore(
    useShallow((state) => ({
      mainGoal: state.mainGoal,
      resolutions: state.resolutions,
      selectedCoachId: state.selectedCoachId,
      coachName: state.coachName,
      coachTone: state.coachTone,
      fixedCommitments: state.fixedCommitments,
      taskComplexity: state.taskComplexity,
      weekendPreference: state.weekendPreference,
      stepIndex: state.stepIndex,
      setMainGoal: state.setMainGoal,
      addResolution: state.addResolution,
      removeResolution: state.removeResolution,
      setCoachProfile: state.setCoachProfile,
      addCommitment: state.addCommitment,
      removeCommitment: state.removeCommitment,
      setTaskComplexity: state.setTaskComplexity,
      setWeekendPreference: state.setWeekendPreference,
      setStepIndex: state.setStepIndex,
    })),
  );
  const selectedCoach = COACH_PROFILES.find((coach) => coach.id === selectedCoachId);

  // Modal State
  const [showResModal, setShowResModal] = useState(false);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [newRes, setNewRes] = useState<Resolution>({
    title: "",
    category: "personal",
    targetCount: 12,
  });
  const [newCommitment, setNewCommitment] = useState<FixedCommitment>({
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    description: "",
  });

  const getFocusAreas = (resolutions: Resolution[]) => {
    const categories = resolutions.map((r) => r.category);
    const unique = [...new Set(categories)];
    return unique.join(",") || "personal";
  };

  const handleNext = () => {
    if (mainGoal.trim()) {
      router.push({
        pathname: "/onboarding/generating",
        params: {
          mainGoal,
          resolutions: JSON.stringify(resolutions),
          fixedCommitmentsJson: JSON.stringify({
            commitments: fixedCommitments,
          }),
          coachName,
          coachTone,
          taskComplexity,
          weekendPreference,
          focusAreas: getFocusAreas(resolutions),
        },
      });
    }
  };

  const addResolution = () => {
    if (newRes.title.trim()) {
      addResolutionToStore({ ...newRes });
      setNewRes({ title: "", category: "personal", targetCount: 12 });
      setShowResModal(false);
    }
  };

  const removeResolution = (index: number) => {
    removeResolutionFromStore(index);
  };

  const addCommitment = () => {
    if (newCommitment.description.trim()) {
      addCommitmentToStore({ ...newCommitment });
      setNewCommitment({
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        description: "",
      });
      setShowCommitmentModal(false);
    }
  };

  const removeCommitment = (index: number) => {
    removeCommitmentFromStore(index);
  };

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;
  const canContinue = stepIndex === 3 ? Boolean(mainGoal.trim()) : true;

  return (
    <Container className="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 120,
          }}
          stickyHeaderIndices={[0]}
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-background pb-4">
            <View className="self-start px-3 py-1 rounded-full bg-surface border border-border/60">
              <Text className="text-xs font-sans-semibold text-muted-foreground tracking-widest">
                STEP {stepIndex + 1} OF {ONBOARDING_STEPS.length}
              </Text>
            </View>
            <View className="mt-4 flex-row items-center justify-between">
              {ONBOARDING_STEPS.map((step, index) => {
                const isActive = index === stepIndex;
                const isDone = index < stepIndex;
                const canJump = index <= stepIndex;

                return (
                  <TouchableOpacity
                    key={step}
                    onPress={() => {
                      if (canJump) {
                        setStepIndex(index);
                      }
                    }}
                    disabled={!canJump}
                    className="flex-1 items-center"
                  >
                    <View
                      className={`h-1.5 w-full rounded-full ${
                        isDone || isActive ? "bg-accent" : "bg-border/40"
                      }`}
                    />
                    <Text
                      className={`mt-2 text-[10px] font-sans-semibold uppercase tracking-widest ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {/* Header */}
          <Animated.View
            entering={FadeInUp.delay(100).duration(600)}
            className="flex-row items-center mb-8 pt-2"
          >
            <TouchableOpacity
              onPress={() => router.back()}
              className="size-12 rounded-2xl bg-surface items-center justify-center border border-border/50"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={colors.foreground} />
            </TouchableOpacity>
          </Animated.View>

          {/* Title Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mb-10">
            <Text className="text-4xl font-sans-bold text-foreground mb-3 tracking-tight">
              Personalize Your Zen
            </Text>
            <Text className="text-lg font-sans text-muted-foreground leading-7">
              Tell us about your month and how you want your AI coach to support you.
            </Text>
          </Animated.View>

          {stepIndex === 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(600)} className="mb-8">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-x-2">
                  <View className="w-8 h-8 rounded-lg bg-success/20 items-center justify-center">
                    <HugeiconsIcon icon={ChampionIcon} size={16} color={colors.success} />
                  </View>
                  <Text className="text-sm font-sans-semibold text-foreground uppercase tracking-wider">
                    Planning Pillars
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowResModal(true)}
                  className="bg-accent/20 py-1.5 px-3 rounded-full flex-row items-center gap-x-1"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={14} color={colors.accent} />
                  <Text className="text-xs font-sans-semibold text-accent">Add</Text>
                </TouchableOpacity>
              </View>

              <Card className="p-5 border-none bg-surface/50 mb-4">
                <View className="flex-row items-start gap-x-3">
                  <View className="w-10 h-10 rounded-xl bg-background items-center justify-center">
                    <HugeiconsIcon icon={SparklesIcon} size={18} color={colors.accent} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-sans-semibold text-foreground">
                      Define your long-range tracks
                    </Text>
                    <Text className="text-xs font-sans text-muted-foreground mt-1 leading-5">
                      Add 2–4 pillars that guide your monthly planning. Each pillar sets a cadence
                      you want to hit across the year.
                    </Text>
                  </View>
                </View>
              </Card>

              {resolutions.length === 0 ? (
                <Card className="p-8 border-dashed border-2 border-border/30 bg-transparent items-center justify-center">
                  <Text className="text-sm font-sans text-muted-foreground text-center">
                    No pillars yet. Add the habits or outcomes you want to revisit all year.
                  </Text>
                </Card>
              ) : (
                <View className="gap-y-3">
                  {resolutions.map((res: Resolution, idx) => (
                    <Animated.View key={idx} entering={FadeInDown}>
                      <Card className="p-4 flex-row items-center justify-between border-none bg-surface/50">
                        <View className="flex-row items-center gap-x-3 flex-1">
                          <View className="w-10 h-10 rounded-xl bg-background items-center justify-center">
                            <HugeiconsIcon
                              icon={
                                RESOLUTION_CATEGORIES.find((c) => c.key === res.category)?.icon ||
                                UserIcon
                              }
                              size={20}
                              color={colors.accent}
                            />
                          </View>
                          <View className="flex-1">
                            <Text
                              className="text-base font-sans-semibold text-foreground"
                              numberOfLines={1}
                            >
                              {res.title}
                            </Text>
                            <Text className="text-xs font-sans text-muted-foreground">
                              Cadence: {res.targetCount} sessions/year
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => removeResolution(idx)}>
                          <HugeiconsIcon icon={Delete02Icon} size={18} color={colors.danger} />
                        </TouchableOpacity>
                      </Card>
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          {stepIndex === 1 && (
            <Animated.View entering={FadeInDown.delay(500).duration(600)} className="mb-6">
              <View className="flex-row items-center gap-x-2 mb-4">
                <View className="w-8 h-8 rounded-lg bg-accent/10 items-center justify-center">
                  <HugeiconsIcon icon={AiChat01Icon} size={16} color={colors.accent} />
                </View>
                <Text className="text-sm font-sans-semibold text-foreground uppercase tracking-wider">
                  AI Companion
                </Text>
              </View>

              <Card className="p-3 border-none bg-surface/50">
                <View className="mb-6">
                  <Text className="text-xs font-sans-semibold text-muted-foreground uppercase mb-3">
                    Choose your coach
                  </Text>
                  <View className="flex-row flex-wrap gap-.3">
                    {COACH_PROFILES.map((coach, index) => (
                      <TouchableOpacity
                        key={coach.id}
                        onPress={() => {
                          setCoachProfile({
                            id: coach.id,
                            name: coach.name,
                            tone: coach.tone,
                          });
                        }}
                        className={`w-1/2 rounded-2xl border p-4 ${
                          index % 2 === 0 ? "pr-2" : "pl-2"
                        } ${index < 2 ? "mb-3" : ""} ${
                          selectedCoachId === coach.id
                            ? "bg-accent/15 border-accent"
                            : "bg-background border-border"
                        }`}
                      >
                        <Text className="text-sm font-sans-semibold text-foreground">
                          {coach.title}
                        </Text>
                        <Text className="text-xs font-sans-medium text-muted-foreground mt-1">
                          {coach.name}
                        </Text>
                        <Text className="text-xs font-sans text-muted-foreground mt-2">
                          {coach.pitch}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="bg-background/70 rounded-2xl border border-border/60 p-4">
                  <Text className="text-xs font-sans-semibold text-muted-foreground uppercase">
                    Selected companion
                  </Text>
                  <Text className="text-base font-sans-semibold text-foreground mt-2">
                    {selectedCoach?.title}
                  </Text>
                  <Text className="text-sm font-sans-medium text-muted-foreground mt-1">
                    {coachName} · {COACH_TONES.find((tone) => tone.key === coachTone)?.label}
                  </Text>
                  <Text className="text-xs font-sans text-muted-foreground mt-3">
                    {selectedCoach?.pitch}
                  </Text>
                </View>
              </Card>
            </Animated.View>
          )}

          {stepIndex === 2 && (
            <View>
              <Animated.View entering={FadeInDown.delay(600).duration(600)} className="mb-8">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-x-2">
                    <View className="w-8 h-8 rounded-lg bg-accent/10 items-center justify-center">
                      <HugeiconsIcon icon={Task01Icon} size={16} color={colors.accent} />
                    </View>
                    <Text className="text-sm font-sans-semibold text-foreground uppercase tracking-wider">
                      Fixed Commitments
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowCommitmentModal(true)}
                    className="bg-accent/20 py-1.5 px-3 rounded-full flex-row items-center gap-x-1"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={14} color={colors.accent} />
                    <Text className="text-xs font-sans-semibold text-accent">Add</Text>
                  </TouchableOpacity>
                </View>

                <Card className="p-5 border-none bg-surface/50 mb-4">
                  <Text className="text-xs font-sans-semibold text-muted-foreground uppercase mb-2">
                    Standing blocks we must plan around
                  </Text>
                  {fixedCommitments.length === 0 ? (
                    <Text className="text-sm font-sans text-muted-foreground">
                      Add commitments like classes, meetings, or workouts so your plan stays real.
                    </Text>
                  ) : (
                    <View className="gap-y-3">
                      {fixedCommitments.map((commitment, idx) => (
                        <View
                          key={`${commitment.dayOfWeek}-${commitment.startTime}-${idx}`}
                          className="flex-row items-center justify-between"
                        >
                          <View className="flex-1">
                            <Text className="text-sm font-sans-semibold text-foreground">
                              {commitment.description}
                            </Text>
                            <Text className="text-xs font-sans text-muted-foreground mt-1">
                              {commitment.dayOfWeek} · {commitment.startTime}–{commitment.endTime}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => removeCommitment(idx)}>
                            <HugeiconsIcon icon={Delete02Icon} size={18} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>

                <View className="flex-row items-center gap-x-2 mb-4">
                  <View className="w-8 h-8 rounded-lg bg-accent/10 items-center justify-center">
                    <HugeiconsIcon icon={Task01Icon} size={16} color={colors.accent} />
                  </View>
                  <Text className="text-sm font-sans-semibold text-foreground uppercase tracking-wider">
                    Task Complexity
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  {["Simple", "Balanced", "Ambitious"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setTaskComplexity(type as TaskComplexity)}
                      className={`flex-1 p-3 rounded-xl border items-center ${
                        taskComplexity === type
                          ? "bg-accent border-accent"
                          : "bg-surface border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-sans-medium ${
                          taskComplexity === type ? "text-primary-foreground" : "text-foreground"
                        }`}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text className="text-xs font-sans text-muted-foreground mt-3">
                  Simple = 3–5 tasks/week. Balanced = 6–9. Ambitious = 10+.
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(700).duration(600)} className="mb-6">
                <View className="flex-row items-center gap-x-2 mb-4">
                  <View className="w-8 h-8 rounded-lg bg-accent/10 items-center justify-center">
                    <HugeiconsIcon icon={SparklesIcon} size={16} color={colors.accent} />
                  </View>
                  <Text className="text-sm font-sans-semibold text-foreground uppercase tracking-wider">
                    Weekend Preference
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  {["Work", "Rest", "Mixed"].map((pref) => (
                    <TouchableOpacity
                      key={pref}
                      onPress={() => setWeekendPreference(pref as WeekendPreference)}
                      className={`flex-1 py-2.5 px-4 rounded-xl border items-center ${
                        weekendPreference === pref
                          ? "bg-accent border-accent"
                          : "bg-background border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-sans-medium ${
                          weekendPreference === pref ? "text-primary-foreground" : "text-foreground"
                        }`}
                      >
                        {pref}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text className="text-xs font-sans text-muted-foreground mt-3">
                  Choose how you want weekends treated in your plan.
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(800).duration(600)} className="mb-6">
                <View className="flex-row items-center gap-x-2 mb-4">
                  <View className="w-8 h-8 rounded-lg bg-accent/10 items-center justify-center">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color={colors.accent} />
                  </View>
                  <Text className="text-sm font-sans-semibold text-foreground uppercase tracking-wider">
                    Preview
                  </Text>
                </View>
                <Card className="p-5 border-none bg-surface/50">
                  <View className="gap-y-3">
                    <View>
                      <Text className="text-xs font-sans-semibold text-muted-foreground uppercase">
                        Monthly focus
                      </Text>
                      <Text className="text-base font-sans-semibold text-foreground mt-1">
                        {mainGoal.trim() || "Not set yet"}
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap justify-between gap-y-3">
                      <View>
                        <Text className="text-xs font-sans-semibold text-muted-foreground uppercase">
                          Coach
                        </Text>
                        <Text className="text-sm font-sans-medium text-foreground mt-1">
                          {coachName} · {coachTone}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs font-sans-semibold text-muted-foreground uppercase">
                          Complexity
                        </Text>
                        <Text className="text-sm font-sans-medium text-foreground mt-1">
                          {taskComplexity}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between">
                      <View>
                        <Text className="text-xs font-sans-semibold text-muted-foreground uppercase">
                          Weekend
                        </Text>
                        <Text className="text-sm font-sans-medium text-foreground mt-1">
                          {weekendPreference}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs font-sans-semibold text-muted-foreground uppercase">
                          Commitments
                        </Text>
                        <Text className="text-sm font-sans-medium text-foreground mt-1">
                          {fixedCommitments.length || 0} blocks
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs font-sans-semibold text-muted-foreground uppercase">
                          Focus areas
                        </Text>
                        <Text className="text-sm font-sans-medium text-foreground mt-1">
                          {getFocusAreas(resolutions)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            </View>
          )}

          {stepIndex === 3 && (
            <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mb-8">
              <View className="flex-row items-center gap-x-2 mb-4">
                <View className="w-8 h-8 rounded-lg bg-accent/10 items-center justify-center">
                  <HugeiconsIcon icon={Target01Icon} size={16} color={colors.accent} />
                </View>
                <Text className="text-sm font-sans-semibold text-foreground uppercase tracking-wider">
                  This Month's Focus
                </Text>
              </View>
              <Card className="p-5 border-none bg-surface/50">
                <TextField>
                  <TextField.Input
                    placeholder="What's the one big thing you want to achieve?"
                    value={mainGoal}
                    onChangeText={setMainGoal}
                    multiline
                    numberOfLines={2}
                    className="text-lg font-sans leading-7 min-h-20"
                  />
                </TextField>
                <View className="mt-4">
                  <Text className="text-xs font-sans-semibold text-muted-foreground uppercase mb-2">
                    Try one-tap ideas
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {GOAL_EXAMPLES.map((example) => (
                      <TouchableOpacity
                        key={example}
                        onPress={() => setMainGoal(example)}
                        className="px-3 py-2 rounded-full border border-border/60 bg-background"
                      >
                        <Text className="text-xs font-sans-medium text-foreground">{example}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View className="mt-3 flex-row items-center gap-x-2">
                  <HugeiconsIcon icon={SparklesIcon} size={14} color={colors.muted} />
                  <Text className="text-xs font-sans text-muted-foreground">
                    AI will use this to prioritize your tasks.
                  </Text>
                </View>
              </Card>
            </Animated.View>
          )}
        </ScrollView>

        <Animated.View entering={FadeInDown.delay(600)} className="px-8 pb-10 pt-4">
          <View className="flex-row items-center justify-between">
            {!isFirstStep ? (
              <TouchableOpacity
                onPress={() => setStepIndex(Math.max(stepIndex - 1, 0))}
                className="px-4 py-3"
              >
                <Text className="text-sm font-sans-semibold text-muted-foreground">Back</Text>
              </TouchableOpacity>
            ) : (
              <View className="w-16" />
            )}

            <Button
              size="lg"
              className="h-16 flex-1 rounded-2xl shadow-xl shadow-accent/20"
              onPress={() => {
                if (isLastStep) {
                  handleNext();
                  return;
                }
                setStepIndex(Math.min(stepIndex + 1, ONBOARDING_STEPS.length - 1));
              }}
              isDisabled={!canContinue}
            >
              <View className="flex-row items-center justify-center gap-x-2">
                <Text className="text-lg font-sans-semibold text-foreground">
                  {isLastStep ? "Finalize My Plan" : "Continue"}
                </Text>
                <HugeiconsIcon
                  icon={isLastStep ? CheckmarkCircle01Icon : ArrowRight01Icon}
                  size={20}
                  color={colors.foreground}
                />
              </View>
            </Button>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Resolution Modal */}
      <Modal
        visible={showResModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowResModal(false)}
          className="flex-1 bg-black/60 justify-end"
        >
          <TouchableOpacity activeOpacity={1} className="bg-surface rounded-t-[40px] p-8 pb-12">
            <View className="w-12 h-1.5 bg-border/50 rounded-full self-center mb-8" />

            <Text className="text-2xl font-sans-bold text-foreground mb-6">New Pillar</Text>

            <View className="mb-6">
              <Text className="text-xs font-sans-semibold text-muted-foreground uppercase mb-2 ml-1">
                What should this pillar cover?
              </Text>
              <TextField>
                <TextField.Input
                  placeholder="e.g. Deep work sessions"
                  value={newRes.title}
                  onChangeText={(text) => setNewRes({ ...newRes, title: text })}
                  className="text-base font-sans"
                />
              </TextField>
            </View>

            <View className="mb-6">
              <Text className="text-xs font-sans-semibold text-muted-foreground uppercase mb-3 ml-1">
                Focus area
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-2"
              >
                {RESOLUTION_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => setNewRes({ ...newRes, category: cat.key })}
                    className={`flex-row items-center gap-x-2  ml-2 px-4 py-2.5 rounded-xl border ${
                      newRes.category === cat.key
                        ? "bg-accent/10 border-accent"
                        : "bg-background border-border"
                    }`}
                  >
                    <HugeiconsIcon
                      icon={cat.icon}
                      size={16}
                      color={newRes.category === cat.key ? `${colors.accent}` : `${colors.muted}`}
                    />
                    <Text
                      className={`text-sm font-sans-medium ${
                        newRes.category === cat.key ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="mb-8">
              <Text className="text-xs font-sans-semibold text-muted-foreground uppercase mb-3 ml-1">
                Cadence (sessions per year)
              </Text>
              <View className="flex-row items-center justify-between bg-background rounded-2xl p-4 border border-border">
                <TouchableOpacity
                  onPress={() =>
                    setNewRes({
                      ...newRes,
                      targetCount: Math.max(1, newRes.targetCount - 1),
                    })
                  }
                  className="w-10 h-10 rounded-xl bg-surface items-center justify-center"
                >
                  <Text className="text-2xl font-sans text-foreground">-</Text>
                </TouchableOpacity>
                <Text className="text-2xl font-sans-bold text-foreground">
                  {newRes.targetCount}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setNewRes({
                      ...newRes,
                      targetCount: newRes.targetCount + 1,
                    })
                  }
                  className="w-10 h-10 rounded-xl bg-surface items-center justify-center"
                >
                  <Text className="text-2xl font-sans text-foreground">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              size="lg"
              className="h-16 rounded-2xl"
              onPress={addResolution}
              isDisabled={!newRes.title.trim()}
            >
              <Text className="text-lg font-sans-semibold text-primary-foreground">Add Pillar</Text>
            </Button>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Commitments Modal */}
      <Modal
        visible={showCommitmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommitmentModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowCommitmentModal(false)}
          className="flex-1 bg-black/60 justify-end"
        >
          <TouchableOpacity activeOpacity={1} className="bg-surface rounded-t-[40px] p-8 pb-12">
            <View className="w-12 h-1.5 bg-border/50 rounded-full self-center mb-8" />

            <Text className="text-2xl font-sans-bold text-foreground mb-6">New Commitment</Text>

            <View className="mb-6">
              <Text className="text-xs font-sans-semibold text-muted-foreground uppercase mb-2 ml-1">
                Commitment label
              </Text>
              <TextField>
                <TextField.Input
                  placeholder="e.g. Pilates class"
                  value={newCommitment.description}
                  onChangeText={(text) => setNewCommitment({ ...newCommitment, description: text })}
                  className="text-base font-sans"
                />
              </TextField>
            </View>

            <View className="mb-6">
              <Text className="text-xs font-sans-semibold text-muted-foreground uppercase mb-3 ml-1">
                Day of week
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-2"
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                  (day) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setNewCommitment({ ...newCommitment, dayOfWeek: day })}
                      className={`flex-row items-center gap-x-2 ml-2 px-4 py-2.5 rounded-xl border ${
                        newCommitment.dayOfWeek === day
                          ? "bg-accent/10 border-accent"
                          : "bg-background border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-sans-medium ${
                          newCommitment.dayOfWeek === day ? "text-accent" : "text-foreground"
                        }`}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </ScrollView>
            </View>

            <View className="mb-8">
              <Text className="text-xs font-sans-semibold text-muted-foreground uppercase mb-3 ml-1">
                Time block
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <TextField>
                    <TextField.Input
                      placeholder="Start (09:00)"
                      value={newCommitment.startTime}
                      onChangeText={(text) =>
                        setNewCommitment({ ...newCommitment, startTime: text })
                      }
                      className="text-base font-sans"
                    />
                  </TextField>
                </View>
                <View className="flex-1">
                  <TextField>
                    <TextField.Input
                      placeholder="End (10:00)"
                      value={newCommitment.endTime}
                      onChangeText={(text) => setNewCommitment({ ...newCommitment, endTime: text })}
                      className="text-base font-sans"
                    />
                  </TextField>
                </View>
              </View>
            </View>

            <Button
              size="lg"
              className="h-16 rounded-2xl"
              onPress={addCommitment}
              isDisabled={!newCommitment.description.trim()}
            >
              <Text className="text-lg font-sans-semibold text-primary-foreground">
                Add Commitment
              </Text>
            </Button>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Container>
  );
}
