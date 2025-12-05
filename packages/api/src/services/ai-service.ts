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
   type: "plan" | "briefing" | "reschedule" | "categorization" | "analysis";
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

export interface PlanEffectivenessMetrics {
   success: boolean;
   effectivenessScore: number;
   completionRate: number;
   insights: string[];
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
         cacheTTL = 3000, // 5 minutes default (300000 => 300 300ms)
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
                  max_tokens: 4000,
                  response_format: { type: "json_object" },
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
    * Generate plan based on user goals using Monthly Planning Prompt
    */
   static async generatePlan(
      userGoals: string,
      config?: AIServiceConfig
   ): Promise<AIResponse<PlanSuggestionContent>> {

      //TODO: Send from your userApp as serverless can be stick sometimes

      const currentDate = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const prompt = `You are an intelligent monthly planning assistant. Your task is to transform user goals into a structured, actionable monthly plan.

**User Input:**
${userGoals}

**Context:**
- Current month: ${currentMonth}
- Current date: ${currentDate}
- User's known commitments: []
- User's preferences: Standard work hours, balanced energy patterns, flexible scheduling

**Your Responsibilities:**
1. Parse and understand the user's goals
2. Break down large goals into weekly milestones
3. Create daily tasks that are realistic and achievable
4. Identify potential conflicts or overload situations
5. Suggest optimal timing based on user patterns

**Output Format (JSON):**
{
  "monthly_summary": "Brief overview of the plan",
  "weekly_breakdown": [
    {
      "week": 1,
      "focus": "Main theme for this week",
      "goals": ["Weekly goal 1", "Weekly goal 2"],
      "daily_tasks": {
        "Monday": ["Task 1", "Task 2"],
        "Tuesday": ["Task 1", "Task 2"]
      }
    }
  ],
  "potential_conflicts": ["Any identified issues"],
  "success_metrics": ["How to measure progress"]
}

**Constraints:**
- Maximum 3-4 major tasks per day
- Include buffer time for unexpected delays
- Consider weekends differently based on user preferences
- Flag any unrealistic timelines`;

      const systemPrompt = "You are an intelligent monthly planning assistant. Create comprehensive, actionable monthly plans with weekly breakdowns and daily tasks. Focus on realistic timelines and balanced workloads.";

      return this.executeAIRequest<string, PlanSuggestionContent>({
         type: "plan",
         input: userGoals,
         prompt,
         systemPrompt,
         config,
      });
   }

   /**
     * Generate plan with progress simulation for better UX
     */
   static async generatePlanWithProgress(
      userGoals: string,
      onProgress?: (stage: string, message: string) => void,
      config?: AIServiceConfig
   ): Promise<AIResponse<PlanSuggestionContent>> {

      // Simulate progress stages
      const stages = [
         { type: 'validation', message: 'Validating your goals...', duration: 2000 },
         { type: 'context', message: 'Analyzing your current commitments...', duration: 2000 },
         { type: 'generating', message: 'Creating your personalized plan...', duration: 4000 },
         { type: 'finalizing', message: 'Optimizing your monthly plan...', duration: 2000 }
      ];

      // Execute progress simulation
      for (const stage of stages) {
         onProgress?.(stage.type, stage.message);
         await new Promise(resolve => setTimeout(resolve, stage.duration));
      }

      // Generate the actual plan
      const result = await this.generatePlan(userGoals, config);

      // Final progress update
      onProgress?.('complete', 'Plan generated successfully!');

      return result;
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
    * Parse plan content for task conversion
    */
   static parsePlanForTasks(plan: PlanSuggestionContent): PlanTask[] {
      const tasks: PlanTask[] = [];

      if (!plan || typeof plan !== 'object') {
         return tasks;
      }

      // Process goals and their tasks
      if (plan.goals && Array.isArray(plan.goals)) {
         plan.goals.forEach((goal: any, goalIndex: number) => {
            if (goal.tasks && Array.isArray(goal.tasks)) {
               goal.tasks.forEach((task: any, taskIndex: number) => {
                  tasks.push({
                     id: `task_${goalIndex}_${taskIndex}`,
                     title: task.title,
                     description: `Task from goal: ${goal.title}`,
                     dueDate: task.dueDate,
                     priority: task.priority || this.inferPriority(task.title),
                     week: 1, // Default week, can be calculated from dueDate if needed
                     day: 'goal_task'
                  });
               });
            }
         });
      }

      return tasks;
   }

   /**
    * Parse plan content for habit identification
    */
   static parsePlanForHabits(plan: PlanSuggestionContent): PlanHabit[] {
      const habits: PlanHabit[] = [];

      if (!plan || typeof plan !== 'object') {
         return habits;
      }

      const recurringPatterns = new Map<string, number>();

      // Analyze tasks for recurring patterns
      if (plan.goals && Array.isArray(plan.goals)) {
         plan.goals.forEach((goal: any) => {
            if (goal.tasks && Array.isArray(goal.tasks)) {
               goal.tasks.forEach((task: any) => {
                  const normalizedTitle = task.title.toLowerCase().trim();
                  recurringPatterns.set(normalizedTitle, (recurringPatterns.get(normalizedTitle) || 0) + 1);
               });
            }
         });
      }

      // Identify potential habits (appearing 3+ times)
      recurringPatterns.forEach((count, title) => {
         if (count >= 3) {
            const frequency = this.inferFrequency(title, count);
            habits.push({
               id: `habit_${title.replace(/\s+/g, '_')}`,
               title: title,
               description: `Recurring activity identified from your plan`,
               frequency,
               targetValue: frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 30,
               suggestedStreak: Math.min(count, 30)
            });
         }
      });

      return habits;
   }

   /**
    * Track plan execution effectiveness
    */
   static async trackPlanExecution(
      _planId: string,
      completedTasks: string[],
      completedHabits: string[],
      _config?: AIServiceConfig
   ): Promise<PlanEffectivenessMetrics> {
      const insights: string[] = [];
      let effectivenessScore = 0;

      // Calculate completion rates
      const totalTasks = completedTasks.length;
      const completionRate = totalTasks > 0 ? 1.0 : 0.5; // Simplified calculation

      // Generate insights
      if (completionRate >= 0.8) {
         insights.push("Excellent plan execution! Most tasks completed successfully.");
         effectivenessScore = 90;
      } else if (completionRate >= 0.6) {
         insights.push("Good plan execution. Consider adjusting timeline expectations.");
         effectivenessScore = 70;
      } else {
         insights.push("Plan execution needs improvement. Consider more realistic goal setting.");
         effectivenessScore = 40;
      }

      if (completedHabits.length > 0) {
         insights.push(`${completedHabits.length} habits maintained from the plan.`);
         effectivenessScore += 10;
      }

      return {
         success: true,
         effectivenessScore,
         completionRate,
         insights
      };
   }

   /**
    * Helper method to infer task priority
    */
   private static inferPriority(taskTitle: string): "low" | "medium" | "high" {
      const title = taskTitle.toLowerCase();
      if (title.includes('urgent') || title.includes('critical') || title.includes('important')) {
         return 'high';
      }
      if (title.includes('review') || title.includes('meeting') || title.includes('call')) {
         return 'medium';
      }
      return 'low';
   }

   /**
    * Helper method to infer habit frequency
    */
   private static inferFrequency(_title: string, count: number): "daily" | "weekly" | "monthly" {
      if (count >= 20) return 'daily';
      if (count >= 8) return 'weekly';
      return 'monthly';
   }

   /**
     * Get all users' rate limit statistics (for monitoring)
     */
   static getAllRateLimitStats() {
      return this.limiter.getAllStats();
   }
   /**
    * Categorize a task from text input
    */
   static async categorizeTask(
      taskText: string,
      config?: AIServiceConfig
   ): Promise<AIResponse<{ title: string; category: string; dueDate?: string; priority: string }>> {
      const prompt = `Analyze this task input: "${taskText}"
      
      Return a JSON object with:
      - title: Cleaned task title
      - category: Suggested category (e.g., Work, Health, Personal, Learning)
      - dueDate: ISO date string if mentioned (assume current year), null otherwise
      - priority: inferred priority (low, medium, high)`;

      return this.executeAIRequest<string, { title: string; category: string; dueDate?: string; priority: string }>({
         type: "categorization",
         input: taskText,
         prompt,
         config
      });
   }

   /**
    * Generate weekly summary
    */
   static async generateWeeklySummary(
      weekData: any,
      config?: AIServiceConfig
   ): Promise<AIResponse<{ summary: string; highlights: string[] }>> {
      const prompt = `Generate a motivational weekly summary based on this data: ${JSON.stringify(weekData)}
      
      Return JSON:
      - summary: 2-3 sentences summarizing performance
      - highlights: Array of 2-3 key achievements`;

      return this.executeAIRequest<any, { summary: string; highlights: string[] }>({
         type: "analysis",
         input: weekData,
         prompt,
         config
      });
   }
}
