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

export interface PlanTask {
   id: string;
   title: string;
   description?: string;
   dueDate?: string;
   priority: "low" | "medium" | "high";
   week: number;
   day: string;
}

export interface PlanHabit {
   id: string;
   title: string;
   description?: string;
   frequency: "daily" | "weekly" | "monthly";
   targetValue: number;
   suggestedStreak: number;
}
