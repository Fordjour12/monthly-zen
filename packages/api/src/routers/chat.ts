import { eventIterator } from "@orpc/server";
import { z } from "zod";

import { publicProcedure } from "../index";
import type { OpenRouterMessage } from "../lib/openrouter";
import { streamChatCompletion } from "../lib/openrouter";

const DEFAULT_SYSTEM_PROMPT =
  "You are Monthly Zen, a planning assistant. Create clear month plans, focus maps, and next steps.";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1, "Message content is required"),
});

const chatStreamInputSchema = z.object({
  messages: z.array(messageSchema).min(1, "At least one message is required"),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
});

export const chatStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("delta"), text: z.string() }),
  z.object({ type: z.literal("done"), finishReason: z.string().optional() }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

export type ChatStreamEvent = z.infer<typeof chatStreamEventSchema>;

export const chatRouter = {
  stream: publicProcedure
    .input(chatStreamInputSchema)
    .output(eventIterator(chatStreamEventSchema, z.void()))
    .handler(async function* ({ input }): AsyncGenerator<ChatStreamEvent> {
      const systemPrompt = process.env.OPENROUTER_SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT;
      const model = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";
      const nonSystemMessages: OpenRouterMessage[] = input.messages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          role: message.role as "user" | "assistant",
          content: message.content,
        }));

      const messages: OpenRouterMessage[] = [
        { role: "system", content: systemPrompt },
        ...nonSystemMessages,
      ];

      const stream = await streamChatCompletion({
        model,
        messages,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      });

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
    }),
};
