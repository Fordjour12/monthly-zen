import { z } from "zod";

import { getOpenRouterService } from "../lib/openrouter";
import { generateInputSchema } from "./plan-ai-schema";

export type PlanAiStreamInput = z.infer<typeof generateInputSchema>;

export const planAiStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("delta"), text: z.string() }),
  z.object({ type: z.literal("done"), finishReason: z.string().optional() }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

export type PlanAiStreamEvent = z.infer<typeof planAiStreamEventSchema>;

export async function* streamPlanAiResponse(
  input: PlanAiStreamInput,
): AsyncGenerator<PlanAiStreamEvent> {
  const prompt = buildStreamPrompt(input);
  const openRouter = getOpenRouterService();

  const stream = await openRouter.streamPlan(prompt);

  for await (const chunk of stream) {
    if (chunk.error?.message) {
      yield { type: "error", message: chunk.error.message };
      return;
    }

    const choice = chunk.choices?.[0];
    const delta = choice?.delta?.content;
    if (delta) {
      yield { type: "delta", text: delta };
    }

    const finishReason = choice?.finish_reason;
    if (finishReason && finishReason !== "error") {
      yield { type: "done", finishReason };
      return;
    }
  }

  yield { type: "done" };
}

function buildStreamPrompt(input: PlanAiStreamInput): string {
  return [
    "You are an AI planning assistant.",
    "Generate a clear monthly plan based on the user inputs.",
    "Return the response as text only.",
    "",
    `Goals: ${input.goalsText}`,
    `Task complexity: ${input.taskComplexity}`,
    `Focus areas: ${input.focusAreas}`,
    `Weekend preference: ${input.weekendPreference}`,
    `Fixed commitments JSON: ${JSON.stringify(input.fixedCommitmentsJson)}`,
  ].join("\n");
}
