import { useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import PlannerAiStreamTest from "./test/ai-stream";

export default function Chat() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const didEnsureConversation = useRef(false);

  const planIdParam = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const parsedPlanId = planIdParam ? Number(planIdParam) : null;
  const planId = Number.isNaN(parsedPlanId) ? null : parsedPlanId;

  const conversationIdParam = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  const conversationId = typeof conversationIdParam === "string" ? conversationIdParam : undefined;

  useEffect(() => {
    if (didEnsureConversation.current) return;
    const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;
    if (!serverUrl) return;

    const ensure = async () => {
      if (conversationId) {
        await fetch(`${serverUrl}/api/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: conversationId, title: "Planner Chat" }),
        }).catch(() => {});

        didEnsureConversation.current = true;
        return;
      }

      const res = await fetch(`${serverUrl}/api/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: "Planner Chat" }),
      });

      if (!res.ok) return;
      const data = (await res.json()) as { id?: string };
      if (!data.id) return;

      router.replace({
        pathname: "/chat",
        params: {
          conversationId: data.id,
          ...(typeof planIdParam === "string" ? { planId: planIdParam } : {}),
        },
      });
      didEnsureConversation.current = true;
    };

    void ensure();
  }, [conversationId, planIdParam, router]);

  if (!conversationId) return null;

  return <PlannerAiStreamTest planId={planId ?? undefined} conversationId={conversationId} />;
}
