import { useLocalSearchParams } from "expo-router";
import PlannerAiStreamTest from "./test/ai-stream";

export default function Chat() {
  const params = useLocalSearchParams();
  const planIdParam = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const parsedPlanId = planIdParam ? Number(planIdParam) : null;
  const planId = Number.isNaN(parsedPlanId) ? null : parsedPlanId;

  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  return (
    <PlannerAiStreamTest
      planId={planId ?? undefined}
      conversationId={typeof conversationId === "string" ? conversationId : undefined}
    />
  );
}
