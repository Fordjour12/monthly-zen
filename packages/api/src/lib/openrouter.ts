import { OpenRouter } from "@openrouter/sdk";

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export class OpenRouterService {
  private client: OpenRouter;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: OpenRouterConfig) {
    this.client = new OpenRouter({
      apiKey: config.apiKey,
    });
    this.model = config.model;
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 4000;
  }

  async generatePlan(prompt: string): Promise<{
    rawContent: string;
    metadata: { contentLength: number; format: "json" | "text" | "mixed" };
  }> {
    try {
      console.log(`Calling OpenRouter with model: ${this.model}, prompt length: ${prompt.length}`);

      const response = await this.client.chat.send({
        model: this.model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: this.temperature,
        maxTokens: this.maxTokens,
      });

      console.log(
        `OpenRouter response received, tokens used: ${response.usage?.totalTokens || "unknown"}`,
      );

      const choice = response.choices?.[0];
      const content = choice?.message?.content;
      if (!content) {
        throw new Error("No content received from OpenRouter");
      }

      if (typeof content !== "string") {
        throw new Error("Response content is not a string");
      }

      const format = this.detectResponseFormat(content);

      console.log(`Response format detected: ${format}, content length: ${content.length}`);

      return {
        rawContent: content,
        metadata: {
          contentLength: content.length,
          format,
        },
      };
    } catch (error) {
      console.error("OpenRouter API error:", error);

      if (error instanceof Error) {
        throw new Error(`OpenRouter API error: ${error.message}`);
      }
      throw new Error("Unknown error occurred while calling OpenRouter API");
    }
  }

  private detectResponseFormat(content: string): "json" | "text" | "mixed" {
    const trimmed = content.trim();

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        JSON.parse(trimmed);
        return "json";
      } catch {
        return "mixed";
      }
    }

    if (trimmed.includes('"') && trimmed.includes(":") && trimmed.includes("{")) {
      return "mixed";
    }

    return "text";
  }
}

let openRouterService: OpenRouterService | null = null;

export function getOpenRouterService(): OpenRouterService {
  if (!openRouterService) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }

    openRouterService = new OpenRouterService({
      apiKey,
      model: process.env.OPENROUTER_MODEL!,
      temperature: process.env.OPENROUTER_TEMPERATURE
        ? parseFloat(process.env.OPENROUTER_TEMPERATURE)
        : undefined,
      maxTokens: process.env.OPENROUTER_MAX_TOKENS
        ? parseInt(process.env.OPENROUTER_MAX_TOKENS)
        : undefined,
    });
  }
  return openRouterService;
}

export function isConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}
