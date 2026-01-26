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
  SparklesIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import type { StructuredAIResponse, WeeklyBreakdown, TaskDescription } from "@monthly-zen/types";
import EventSource from "react-native-sse";

import { Container } from "@/components/ui/container";
import { useSemanticColors } from "@/utils/theme";
import type { ChatMessage } from "@/storage/chatStore";
import {
  addMessage,
  getMessages,
  newId,
  setLastConversationId,
  updateConversation,
  updateMessage,
} from "@/storage/chatStore";
import { throttle } from "@/storage/throttle";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

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

type Message = {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  meta?: string;
};

type OpenRouterChunk = {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
  error?: { message?: string };
};

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const extractJsonPayload = (rawText: string): string | null => {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const startIndex = rawText.indexOf("{");
  const endIndex = rawText.lastIndexOf("}");
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  return rawText.slice(startIndex, endIndex + 1).trim();
};

const parseStructuredResponse = (rawText: string): StructuredAIResponse | null => {
  const payload = extractJsonPayload(rawText);
  if (!payload) return null;

  try {
    return JSON.parse(payload) as StructuredAIResponse;
  } catch (error) {
    console.error("[AI Stream] Failed to parse JSON payload", error);
    return null;
  }
};

const formatTaskLine = (task: TaskDescription) => {
  const details = [
    task.focus_area ? `Focus: ${task.focus_area}` : null,
    task.difficulty_level ? `Difficulty: ${task.difficulty_level}` : null,
    task.start_time && task.end_time ? `Time: ${task.start_time} → ${task.end_time}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return details ? `- ${task.task_description} (${details})` : `- ${task.task_description}`;
};

const formatWeekSection = (week: WeeklyBreakdown, fallbackWeekNumber: number) => {
  const lines: string[] = [];
  const weekNumber = typeof week.week === "number" ? week.week : fallbackWeekNumber;
  const focusLabel = week.focus ? ` — ${week.focus}` : "";

  lines.push(`Week ${weekNumber}${focusLabel}`);

  if (Array.isArray(week.goals) && week.goals.length > 0) {
    lines.push("Goals:");
    week.goals
      .filter((goal) => typeof goal === "string" && goal.trim().length > 0)
      .forEach((goal) => {
        lines.push(`• ${goal}`);
      });
  }

  if (week.daily_tasks && typeof week.daily_tasks === "object") {
    DAY_ORDER.forEach((day) => {
      const tasks = week.daily_tasks?.[day];
      if (!Array.isArray(tasks) || tasks.length === 0) return;

      lines.push(`${day}:`);
      tasks
        .filter((task): task is TaskDescription => Boolean(task?.task_description))
        .forEach((task) => {
          lines.push(formatTaskLine(task));
          if (task.scheduling_reason) {
            lines.push(`  ↳ ${task.scheduling_reason}`);
          }
        });
    });
  }

  return lines;
};

const formatStructuredResponse = (response: StructuredAIResponse | null): string | null => {
  if (!response) return null;

  const lines: string[] = [];

  if (response.monthly_summary) {
    lines.push("Monthly Summary");
    lines.push(response.monthly_summary.trim());
  }

  if (Array.isArray(response.weekly_breakdown) && response.weekly_breakdown.length > 0) {
    response.weekly_breakdown.forEach((week, index) => {
      if (lines.length > 0) lines.push("");
      lines.push(...formatWeekSection(week, index + 1));
    });
  }

  return lines.length > 0 ? lines.join("\n") : null;
};

const formatReadablePlan = (input: unknown): string | null => {
  if (typeof input === "string") {
    return formatStructuredResponse(parseStructuredResponse(input));
  }

  if (input && typeof input === "object") {
    return formatStructuredResponse(input as StructuredAIResponse);
  }

  return null;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";
const SYSTEM_PROMPT =
  "You are Monthly Zen, a planning assistant. Create clear month plans, focus maps, and next steps.";

type PlannerAiStreamTestProps = {
  planId?: number;
  conversationId?: string;
};

export default function PlannerAiStreamTest({ planId, conversationId }: PlannerAiStreamTestProps) {
  const router = useRouter();
  const colors = useSemanticColors();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState("");
  const [composerHeight, setComposerHeight] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const defaultMessages = useMemo<Message[]>(
    () => [
      {
        id: "system-1",
        role: "system",
        content: "Public streaming mode. Sends requests directly to OpenRouter.",
        meta: "Public Test",
      },
      {
        id: "assistant-1",
        role: "assistant",
        content: "Describe your month goals and I will stream the response.",
        meta: "Monthly Zen",
      },
    ],
    [],
  );

  const [messages, setMessages] = useState<Message[]>(defaultMessages);

  const streamingAbort = useRef<EventSource | null>(null);
  const streamingMessageId = useRef<string | null>(null);
  const streamingRawText = useRef("");
  const hasSeededPlan = useRef(false);

  const persistAssistantContentThrottled = useMemo(
    () =>
      throttle((targetConversationId: string, messageId: string, content: string) => {
        updateMessage(targetConversationId, messageId, { content });
        updateConversation(targetConversationId, {
          updatedAt: Date.now(),
          lastMessagePreview: content.slice(0, 120),
        });
      }, 500),
    [],
  );

  const storedToLocalMessage = useMemo(
    () =>
      (stored: ChatMessage): Message => ({
        id: stored.id,
        role: stored.role,
        content: stored.content,
        meta: typeof stored.meta?.label === "string" ? stored.meta.label : undefined,
      }),
    [],
  );

  const planQuery = useQuery({
    ...orpc.plan.getById.queryOptions({ planId: planId ?? 0, input: { planId: planId ?? 0 } }),
    enabled: Boolean(planId),
  });

  useEffect(() => {
    if (!conversationId) return;
    setLastConversationId(conversationId);

    const storedMessages = getMessages(conversationId);
    if (storedMessages.length > 0) {
      setMessages(storedMessages.map(storedToLocalMessage));
      return;
    }

    const now = Date.now();
    const seeded = defaultMessages.map((message, idx) => {
      const id = newId(message.role);
      const stored: ChatMessage = {
        id,
        conversationId,
        role: message.role,
        content: message.content,
        createdAt: now + idx,
        status: "final",
        meta: message.meta ? { label: message.meta } : undefined,
      };
      addMessage(stored);
      return stored;
    });

    setMessages(seeded.map(storedToLocalMessage));
  }, [conversationId, defaultMessages, storedToLocalMessage]);

  useEffect(() => {
    return () => {
      streamingAbort.current?.removeAllEventListeners();
      streamingAbort.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!planId || hasSeededPlan.current) return;

    if (planQuery.data?.success && planQuery.data.data) {
      const plan = planQuery.data.data as {
        id: number;
        rawAiResponse?: string | null;
        aiResponseRaw?: unknown;
        monthlySummary?: string | null;
      };
      const responseText =
        plan.rawAiResponse?.trim() ||
        (plan.aiResponseRaw ? JSON.stringify(plan.aiResponseRaw, null, 2) : "");
      const formattedResponse =
        formatReadablePlan(plan.rawAiResponse ?? plan.aiResponseRaw) ?? responseText;
      const intro = plan.monthlySummary?.trim()
        ? `Plan summary: ${plan.monthlySummary}`
        : "Your onboarding plan is ready. Ask for edits or refinements.";

      hasSeededPlan.current = true;
      setMessages([
        {
          id: "system-plan",
          role: "system",
          content: intro,
          meta: "Plan Ready",
        },
        {
          id: `assistant-plan-${plan.id}`,
          role: "assistant",
          content: formattedResponse || "Plan generated. Ask me to refine it.",
          meta: "Monthly Plan",
        },
      ]);
    }
  }, [planId, planQuery.data?.success, planQuery.data?.data]);

  const backgroundGlow = useMemo(
    () => (
      <View className="absolute -top-24 right-8 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
    ),
    [],
  );

  const buildChatMessages = (history: Message[]) => {
    const cleanedHistory = history
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }))
      .filter((message) => message.content.length > 0);

    return [{ role: "system", content: SYSTEM_PROMPT }, ...cleanedHistory];
  };

  const updateStreamingMessage = (updater: string | ((prev: string) => string)) => {
    if (!streamingMessageId.current) return;
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== streamingMessageId.current) return message;
        const nextContent =
          typeof updater === "function" ? updater(message.content ?? "") : updater;
        return { ...message, content: nextContent };
      }),
    );
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    Haptics.selectionAsync();
    const now = Date.now();
    const userMessageId = conversationId ? newId("user") : `user-${now}`;
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: content.trim(),
    };

    if (conversationId) {
      addMessage({
        id: userMessageId,
        conversationId,
        role: "user",
        content: userMessage.content,
        createdAt: now,
        status: "final",
      });
      updateConversation(conversationId, {
        updatedAt: now,
        lastMessagePreview: userMessage.content.slice(0, 120),
      });
    }

    const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Missing EXPO_PUBLIC_OPENROUTER_API_KEY in apps/native/.env.",
          meta: "Config",
        },
      ]);
      setInput("");
      return;
    }

    const assistantId = conversationId ? newId("assistant") : `assistant-${now}`;
    streamingMessageId.current = assistantId;

    if (conversationId) {
      addMessage({
        id: assistantId,
        conversationId,
        role: "assistant",
        content: "",
        createdAt: now + 1,
        status: "streaming",
        meta: { label: "Streaming" },
      });
      updateConversation(conversationId, { updatedAt: Date.now() });
    }

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        meta: "Streaming",
      },
    ]);
    setInput("");
    setIsStreaming(true);
    streamingRawText.current = "";

    const model = process.env.EXPO_PUBLIC_OPENROUTER_MODEL ?? DEFAULT_MODEL;
    const payload = JSON.stringify({
      model,
      stream: true,
      messages: buildChatMessages([...messages, userMessage]),
    });

    const eventSource = new EventSource(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Title": "Monthly Zen (Native)",
      },
      body: payload,
      pollingInterval: 0,
    });

    const closeStream = () => {
      eventSource.removeAllEventListeners();
      eventSource.close();
      streamingAbort.current = null;
      streamingMessageId.current = null;
      setIsStreaming(false);
    };

    const finalizeStream = () => {
      const formattedContent =
        formatReadablePlan(streamingRawText.current) ?? streamingRawText.current;
      updateStreamingMessage(formattedContent);

      if (conversationId && streamingMessageId.current) {
        updateMessage(conversationId, streamingMessageId.current, {
          status: "final",
          content: formattedContent,
        });
        updateConversation(conversationId, {
          updatedAt: Date.now(),
          lastMessagePreview: formattedContent.slice(0, 120),
        });
      }
    };

    const handleMessage = (data: string | null) => {
      if (!data) return;
      const trimmed = data.trim();
      if (!trimmed) return;

      if (trimmed === "[DONE]") {
        finalizeStream();
        closeStream();
        return;
      }

      try {
        const parsed = JSON.parse(trimmed) as OpenRouterChunk;
        if (parsed.error?.message) {
          if (conversationId && streamingMessageId.current) {
            updateMessage(conversationId, streamingMessageId.current, {
              status: "error",
              content: `Error: ${parsed.error.message}`,
            });
            updateConversation(conversationId, { updatedAt: Date.now() });
          }
          updateStreamingMessage(`Error: ${parsed.error.message}`);
          closeStream();
          return;
        }

        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          streamingRawText.current += delta;
          updateStreamingMessage((prev) => {
            const next = prev + delta;
            if (conversationId && streamingMessageId.current) {
              persistAssistantContentThrottled(conversationId, streamingMessageId.current, next);
            }
            return next;
          });
        }

        const finishReason = parsed.choices?.[0]?.finish_reason;
        if (finishReason) {
          finalizeStream();
          closeStream();
        }
      } catch (error) {
        console.error("Failed to parse SSE event", error);
      }
    };

    eventSource.addEventListener("message", (event) => {
      handleMessage(event.data ?? null);
    });

    eventSource.addEventListener("error", (event) => {
      const message =
        event.type === "error" || event.type === "exception" ? event.message : "Streaming failed";
      updateStreamingMessage(`Error: ${message}`);
      closeStream();
    });

    streamingAbort.current = eventSource;
  };

  const handlePrompt = (prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(prompt);
  };

  const stopStreaming = () => {
    streamingAbort.current?.removeAllEventListeners();
    streamingAbort.current?.close();
    streamingAbort.current = null;
    streamingMessageId.current = null;
    setIsStreaming(false);
  };

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
              <Text className="text-xl font-sans-bold text-foreground">AI Stream (Public)</Text>
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
                    <Text className="text-sm font-sans-bold text-foreground">
                      Streaming Monitor
                    </Text>
                    <Text className="text-[11px] font-sans text-muted-foreground">
                      openrouter.ai /chat/completions
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-x-1">
                  <View
                    className={`w-2 h-2 rounded-full ${
                      isStreaming ? "bg-accent" : "bg-muted-foreground/40"
                    }`}
                  />
                  <Text className="text-[9px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                    {isStreaming ? "Live" : "Idle"}
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
              contentContainerStyle={{ paddingBottom: composerHeight + 24 }}
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
                          {message.content || (isStreaming ? "..." : "")}
                        </Text>
                      </View>
                    )}
                  </Animated.View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        <View
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          className="pt-3"
          onLayout={(event) => setComposerHeight(event.nativeEvent.layout.height)}
        >
          <View className="px-6">
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
          </View>

          <View className="mt-2 rounded-[26px] bg-surface/90 border border-border/50 px-4 py-3 shadow-xl shadow-black/10">
            <View className="flex-row items-end gap-x-3">
              <TouchableOpacity
                className="w-10 h-10 rounded-2xl bg-background/80 border border-border/50 items-center justify-center"
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <HugeiconsIcon icon={PlusSignIcon} size={18} color={colors.foreground} />
              </TouchableOpacity>
              <View className="flex-1">
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Describe your month goals to stream..."
                  placeholderTextColor="var(--muted-foreground)"
                  className="min-h-[44px] max-h-28 text-sm font-sans text-foreground leading-6"
                  multiline
                  textAlignVertical="top"
                />
              </View>
              {isStreaming ? (
                <TouchableOpacity
                  onPress={stopStreaming}
                  className="w-10 h-10 rounded-2xl bg-danger items-center justify-center"
                >
                  <Text className="text-[11px] font-sans-bold text-background">Stop</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => sendMessage(input)}
                  className="w-10 h-10 rounded-2xl bg-foreground items-center justify-center"
                >
                  <HugeiconsIcon icon={ArrowUp01Icon} size={18} color={colors.background} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
