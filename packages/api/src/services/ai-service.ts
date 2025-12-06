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

export interface SuggestionItemClassification {
   title: string;
   type: "task" | "habit" | "recurring-task";
   confidence: number;
   reasoning: string;
   suggested_priority: "low" | "medium" | "high";
   suggested_frequency?: "daily" | "weekly" | "monthly";
   estimated_duration?: string;
   due_date?: string;
   recurrence_rule?: string;
   habit_potential?: {
      is_habit: boolean;
      frequency?: "daily" | "weekly" | "monthly";
      target_value?: number;
      streak_suggestion?: number;
      best_time?: "morning" | "afternoon" | "evening";
      trigger_activity?: string;
   };
   dependencies?: string[];
   quick_win?: boolean;
   long_term_build?: boolean;
}

export interface SuggestionApplicationStrategy {
   classifications: SuggestionItemClassification[];
   application_strategy: {
      recommended_order: string[];
      dependencies: string[];
      quick_wins: string[];
      long_term_builds: string[];
      total_estimated_time: string;
      balance_score: number;
   };
   warnings: string[];
   success_metrics: string[];
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
          confi
       });
    }

   /**
    * Classify suggestion items for application as tasks, habits, or recurring tasks
    */
   static async classifySuggestionItems(
      suggestionContent: any,
      userContext?: {
         current_tasks?: any[];
         current_habits?: any[];
         user_preferences?: any;
         completion_history?: any;
      },
      config?: AIServiceConfig
   ): Promise<AIResponse<SuggestionApplicationStrategy>> {
      const prompt = `You are an intelligent task and habit classifier. Analyze plan suggestions and classify them for optimal application as tasks, habits, or recurring tasks.

**Input Suggestion:**
${JSON.stringify(suggestionContent)}

**User Context:**
- Existing tasks: ${JSON.stringify(userContext?.current_tasks || [])}
- Existing habits: ${JSON.stringify(userContext?.current_habits || [])}
- User preferences: ${JSON.stringify(userContext?.user_preferences || {})}
- Completion patterns: ${JSON.stringify(userContext?.completion_history || {})}

**Classification Rules:**
1. **Tasks**: One-time activities with specific outcomes and deadlines
2. **Habits**: Recurring activities that build skills/behaviors over time
3. **Recurring Tasks**: Regular responsibilities that need completion but aren't habit-forming

**Task Identification Criteria:**
- Has specific deadline or due date
- One-time completion required
- Clear deliverable or outcome
- Project-based activities
- Learning milestones

**Habit Identification Criteria:**
- Daily/weekly recurring activities
- Skill-building exercises
- Health and wellness activities
- Personal development practices
- Activities that benefit from consistency

**Recurring Task Identification Criteria:**
- Regular maintenance activities
- Review and reporting tasks
- Administrative responsibilities
- Meetings and check-ins
- Cleanup and organization

**Output Format (JSON):**
{
  "classifications": [
    {
      "title": "Item title",
      "type": "task|habit|recurring-task",
      "confidence": 0.95,
      "reasoning": "Why this classification makes sense",
      "suggested_priority": "low|medium|high",
      "suggested_frequency": "daily|weekly|monthly",
      "estimated_duration": "30 min",
      "due_date": "ISO date if applicable",
      "recurrence_rule": "RRULE or custom pattern for recurring tasks",
      "habit_potential": {
        "is_habit": true,
        "frequency": "daily",
        "target_value": 1,
        "streak_suggestion": 21,
        "best_time": "morning|afternoon|evening",
        "trigger_activity": "existing habit to stack with"
      },
      "dependencies": ["Items that should be completed first"],
      "quick_win": true/false,
      "long_term_build": true/false
    }
  ],
  "application_strategy": {
    "recommended_order": ["Suggested order of application"],
    "dependencies": ["Items that depend on others"],
    "quick_wins": ["Items for immediate success"],
    "long_term_builds": ["Items that develop over time"],
    "total_estimated_time": "Total time commitment per week",
    "balance_score": "How well this balances different life areas"
  },
  "warnings": [
    "Potential conflicts or overload warnings",
    "Items that might be too ambitious",
    "Timing considerations"
  ],
  "success_metrics": [
    "How to measure successful application",
    "Key performance indicators for each item type"
  ]
}

**Confidence Scoring Guidelines:**
- **0.9-1.0**: Very clear classification, strong pattern match
- **0.7-0.89**: Good classification with reasonable confidence
- **0.5-0.69**: Moderate confidence, multiple interpretations possible
- **0.3-0.49**: Low confidence, user input recommended
- **0.0-0.29**: Very uncertain, manual classification needed

**Recurrence Rule Examples:**
- Daily: "FREQ=DAILY"
- Weekly: "FREQ=WEEKLY;BYDAY=MO,WE,FR"
- Monthly: "FREQ=MONTHLY;BYMONTHDAY=1"
- Workdays: "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR"`;

      const systemPrompt = "You are an intelligent task and habit classifier. Analyze plan suggestions and provide detailed classifications with confidence scores and application strategies. Focus on realistic categorization and practical implementation guidance.";

      return this.executeAIRequest<any, SuggestionApplicationStrategy>({
         type: "analysis",
         input: { suggestionContent, userContext },
         prompt,
         systemPrompt,
         config,
      });
   }

   /**
    * Extract items from suggestion content for application
    */
   static extractItemsFromSuggestion(
      suggestion: any,
      applyAs: "task" | "habit" | "recurring-task"
   ): SuggestionItemClassification[] {
      const items: SuggestionItemClassification[] = [];

      if (!suggestion || typeof suggestion !== 'object') {
         return items;
      }

      // Extract from plan suggestions
      if (suggestion.weekly_breakdown && Array.isArray(suggestion.weekly_breakdown)) {
         suggestion.weekly_breakdown.forEach((week: any, weekIndex: number) => {
            // Extract from goals
            if (week.goals && Array.isArray(week.goals)) {
               week.goals.forEach((goal: any, goalIndex: number) => {
                  if (goal.tasks && Array.isArray(goal.tasks)) {
                     goal.tasks.forEach((task: any, taskIndex: number) => {
                        const classification: SuggestionItemClassification = {
                           title: task.title,
                           type: applyAs,
                           confidence: this.calculateConfidence(task.title, applyAs),
                           reasoning: this.generateReasoning(task.title, applyAs),
                           suggested_priority: task.priority || this.inferPriority(task.title),
                           estimated_duration: task.duration || "30 min",
                           due_date: task.dueDate,
                           quick_win: this.isQuickWin(task.title),
                           long_term_build: this.isLongTermBuild(task.title),
                        };

                        if (applyAs === "recurring-task") {
                           classification.recurrence_rule = this.generateRecurrenceRule(task.title);
                        } else if (applyAs === "habit") {
                           classification.habit_potential = this.analyzeHabitPotential(task.title);
                           classification.suggested_frequency = classification.habit_potential.frequency;
                        }

                        items.push(classification);
                     });
                  }
               });
            }

            // Extract from daily tasks
            if (week.daily_tasks && typeof week.daily_tasks === 'object') {
               Object.entries(week.daily_tasks).forEach(([day, tasks]: [string, any]) => {
                  if (Array.isArray(tasks)) {
                     tasks.forEach((taskTitle: string, index: number) => {
                        const classification: SuggestionItemClassification = {
                           title: taskTitle,
                           type: applyAs,
                           confidence: this.calculateConfidence(taskTitle, applyAs),
                           reasoning: this.generateReasoning(taskTitle, applyAs),
                           suggested_priority: this.inferPriority(taskTitle),
                           estimated_duration: "30 min",
                           due_date: this.calculateDueDate(weekIndex, day),
                           quick_win: this.isQuickWin(taskTitle),
                           long_term_build: this.isLongTermBuild(taskTitle),
                        };

                        if (applyAs === "recurring-task") {
                           classification.recurrence_rule = this.generateRecurrenceRule(taskTitle);
                        } else if (applyAs === "habit") {
                           classification.habit_potential = this.analyzeHabitPotential(taskTitle);
                           classification.suggested_frequency = classification.habit_potential.frequency;
                        }

                        items.push(classification);
                     });
                  }
               });
            }
         });
      }

      return items;
   }

   /**
    * Calculate confidence score for item classification
    */
   private static calculateConfidence(title: string, type: "task" | "habit" | "recurring-task"): number {
      const lowerTitle = title.toLowerCase();

      if (type === "task") {
         const taskKeywords = ["complete", "finish", "submit", "deliver", "create", "build", "develop"];
         const matches = taskKeywords.filter(keyword => lowerTitle.includes(keyword)).length;
         return Math.min(0.9, 0.5 + (matches * 0.1));
      }

      if (type === "habit") {
         const habitKeywords = ["exercise", "meditate", "read", "write", "practice", "study", "daily", "every"];
         const matches = habitKeywords.filter(keyword => lowerTitle.includes(keyword)).length;
         return Math.min(0.95, 0.6 + (matches * 0.1));
      }

      if (type === "recurring-task") {
         const recurringKeywords = ["review", "meeting", "report", "check", "update", "weekly", "monthly"];
         const matches = recurringKeywords.filter(keyword => lowerTitle.includes(keyword)).length;
         return Math.min(0.9, 0.5 + (matches * 0.1));
      }

      return 0.5;
   }

   /**
    * Generate reasoning for classification
    */
   private static generateReasoning(title: string, type: "task" | "habit" | "recurring-task"): string {
      const lowerTitle = title.toLowerCase();

      if (type === "task") {
         if (lowerTitle.includes("complete") || lowerTitle.includes("finish")) {
            return "Contains completion-oriented language indicating a one-time task";
         }
         return "Appears to be a specific activity with clear deliverable";
      }

      if (type === "habit") {
         if (lowerTitle.includes("daily") || lowerTitle.includes("every")) {
            return "Contains frequency indicators suggesting a recurring habit";
         }
         return "Represents an activity that benefits from consistent practice";
      }

      if (type === "recurring-task") {
         if (lowerTitle.includes("review") || lowerTitle.includes("meeting")) {
            return "Contains maintenance or coordination language typical of recurring tasks";
         }
         return "Represents a regular responsibility that needs periodic completion";
      }

      return "Classification based on pattern analysis";
   }

   /**
    * Generate recurrence rule for recurring tasks
    */
   private static generateRecurrenceRule(title: string): string {
      const lowerTitle = title.toLowerCase();

      if (lowerTitle.includes("daily")) return "FREQ=DAILY";
      if (lowerTitle.includes("weekly")) return "FREQ=WEEKLY";
      if (lowerTitle.includes("monthly")) return "FREQ=MONTHLY";
      if (lowerTitle.includes("workday") || lowerTitle.includes("weekday")) {
         return "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR";
      }

      // Default to weekly for recurring tasks
      return "FREQ=WEEKLY";
   }

   /**
    * Analyze habit potential of an item
    */
   private static analyzeHabitPotential(title: string) {
      const lowerTitle = title.toLowerCase();

      const dailyHabits = ["exercise", "meditate", "read", "write", "practice", "study"];
      const weeklyHabits = ["review", "plan", "organize", "clean", "shop"];

      let frequency: "daily" | "weekly" | "monthly" = "daily";
      let targetValue = 1;

      if (dailyHabits.some(habit => lowerTitle.includes(habit))) {
         frequency = "daily";
         targetValue = 1;
      } else if (weeklyHabits.some(habit => lowerTitle.includes(habit))) {
         frequency = "weekly";
         targetValue = 7;
      } else {
         frequency = "monthly";
         targetValue = 30;
      }

      return {
         is_habit: true,
         frequency,
         target_value: targetValue,
         streak_suggestion: 21,
         best_time: this.inferBestTime(lowerTitle),
         trigger_activity: this.inferTriggerActivity(lowerTitle),
      };
   }

   /**
    * Infer best time for habit
    */
   private static inferBestTime(title: string): "morning" | "afternoon" | "evening" {
      const lowerTitle = title.toLowerCase();

      if (lowerTitle.includes("morning") || lowerTitle.includes("breakfast")) return "morning";
      if (lowerTitle.includes("evening") || lowerTitle.includes("night")) return "evening";
      if (lowerTitle.includes("afternoon") || lowerTitle.includes("lunch")) return "afternoon";

      // Default based on activity type
      if (lowerTitle.includes("exercise") || lowerTitle.includes("meditate")) return "morning";
      if (lowerTitle.includes("read") || lowerTitle.includes("study")) return "evening";

      return "morning";
   }

   /**
    * Infer trigger activity for habit stacking
    */
   private static inferTriggerActivity(title: string): string {
      const lowerTitle = title.toLowerCase();

      if (lowerTitle.includes("exercise")) return "after waking up";
      if (lowerTitle.includes("meditate")) return "after waking up";
      if (lowerTitle.includes("read")) return "before bed";
      if (lowerTitle.includes("write")) return "after morning coffee";
      if (lowerTitle.includes("study")) return "after dinner";

      return "daily";
   }

   /**
    * Check if item is a quick win
    */
   private static isQuickWin(title: string): boolean {
      const lowerTitle = title.toLowerCase();
      const quickWinKeywords = ["quick", "simple", "easy", "short", "brief", "review", "check"];
      return quickWinKeywords.some(keyword => lowerTitle.includes(keyword));
   }

   /**
    * Check if item is a long term build
    */
   private static isLongTermBuild(title: string): boolean {
      const lowerTitle = title.toLowerCase();
      const longTermKeywords = ["learn", "develop", "build", "create", "master", "practice", "study"];
      return longTermKeywords.some(keyword => lowerTitle.includes(keyword));
   }

   /**
    * Calculate due date from week and day
    */
   private static calculateDueDate(weekIndex: number, day: string): string {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const weekStart = new Date(startOfMonth.getTime() + (weekIndex * 7 * 24 * 60 * 60 * 1000));

      const dayMap: { [key: string]: number } = {
         'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
         'friday': 5, 'saturday': 6, 'sunday': 0
      };

      const dayOffset = dayMap[day.toLowerCase()] || 0;
      const dueDate = new Date(weekStart.getTime() + (dayOffset * 24 * 60 * 60 * 1000));

      return dueDate.toISOString().split('T')[0];
   }
}
