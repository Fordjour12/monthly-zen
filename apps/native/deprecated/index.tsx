import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Stack, useFocusEffect, useRootNavigationState, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { AiChat01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";

import { Container } from "@/components/ui/container";
import { useSemanticColors } from "@/utils/theme";
import {
  Conversation,
  createConversation,
  deleteConversation,
  getLastConversationId,
  listConversations,
  setLastConversationId,
} from "@/storage/chatStore";

export default function ConversationsIndex() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const colors = useSemanticColors();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const lastConversationRef = useRef<string | null>(null);
  const didAutoOpen = useRef(false);

  const loadConversations = useCallback(() => {
    const items = listConversations();
    setConversations(items);
    lastConversationRef.current = getLastConversationId();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations]),
  );

  useEffect(() => {
    if (didAutoOpen.current) return;
    if (!rootNavigationState?.key) return;
    const lastId = getLastConversationId();
    if (!lastId) {
      didAutoOpen.current = true;
      return;
    }

    const exists = listConversations().some((conversation) => conversation.id === lastId);
    if (exists) {
      didAutoOpen.current = true;
      router.replace({ pathname: "/chat", params: { conversationId: lastId } });
    }
  }, [router, rootNavigationState?.key]);

  const backgroundGlow = useMemo(
    () => (
      <View className="absolute -top-24 right-8 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
    ),
    [],
  );

  const handleNewChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const conversation = createConversation("Planner Chat");
    setLastConversationId(conversation.id);
    router.push({ pathname: "/chat", params: { conversationId: conversation.id } });
  };

  const openConversation = (conversationId: string) => {
    Haptics.selectionAsync();
    setLastConversationId(conversationId);
    router.push({ pathname: "/chat", params: { conversationId } });
  };

  const handleDelete = (conversationId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteConversation(conversationId);
    loadConversations();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Container className="bg-background" withScroll={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1">
        {backgroundGlow}

        <View className="px-6 pt-10 pb-4 flex-row items-center gap-x-4">
          <View className="flex-1">
            <Text className="text-[10px] font-sans-bold uppercase tracking-[3px] text-muted-foreground">
              Planner
            </Text>
            <Text className="text-2xl font-sans-bold text-foreground">Conversations</Text>
          </View>

          <TouchableOpacity
            onPress={handleNewChat}
            className="flex-row items-center gap-x-2 px-4 py-2 rounded-2xl bg-foreground"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} color={colors.background} />
            <Text className="text-xs font-sans-bold uppercase tracking-[2px] text-background">
              New Chat
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-6">
          <Animated.View
            entering={FadeInDown.duration(500)}
            className="bg-surface/60 border border-border/40 rounded-4xl p-4"
          >
            <View className="flex-row items-center gap-x-3">
              <View className="w-9 h-9 rounded-2xl bg-accent/20 items-center justify-center">
                <HugeiconsIcon icon={AiChat01Icon} size={16} color={colors.accent} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-sans-bold text-foreground">Resume your focus</Text>
                <Text className="text-[11px] font-sans text-muted-foreground">
                  Open recent sessions or spin up a new plan.
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        <ScrollView className="flex-1 mt-5" contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="px-6 gap-y-4">
            {conversations.length === 0 ? (
              <View className="rounded-4xl border border-dashed border-border/50 bg-surface/30 px-5 py-6">
                <Text className="text-sm font-sans-bold text-foreground">No conversations yet</Text>
                <Text className="text-xs font-sans text-muted-foreground mt-2">
                  Start a fresh planning thread and keep it around for next time.
                </Text>
                <TouchableOpacity
                  onPress={handleNewChat}
                  className="mt-4 px-4 py-2 rounded-2xl bg-foreground self-start"
                >
                  <Text className="text-[10px] font-sans-bold uppercase tracking-[2px] text-background">
                    Start New Chat
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              conversations.map((conversation) => {
                const isLast = lastConversationRef.current === conversation.id;
                return (
                  <TouchableOpacity
                    key={conversation.id}
                    onPress={() => openConversation(conversation.id)}
                    className={`rounded-[28px] border px-5 py-4 ${
                      isLast ? "bg-accent/10 border-accent/40" : "bg-surface/70 border-border/40"
                    }`}
                  >
                    <View className="flex-row items-start gap-x-3">
                      <View
                        className={`w-11 h-11 rounded-2xl items-center justify-center ${
                          isLast ? "bg-accent/20" : "bg-background/70"
                        }`}
                      >
                        <HugeiconsIcon icon={AiChat01Icon} size={18} color={colors.accent} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-sans-bold text-foreground">
                            {conversation.title || "Planner Chat"}
                          </Text>
                          <Text className="text-[10px] font-sans-semibold text-muted-foreground">
                            {formatDate(conversation.updatedAt)}
                          </Text>
                        </View>
                        <Text
                          className="text-xs font-sans text-muted-foreground mt-2"
                          numberOfLines={2}
                        >
                          {conversation.lastMessagePreview || "Start the next step of your plan."}
                        </Text>
                        <View className="flex-row items-center gap-x-3 mt-3">
                          <Text className="text-[9px] font-sans-bold uppercase tracking-[2px] text-muted-foreground">
                            {isLast ? "Last Opened" : "Conversation"}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleDelete(conversation.id)}
                            className="px-3 py-1 rounded-full bg-background/70 border border-border/40"
                          >
                            <Text className="text-[9px] font-sans-bold uppercase tracking-[2px] text-muted-foreground">
                              Delete
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </Container>
  );
}
