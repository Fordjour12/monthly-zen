import { useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import PlannerAiStreamTest from "./test/ai-stream";
import { createConversation } from "@/storage/chatStore";

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
    if (conversationId) {
      didEnsureConversation.current = true;
      return;
    }

    const created = createConversation("Planner Chat");
    router.replace({
      pathname: "/chat",
      params: {
        conversationId: created.id,
        ...(typeof planIdParam === "string" ? { planId: planIdParam } : {}),
      },
    });
    didEnsureConversation.current = true;
  }, [conversationId, planIdParam, router]);

  if (!conversationId) return null;

  return <PlannerAiStreamTest planId={planId ?? undefined} conversationId={conversationId} />;
}
