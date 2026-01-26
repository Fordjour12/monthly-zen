import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import EventSource from "react-native-sse";

import { Container } from "@/components/ui/container";
import { useSemanticColors } from "@/utils/theme";
import type { ChatMessage } from "@/storage/chatStore";
import {
  addMessage,
  getConversationMonitorSettings,
  getDefaultMonitorSettings,
  getMessages,
  newId,
  setConversationMonitorSettings,
  setDefaultMonitorSettings,
  setLastConversationId,
  updateConversation,
  updateMessage,
} from "@/storage/chatStore";
import { throttle } from "@/storage/throttle";
import { orpc } from "@/utils/orpc";

const PROMPTS = [
  "Build a 30-day plan",
  "Map my focus areas",
  "Plan around commitments",
  "Review my last month",
];

const TONE_OPTIONS = ["Calm", "Direct", "Analytical"] as const;
const DEPTH_OPTIONS = ["Brief", "Balanced", "Deep"] as const;
const FORMAT_OPTIONS = ["Bullets", "Narrative", "Checklist"] as const;

const DEFAULT_MONITOR_SETTINGS = {
  tone: "Calm",
  depth: "Balanced",
  format: "Bullets",
} as const;

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
  const settingsSheetRef = useRef<BottomSheetModal>(null);
  const [input, setInput] = useState("");
  const [composerHeight, setComposerHeight] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [tone, setTone] = useState<(typeof TONE_OPTIONS)[number]>(DEFAULT_MONITOR_SETTINGS.tone);
  const [depth, setDepth] = useState<(typeof DEPTH_OPTIONS)[number]>(DEFAULT_MONITOR_SETTINGS.depth);
  const [format, setFormat] = useState<(typeof FORMAT_OPTIONS)[number]>(
    DEFAULT_MONITOR_SETTINGS.format,
  );
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
    const fallbackDefaults = getDefaultMonitorSettings() ?? DEFAULT_MONITOR_SETTINGS;
    if (!conversationId) {
      setTone(fallbackDefaults.tone);
      setDepth(fallbackDefaults.depth);
      setFormat(fallbackDefaults.format);
      return;
    }

    const saved = getConversationMonitorSettings(conversationId);
    const nextSettings = saved ?? fallbackDefaults;
    setTone(nextSettings.tone);
    setDepth(nextSettings.depth);
    setFormat(nextSettings.format);
    if (!saved) {
      setConversationMonitorSettings(conversationId, nextSettings);
    }
  }, [conversationId]);

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
          content: responseText || "Plan generated. Ask me to refine it.",
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

  const settingsSnapPoints = useMemo(() => ["52%"], []);
  const renderSettingsBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  const monitorStats = useMemo(
    () => [
      { label: "Tone", value: tone },
      { label: "Depth", value: depth },
      { label: "Format", value: format },
    ],
    [depth, format, tone],
  );

  const systemPrompt = useMemo(
    () => `${SYSTEM_PROMPT}\nResponse tone: ${tone}. Depth: ${depth}. Format: ${format}.`,
    [depth, format, tone],
  );

  const buildChatMessages = (history: Message[]) => {
    const cleanedHistory = history
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }))
      .filter((message) => message.content.length > 0);

    return [{ role: "system", content: systemPrompt }, ...cleanedHistory];
  };

  const updateMonitorSettings = (next: {
    tone: (typeof TONE_OPTIONS)[number];
    depth: (typeof DEPTH_OPTIONS)[number];
    format: (typeof FORMAT_OPTIONS)[number];
  }) => {
    setTone(next.tone);
    setDepth(next.depth);
    setFormat(next.format);
    if (conversationId) {
      setConversationMonitorSettings(conversationId, next);
    }
  };

  const handleToneChange = (value: (typeof TONE_OPTIONS)[number]) => {
    Haptics.selectionAsync();
    updateMonitorSettings({ tone: value, depth, format });
  };

  const handleDepthChange = (value: (typeof DEPTH_OPTIONS)[number]) => {
    Haptics.selectionAsync();
    updateMonitorSettings({ tone, depth: value, format });
  };

  const handleFormatChange = (value: (typeof FORMAT_OPTIONS)[number]) => {
    Haptics.selectionAsync();
    updateMonitorSettings({ tone, depth, format: value });
  };

  const saveDefaults = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDefaultMonitorSettings({ tone, depth, format });
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

    const handleMessage = (data: string | null) => {
      if (!data) return;
      const trimmed = data.trim();
      if (!trimmed) return;

      if (trimmed === "[DONE]") {
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
          updateStreamingMessage((prev) => {
            const next = `${prev}\n\n[${finishReason}]`;
            if (conversationId && streamingMessageId.current) {
              updateMessage(conversationId, streamingMessageId.current, { status: "final" });
              persistAssistantContentThrottled(conversationId, streamingMessageId.current, next);
            }
            return next;
          });
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

  const openSettings = () => {
    Haptics.selectionAsync();
    settingsSheetRef.current?.present();
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
              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-[10px] font-sans-bold uppercase tracking-[2px] text-muted-foreground">
                  Conversation tuning
                </Text>
                <TouchableOpacity
                  onPress={openSettings}
                  className="flex-row items-center gap-x-1 rounded-full border border-border/40 bg-background/70 px-3 py-1"
                >
                  <HugeiconsIcon icon={Settings02Icon} size={12} color="var(--foreground)" />
                  <Text className="text-[10px] font-sans-semibold text-foreground">Edit</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-x-2 mt-3">
                {monitorStats.map((stat) => (
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
      <BottomSheetModal
        ref={settingsSheetRef}
        snapPoints={settingsSnapPoints}
        enablePanDownToClose
        backdropComponent={renderSettingsBackdrop}
        handleIndicatorStyle={{ backgroundColor: "var(--border)", width: 40 }}
        backgroundStyle={{ backgroundColor: colors.background, borderRadius: 32 }}
      >
        <BottomSheetView className="flex-1 px-6 pb-10">
          <View className="py-4">
            <Text className="text-xl font-sans-bold text-foreground">Monitor Configuration</Text>
            <Text className="text-xs font-sans text-muted-foreground mt-1">
              Tune how the assistant responds for this conversation.
            </Text>
          </View>
          <View className="gap-y-5">
            <ConfigRow
              title="Response Tone"
              options={TONE_OPTIONS}
              value={tone}
              onChange={handleToneChange}
            />
            <ConfigRow
              title="Response Depth"
              options={DEPTH_OPTIONS}
              value={depth}
              onChange={handleDepthChange}
            />
            <ConfigRow
              title="Response Format"
              options={FORMAT_OPTIONS}
              value={format}
              onChange={handleFormatChange}
            />
          </View>
          <View className="mt-6 rounded-3xl border border-border/40 bg-surface/70 px-4 py-4">
            <Text className="text-[10px] font-sans-bold uppercase tracking-[2px] text-muted-foreground">
              Default preference
            </Text>
            <Text className="text-xs font-sans text-foreground mt-1">
              Save these settings as your default for new conversations.
            </Text>
            <TouchableOpacity
              onPress={saveDefaults}
              className="mt-3 rounded-2xl bg-foreground px-4 py-2 items-center"
            >
              <Text className="text-[11px] font-sans-bold text-background">Save as default</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </Container>
  );
}

type ConfigRowProps<T extends string> = {
  title: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

function ConfigRow<T extends string>({ title, options, value, onChange }: ConfigRowProps<T>) {
  return (
    <View className="gap-y-2">
      <Text className="text-[10px] font-sans-bold uppercase tracking-[2px] text-muted-foreground">
        {title}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
        <View className="flex-row gap-x-2">
          {options.map((option) => {
            const isActive = option === value;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => onChange(option)}
                className={`px-4 py-2 rounded-2xl border ${
                  isActive ? "bg-foreground border-foreground" : "bg-surface border-border/40"
                }`}
              >
                <Text
                  className={`text-[10px] font-sans-bold uppercase tracking-[2px] ${
                    isActive ? "text-background" : "text-muted-foreground"
                  }`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
