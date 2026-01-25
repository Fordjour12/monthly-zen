import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { Container } from "@/components/ui/container";
import { orpc } from "@/utils/orpc";

export default function DraftReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const draftKeyParam = Array.isArray(params.draftKey) ? params.draftKey[0] : params.draftKey;
  const draftKey = typeof draftKeyParam === "string" ? draftKeyParam : "";

  const draftQuery = useQuery({
    ...orpc.plan.getDraft.queryOptions({ input: { draftKey } }),
    enabled: draftKey.length > 0,
  });

  const raw = draftQuery.data?.success ? (draftQuery.data.data as any) : null;
  const planData = raw?.planData ?? raw?.aiResponseRaw;
  const content =
    planData && typeof planData === "object" && typeof planData.content === "string"
      ? planData.content
      : typeof planData === "string"
        ? planData
        : planData
          ? JSON.stringify(planData, null, 2)
          : "";

  return (
    <Container className="bg-background" withScroll={false}>
      <Stack.Screen options={{ title: "Review Draft" }} />

      <View className="flex-row items-center justify-between px-6 pt-6 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-4 py-2 rounded-full bg-surface border border-border/40"
        >
          <Text className="text-[10px] font-sans-bold uppercase tracking-[2px] text-muted-foreground">
            Back
          </Text>
        </TouchableOpacity>

        <View className="px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
          <Text className="text-[10px] font-sans-bold uppercase tracking-[2px] text-accent">
            Draft
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 28 }}>
        {draftQuery.isLoading ? (
          <Text className="text-sm font-sans text-muted-foreground">Loading…</Text>
        ) : draftQuery.data && !draftQuery.data.success ? (
          <Text className="text-sm font-sans text-danger">
            {draftQuery.data.error || "Draft not found"}
          </Text>
        ) : (
          <View className="rounded-[24px] border border-border/50 bg-surface/60 p-5">
            <Text className="text-[10px] font-sans-bold uppercase tracking-[3px] text-muted-foreground">
              Latest Assistant Response
            </Text>
            <Text className="text-sm font-sans text-foreground mt-3 leading-6">{content}</Text>
          </View>
        )}
      </ScrollView>

      <View className="px-6 pb-6">
        <View className="rounded-[24px] border border-border/40 bg-surface/40 p-5">
          <Text className="text-sm font-sans-semibold text-foreground">Next step</Text>
          <Text className="text-[12px] font-sans text-muted-foreground mt-2 leading-5">
            When you’re happy with this draft, we’ll add a Confirm action that parses it into a
            structured plan and generates tasks.
          </Text>
        </View>
      </View>
    </Container>
  );
}
