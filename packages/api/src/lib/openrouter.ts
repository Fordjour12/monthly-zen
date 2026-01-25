import { OpenRouter } from "@openrouter/sdk";

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterStreamChunk = {
  choices?: Array<{
    delta?: { content?: string | null };
    finish_reason?: string | null;
  }>;
  error?: { message?: string };
  usage?: Record<string, number | null>;
};

export type StreamChatOptions = {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
  includeUsage?: boolean;
};

let openRouterClient: OpenRouter | null = null;

function getOpenRouterClient(): OpenRouter {
  if (!openRouterClient) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }
    openRouterClient = new OpenRouter({ apiKey });
  }

  return openRouterClient;
}

export async function streamChatCompletion(
  options: StreamChatOptions,
): Promise<AsyncIterable<OpenRouterStreamChunk>> {
  const client = getOpenRouterClient();

  const stream = await client.chat.send({
    model: options.model,
    messages: options.messages,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    stream: true,
    streamOptions: options.includeUsage ? { includeUsage: true } : undefined,
  });

  return stream as AsyncIterable<OpenRouterStreamChunk>;
}

export async function collectChatCompletion(
  options: StreamChatOptions,
): Promise<{ content: string; finishReason?: string | null }> {
  const stream = await streamChatCompletion(options);
  let content = "";
  let finishReason: string | null | undefined;

  for await (const chunk of stream) {
    if (chunk.error?.message) {
      throw new Error(chunk.error.message);
    }

    const choice = chunk.choices?.[0];
    const delta = choice?.delta?.content;
    if (delta) {
      content += delta;
    }

    if (choice?.finish_reason && choice.finish_reason !== "error") {
      finishReason = choice.finish_reason;
      break;
    }
  }

  return { content, finishReason };
}
