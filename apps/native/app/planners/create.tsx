import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  AiChat01Icon,
  ArrowLeft01Icon,
  ArrowUp01Icon,
  Calendar01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Files01Icon,
  PlusSignIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { Container } from "@/components/ui/container";
import { useSemanticColors } from "@/utils/theme";

const PROMPTS = [
  "Build a 30-day plan",
  "Map my focus areas",
  "Plan around commitments",
  "Review my last month",
];

const QUICK_STATS = [
  { label: "Intensity", value: "Balanced" },
  { label: "Focus", value: "3 domains" },
  { label: "Weekend", value: "Hybrid" },
];

const SUGGESTIONS: Suggestion[] = [
  { id: "s1", label: "Save Plan", description: "Store this blueprint in your planner" },
  { id: "s2", label: "Adjust Intensity", description: "Make it more ambitious" },
  { id: "s3", label: "Add Commitments", description: "Block existing meetings" },
];

const FOLLOW_UPS = [
  "Summarize my plan in 3 bullets",
  "Add a weekly review ritual",
  "Make weekends recovery focused",
];

type Message = {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  meta?: string;
  kind?: "text" | "plan";
};

type Suggestion = {
  id: string;
  label: string;
  description: string;
};

type PlanSection = {
  title: string;
  items: string[];
};

type PlanPayload = {
  title: string;
  summary: string;
  duration: string;
  sections: PlanSection[];
};

type SavedPlan = {
  id: string;
  title: string;
  subtitle: string;
};

const PLAN_DATA: PlanPayload = {
  title: "Balanced Month Blueprint",
  summary:
    "A 30-day rhythm that blends fitness, product execution, and learning without burning out.",
  duration: "Mar 01 - Mar 30",
  sections: [
    {
      title: "Weekly Structure",
      items: [
        "Mon/Wed/Fri: 90-minute deep work block on product milestones",
        "Tue/Thu: 45-minute skill sprint + 30-minute review",
        "Sat: long-form training session + weekly recap",
        "Sun: reset ritual, light admin, and prep",
      ],
    },
    {
      title: "Daily Highlights",
      items: [
        "Morning: 20-minute mobility + intention setting",
        "Midday: single focus sprint with no meetings",
        "Evening: 30-minute learning sprint or reading",
      ],
    },
    {
      title: "Momentum Triggers",
      items: [
        "Track 3 key metrics: workouts, deep work hours, lessons shipped",
        "Use a weekly scorecard to adjust intensity",
        "Schedule a mid-month calibration call with yourself",
      ],
    },
  ],
};

const SAVED_PLANS: SavedPlan[] = [
  {
    id: "saved-1",
    title: "Balanced Month Blueprint",
    subtitle: "Active plan · Updated today",
  },
  {
    id: "saved-2",
    title: "Sprint Mode Template",
    subtitle: "Draft · Saved 2 days ago",
  },
];

export default function PlannerChatCreate() {
  const router = useRouter();
  const colors = useSemanticColors();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const replyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-1",
      role: "system",
      content: "Planner mode engaged. We'll craft a monthly system together.",
      meta: "Session initialized",
    },
    {
      id: "assistant-1",
      role: "assistant",
      content:
        "Tell me what you want to achieve in the next 30 days. We'll shape your goals into a focused plan.",
      meta: "Monthly Zen",
    },
    {
      id: "user-1",
      role: "user",
      content: "I want a balanced month with fitness, product work, and learning.",
    },
    {
      id: "assistant-2",
      role: "assistant",
      content: "Got it. Share any fixed commitments and how intense you want the plan to feel.",
    },
    {
      id: "user-2",
      role: "user",
      content: "I can do 4 workouts a week and block 2 hours a day for product work.",
    },
    {
      id: "assistant-3",
      role: "assistant",
      content:
        "Perfect. I'll draft a balanced blueprint with fitness, deep work, and learning sprints.",
      meta: "Drafting",
    },
    {
      id: "assistant-4",
      role: "assistant",
      kind: "plan",
      content: "Drafted plan",
      meta: "Plan ready",
    },
    {
      id: "assistant-5",
      role: "assistant",
      content: "Want me to save this as your active month or fine-tune the intensity first?",
    },
  ]);

  useEffect(() => {
    return () => {
      if (replyTimeout.current) clearTimeout(replyTimeout.current);
    };
  }, []);

  const sendMessage = (content: string) => {
    if (!content.trim()) return;
    Haptics.selectionAsync();
    const newMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsTyping(true);

    replyTimeout.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            "Nice. I can layer that into a balanced weekly flow. Do you want weekends for recovery, light maintenance, or a focused push?",
          meta: "Draft suggestion",
        },
      ]);
      setIsTyping(false);
    }, 900);
  };

  const handlePrompt = (prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(prompt);
  };

  const handleSuggestion = (suggestion: Suggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (suggestion.id === "s1") {
      setPlanSaved(true);
      setShowSavedDrawer(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          role: "system",
          content: "Plan saved locally. You can revisit it in My Plans anytime.",
          meta: "Saved",
        },
        {
          id: `assistant-${Date.now() + 1}`,
          role: "assistant",
          content: "Saved. Want me to generate a weekly checklist too?",
        },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: suggestion.label,
      },
      {
        id: `assistant-${Date.now() + 1}`,
        role: "assistant",
        content: `Got it. I'll ${suggestion.description.toLowerCase()} and update the draft.`,
        meta: "Updating",
      },
    ]);
  };

  const backgroundGlow = useMemo(
    () => (
      <View className="absolute -top-24 right-8 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
    ),
    [],
  );

  return (
    <Container className="bg-background" withScroll={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1">
          {backgroundGlow}
          <View className="px-6 pt-10 pb-3 flex-row items-center gap-x-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-surface border border-border/50 items-center justify-center"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color="var(--foreground)" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-[10px] font-sans-bold uppercase tracking-[3px] text-muted-foreground">
                Planner
              </Text>
              <Text className="text-xl font-sans-bold text-foreground">Chat Blueprint</Text>
            </View>
            <View className="w-10 h-10 rounded-2xl bg-accent/15 items-center justify-center">
              <HugeiconsIcon icon={AiChat01Icon} size={20} color="var(--accent)" />
            </View>
          </View>

          <View className="px-6">
            <Animated.View
              entering={FadeInDown.duration(500)}
              className="bg-surface/60 border border-border/40 rounded-[24px] p-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-3">
                  <View className="w-9 h-9 rounded-2xl bg-accent/20 items-center justify-center">
                    <HugeiconsIcon icon={SparklesIcon} size={16} color="var(--accent)" />
                  </View>
                  <View>
                    <Text className="text-sm font-sans-bold text-foreground">Monthly Engine</Text>
                    <Text className="text-[11px] font-sans text-muted-foreground">
                      System crafting mode
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-x-1">
                  <HugeiconsIcon icon={Clock01Icon} size={12} color="var(--muted-foreground)" />
                  <Text className="text-[9px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                    Live
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-x-2 mt-3">
                {QUICK_STATS.map((stat) => (
                  <View
                    key={stat.label}
                    className="flex-1 rounded-2xl bg-background/60 border border-border/30 px-3 py-2"
                  >
                    <Text className="text-[8px] font-sans-bold uppercase tracking-[2px] text-muted-foreground">
                      {stat.label}
                    </Text>
                    <Text className="text-xs font-sans-semibold text-foreground mt-1">
                      {stat.value}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            <ScrollView
              ref={scrollRef}
              className="mt-5"
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              <View className="gap-y-5">
                {messages.map((message, index) => (
                  <Animated.View
                    key={message.id}
                    entering={FadeInUp.delay(80 * index).duration(420)}
                    className={message.role === "user" ? "items-end" : "items-start"}
                  >
                    {message.role === "system" ? (
                      <View className="w-full rounded-3xl border border-border/40 bg-surface/40 px-4 py-3">
                        <Text className="text-[10px] font-sans-bold uppercase tracking-[3px] text-muted-foreground">
                          {message.meta}
                        </Text>
                        <Text className="text-sm font-sans text-foreground mt-2">
                          {message.content}
                        </Text>
                      </View>
                    ) : message.kind === "plan" ? (
                      <View className="w-full rounded-[28px] border border-border/40 bg-surface/70 p-4">
                        <View className="flex-row items-center justify-between mb-3">
                          <View>
                            <Text className="text-[9px] font-sans-bold uppercase tracking-[3px] text-muted-foreground">
                              {PLAN_DATA.duration}
                            </Text>
                            <Text className="text-lg font-sans-bold text-foreground">
                              {PLAN_DATA.title}
                            </Text>
                          </View>
                          <View className="w-10 h-10 rounded-2xl bg-accent/15 items-center justify-center">
                            <HugeiconsIcon icon={SparklesIcon} size={18} color="var(--accent)" />
                          </View>
                        </View>
                        <Text className="text-sm font-sans text-muted-foreground leading-6">
                          {PLAN_DATA.summary}
                        </Text>
                        <View className="mt-4 gap-y-3">
                          {PLAN_DATA.sections.map((section: PlanSection) => (
                            <View
                              key={section.title}
                              className="rounded-2xl border border-border/30 bg-background/40 p-3"
                            >
                              <Text className="text-[10px] font-sans-bold uppercase tracking-[2px] text-muted-foreground mb-2">
                                {section.title}
                              </Text>
                              {section.items.slice(0, 2).map((item: string) => (
                                <View
                                  key={item}
                                  className="flex-row items-start gap-x-2 mb-2 last:mb-0"
                                >
                                  <View className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                                  <Text className="text-sm font-sans text-foreground leading-6 flex-1">
                                    {item}
                                  </Text>
                                </View>
                              ))}
                              {section.items.length > 2 && (
                                <Text className="text-[11px] font-sans-medium text-muted-foreground mt-1">
                                  +{section.items.length - 2} more
                                </Text>
                              )}
                            </View>
                          ))}
                        </View>
                        <View className="flex-row gap-x-2 mt-4">
                          <TouchableOpacity
                            onPress={() => handleSuggestion(SUGGESTIONS[0])}
                            className={`flex-1 rounded-2xl px-4 py-3 items-center justify-center border ${
                              planSaved
                                ? "bg-success/20 border-success/40"
                                : "bg-foreground border-foreground"
                            }`}
                          >
                            <Text
                              className={`text-[11px] font-sans-bold uppercase tracking-[2px] ${
                                planSaved ? "text-success" : "text-background"
                              }`}
                            >
                              {planSaved ? "Saved" : "Save Plan"}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setShowSavedDrawer(true)}
                            className="flex-1 rounded-2xl px-4 py-3 items-center justify-center border border-border/40 bg-background/40"
                          >
                            <Text className="text-[11px] font-sans-bold uppercase tracking-[2px] text-foreground">
                              Preview
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View
                        className={`max-w-[82%] rounded-[26px] px-4 py-3 border ${
                          message.role === "user"
                            ? "bg-foreground border-foreground"
                            : "bg-surface border-border/40"
                        }`}
                      >
                        {message.meta && message.role !== "user" && (
                          <Text className="text-[9px] font-sans-bold uppercase tracking-[2px] text-muted-foreground">
                            {message.meta}
                          </Text>
                        )}
                        <Text
                          className={`text-sm font-sans leading-6 ${
                            message.role === "user" ? "text-background" : "text-foreground"
                          }`}
                        >
                          {message.content}
                        </Text>
                      </View>
                    )}
                  </Animated.View>
                ))}

                {isTyping && (
                  <Animated.View entering={FadeInUp.duration(300)} className="items-start">
                    <View className="flex-row items-center gap-x-2 rounded-[22px] bg-surface border border-border/40 px-4 py-2">
                      <View className="w-2 h-2 rounded-full bg-accent/80" />
                      <View className="w-2 h-2 rounded-full bg-accent/50" />
                      <View className="w-2 h-2 rounded-full bg-accent/30" />
                      <Text className="text-xs font-sans text-muted-foreground ml-1">
                        Monthly Zen is drafting...
                      </Text>
                    </View>
                  </Animated.View>
                )}

                {!isTyping && (
                  <Animated.View
                    entering={FadeInUp.delay(180).duration(360)}
                    className="items-start"
                  >
                    <View className="w-full rounded-[24px] border border-accent/30 bg-accent/10 px-4 py-3">
                      <Text className="text-[10px] font-sans-bold uppercase tracking-[2px] text-accent mb-2">
                        Follow-ups
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {FOLLOW_UPS.map((item: string) => (
                          <TouchableOpacity
                            key={item}
                            onPress={() => handlePrompt(item)}
                            className="px-3 py-2 rounded-2xl bg-accent/15 border border-accent/30"
                          >
                            <Text className="text-[10px] font-sans-medium text-foreground">
                              {item}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </Animated.View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>

        <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} className="px-6 pt-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <View className="flex-row gap-x-2">
              {PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  onPress={() => handlePrompt(prompt)}
                  className="px-4 py-2 rounded-2xl bg-surface border border-border/40"
                >
                  <Text className="text-[11px] font-sans-semibold text-foreground">{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View className="mt-2 rounded-[26px] bg-surface/90 border border-border/50 p-3 shadow-xl shadow-black/10">
            <View className="flex-row items-end gap-x-3">
              <TouchableOpacity
                className="w-10 h-10 rounded-2xl bg-background/80 border border-border/50 items-center justify-center"
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <HugeiconsIcon icon={PlusSignIcon} size={18} color="var(--foreground)" />
              </TouchableOpacity>
              <View className="flex-1">
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Describe your month, goals, or constraints..."
                  placeholderTextColor="var(--muted-foreground)"
                  className="min-h-[44px] max-h-28 text-sm font-sans text-foreground leading-6"
                  multiline
                  textAlignVertical="top"
                />
              </View>
              <TouchableOpacity
                onPress={() => sendMessage(input)}
                className="w-10 h-10 rounded-2xl bg-foreground items-center justify-center"
              >
                <HugeiconsIcon icon={ArrowUp01Icon} size={18} color={colors.background} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {showSavedDrawer && (
          <View className="absolute inset-0 justify-end">
            <TouchableOpacity
              onPress={() => setShowSavedDrawer(false)}
              className="absolute inset-0 bg-background/70"
              activeOpacity={1}
            />
            <Animated.View
              entering={FadeInUp.duration(240)}
              className="bg-surface border border-border/40 rounded-t-[32px] px-6 pt-6 pb-8"
            >
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-[10px] font-sans-bold uppercase tracking-[3px] text-muted-foreground">
                    Saved Plans
                  </Text>
                  <Text className="text-xl font-sans-bold text-foreground">
                    Your Blueprint Vault
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowSavedDrawer(false)}
                  className="w-10 h-10 rounded-2xl bg-surface border border-border/50 items-center justify-center"
                >
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color="var(--foreground)" />
                </TouchableOpacity>
              </View>

              <View className="gap-y-3">
                {SAVED_PLANS.map((plan) => (
                  <View
                    key={plan.id}
                    className="flex-row items-center justify-between rounded-3xl border border-border/40 bg-background/40 px-4 py-3"
                  >
                    <View className="flex-row items-center gap-x-3">
                      <View className="w-10 h-10 rounded-2xl bg-accent/15 items-center justify-center">
                        <HugeiconsIcon icon={Calendar01Icon} size={18} color="var(--accent)" />
                      </View>
                      <View>
                        <Text className="text-sm font-sans-bold text-foreground">{plan.title}</Text>
                        <Text className="text-[11px] font-sans text-muted-foreground">
                          {plan.subtitle}
                        </Text>
                      </View>
                    </View>
                    <View className="w-9 h-9 rounded-2xl bg-surface items-center justify-center border border-border/50">
                      <HugeiconsIcon icon={Files01Icon} size={16} color="var(--muted-foreground)" />
                    </View>
                  </View>
                ))}
              </View>

              <View className="flex-row gap-x-2 mt-5">
                <TouchableOpacity
                  onPress={() => {
                    setShowSavedDrawer(false);
                    handleSuggestion(SUGGESTIONS[1]);
                  }}
                  className="flex-1 rounded-2xl px-4 py-3 items-center justify-center border border-border/40 bg-background/40"
                >
                  <Text className="text-[11px] font-sans-bold uppercase tracking-[2px] text-foreground">
                    Open Plan
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowSavedDrawer(false)}
                  className="flex-1 rounded-2xl px-4 py-3 items-center justify-center border border-foreground bg-foreground"
                >
                  <Text className="text-[11px] font-sans-bold uppercase tracking-[2px] text-background">
                    Keep Chatting
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Container>
  );
}
