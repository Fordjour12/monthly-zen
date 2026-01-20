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
