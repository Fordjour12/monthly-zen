interface AIServiceConfig {
   userId?: string;
   model?: string;
}

export interface AIRequest<T> {
   type: "plan" | "briefing" | "reschedule" | "categorization" | "analysis";
   input: T;
   prompt: string;
   systemPrompt?: string;
   config?: AIServiceConfig;
}

export interface AIResponse<T> {
   success: boolean;
   data?: T;
   error?: string;
   fallbackUsed?: boolean;
}
