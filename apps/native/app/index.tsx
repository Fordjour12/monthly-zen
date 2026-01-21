import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  AndroidSoftInputModes,
  KeyboardAvoidingView,
  KeyboardController,
} from "react-native-keyboard-controller";
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
import { Container } from "@/components/ui/container";
import { useSemanticColors } from "@/utils/theme";
import EventSource from "react-native-sse";

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

// ✅ This matches YOUR relay events:
// { type: "delta", text: "..." }
// { type: "usage", usage: {...} }
// { type: "done", finishReason?: "stop" | ... }
// { type: "error", message: "..." }
// { type: "ping" }
type RelayChunk =
  | { type: "delta"; text: string }
  | { type: "usage"; usage: any }
  | { type: "done"; finishReason?: string }
  | { type: "error"; message: string }
  | { type: "ping" };

const RELAY_URL = process.env.EXPO_PUBLIC_RELAY_URL ?? ""; // e.g. http://10.0.2.2:3000/api/openrouter
const DEFAULT_MODEL = "google/gemini-2.5-flash";
const SYSTEM_PROMPT =
  "You are Monthly Zen, a planning assistant. Create clear month plans, focus maps, and next steps.";

export default function PlannerAiRelayOnly() {
  const router = useRouter();
  const colors = useSemanticColors();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [input, setInput] = useState("");
  const [composerHeight, setComposerHeight] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-1",
      role: "system",
      content: "Streaming mode. All requests go to your relay server.",
      meta: "Relay Only",
    },
    {
      id: "assistant-1",
      role: "assistant",
      content: "Describe your month goals and I will stream the response.",
      meta: "Monthly Zen",
    },
  ]);

  const streamingAbort = useRef<EventSource | null>(null);
  const streamingMessageId = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      streamingAbort.current?.removeAllEventListeners();
      streamingAbort.current?.close();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    KeyboardController.setInputMode(AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE);
    return () => {
      KeyboardController.setDefaultMode();
    };
  }, []);

  const backgroundGlow = useMemo(
    () => (
      <View className="absolute -top-24 right-8 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
    ),
    [],
  );

  const updateStreamingMessage = (updater: string | ((prev: string) => string)) => {
    if (!streamingMessageId.current) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== streamingMessageId.current) return m;
        const next = typeof updater === "function" ? updater(m.content ?? "") : updater;
        return { ...m, content: next };
      }),
    );
  };

  const closeStream = (es: EventSource) => {
    es.removeAllEventListeners();
    es.close();
    streamingAbort.current = null;
    streamingMessageId.current = null;
    setIsStreaming(false);
  };

  /**
   * ✅ Robust relay SSE parsing:
   * - normalizes CRLF
   * - handles multiple JSON blobs in one event.data (common in dev/polyfills)
   * - supports your relay event types: delta/usage/done/error/ping
   */
  const handleRelaySSE = (raw: string | null, es: EventSource) => {
    if (!raw) return;

    const normalized = raw.replace(/\r\n/g, "\n").trim();
    if (!normalized) return;

    // Some libs/dev servers batch multiple JSON objects into one "message" callback
    const parts = normalized
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const part of parts) {
      let parsed: any;
      try {
        parsed = JSON.parse(part);
      } catch {
        // Rare: "data: {...}" gets passed through
        if (part.startsWith("data:")) {
          const maybe = part.slice(5).trim();
          try {
            parsed = JSON.parse(maybe);
          } catch {
            continue;
          }
        } else {
          continue;
        }
      }

      const chunk = parsed as RelayChunk;

      if (chunk.type === "ping") continue;

      if (chunk.type === "delta") {
        updateStreamingMessage((prev) => prev + chunk.text);
        continue;
      }

      if (chunk.type === "usage") {
        // optional: you can show usage somewhere
        continue;
      }

      if (chunk.type === "error") {
        updateStreamingMessage(`Error: ${chunk.message}`);
        closeStream(es);
        continue;
      }

      if (chunk.type === "done") {
        // optional:
        // if (chunk.finishReason) updateStreamingMessage((p) => `${p}\n\n[${chunk.finishReason}]`);
        closeStream(es);
        continue;
      }
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    if (!RELAY_URL) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Missing EXPO_PUBLIC_RELAY_URL in your .env (relay server endpoint).",
          meta: "Config",
        },
      ]);
      return;
    }

    Haptics.selectionAsync();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
    };

    const assistantId = `assistant-${Date.now()}`;
    streamingMessageId.current = assistantId;

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "", meta: "Streaming" },
    ]);
    setInput("");
    setIsStreaming(true);

    const model = process.env.EXPO_PUBLIC_RELAY_MODEL ?? DEFAULT_MODEL;

    // ✅ Relay payload only (no OpenRouter key/client concerns)
    const payload = JSON.stringify({
      question: userMessage.content,
      model,
      systemPrompt: SYSTEM_PROMPT,
    });

    const es = new EventSource(RELAY_URL, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: payload,
      pollingInterval: 0,
    });

    streamingAbort.current = es;

    es.addEventListener("message", (event) => {
      handleRelaySSE(event.data ?? null, es);
    });

    es.addEventListener("error", (event) => {
      const msg =
        event.type === "error" || event.type === "exception"
          ? ((event as any).message ?? "Streaming failed")
          : "Streaming failed";
      updateStreamingMessage(`Error: ${msg}`);
      closeStream(es);
    });
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
      <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
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
              <Text className="text-xl font-sans-bold text-foreground">AI Stream (Relay Only)</Text>
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
                      Relay endpoint
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-x-1">
                  <View
                    className={`w-2 h-2 rounded-full ${isStreaming ? "bg-accent" : "bg-muted-foreground/40"}`}
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
                  className="min-h-11 max-h-28 text-sm font-sans text-foreground leading-6"
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
