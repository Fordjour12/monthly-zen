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
  timeoutMs?: number;
  signal?: AbortSignal;
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
    signal: options.signal,
  } as Parameters<typeof client.chat.send>[0]);

  return stream as AsyncIterable<OpenRouterStreamChunk>;
}

export async function collectChatCompletion(
  options: StreamChatOptions,
): Promise<{ content: string; finishReason?: string | null }> {
  const { timeoutMs, signal, ...streamOptions } = options;
  const controller = timeoutMs ? new AbortController() : null;

  if (signal && controller) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
    }
  }

  const stream = await streamChatCompletion({
    ...streamOptions,
    signal: controller?.signal ?? signal,
  });
  let content = "";
  let finishReason: string | null | undefined;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise =
    timeoutMs && timeoutMs > 0
      ? new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            controller?.abort();
            const error = new Error("OpenRouter request timed out");
            error.name = "TimeoutError";
            reject(error);
          }, timeoutMs);
        })
      : null;

  const consumeStream = async () => {
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
  };

  try {
    if (timeoutPromise) {
      return await Promise.race([consumeStream(), timeoutPromise]);
    }

    return await consumeStream();
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
