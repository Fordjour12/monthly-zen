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

const COACH_TONES = [
  { key: "encouraging", label: "Encouraging" },
  { key: "direct", label: "Direct" },
  { key: "analytical", label: "Analytical" },
  { key: "friendly", label: "Friendly" },
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

interface Resolution {
  title: string;
  category: string;
  targetCount: number;
}

/**
 * Premium Onboarding Goals screen.
 * Features:
 * - Single monthly focus
 * - Yearly resolutions
 * - AI Coach personalization
 */
export default function GoalsScreen() {
  const router = useRouter();
  const colors = useSemanticColors();

  // State
  const [mainGoal, setMainGoal] = useState("");
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [coachName, setCoachName] = useState("Alex");
  const [coachTone, setCoachTone] = useState("encouraging");
  const [taskComplexity, setTaskComplexity] = useState<"Simple" | "Balanced" | "Ambitious">(
    "Balanced",
  );
  const [weekendPreference, setWeekendPreference] = useState<"Work" | "Rest" | "Mixed">("Mixed");

  // Modal State
  const [showResModal, setShowResModal] = useState(false);
  const [newRes, setNewRes] = useState<Resolution>({
    title: "",
    category: "personal",
    targetCount: 12,
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
      setResolutions([...resolutions, { ...newRes }]);
      setNewRes({ title: "", category: "personal", targetCount: 12 });
      setShowResModal(false);
    }
  };

  const removeResolution = (index: number) => {
    setResolutions(resolutions.filter((_, i) => i !== index));
  };

  return (
    <Container className="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
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

          {/* 1. Main Goal Section */}
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
              <View className="mt-3 flex-row items-center gap-x-2">
                <HugeiconsIcon icon={SparklesIcon} size={14} color={colors.muted} />
                <Text className="text-xs font-sans text-muted-foreground">
                  AI will use this to prioritize your tasks.
                </Text>
              </View>
            </Card>
          </Animated.View>

          {/* 2. Yearly Resolutions Section */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-x-2">
                <View className="w-8 h-8 rounded-lg bg-success/20 items-center justify-center">
                  <HugeiconsIcon icon={ChampionIcon} size={16} color={colors.success} />
                </View>
                <Text className="text-sm font-sans-semibold text-foreground uppercase tracking-wider">
                  Yearly Resolutions
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

            {resolutions.length === 0 ? (
              <Card className="p-8 border-dashed border-2 border-border/30 bg-transparent items-center justify-center">
                <Text className="text-sm font-sans text-muted-foreground text-center">
                  No yearly goals added yet. {"\n"}Track long-term progress here.
                </Text>
              </Card>
            ) : (
              <View className="gap-y-3">
                {resolutions.map((res, idx) => (
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
                            {res.targetCount} times this year
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

          {/* 3. Coach Settings Section */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)} className="mb-6">
            <View className="flex-row items-center gap-x-2 mb-4">
              <View className="w-8 h-8 rounded-lg bg-accent/10 items-center justify-center">
                <HugeiconsIcon icon={AiChat01Icon} size={16} color={colors.accent} />
              </View>
              <Text className="text-sm font-sans-semibold text-foreground uppercase tracking-wider">
                AI Companion
              </Text>
            </View>

            <Card className="p-6 border-none bg-surface/50">
              <View className="mb-6">
                <Text className="text-xs font-sans-semibold text-muted-foreground uppercase mb-2 ml-1">
                  Companion Name
                </Text>
                <TextField>
                  <TextField.Input
                    placeholder="e.g. Alex"
                    value={coachName}
                    onChangeText={setCoachName}
                    className="text-base font-sans"
                  />
                </TextField>
              </View>

              <View>
                <Text className="text-xs font-sans-semibold text-muted-foreground uppercase mb-3 ml-1">
                  Interaction Style
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {COACH_TONES.map((tone) => (
                    <TouchableOpacity
                      key={tone.key}
                      onPress={() => setCoachTone(tone.key)}
                      className={`px-4 py-2.5 rounded-xl border ${
                        coachTone === tone.key
                          ? "bg-accent border-accent"
                          : "bg-background border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-sans-medium ${
                          coachTone === tone.key ? "text-primary-foreground" : "text-foreground"
                        }`}
                      >
                        {tone.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Card>
          </Animated.View>

          {/* 4. Task Complexity Section */}
          <Animated.View entering={FadeInDown.delay(600).duration(600)} className="mb-8">
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
                  onPress={() => setTaskComplexity(type as any)}
                  className={`flex-1 p-3 rounded-xl border items-center ${
                    taskComplexity === type ? "bg-accent border-accent" : "bg-surface border-border"
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
          </Animated.View>

          {/* 5. Weekend Preference Section */}
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
                  onPress={() => setWeekendPreference(pref as any)}
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
          </Animated.View>
        </ScrollView>

        {/* Floating Action Button */}
        <Animated.View
          entering={FadeInDown.delay(600)}
          className="absolute bottom-10 left-8 right-8"
        >
          <Button
            size="lg"
            className="h-16 rounded-2xl shadow-xl shadow-accent/20"
            onPress={handleNext}
            isDisabled={!mainGoal.trim()}
          >
            <View className="flex-row items-center justify-center gap-x-2">
              <Text className="text-lg font-sans-semibold text-foreground">Finalize My Plan</Text>
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color={colors.foreground} />
            </View>
          </Button>
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

            <Text className="text-2xl font-sans-bold text-foreground mb-6">New Resolution</Text>

            <View className="mb-6">
              <Text className="text-xs font-sans-semibold text-muted-foreground uppercase mb-2 ml-1">
                What do you want to achieve?
              </Text>
              <TextField>
                <TextField.Input
                  placeholder="e.g. Read 12 books"
                  value={newRes.title}
                  onChangeText={(text) => setNewRes({ ...newRes, title: text })}
                  className="text-base font-sans"
                />
              </TextField>
            </View>

            <View className="mb-6">
              <Text className="text-xs font-sans-semibold text-muted-foreground uppercase mb-3 ml-1">
                Category
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
                Frequency (Times per year)
              </Text>
              <View className="flex-row items-center justify-between bg-background rounded-2xl p-4 border border-border">
                <TouchableOpacity
                  onPress={() =>
                    setNewRes({ ...newRes, targetCount: Math.max(1, newRes.targetCount - 1) })
                  }
                  className="w-10 h-10 rounded-xl bg-surface items-center justify-center"
                >
                  <Text className="text-2xl font-sans text-foreground">-</Text>
                </TouchableOpacity>
                <Text className="text-2xl font-sans-bold text-foreground">
                  {newRes.targetCount}
                </Text>
                <TouchableOpacity
                  onPress={() => setNewRes({ ...newRes, targetCount: newRes.targetCount + 1 })}
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
              <Text className="text-lg font-sans-semibold text-primary-foreground">
                Add Resolution
              </Text>
            </Button>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Container>
  );
}
