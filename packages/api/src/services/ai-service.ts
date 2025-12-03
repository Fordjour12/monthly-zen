import { openai } from "../lib/openrouter";
import { SimpleCache } from "../cache/simple-cache";
import { SimpleRateLimiter, DEFAULT_RATE_LIMITS } from "../rate-limiting/simple-limiter";
import { SimpleRetry } from "../error-handling/simple-retry";
import { FallbackHandler } from "../error-handling/fallback-handler";
import type {
   BriefingSuggestionContent,
   PlanSuggestionContent,
   RescheduleSuggestionContent,
} from "@my-better-t-app/db";

interface AIServiceConfig {
   cacheTTL?: number;
   rateLimitKey?: string;
   maxRetries?: number;
   userId?: string;
   model?: string;
}

interface AIRequest<T> {
   type: "plan" | "briefing" | "reschedule";
   input: T;
   prompt: string;
   systemPrompt?: string;
   config?: AIServiceConfig;
}

interface AIResponse<T> {
   success: boolean;
   data?: T;
   error?: string;
   cached?: boolean;
   fallbackUsed?: boolean;
}

export class AIService {
   private static cache = new SimpleCache();
   private static limiter = new SimpleRateLimiter(DEFAULT_RATE_LIMITS);

   /**
    * Generic AI request handler with caching, rate limiting, and retry logic
    */
   private static async executeAIRequest<TInput, TOutput>(
      request: AIRequest<TInput>
   ): Promise<AIResponse<TOutput>> {
      const { type, input, prompt, systemPrompt, config = {} } = request;
      const {
         cacheTTL = 300000, // 5 minutes default
         maxRetries = 3,
         userId = "anonymous",
         model = "openai/gpt-oss-120b",
      } = config;

      try {
         // Check cache first
         const cacheKey = SimpleCache.generateKey(type,
            typeof input === 'string' ? { input } : input as Record<string, any>
         );
         const cached = this.cache.get<TOutput>(cacheKey);
         if (cached) {
            return {
               success: true,
               data: cached,
               cached: true,
            };
         }

         // Apply rate limiting
         const rateLimitStatus = this.limiter.checkLimit(userId, type as keyof Omit<typeof DEFAULT_RATE_LIMITS, "daily" | "monthly">);
         if (!rateLimitStatus.allowed) {
            throw new Error(`Rate limit exceeded. Try again after ${rateLimitStatus.resetTime.toLocaleString()}`);
         }

         // Execute AI request with retry logic
         const retryResult = await SimpleRetry.execute(
            async () => {
               const completion = await openai.chat.completions.create({
                  model,
                  messages: [
                     ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
                     { role: "user" as const, content: prompt },
                  ],
                  temperature: 0.7,
                  max_tokens: 2000,
               });

                const content = completion.choices[0]?.message?.content;
                if (!content) {
                   throw new Error("No content received from AI service");
                }

                 // Clean up the content - remove markdown code blocks and extra whitespace
                 let cleanContent = content.trim();
                 
                 // Remove markdown code block markers if present
                 if (cleanContent.startsWith('```')) {
                    const lines = cleanContent.split('\n');
                    // Remove first line (```json) and last line (```)
                    if (lines.length > 2) {
                       cleanContent = lines.slice(1, -1).join('\n').trim();
                    }
                 }

                 // Remove any backticks that might be in the content
                 cleanContent = cleanContent.replace(/`/g, '');

                 // Try to extract JSON from the content if it's embedded in text
                 const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
                 if (jsonMatch) {
                    cleanContent = jsonMatch[0];
                 }

                 try {
                    const parsed = JSON.parse(cleanContent);
                    return parsed as TOutput;
                 } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    console.error('Original content:', content);
                    console.error('Cleaned content:', cleanContent);
                    
                    // Try to fix common JSON issues
                    try {
                       // Remove trailing commas and fix other common issues
                       const fixedContent = cleanContent
                          .replace(/,\s*}/g, '}')
                          .replace(/,\s*]/g, ']')
                          .replace(/"\s*:\s*"/g, '":"');
                       const fixedParsed = JSON.parse(fixedContent);
                       return fixedParsed as TOutput;
                    } catch (fixError) {
                       throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
                    }
                 }
            },
            {
               maxAttempts: maxRetries,
               baseDelay: 1000,
               backoffFactor: 2,
            }
         );

         if (!retryResult.success) {
            throw retryResult.error || new Error("Failed to execute AI request");
         }

         // Record usage and cache the result
         this.limiter.recordUsage(userId, type as keyof Omit<typeof DEFAULT_RATE_LIMITS, "daily" | "monthly">);
         this.cache.set(cacheKey, retryResult.data as TOutput, cacheTTL);

         return {
            success: true,
            data: retryResult.data,
            cached: false,
         };
      } catch (error) {
         // Use fallback handler
         const fallbackResult = await FallbackHandler.handleAIError(
            error instanceof Error ? error : new Error("Unknown error"),
            type,
            input
         );

         return {
            success: fallbackResult.success,
            data: fallbackResult.data as TOutput,
            error: fallbackResult.message,
            fallbackUsed: true,
         };
      }
   }

   /**
    * Generate plan based on user goals
    */
   static async generatePlan(
      userGoals: string,
      config?: AIServiceConfig
   ): Promise<AIResponse<PlanSuggestionContent>> {
      const prompt = `Generate a structured plan based on these user goals: "${userGoals}"

      Return a JSON response with this structure:
      {
        "goals": [
          {
            "title": "Goal title",
            "description": "Goal description",
            "category": "personal|work|health|learning",
            "tasks": [
              {
                "title": "Task title",
                "priority": "low|medium|high",
                "dueDate": "YYYY-MM-DD"
              }
            ]
          }
        ]
      }`;

      const systemPrompt = "You are a helpful planning assistant. Create realistic, actionable plans with clear tasks and deadlines.";

      return this.executeAIRequest<string, PlanSuggestionContent>({
         type: "plan",
         input: userGoals,
         prompt,
         systemPrompt,
         config,
      });
   }

   /**
    * Generate daily briefing
    */
   static async generateBriefing(
      currentDate: string,
      todaysTasks: Array<{ title: string; priority: string }>,
      config?: AIServiceConfig
   ): Promise<AIResponse<BriefingSuggestionContent>> {
      const prompt = `Generate a daily briefing for ${currentDate} with these tasks:
      ${todaysTasks.map(task => `- ${task.title} (${task.priority})`).join('\n')}

      Return a JSON response with this structure:
      {
        "summary": "Brief summary of the day",
        "todaysTasks": [
          {
            "taskId": "task-id",
            "title": "Task title",
            "priority": "low|medium|high"
          }
        ],
        "upcomingDeadlines": [
          {
            "title": "Deadline title",
            "dueDate": "YYYY-MM-DD",
            "priority": "low|medium|high"
          }
        ],
        "habitReminders": [
          {
            "habit": "Habit name",
            "frequency": "daily|weekly",
            "lastCompleted": "YYYY-MM-DD"
          }
        ]
      }`;

      const systemPrompt = "You are a helpful daily briefing assistant. Provide concise, actionable insights about the day's tasks and schedule.";

      return this.executeAIRequest<
         { currentDate: string; todaysTasks: Array<{ title: string; priority: string }> },
         BriefingSuggestionContent
      >({
         type: "briefing",
         input: { currentDate, todaysTasks },
         prompt,
         systemPrompt,
         config,
      });
   }

   /**
    * Generate reschedule suggestions
    */
   static async generateReschedule(
      backlogTasks: Array<{ title: string; priority: string; dueDate: string }>,
      config?: AIServiceConfig
   ): Promise<AIResponse<RescheduleSuggestionContent>> {
      const prompt = `Generate reschedule suggestions for these overdue tasks:
      ${backlogTasks.map(task => `- ${task.title} (${task.priority}, due: ${task.dueDate})`).join('\n')}

      Return a JSON response with this structure:
      {
        "reason": "Reason for rescheduling",
        "affectedTasks": [
          {
            "taskId": "task-id",
            "currentDueDate": "YYYY-MM-DD",
            "suggestedDueDate": "YYYY-MM-DD"
          }
        ],
        "affectedEvents": [
          {
            "eventId": "event-id",
            "title": "Event title",
            "originalDate": "YYYY-MM-DD",
            "suggestedDate": "YYYY-MM-DD"
          }
        ]
      }`;

      const systemPrompt = "You are a helpful scheduling assistant. Suggest realistic reschedule dates considering task priorities and dependencies.";

      return this.executeAIRequest<
         Array<{ title: string; priority: string; dueDate: string }>,
         RescheduleSuggestionContent
      >({
         type: "reschedule",
         input: backlogTasks,
         prompt,
         systemPrompt,
         config,
      });
   }

   /**
    * Clear cache for a specific type or all cache
    */
   static clearCache(type?: "plan" | "briefing" | "reschedule"): void {
      if (type) {
         // Clear all entries that start with the type prefix
         const cacheInstance = this.cache as any;
         if (cacheInstance.cache) {
            for (const [key] of cacheInstance.cache.entries()) {
               if (key.startsWith(`${type}:`)) {
                  cacheInstance.cache.delete(key);
               }
            }
         }
      } else {
         this.cache.clear();
      }
   }

   /**
    * Get cache statistics
    */
   static getCacheStats() {
      return this.cache.getStats();
   }

   /**
    * Get rate limit statistics
    */
   static getRateLimitStats(userId: string = "anonymous") {
      return this.limiter.getUserStats(userId);
   }

   /**
    * Get all users' rate limit statistics (for monitoring)
    */
   static getAllRateLimitStats() {
      return this.limiter.getAllStats();
   }
}
