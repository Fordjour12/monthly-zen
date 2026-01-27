import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  AndroidSoftInputModes,
  KeyboardController,
  KeyboardStickyView,
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
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import EventSource from "react-native-sse";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { StructuredAIResponse, WeeklyBreakdown, TaskDescription } from "@monthly-zen/types";

import { Container } from "@/components/ui/container";
import { useSemanticColors } from "@/utils/theme";
import {
  getConversationMonitorSettings,
  getDefaultMonitorSettings,
  setConversationMonitorSettings,
  setDefaultMonitorSettings,
  updateConversation,
  updateMessage,
} from "@/storage/chatStore";
import { throttle } from "@/storage/throttle";
import { orpc } from "@/utils/orpc";
import { useToast } from "heroui-native";
import { authClient } from "@/lib/auth-client";
import { usePreferences } from "@/hooks/usePreferences";

const PROMPTS = [
  "Build a 30-day plan",
  "Map my focus areas",
  "Plan around commitments",
  "Review my last month",
];

const TASK_COMPLEXITY_OPTIONS = ["Simple", "Balanced", "Ambitious"] as const;
const WEEKEND_PREFERENCE_OPTIONS = ["Work", "Rest", "Mixed"] as const;
const RESPONSE_TONE_OPTIONS = ["encouraging", "direct", "analytical", "friendly"] as const;
const DEPTH_OPTIONS = ["Brief", "Balanced", "Deep"] as const;
const FORMAT_OPTIONS = ["Bullets", "Narrative", "Checklist"] as const;

type TaskComplexityOption = (typeof TASK_COMPLEXITY_OPTIONS)[number];
type WeekendPreferenceOption = (typeof WEEKEND_PREFERENCE_OPTIONS)[number];
type ResponseToneOption = (typeof RESPONSE_TONE_OPTIONS)[number];
type DepthOption = (typeof DEPTH_OPTIONS)[number];
type FormatOption = (typeof FORMAT_OPTIONS)[number];

const DEFAULT_MONITOR_SETTINGS = {
  focusArea: "",
  taskComplexity: "Balanced",
  weekendPreference: "Mixed",
  responseTone: "encouraging",
  depth: "Balanced",
  format: "Bullets",
} as const;

const isTaskComplexityOption = (value: string | null | undefined): value is TaskComplexityOption =>
  typeof value === "string" && TASK_COMPLEXITY_OPTIONS.includes(value as TaskComplexityOption);
const isWeekendPreferenceOption = (
  value: string | null | undefined,
): value is WeekendPreferenceOption =>
  typeof value === "string" &&
  WEEKEND_PREFERENCE_OPTIONS.includes(value as WeekendPreferenceOption);
const isResponseToneOption = (value: string | null | undefined): value is ResponseToneOption =>
  typeof value === "string" && RESPONSE_TONE_OPTIONS.includes(value as ResponseToneOption);
const isDepthOption = (value: string | null | undefined): value is DepthOption =>
  typeof value === "string" && DEPTH_OPTIONS.includes(value as DepthOption);
const isFormatOption = (value: string | null | undefined): value is FormatOption =>
  typeof value === "string" && FORMAT_OPTIONS.includes(value as FormatOption);

const resolveMonitorSettings = (
  settings?: {
    focusArea?: string | null;
    taskComplexity?: string | null;
    weekendPreference?: string | null;
    responseTone?: string | null;
    depth?: string | null;
    format?: string | null;
  } | null,
): {
  focusArea: string;
  taskComplexity: TaskComplexityOption;
  weekendPreference: WeekendPreferenceOption;
  responseTone: ResponseToneOption;
  depth: DepthOption;
  format: FormatOption;
} => ({
  focusArea: typeof settings?.focusArea === "string" ? settings.focusArea : "",
  taskComplexity: isTaskComplexityOption(settings?.taskComplexity)
    ? settings.taskComplexity
    : DEFAULT_MONITOR_SETTINGS.taskComplexity,
  weekendPreference: isWeekendPreferenceOption(settings?.weekendPreference)
    ? settings.weekendPreference
    : DEFAULT_MONITOR_SETTINGS.weekendPreference,
  responseTone: isResponseToneOption(settings?.responseTone)
    ? settings.responseTone
    : DEFAULT_MONITOR_SETTINGS.responseTone,
  depth: isDepthOption(settings?.depth) ? settings.depth : DEFAULT_MONITOR_SETTINGS.depth,
  format: isFormatOption(settings?.format) ? settings.format : DEFAULT_MONITOR_SETTINGS.format,
});

type Message = {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  meta?: string;
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
type ServerStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; finishReason?: string }
  | { type: "error"; message: string }
  | { type: "usage"; usage: unknown };

type PlannerAiStreamTestProps = {
  planId?: number;
  conversationId?: string;
};

type PlannerContext = {
  focusArea?: string;
  taskComplexity?: TaskComplexityOption;
  weekendPreference?: WeekendPreferenceOption;
  responseTone?: ResponseToneOption;
  depth?: DepthOption;
  format?: FormatOption;
  fixedCommitmentsJson?: {
    commitments: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      description: string;
    }>;
  };
  coachName?: string | null;
  coachTone?: ResponseToneOption | null;
};

export default function PlannerAiStreamTest({ planId, conversationId }: PlannerAiStreamTestProps) {
  const router = useRouter();
  const colors = useSemanticColors();
  const { toast } = useToast();
  const { data: preferencesResponse } = usePreferences();
  const preferences = preferencesResponse?.data;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const settingsSheetRef = useRef<BottomSheetModal>(null);
  const [input, setInput] = useState("");
  const [composerHeight, setComposerHeight] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [focusArea, setFocusArea] = useState<string>(DEFAULT_MONITOR_SETTINGS.focusArea);
  const [taskComplexity, setTaskComplexity] = useState<TaskComplexityOption>(
    DEFAULT_MONITOR_SETTINGS.taskComplexity,
  );
  const [weekendPreference, setWeekendPreference] = useState<WeekendPreferenceOption>(
    DEFAULT_MONITOR_SETTINGS.weekendPreference,
  );
  const [responseTone, setResponseTone] = useState<ResponseToneOption>(
    DEFAULT_MONITOR_SETTINGS.responseTone,
  );
  const [depth, setDepth] = useState<DepthOption>(DEFAULT_MONITOR_SETTINGS.depth);
  const [format, setFormat] = useState<FormatOption>(DEFAULT_MONITOR_SETTINGS.format);
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

  const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;

  const loadConversationMessages = async () => {
    if (!conversationId || !serverUrl) return;

    const cookie = authClient.getCookie();
    const headers = cookie ? { Cookie: cookie } : undefined;

    const res = await fetch(`${serverUrl}/api/conversations/${conversationId}/messages`, {
      headers,
      credentials: "include",
    });

    if (!res.ok) return;
    const data = (await res.json()) as {
      messages?: Array<{
        id: string;
        role: "system" | "user" | "assistant";
        content: string;
      }>;
    };

    if (!Array.isArray(data.messages)) return;
    if (data.messages.length === 0) {
      setMessages(defaultMessages);
      return;
    }

    setMessages(
      data.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      })),
    );
  };

  const planQuery = useQuery({
    ...orpc.plan.getById.queryOptions({ planId: planId ?? 0, input: { planId: planId ?? 0 } }),
    enabled: Boolean(planId),
  });

  const saveDraftMutation = useMutation(orpc.plan.saveDraftFromConversation.mutationOptions());

  const handleSaveDraft = async () => {
    if (!conversationId) return;
    try {
      const result = (await saveDraftMutation.mutateAsync({
        conversationId,
      })) as { success: boolean; draftKey?: string; error?: string };

      if (!result.success || !result.draftKey) {
        toast.show({
          variant: "danger",
          label: "Save failed",
          description: result.error || "Could not create draft",
        });
        return;
      }

      toast.show({
        variant: "success",
        label: "Draft created",
        description: "Review and confirm when you’re ready.",
      });

      router.push(`/draft/${result.draftKey}` as any as never);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create draft";
      toast.show({ variant: "danger", label: "Save failed", description: message });
    }
  };

  useEffect(() => {
    void loadConversationMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    const fallbackDefaults = resolveMonitorSettings(getDefaultMonitorSettings());
    if (!conversationId) {
      setFocusArea(fallbackDefaults.focusArea);
      setTaskComplexity(fallbackDefaults.taskComplexity);
      setWeekendPreference(fallbackDefaults.weekendPreference);
      setResponseTone(fallbackDefaults.responseTone);
      setDepth(fallbackDefaults.depth);
      setFormat(fallbackDefaults.format);
      return;
    }

    const saved = getConversationMonitorSettings(conversationId);
    const nextSettings = resolveMonitorSettings(saved);
    setFocusArea(nextSettings.focusArea);
    setTaskComplexity(nextSettings.taskComplexity);
    setWeekendPreference(nextSettings.weekendPreference);
    setResponseTone(nextSettings.responseTone);
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
    if (Platform.OS !== "android") return;
    KeyboardController.setInputMode(AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE);
    return () => {
      KeyboardController.setDefaultMode();
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

  const settingsSnapPoints = useMemo(() => ["52%"], []);
  const renderSettingsBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  const monitorStats = useMemo(
    () => [
      { label: "Focus Area", value: focusArea || "Not set" },
      { label: "Complexity", value: taskComplexity },
      { label: "Weekend", value: weekendPreference },
    ],
    [focusArea, taskComplexity, weekendPreference],
  );

  const persistAssistantContentThrottled = useMemo(
    () =>
      throttle((conversationId: string, messageId: string, content: string) => {
        updateMessage(conversationId, messageId, { content });
        updateConversation(conversationId, { updatedAt: Date.now() });
      }, 500),
    [],
  );

  const updateMonitorSettings = (next: {
    focusArea: string;
    taskComplexity: TaskComplexityOption;
    weekendPreference: WeekendPreferenceOption;
    responseTone: ResponseToneOption;
    depth: DepthOption;
    format: FormatOption;
  }) => {
    setFocusArea(next.focusArea);
    setTaskComplexity(next.taskComplexity);
    setWeekendPreference(next.weekendPreference);
    setResponseTone(next.responseTone);
    setDepth(next.depth);
    setFormat(next.format);
    if (conversationId) {
      setConversationMonitorSettings(conversationId, next);
    }
  };

  const handleFocusAreaChange = (value: string) => {
    updateMonitorSettings({
      focusArea: value,
      taskComplexity,
      weekendPreference,
      responseTone,
      depth,
      format,
    });
  };

  const handleTaskComplexityChange = (value: TaskComplexityOption) => {
    Haptics.selectionAsync();
    updateMonitorSettings({
      focusArea,
      taskComplexity: value,
      weekendPreference,
      responseTone,
      depth,
      format,
    });
  };

  const handleWeekendPreferenceChange = (value: WeekendPreferenceOption) => {
    Haptics.selectionAsync();
    updateMonitorSettings({
      focusArea,
      taskComplexity,
      weekendPreference: value,
      responseTone,
      depth,
      format,
    });
  };

  const handleResponseToneChange = (value: ResponseToneOption) => {
    Haptics.selectionAsync();
    updateMonitorSettings({
      focusArea,
      taskComplexity,
      weekendPreference,
      responseTone: value,
      depth,
      format,
    });
  };

  const handleDepthChange = (value: DepthOption) => {
    Haptics.selectionAsync();
    updateMonitorSettings({
      focusArea,
      taskComplexity,
      weekendPreference,
      responseTone,
      depth: value,
      format,
    });
  };

  const handleFormatChange = (value: FormatOption) => {
    Haptics.selectionAsync();
    updateMonitorSettings({
      focusArea,
      taskComplexity,
      weekendPreference,
      responseTone,
      depth,
      format: value,
    });
  };

  const saveDefaults = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDefaultMonitorSettings({
      focusArea,
      taskComplexity,
      weekendPreference,
      responseTone,
      depth,
      format,
    });
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
    if (!conversationId || !serverUrl) {
      toast.show({
        variant: "danger",
        label: "Chat unavailable",
        description: "Missing conversationId or server URL",
      });
      return;
    }

    Haptics.selectionAsync();

    const userMessage: Message = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: content.trim(),
    };

    const assistantId = `local-assistant-${Date.now()}`;
    streamingMessageId.current = assistantId;

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

    const resolvedFocusArea =
      focusArea.trim() || preferences?.defaultFocusArea?.trim() || "General planning";
    const fixedCommitmentsJson = preferences?.fixedCommitmentsJson ?? { commitments: [] };
    const plannerContext: PlannerContext = {
      focusArea: resolvedFocusArea,
      taskComplexity,
      weekendPreference,
      responseTone,
      depth,
      format,
      fixedCommitmentsJson,
      coachName: preferences?.coachName ?? null,
      coachTone: preferences?.coachTone ?? null,
    };
    const payload = JSON.stringify({ message: userMessage.content, plannerContext });

    const cookie = authClient.getCookie();

    const eventSource = new EventSource(`${serverUrl}/api/conversations/${conversationId}/stream`, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
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
        persistAssistantContentThrottled.flush(
          conversationId,
          streamingMessageId.current,
          formattedContent,
        );
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
      try {
        const parsed = JSON.parse(trimmed) as ServerStreamEvent;

        if (parsed.type === "error") {
          updateStreamingMessage(`Error: ${parsed.message}`);
          closeStream();
          void loadConversationMessages();
          return;
        }

        if (parsed.type === "delta") {
          const delta = parsed.text;
          streamingRawText.current += delta;
          updateStreamingMessage((prev) => {
            const next = prev + delta;
            if (conversationId && streamingMessageId.current) {
              persistAssistantContentThrottled(conversationId, streamingMessageId.current, next);
            }
            return next;
          });
          return;
        }

        if (parsed.type === "done") {
          finalizeStream();
          closeStream();
          void loadConversationMessages();
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
      <View className="flex-1">
        <View className="flex-1">
          {backgroundGlow}
          <View className="px-6 pt-10 pb-3 flex-row items-center gap-x-4">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)")}
              className="w-10 h-10 rounded-2xl bg-surface border border-border/50 items-center justify-center"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={colors.foreground} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-[10px] font-sans-bold uppercase tracking-[3px] text-muted-foreground">
                Planner
              </Text>
              <Text className="text-xl font-sans-bold text-foreground">AI Stream (Public)</Text>
            </View>
            <View className="w-10 h-10 rounded-2xl bg-accent/15 items-center justify-center">
              <HugeiconsIcon icon={AiChat01Icon} size={20} color={colors.accent} />
            </View>
          </View>

          <View className="px-6">
            <Animated.View
              entering={FadeInDown.duration(500)}
              className="bg-surface/60 border border-border/40 rounded-xl p-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-3">
                  <View className="w-9 h-9 rounded-2xl bg-accent/20 items-center justify-center">
                    <HugeiconsIcon icon={SparklesIcon} size={16} color={colors.accent} />
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
                  className="rounded-full border border-border/40 bg-background/70 p-2"
                >
                  <HugeiconsIcon icon={Settings02Icon} size={12} color={colors.foreground} />
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
                        className={`rounded-[26px] px-4 py-3 border ${
                          message.role === "user"
                            ? "max-w-[82%] bg-foreground border-foreground"
                            : "max-w-[90%] bg-surface border-border/40"
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

                        {message.role === "assistant" &&
                          Boolean(conversationId) &&
                          message.content.trim().length > 0 && (
                            <View className="mt-3">
                              <TouchableOpacity
                                onPress={handleSaveDraft}
                                disabled={saveDraftMutation.isPending}
                                className="self-start px-3 py-2 rounded-full bg-background/60 border border-border/40"
                              >
                                <Text className="text-[9px] font-sans-bold uppercase tracking-[2px] text-muted-foreground">
                                  {saveDraftMutation.isPending ? "Saving..." : "Save Plan"}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                      </View>
                    )}
                  </Animated.View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        <KeyboardStickyView offset={{ closed: insets.bottom, opened: insets.bottom + 6 }}>
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
                      <Text className="text-[11px] font-sans-semibold text-foreground">
                        {prompt}
                      </Text>
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
        </KeyboardStickyView>
      </View>
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
            <View className="gap-y-2">
              <Text className="text-[10px] font-sans-bold uppercase tracking-[2px] text-muted-foreground">
                Focus Area
              </Text>
              <TextInput
                value={focusArea}
                onChangeText={handleFocusAreaChange}
                placeholder="e.g. Health, Career"
                placeholderTextColor="var(--muted-foreground)"
                className="rounded-2xl border border-border/40 bg-background/70 px-4 py-2 text-sm font-sans text-foreground"
              />
            </View>
            <ConfigRow
              title="Task Complexity"
              options={TASK_COMPLEXITY_OPTIONS}
              value={taskComplexity}
              onChange={handleTaskComplexityChange}
            />
            <ConfigRow
              title="Weekend Preference"
              options={WEEKEND_PREFERENCE_OPTIONS}
              value={weekendPreference}
              onChange={handleWeekendPreferenceChange}
            />
            <ConfigRow
              title="Response Tone"
              options={RESPONSE_TONE_OPTIONS}
              value={responseTone}
              onChange={handleResponseToneChange}
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="overflow-visible"
        contentContainerStyle={{ paddingRight: 12 }}
      >
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
