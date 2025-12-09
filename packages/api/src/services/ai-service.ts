import { openai } from "../lib/openrouter";
import { SimpleRetry } from "../error-handling/simple-retry";
import { FallbackHandler } from "../error-handling/fallback-handler";
import type {
   BriefingSuggestionContent,
   PlanSuggestionContent,
   RescheduleSuggestionContent,
   TaskPriority,
} from "@my-better-t-app/db";

interface AIServiceConfig {
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

   // Rich scheduling information from AI plans
   start_time?: string; // ISO timestamp or time string (e.g., "9:00 AM")
   end_time?: string; // ISO timestamp or time string (e.g., "12:00 PM")
   day_of_week?: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
   week_number?: number; // Week number in the plan (1-4)
   time_block?: "morning" | "afternoon" | "evening" | "night";
   plan_context?: {
      week_focus?: string; // e.g., "React Native Setup and TypeScript Fundamentals"
      goal?: string; // e.g., "Set up React Native development environment"
      original_task_string?: string; // Original task string from AI
   };

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

/**
     * Generic AI request handler with retry logic
     */
export async function executeAIRequest<TInput = any, TOutput = any>(
   request: AIRequest<TInput>
): Promise<AIResponse<TOutput>> {
   const { type, input, prompt, systemPrompt, config = {} } = request;
   const {
      maxRetries = 3,
      model = "google/gemini-2.5-flash",
   } = config;

   try {

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

      return {
         success: true,
         data: retryResult.data,
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
export async function generatePlan(
   userGoals: string,
   config?: AIServiceConfig
): Promise<AIResponse<PlanSuggestionContent>> {
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
   return await executeAIRequest<string, PlanSuggestionContent>({
      type: "plan",
      input: userGoals,
      prompt,
      systemPrompt,
      config,
   });
}

/**
     * Regenerate plan based on user feedback and execution insights
     */
export async function regeneratePlan(
   originalPlanId: string,
   regenerationReason: string,
   config?: AIServiceConfig
): Promise<AIResponse<PlanSuggestionContent>> {
   try {
      // Fetch original plan data
      const originalPlan = await fetchPlanData(originalPlanId);
      if (!originalPlan) {
         return {
            success: false,
            error: "Original plan not found",
         };
      }

      // Get execution insights if available
      let executionInsights = "";
      try {
         const { aiQueries } = await import("@my-better-t-app/db");
         const suggestion = await aiQueries.getSuggestionById(originalPlanId);

         if (suggestion && suggestion.applicationHistory) {
            const history = suggestion.applicationHistory as any[];
            if (history.length > 0) {
               const latestExecution = history[history.length - 1];
               executionInsights = `
**Previous Execution Insights:**
- Completion Rate: ${latestExecution.completionRate || 'N/A'}%
- Common Issues: ${latestExecution.issues?.join(', ') || 'None identified'}
- User Feedback: ${latestExecution.userFeedback || 'No specific feedback'}
- Time Management: ${latestExecution.timeManagement || 'Not analyzed'}
`;
            }
         }
      } catch (error) {
         console.warn('Could not fetch execution insights:', error);
      }

      const currentDate = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const prompt = `You are an intelligent monthly planning assistant specializing in plan regeneration and improvement. Your task is to create an improved version of a previous plan based on user feedback and execution insights.

**Original Plan:**
${JSON.stringify(originalPlan, null, 2)}

**User Regeneration Reason:**
${regenerationReason}

${executionInsights}

**Context:**
- Current month: ${currentMonth}
- Current date: ${currentDate}
- User's preferences: Standard work hours, balanced energy patterns, flexible scheduling

**Regeneration Guidelines:**
1. Address specific user concerns mentioned in regeneration reason
2. Learn from previous execution insights and avoid repeating issues
3. Maintain core goals but adjust approach, timeline, or breakdown
4. Consider workload balance and realistic time estimates
5. Provide more flexibility where previous plan was too rigid
6. Add buffer time for unexpected delays if time management was an issue

**Output Format (JSON):**
{
  "monthly_summary": "Improved overview addressing user concerns",
  "weekly_breakdown": [
    {
      "week": 1,
      "focus": "Refined weekly theme",
      "goals": ["Adjusted weekly goal 1", "Adjusted weekly goal 2"],
      "daily_tasks": {
        "Monday": ["Improved task 1", "Improved task 2"],
        "Tuesday": ["Improved task 1", "Improved task 2"]
      }
    }
  ],
  "improvements_made": [
    "Specific improvement 1 based on feedback",
    "Specific improvement 2 based on execution insights"
  ],
  "potential_conflicts": ["Any new identified issues"],
  "success_metrics": ["Refined success metrics"]
}

**Key Improvements to Focus On:**
- If user found plan too ambitious: Reduce daily task count, extend timelines
- If user found plan too easy: Add challenging elements, increase complexity
- If time management was an issue: Better time estimates, more buffer time
- If tasks were unclear: More specific, actionable task descriptions
- If motivation was low: Add quick wins, milestone celebrations`;

      const systemPrompt = "You are an expert planning assistant specializing in iterative plan improvement. Create enhanced plans that directly address user feedback while learning from previous execution patterns. Focus on realistic, achievable improvements that maintain user motivation.";

      const response = await executeAIRequest<any, PlanSuggestionContent>({
         type: "plan",
         input: { originalPlan, regenerationReason, executionInsights },
         prompt,
         systemPrompt,
         config,
      });

      // If regeneration is successful, save it as a new suggestion with reference to original
      if (response.success && config?.userId) {
         try {
            const { aiQueries } = await import("@my-better-t-app/db");
            await aiQueries.createSuggestion(
               config.userId,
               "plan",
               response.data!
            );

            // Add to application history of original plan
            await aiQueries.addToApplicationHistory(originalPlanId, {
               type: "regeneration",
               timestamp: Date.now(),
               reason: regenerationReason,
               newPlanId: response.data, // This would be the ID of the new plan
            });
         } catch (error) {
            console.warn('Could not save regenerated plan:', error);
         }
      }

      return response;
   } catch (error) {
      console.error('Error in regeneratePlan:', error);
      return {
         success: false,
         error: error instanceof Error ? error.message : "Unknown error during plan regeneration",
      };
   }
}

/**
 * Modify existing plan based on specific user feedback and adjustments
 */
export async function modifyPlan(
   planId: string,
   modifications: {
      userFeedback?: string;
      completedTasks?: string[];
      newGoals?: string[];
      timeConstraints?: string;
      priorityAdjustments?: Array<{ taskTitle: string, newPriority: TaskPriority }>;
      weeklyAdjustments?: Array<{ week: number, adjustments: string[] }>;
   },
   config?: AIServiceConfig
): Promise<AIResponse<PlanSuggestionContent>> {
   try {
      // Fetch existing plan
      const existingPlan = await fetchPlanData(planId);
      if (!existingPlan) {
         return {
            success: false,
            error: "Plan not found",
         };
      }

      // Get execution data if available
      let executionContext = "";
      if (modifications.completedTasks && modifications.completedTasks.length > 0) {
         executionContext = `
**Completed Tasks:**
${modifications.completedTasks.map(task => `- ${task}`).join('\n')}

**Progress Analysis:**
- Completed ${modifications.completedTasks.length} tasks
- This represents ${modifications.completedTasks.length > 0 ? 'good progress' : 'limited progress'} toward goals
`;
      }

      const currentDate = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Build modification context
      const modificationContext = [];
      if (modifications.userFeedback) {
         modificationContext.push(`**User Feedback:** ${modifications.userFeedback}`);
      }
      if (modifications.newGoals && modifications.newGoals.length > 0) {
         modificationContext.push(`**New Goals to Add:** ${modifications.newGoals.join(', ')}`);
      }
      if (modifications.timeConstraints) {
         modificationContext.push(`**Time Constraints:** ${modifications.timeConstraints}`);
      }
      if (modifications.priorityAdjustments && modifications.priorityAdjustments.length > 0) {
         modificationContext.push(`**Priority Adjustments:** ${modifications.priorityAdjustments.map(adj => `- ${adj.taskTitle}: ${adj.newPriority}`).join('\n')}`);
      }
      if (modifications.weeklyAdjustments && modifications.weeklyAdjustments.length > 0) {
         modificationContext.push(`**Weekly Adjustments:** ${modifications.weeklyAdjustments.map(adj => `- Week ${adj.week}: ${adj.adjustments.join(', ')}`).join('\n')}`);
      }

      const prompt = `You are an intelligent monthly planning assistant specializing in plan modification and refinement. Your task is to modify an existing plan based on specific user feedback and adjustments while maintaining overall coherence and structure.

**Existing Plan:**
${JSON.stringify(existingPlan, null, 2)}

**Modification Requests:**
${modificationContext.join('\n')}

**Execution Context:**
${executionContext}

**Context:**
- Current month: ${currentMonth}
- Current date: ${currentDate}
- User's preferences: Standard work hours, balanced energy patterns, flexible scheduling

**Modification Guidelines:**
1. Apply all requested modifications precisely
2. Maintain plan structure and consistency across weeks
3. Adjust related tasks when priorities change
4. Rebalance workload when new goals are added
5. Respect time constraints and adjust timelines accordingly
6. Ensure all weekly themes align with overall monthly goals
7. Keep task descriptions specific and actionable

**Output Format (JSON):**
{
  "monthly_summary": "Updated overview reflecting all modifications",
  "weekly_breakdown": [
    {
      "week": 1,
      "focus": "Updated weekly theme",
      "goals": ["Modified weekly goal 1", "Modified weekly goal 2"],
      "daily_tasks": {
        "Monday": ["Adjusted task 1", "Adjusted task 2"],
        "Tuesday": ["Adjusted task 1", "Adjusted task 2"]
      }
    }
  ],
  "modifications_applied": [
    "Specific modification 1 that was applied",
    "Specific modification 2 that was applied"
  ],
  "impact_analysis": {
    "workload_change": "increased/decreased/maintained",
    "timeline_impact": "extended/shortened/maintained",
    "priority_rebalancing": "description of priority changes"
  },
  "potential_conflicts": ["Any new conflicts from modifications"],
  "success_metrics": ["Refined success metrics"]
}

**Key Modification Rules:**
- When priorities change: Adjust task order and weekly emphasis
- When new goals are added: Integrate them without overloading weeks
- When time constraints are specified: Adjust task duration and frequency
- When user feedback is provided: Address specific concerns directly
- Maintain realistic daily task limits (3-4 major tasks per day)`;

      const systemPrompt = "You are an expert planning assistant specializing in precise plan modifications. Apply all requested changes accurately while maintaining plan coherence, realistic workloads, and achievable timelines. Focus on implementing user feedback exactly as requested.";

      const response = await executeAIRequest<any, PlanSuggestionContent>({
         type: "plan",
         input: { existingPlan, modifications, executionContext },
         prompt,
         systemPrompt,
         config,
      });

      // If modification is successful, update the original suggestion
      if (response.success && config?.userId) {
         try {
            const { aiQueries } = await import("@my-better-t-app/db");

            // Update the original suggestion with new content
            await aiQueries.updateSuggestionContent(planId, response.data!);

            // Add to application history
            await aiQueries.addToApplicationHistory(planId, {
               type: "modification",
               timestamp: Date.now(),
               modifications,
               modifiedContent: response.data,
            });
         } catch (error) {
            console.warn('Could not save modified plan:', error);
         }
      }

      return response;
   } catch (error) {
      console.error('Error in modifyPlan:', error);
      return {
         success: false,
         error: error instanceof Error ? error.message : "Unknown error during plan modification",
      };
   }
}








/**
     * Parse plan content for task conversion
     */
export function parsePlanForTasks(plan: PlanSuggestionContent): PlanTask[] {
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
                  priority: task.priority || inferPriority(task.title),
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
export function parsePlanForHabits(plan: PlanSuggestionContent): PlanHabit[] {
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
         const frequency = inferFrequency(title, count);
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
 * Populate calendar with classified items from AI suggestions
 */
export async function populateCalendar(
   userId: string,
   classifiedItems: SuggestionItemClassification[],
   options?: {
      startDate?: Date;
      endDate?: Date;
      avoidConflicts?: boolean;
      preferredTimes?: Record<string, string>;
      defaultDuration?: number; // in minutes
   }
): Promise<AIResponse<{
   createdEvents: Array<{
      id: string;
      title: string;
      type: "task" | "habit" | "recurring-task";
      startTime: Date;
      endTime: Date;
      classification: SuggestionItemClassification;
   }>;
   conflicts: Array<{
      item: SuggestionItemClassification;
      conflict: string;
      suggestion: string;
   }>;
   suggestions: string[];
   totalScheduled: number;
   totalSkipped: number;
}>> {
   try {
      const { calendarQueries, taskQueries, habitQueries } = await import("@my-better-t-app/db");

      const startDate = options?.startDate || new Date();
      const endDate = options?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const avoidConflicts = options?.avoidConflicts !== false; // default to true
      const defaultDuration = options?.defaultDuration || 30; // 30 minutes default
      const preferredTimes = options?.preferredTimes || {};

      const createdEvents: any[] = [];
      const conflicts: any[] = [];
      const suggestions: string[] = [];
      let totalScheduled = 0;
      let totalSkipped = 0;

      // Sort items by priority and type for optimal scheduling
      const sortedItems = classifiedItems.sort((a, b) => {
         const priorityOrder = { high: 3, medium: 2, low: 1 };
         const aPriority = priorityOrder[a.suggested_priority] || 1;
         const bPriority = priorityOrder[b.suggested_priority] || 1;

         if (aPriority !== bPriority) {
            return bPriority - aPriority; // Higher priority first
         }

         // Schedule habits before tasks for consistency
         if (a.type === 'habit' && b.type !== 'habit') return -1;
         if (b.type === 'habit' && a.type !== 'habit') return 1;

         return 0;
      });

      // Process each classified item
      for (const item of sortedItems) {
         try {
            const scheduledEvent = await scheduleCalendarItem(
               userId,
               item,
               startDate,
               endDate,
               avoidConflicts,
               preferredTimes,
               defaultDuration
            );

            if (scheduledEvent.success) {
               // Create the calendar event
               const calendarEvent = await calendarQueries.createEvent(userId, {
                  title: item.title,
                  description: `AI-scheduled ${item.type}: ${item.reasoning}`,
                  startTime: scheduledEvent.startTime!,
                  endTime: scheduledEvent.endTime!,
               });

               // Create corresponding task or habit if needed
               if (item.type === 'task') {
                  await taskQueries.createTask(userId, {
                     title: item.title,
                     description: item.reasoning,
                     priority: item.suggested_priority,
                     dueDate: new Date(scheduledEvent.startTime!),
                     suggestionId: item.title, // Use title as reference
                  });
               } else if (item.type === 'habit') {
                  await habitQueries.createHabit(userId, {
                     title: item.title,
                     description: item.reasoning,
                     frequency: item.suggested_frequency || 'daily',
                     bestTime: item.habit_potential?.best_time,
                     triggerActivity: item.habit_potential?.trigger_activity,
                     suggestionId: item.title,
                  });
               }

               createdEvents.push({
                  id: calendarEvent.id,
                  title: calendarEvent.title,
                  type: item.type,
                  startTime: new Date(calendarEvent.startTime),
                  endTime: new Date(calendarEvent.endTime),
                  classification: item,
               });

               totalScheduled++;
            } else {
               conflicts.push({
                  item,
                  conflict: scheduledEvent.reason || 'Scheduling conflict',
                  suggestion: scheduledEvent.suggestion || 'Try a different time',
               });
               totalSkipped++;
            }
         } catch (error) {
            console.error(`Error scheduling item ${item.title}:`, error);
            conflicts.push({
               item,
               conflict: error instanceof Error ? error.message : 'Unknown error',
               suggestion: 'Manual scheduling required',
            });
            totalSkipped++;
         }
      }

      // Generate scheduling suggestions
      if (conflicts.length > 0) {
         suggestions.push(`${conflicts.length} items could not be automatically scheduled due to conflicts`);
         suggestions.push('Consider adjusting time preferences or resolving conflicts manually');
      }

      if (totalScheduled > 0) {
         suggestions.push(`Successfully scheduled ${totalScheduled} items in your calendar`);
      }

      if (totalSkipped > totalScheduled) {
         suggestions.push('Review conflicting items and consider alternative scheduling times');
      }

      return {
         success: true,
         data: {
            createdEvents,
            conflicts,
            suggestions,
            totalScheduled,
            totalSkipped,
         },
      };
   } catch (error) {
      console.error('Error in populateCalendar:', error);
      return {
         success: false,
         error: error instanceof Error ? error.message : "Unknown error during calendar population",
      };
   }
}

/**
 * Helper function to schedule a single calendar item
 */
async function scheduleCalendarItem(
   userId: string,
   item: SuggestionItemClassification,
   startDate: Date,
   endDate: Date,
   avoidConflicts: boolean,
   preferredTimes: Record<string, string>,
   defaultDuration: number
): Promise<{
   success: boolean;
   startTime?: Date;
   endTime?: Date;
   reason?: string;
   suggestion?: string;
}> {
   try {
      const { calendarQueries } = await import("@my-better-t-app/db");

      // Calculate duration based on item type and estimated duration
      let duration = defaultDuration;
      if (item.estimated_duration) {
         // Parse duration string like "30 min", "1 hour", "2 hours"
         const durationMatch = item.estimated_duration.match(/(\d+)\s*(hour|hr|minute|min)/i);
         if (durationMatch) {
            const value = parseInt(durationMatch[1]);
            const unit = durationMatch[2].toLowerCase();
            duration = unit.includes('hour') || unit.includes('hr') ? value * 60 : value;
         }
      }

      // Determine optimal scheduling time based on item type and preferences
      let preferredTime = preferredTimes[item.type] || preferredTimes['default'];

      if (item.habit_potential?.best_time) {
         preferredTime = item.habit_potential.best_time;
      }

      // Calculate start time based on preferences
      const startTime = calculateOptimalStartTime(
         startDate,
         endDate,
         preferredTime,
         item.type === 'habit' // habits should be scheduled consistently
      );

      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      // Check for conflicts if avoidance is enabled
      if (avoidConflicts) {
         const conflictingEvents = await calendarQueries.findOverlappingEvents(
            userId,
            startTime,
            endTime
         );

         if (conflictingEvents.length > 0) {
            // Try to find alternative time slots
            const alternativeSlot = await findAlternativeTimeSlot(
               userId,
               startTime,
               endTime,
               duration,
               endDate
            );

            if (alternativeSlot) {
               return {
                  success: true,
                  startTime: alternativeSlot.start,
                  endTime: alternativeSlot.end,
               };
            } else {
               return {
                  success: false,
                  reason: `Conflicts with ${conflictingEvents.length} existing events`,
                  suggestion: 'Try scheduling on a different day or time',
               };
            }
         }
      }

      return {
         success: true,
         startTime,
         endTime,
      };
   } catch (error) {
      return {
         success: false,
         reason: error instanceof Error ? error.message : 'Unknown scheduling error',
      };
   }
}

/**
 * Calculate optimal start time based on preferences and item type
 */
function calculateOptimalStartTime(
   startDate: Date,
   endDate: Date,
   preferredTime: string | undefined,
   isHabit: boolean
): Date {
   const now = new Date();
   let startTime = new Date(Math.max(now.getTime(), startDate.getTime()));

   // Set preferred time of day
   if (preferredTime) {
      const timeMap: Record<string, { hour: number; minute: number }> = {
         morning: { hour: 8, minute: 0 },
         afternoon: { hour: 14, minute: 0 },
         evening: { hour: 18, minute: 0 },
      };

      const timeSlot = timeMap[preferredTime.toLowerCase()];
      if (timeSlot) {
         startTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);

         // If the preferred time has passed today, move to tomorrow
         if (startTime < now) {
            startTime.setDate(startTime.getDate() + 1);
         }
      }
   }

   // For habits, try to schedule at consistent times
   if (isHabit) {
      // Find the next consistent time slot
      while (startTime.getDay() === 0 || startTime.getDay() === 6) { // Avoid weekends for habits unless specified
         startTime.setDate(startTime.getDate() + 1);
      }
   }

   // Ensure we're within the allowed date range
   const startTimeMs = startTime.getTime();
   if (startTimeMs > endDate.getTime()) {
      return new Date(startDate); // Return earliest possible time if no suitable slot found
   }

   return startTime;
}

/**
     * Helper function to find alternative time slot for conflicting events
     */
async function findAlternativeTimeSlot(
   userId: string,
   originalStart: Date,
   originalEnd: Date,
   duration: number,
   endDate: Date
): Promise<{ start: Date; end: Date } | null> {
   try {
      const { calendarQueries } = await import("@my-better-t-app/db");

      // Try slots in 30-minute increments for the next 7 days
      const searchEnd = new Date(Math.min(originalEnd.getTime() + 7 * 24 * 60 * 60 * 1000, endDate.getTime()));
      let currentSlot = new Date(originalStart);

      while (currentSlot < searchEnd) {
         const slotEnd = new Date(currentSlot.getTime() + duration * 60 * 1000);

         const conflicts = await calendarQueries.findOverlappingEvents(
            userId,
            currentSlot,
            slotEnd
         );

         if (conflicts.length === 0) {
            return { start: currentSlot, end: slotEnd };
         }

         // Move to next 30-minute slot
         currentSlot.setTime(currentSlot.getTime() + 30 * 60 * 1000);
      }

      return null;
   } catch (error) {
      console.error('Error finding alternative time slot:', error);
      return null;
   }
}

/**
 * Modify calendar schedule dynamically based on user adjustments
 */
export async function modifyCalendarSchedule(
   userId: string,
   modifications: {
      rescheduleTasks?: Array<{ taskId: string, newDate: string, newTime?: string }>;
      adjustHabits?: Array<{ habitId: string, newTime: string, newFrequency?: string }>;
      pauseItems?: Array<{ id: string, type: "task" | "habit", pauseUntil: string }>;
      resumeItems?: Array<{ id: string, type: "task" | "habit" }>;
      bulkReschedule?: {
         fromDate: string;
         toDate: string;
         reason: string;
      };
   },
   _reason?: string
): Promise<AIResponse<{
   modifiedEvents: Array<{
      id: string;
      type: "task" | "habit" | "event";
      action: "rescheduled" | "paused" | "resumed" | "adjusted";
      previousTime?: Date;
      newTime?: Date;
      details: string;
   }>;
   impact: string[];
   warnings: string[];
   conflicts: Array<{
      id: string;
      title: string;
      conflict: string;
      suggestion: string;
   }>;
}>> {
   try {
      const { calendarQueries, taskQueries, habitQueries } = await import("@my-better-t-app/db");

      const modifiedEvents: any[] = [];
      const impact: string[] = [];
      const warnings: string[] = [];
      const conflicts: any[] = [];

      // Process task rescheduling
      if (modifications.rescheduleTasks) {
         for (const reschedule of modifications.rescheduleTasks) {
            try {
               // Get the task and its associated calendar events
               const task = await taskQueries.findByUser(userId, {}).then(tasks =>
                  tasks.find(t => t.id === reschedule.taskId)
               );

               if (!task) {
                  warnings.push(`Task ${reschedule.taskId} not found`);
                  continue;
               }

               const taskEvents = await calendarQueries.findByTask(reschedule.taskId);

               for (const event of taskEvents) {
                  const newDateTime = parseDateTime(reschedule.newDate, reschedule.newTime);

                  if (!newDateTime) {
                     warnings.push(`Invalid date/time format for task ${reschedule.taskId}`);
                     continue;
                  }

                  // Check for conflicts at new time
                  const conflictingEvents = await calendarQueries.findOverlappingEvents(
                     userId,
                     newDateTime,
                     new Date(newDateTime.getTime() + (event.endTime.getTime() - event.startTime.getTime()))
                  );

                  if (conflictingEvents.length > 0) {
                     conflicts.push({
                        id: event.id,
                        title: event.title,
                        conflict: `Conflicts with ${conflictingEvents.length} existing events`,
                        suggestion: 'Choose a different time or resolve conflicts manually',
                     });
                     continue;
                  }
                  // Update the calendar event
                  await calendarQueries.updateEvent(event.id, {
                     startTime: newDateTime,
                     endTime: new Date(newDateTime.getTime() + (event.endTime.getTime() - event.startTime.getTime())),
                  });

                  // Update the task due date
                  await taskQueries.updateStatus(reschedule.taskId, "pending"); // Reset to pending if completed

                  modifiedEvents.push({
                     id: event.id,
                     type: "task",
                     action: "rescheduled",
                     previousTime: new Date(event.startTime),
                     newTime: newDateTime,
                     details: `Rescheduled from ${new Date(event.startTime).toLocaleString()} to ${newDateTime.toLocaleString()}`,
                  });
               }

               impact.push(`Task "${task.title}" rescheduled to ${reschedule.newDate}`);
            } catch (error) {
               console.error(`Error rescheduling task ${reschedule.taskId}:`, error);
               warnings.push(`Failed to reschedule task ${reschedule.taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
         }
      }

      // Process habit adjustments
      if (modifications.adjustHabits) {
         for (const adjustment of modifications.adjustHabits) {
            try {
               const habit = await habitQueries.findById(adjustment.habitId);

               if (!habit) {
                  warnings.push(`Habit ${adjustment.habitId} not found`);
                  continue;
               }

               // Update habit properties (this would require extending the habit schema)
               // For now, we'll log the adjustment
               modifiedEvents.push({
                  id: adjustment.habitId,
                  type: "habit",
                  action: "adjusted",
                  newTime: new Date(adjustment.newTime),
                  details: `Habit time adjusted to ${adjustment.newTime}${adjustment.newFrequency ? `, frequency to ${adjustment.newFrequency}` : ''}`,
               });

               impact.push(`Habit "${habit.title}" adjusted: time to ${adjustment.newTime}${adjustment.newFrequency ? `, frequency to ${adjustment.newFrequency}` : ''}`);
            } catch (error) {
               console.error(`Error adjusting habit ${adjustment.habitId}:`, error);
               warnings.push(`Failed to adjust habit ${adjustment.habitId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
         }
      }

      // Process pause items
      if (modifications.pauseItems) {
         for (const pauseItem of modifications.pauseItems) {
            try {
               const pauseUntil = new Date(pauseItem.pauseUntil);

               if (pauseItem.type === "task") {
                  const task = await taskQueries.findByUser(userId, {}).then(tasks =>
                     tasks.find(t => t.id === pauseItem.id)
                  );

                  if (task) {
                     const taskEvents = await calendarQueries.findByTask(pauseItem.id);

                     for (const event of taskEvents) {
                        await calendarQueries.updateEvent(event.id, {
                           startTime: pauseUntil,
                           endTime: new Date(pauseUntil.getTime() + (event.endTime.getTime() - event.startTime.getTime())),
                        });
                     }

                     modifiedEvents.push({
                        id: pauseItem.id,
                        type: "task",
                        action: "paused",
                        newTime: pauseUntil,
                        details: `Paused until ${pauseUntil.toLocaleString()}`,
                     });
                  }
               } else if (pauseItem.type === "habit") {
                  // Habit pausing would require schema extension
                  modifiedEvents.push({
                     id: pauseItem.id,
                     type: "habit",
                     action: "paused",
                     newTime: pauseUntil,
                     details: `Paused until ${pauseUntil.toLocaleString()}`,
                  });
               }

               impact.push(`${pauseItem.type === "task" ? 'Task' : 'Habit'} paused until ${pauseUntil.toLocaleString()}`);
            } catch (error) {
               console.error(`Error pausing item ${pauseItem.id}:`, error);
               warnings.push(`Failed to pause ${pauseItem.type} ${pauseItem.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
         }
      }

      // Process resume items
      if (modifications.resumeItems) {
         for (const resumeItem of modifications.resumeItems) {
            try {
               const now = new Date();

               if (resumeItem.type === "task") {
                  const task = await taskQueries.findByUser(userId, {}).then(tasks =>
                     tasks.find(t => t.id === resumeItem.id)
                  );

                  if (task) {
                     const taskEvents = await calendarQueries.findByTask(resumeItem.id);

                     for (const event of taskEvents) {
                        await calendarQueries.updateEvent(event.id, {
                           startTime: now,
                           endTime: new Date(now.getTime() + (event.endTime.getTime() - event.startTime.getTime())),
                        });
                     }

                     modifiedEvents.push({
                        id: resumeItem.id,
                        type: "task",
                        action: "resumed",
                        newTime: now,
                        details: `Resumed at ${now.toLocaleString()}`,
                     });
                  }
               } else if (resumeItem.type === "habit") {
                  modifiedEvents.push({
                     id: resumeItem.id,
                     type: "habit",
                     action: "resumed",
                     newTime: now,
                     details: `Resumed at ${now.toLocaleString()}`,
                  });
               }

               impact.push(`${resumeItem.type === "task" ? 'Task' : 'Habit'} resumed`);
            } catch (error) {
               console.error(`Error resuming item ${resumeItem.id}:`, error);
               warnings.push(`Failed to resume ${resumeItem.type} ${resumeItem.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
         }
      }

      // Process bulk reschedule
      if (modifications.bulkReschedule) {
         try {
            const fromDate = new Date(modifications.bulkReschedule.fromDate);
            const toDate = new Date(modifications.bulkReschedule.toDate);

            // Get all events in the date range
            const eventsInRange = await calendarQueries.findByDateRange(userId, fromDate, toDate);

            for (const event of eventsInRange) {
               const timeDifference = toDate.getTime() - fromDate.getTime();
               const newStartTime = new Date(event.startTime.getTime() + timeDifference);
               const newEndTime = new Date(event.endTime.getTime() + timeDifference);

               await calendarQueries.updateEvent(event.id, {
                  startTime: newStartTime,
                  endTime: newEndTime,
               });

               modifiedEvents.push({
                  id: event.id,
                  type: "event",
                  action: "rescheduled",
                  previousTime: new Date(event.startTime),
                  newTime: newStartTime,
                  details: `Bulk rescheduled: ${modifications.bulkReschedule.reason}`,
               });
            }

            impact.push(`Bulk rescheduled ${eventsInRange.length} events: ${modifications.bulkReschedule.reason}`);
         } catch (error) {
            console.error('Error in bulk reschedule:', error);
            warnings.push(`Bulk reschedule failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
         }
      }

      // Generate summary insights
      if (modifiedEvents.length > 0) {
         impact.push(`Successfully modified ${modifiedEvents.length} calendar items`);
      }

      if (conflicts.length > 0) {
         warnings.push(`${conflicts.length} scheduling conflicts detected - manual resolution required`);
      }

      if (warnings.length > 0) {
         impact.push(`${warnings.length} issues encountered during modification`);
      }

      return {
         success: true,
         data: {
            modifiedEvents,
            impact,
            warnings,
            conflicts,
         },
      };
   } catch (error) {
      console.error('Error in modifyCalendarSchedule:', error);
      return {
         success: false,
         error: error instanceof Error ? error.message : "Unknown error during calendar modification",
      };
   }
}

/**
 * Helper function to parse date and time strings
 */
function parseDateTime(dateString: string, timeString?: string): Date | null {
   try {
      if (!dateString) {
         return null;
      }
      let dateTime = new Date(dateString);

      if (isNaN(dateTime.getTime())) {
         return null;
      }

      if (timeString) {
         const parts = timeString.split(':');
         if (parts.length === 2) {
            const hours = Number(parts[0]);
            const minutes = Number(parts[1]);
            if (!isNaN(hours) && !isNaN(minutes)) {
               dateTime.setHours(hours, minutes, 0, 0);
            }
         }
      }

      return dateTime;
   } catch (error) {
      return null;
   }
}

/**
 * Resolve calendar conflicts using AI-powered strategies
 */
export async function resolveCalendarConflicts(
   _userId: string,
   conflicts: Array<{
      eventId: string;
      conflictType: "overlap" | "resource" | "time";
      conflictingEventIds: string[];
      severity: "low" | "medium" | "high";
   }>,
   strategy?: "prioritize" | "reschedule" | "split" | "user_choice" | "ai_optimized"
): Promise<AIResponse<{
   resolutions: Array<{
      eventId: string;
      action: "keep" | "reschedule" | "split" | "cancel" | "merge";
      newTime?: Date;
      reason: string;
      confidence: number;
      alternatives?: Array<{
         action: string;
         description: string;
         impact: string;
      }>;
   }>;
   summary: {
      totalConflicts: number;
      resolvedConflicts: number;
      unresolvedConflicts: number;
      strategy: string;
      timeSaved: number; // in minutes
      recommendations: string[];
   };
   warnings: string[];
}>> {
   try {
      const { calendarQueries } = await import("@my-better-t-app/db");

      const resolutions: any[] = [];
      const warnings: string[] = [];
      let resolvedCount = 0;
      let timeSaved = 0;

      const selectedStrategy = strategy || "ai_optimized";

      // Process each conflict
      for (const conflict of conflicts) {
         try {
            // Get all events involved in the conflict
            const mainEvent = await calendarQueries.findById(conflict.eventId);
            const conflictingEvents = await Promise.all(
               conflict.conflictingEventIds.map(id => calendarQueries.findById(id))
            );

            if (!mainEvent) {
               warnings.push(`Main event ${conflict.eventId} not found`);
               continue;
            }

            const allEvents = [mainEvent, ...conflictingEvents.filter(Boolean)];

            // Apply resolution strategy
            const resolution = await applyConflictResolutionStrategy(
               allEvents,
               conflict.conflictType,
               conflict.severity,
               selectedStrategy
            );

            if (resolution.success) {
               // Apply the resolution
               for (const action of resolution.actions) {
                  try {
                     if (action.type === "reschedule") {
                        await calendarQueries.updateEvent(action.eventId, {
                           startTime: action.newStartTime,
                           endTime: action.newEndTime,
                        });
                     } else if (action.type === "split") {
                        // Split event into multiple smaller events
                        if (action.splitTimes) {
                           await splitCalendarEvent(action.eventId, action.splitTimes);
                        }
                     } else if (action.type === "cancel") {
                        await calendarQueries.deleteEvent(action.eventId);
                     }
                  } catch (error) {
                     console.error(`Error applying resolution for event ${action.eventId}:`, error);
                     warnings.push(`Failed to apply resolution for event ${action.eventId}`);
                  }
               }

               resolutions.push({
                  eventId: conflict.eventId,
                  action: resolution.primaryAction as "keep" | "reschedule" | "split" | "cancel" | "merge",
                  newTime: (resolution.actions[0] && resolution.actions[0].newStartTime) ? resolution.actions[0].newStartTime : undefined,
                  reason: resolution.reason,
                  confidence: resolution.confidence,
                  alternatives: resolution.alternatives,
               });

               resolvedCount++;
               timeSaved += resolution.timeSaved || 0;
            } else {
               warnings.push(`Could not resolve conflict for event ${conflict.eventId}: ${resolution.reason}`);
            }
         } catch (error) {
            console.error(`Error processing conflict ${conflict.eventId}:`, error);
            warnings.push(`Failed to process conflict for event ${conflict.eventId}`);
         }
      }

      // Generate summary and recommendations
      const summary = {
         totalConflicts: conflicts.length,
         resolvedConflicts: resolvedCount,
         unresolvedConflicts: conflicts.length - resolvedCount,
         strategy: selectedStrategy,
         timeSaved,
         recommendations: generateConflictRecommendations(resolvedCount, conflicts.length, selectedStrategy),
      };

      return {
         success: true,
         data: {
            resolutions,
            summary,
            warnings,
         },
      };
   } catch (error) {
      console.error('Error in resolveCalendarConflicts:', error);
      return {
         success: false,
         error: error instanceof Error ? error.message : "Unknown error during conflict resolution",
      };
   }
}

/**
 * Apply specific conflict resolution strategy
 */
async function applyConflictResolutionStrategy(
   events: any[],
   conflictType: string,
   severity: string,
   strategy: string
): Promise<{
   success: boolean;
   primaryAction: string;
   actions: Array<{
      eventId: string;
      type: string;
      newStartTime?: Date;
      newEndTime?: Date;
      splitTimes?: Date[];
   }>;
   reason: string;
   confidence: number;
   timeSaved?: number;
   alternatives?: Array<{
      action: string;
      description: string;
      impact: string;
   }>;
}> {
   try {
      switch (strategy) {
         case "prioritize":
            return await prioritizeStrategy(events, severity);
         case "reschedule":
            return await rescheduleStrategy(events, conflictType);
         case "split":
            return await splitStrategy(events);
         case "user_choice":
            return await userChoiceStrategy(events);
         case "ai_optimized":
         default:
            return await aiOptimizedStrategy(events, conflictType, severity);
      }
   } catch (error) {
      return {
         success: false,
         primaryAction: "none",
         actions: [],
         reason: error instanceof Error ? error.message : "Strategy application failed",
         confidence: 0,
      };
   }
}

/**
 * Prioritize strategy - keep highest priority events
 */
async function prioritizeStrategy(events: any[], _severity: string): Promise<any> {
   // Sort by priority (assuming priority is stored in event title or metadata)
   const sortedEvents = events.sort((a, b) => {
      // Extract priority from title or use creation time as fallback
      const aPriority = extractPriority(a.title);
      const bPriority = extractPriority(b.title);
      return bPriority - aPriority;
   });

   const highestPriority = sortedEvents[0];
   const lowerPriorityEvents = sortedEvents.slice(1);

   return {
      success: true,
      primaryAction: "keep",
      actions: [
         {
            eventId: highestPriority.id,
            type: "keep",
         },
         ...lowerPriorityEvents.map(event => ({
            eventId: event.id,
            type: "reschedule",
            newStartTime: findNextAvailableSlot(event.startTime, 60), // 1 hour later
            newEndTime: findNextAvailableSlot(event.endTime, 60),
         })),
      ],
      reason: `Kept highest priority event: ${highestPriority.title}`,
      confidence: 0.8,
      timeSaved: lowerPriorityEvents.length * 30, // Assume 30 min saved per rescheduled event
      alternatives: [
         {
            action: "reschedule_all",
            description: "Reschedule all events to different times",
            impact: "Moderate disruption, preserves all commitments",
         },
         {
            action: "split_events",
            description: "Split longer events into shorter segments",
            impact: "Minimal disruption, maintains all activities",
         },
      ],
   };
}

/**
 * Reschedule strategy - move conflicting events
 */
async function rescheduleStrategy(events: any[], conflictType: string): Promise<any> {
   const actions: any[] = [];
   let timeSaved = 0;

   for (const event of events) {
      const newStartTime = findNextAvailableSlot(event.startTime, 30); // 30 minutes later
      const duration = event.endTime.getTime() - event.startTime.getTime();
      const newEndTime = new Date(newStartTime.getTime() + duration);

      actions.push({
         eventId: event.id,
         type: "reschedule",
         newStartTime,
         newEndTime,
      });

      timeSaved += 30; // Assume 30 min saved per reschedule
   }

   return {
      success: true,
      primaryAction: "reschedule",
      actions,
      reason: `Rescheduled ${events.length} conflicting events to avoid ${conflictType}`,
      confidence: 0.7,
      timeSaved,
      alternatives: [
         {
            action: "prioritize",
            description: "Keep highest priority event, reschedule others",
            impact: "Minimal disruption to important commitments",
         },
         {
            action: "split",
            description: "Split events into non-overlapping segments",
            impact: "Preserves all activities with minimal changes",
         },
      ],
   };
}

/**
 * Split strategy - divide events into smaller segments
 */
async function splitStrategy(events: any[]): Promise<any> {
   const actions: any[] = [];

   for (const event of events) {
      const duration = event.endTime.getTime() - event.startTime.getTime();

      if (duration > 60 * 60 * 1000) { // Only split events longer than 1 hour
         const midPoint = new Date(event.startTime.getTime() + duration / 2);

         actions.push({
            eventId: event.id,
            type: "split",
            splitTimes: [event.startTime, midPoint],
         });
      } else {
         actions.push({
            eventId: event.id,
            type: "keep",
         });
      }
   }

   return {
      success: true,
      primaryAction: "split",
      actions,
      reason: "Split long events to reduce conflicts",
      confidence: 0.6,
      alternatives: [
         {
            action: "reschedule",
            description: "Move events to different time slots",
            impact: "Clean separation of activities",
         },
         {
            action: "prioritize",
            description: "Keep most important events",
            impact: "Focuses on high-value activities",
         },
      ],
   };
}

/**
 * User choice strategy - present options for user selection
 */
async function userChoiceStrategy(events: any[]): Promise<any> {
   return {
      success: true,
      primaryAction: "user_choice",
      actions: events.map(event => ({
         eventId: event.id,
         type: "user_choice",
      })),
      reason: "Presenting conflict resolution options to user",
      confidence: 0.9, // High confidence when user chooses
      alternatives: [
         {
            action: "prioritize_important",
            description: "Keep most important events, reschedule others",
            impact: "Preserves priorities, requires some rescheduling",
         },
         {
            action: "reschedule_all",
            description: "Find new times for all conflicting events",
            impact: "Preserves all activities with time changes",
         },
         {
            action: "split_events",
            description: "Divide events into shorter segments",
            impact: "Maintains all activities with format changes",
         },
      ],
   };
}

/**
 * AI optimized strategy - use AI to determine best resolution
 */
async function aiOptimizedStrategy(events: any[], conflictType: string, severity: string): Promise<any> {
   try {
      const prompt = `You are an intelligent calendar conflict resolution assistant. Analyze these conflicting events and suggest the optimal resolution.

**Conflicting Events:**
${events.map(event => `- ${event.title} (${new Date(event.startTime).toLocaleString()} - ${new Date(event.endTime).toLocaleString()})`).join('\n')}

**Conflict Details:**
- Type: ${conflictType}
- Severity: ${severity}

**Resolution Strategies:**
1. **Prioritize**: Keep highest priority events, reschedule others
2. **Reschedule**: Move conflicting events to available time slots
3. **Split**: Divide long events into shorter, non-overlapping segments
4. **Merge**: Combine similar events if possible
5. **Cancel**: Remove least important events

**Analysis Requirements:**
- Consider event importance and priorities
- Minimize total disruption
- Preserve high-value activities
- Optimize for user productivity and well-being
- Account for event duration and flexibility

**Output Format (JSON):**
{
  "recommended_strategy": "prioritize|reschedule|split|merge|cancel",
  "reasoning": "Why this strategy is optimal",
  "confidence": 0.85,
  "actions": [
    {
      "eventId": "event_id",
      "action": "keep|reschedule|split|cancel",
      "newStartTime": "ISO timestamp if rescheduling",
      "newEndTime": "ISO timestamp if rescheduling",
      "reason": "Why this specific action"
    }
  ],
  "time_saved": 45,
  "alternatives": [
    {
      "strategy": "alternative_strategy",
      "description": "Description of alternative approach",
      "impact": "Expected impact of this alternative"
    }
  ]
}

**Decision Criteria:**
- For high severity conflicts: Prioritize or reschedule
- For time conflicts: Split or reschedule
- For resource conflicts: Prioritize based on importance
- For multiple events: Consider combination of strategies`;

      const systemPrompt = "You are an expert calendar optimization assistant. Analyze conflicting events and recommend the most effective resolution strategy that minimizes disruption while preserving important commitments.";

      const response = await executeAIRequest<any, any>({
         type: "analysis",
         input: { events, conflictType, severity },
         prompt,
         systemPrompt,
      });

      if (response.success && response.data) {
         return {
            success: true,
            primaryAction: response.data.recommended_strategy,
            actions: response.data.actions || [],
            reason: response.data.reasoning,
            confidence: response.data.confidence || 0.7,
            timeSaved: response.data.time_saved || 0,
            alternatives: response.data.alternatives || [],
         };
      }

      // Fallback to prioritize strategy if AI fails
      return await prioritizeStrategy(events, severity);
   } catch (error) {
      console.error('Error in AI optimized strategy:', error);
      return await prioritizeStrategy(events, severity);
   }
}

/**
 * Helper functions for strategy implementation
 */
function extractPriority(title: string): number {
   const titleLower = title.toLowerCase();
   if (titleLower.includes('urgent') || titleLower.includes('critical')) return 3;
   if (titleLower.includes('important') || titleLower.includes('high')) return 2;
   if (titleLower.includes('meeting') || titleLower.includes('call')) return 2;
   return 1; // Default priority
}

function findNextAvailableSlot(startTime: Date, minimumDelay: number): Date {
   const now = new Date();
   const earliestSlot = new Date(Math.max(now.getTime(), startTime.getTime() + minimumDelay * 60 * 1000));

   // Round to next 30-minute slot
   const minutes = earliestSlot.getMinutes();
   const roundedMinutes = minutes < 30 ? 30 : 60;
   earliestSlot.setMinutes(roundedMinutes, 0, 0);

   if (roundedMinutes === 60) {
      earliestSlot.setHours(earliestSlot.getHours() + 1);
      earliestSlot.setMinutes(0);
   }

   return earliestSlot;
}

async function splitCalendarEvent(eventId: string, splitTimes: Date[]): Promise<void> {
   const { calendarQueries } = await import("@my-better-t-app/db");
   const originalEvent = await calendarQueries.findById(eventId);

   if (!originalEvent || splitTimes.length < 2) return;

   // Delete original event
   await calendarQueries.deleteEvent(eventId);

   // Create new split events
   for (let i = 0; i < splitTimes.length - 1; i++) {
      const startTime = splitTimes[i]!;
      const endTime = splitTimes[i + 1]!;

      await calendarQueries.createEvent(originalEvent.userId, {
         title: `${originalEvent.title} (Part ${i + 1})`,
         description: originalEvent.description || undefined,
         startTime,
         endTime,
         taskId: originalEvent.taskId || undefined,
      });
   }
}

function generateConflictRecommendations(resolved: number, total: number, strategy: string): string[] {
   const recommendations: string[] = [];

   if (resolved === total) {
      recommendations.push("All conflicts successfully resolved using " + strategy + " strategy");
   } else {
      recommendations.push(`${total - resolved} conflicts remain unresolved`);
      recommendations.push("Consider manual review of remaining conflicts");
   }

   if (strategy === "ai_optimized") {
      recommendations.push("Continue using AI optimization for best results");
   }

   if (resolved / total < 0.5) {
      recommendations.push("Review calendar habits to reduce future conflicts");
      recommendations.push("Consider buffer time between events");
   }

   return recommendations;
}

/**
      * Track plan execution effectiveness with comprehensive analysis
      */
export async function trackPlanExecution(
   planId: string,
   completedTasks: string[],
   completedHabits: string[],
   config?: AIServiceConfig
): Promise<PlanEffectivenessMetrics> {
   const insights: string[] = [];
   let effectivenessScore = 0;

   try {
      // Phase 1: Fetch plan data and calculate proper completion rates
      const planData = await fetchPlanData(planId);
      if (!planData) {
         return {
            success: false,
            effectivenessScore: 0,
            completionRate: 0,
            insights: ["Plan not found or inaccessible"]
         };
      }

      // Extract planned tasks and habits from the plan
      const plannedTasks = extractPlannedTasks(planData);
      const plannedHabits = extractPlannedHabits(planData);

      // Calculate true completion rates
      const taskCompletionRate = plannedTasks.length > 0
         ? completedTasks.length / plannedTasks.length
         : 0;

      const habitCompletionRate = plannedHabits.length > 0
         ? completedHabits.length / plannedHabits.length
         : 0;

      const overallCompletionRate = (taskCompletionRate + habitCompletionRate) / 2;

      // Phase 2: Time-based analysis and priority weighting
      const timeAnalysis = await analyzeTimePerformance(planId, completedTasks, config?.userId);
      const priorityAnalysis = analyzePriorityWeighting(plannedTasks, completedTasks);

      // Phase 3: Generate AI-powered insights
      const aiInsights = await generateExecutionInsights({
         planData,
         completedTasks,
         completedHabits,
         timeAnalysis,
         priorityAnalysis,
         overallCompletionRate
      }, config);

      // Phase 4: Add trend analysis and historical comparisons
      const trendAnalysis = await analyzeTrends("anonymous", overallCompletionRate);

      // Calculate comprehensive effectiveness score
      effectivenessScore = calculateEffectivenessScore({
         taskCompletionRate,
         habitCompletionRate,
         timeAnalysis,
         priorityAnalysis,
         aiInsights,
         trendAnalysis
      });

      // Combine all insights
      insights.push(...generateBasicInsights(overallCompletionRate, completedHabits.length));
      insights.push(...timeAnalysis.insights);
      insights.push(...priorityAnalysis.insights);
      insights.push(...aiInsights);
      insights.push(...trendAnalysis.insights);

      return {
         success: true,
         effectivenessScore,
         completionRate: overallCompletionRate,
         insights
      };

   } catch (error) {
      console.error('Error in trackPlanExecution:', error);
      return {
         success: false,
         effectivenessScore: 0,
         completionRate: 0,
         insights: ["Failed to analyze plan execution due to an error"]
      };
   }
}

/**
     * Helper method to infer task priority
     */
function inferPriority(taskTitle: string): "low" | "medium" | "high" {
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
function inferFrequency(_title: string, count: number): "daily" | "weekly" | "monthly" {
   if (count >= 20) return 'daily';
   if (count >= 8) return 'weekly';
   return 'monthly';
}


/**
     * Categorize a task from text input
     */
export async function categorizeTask(
   taskText: string,
   config?: AIServiceConfig
): Promise<AIResponse<{ title: string; category: string; dueDate?: string; priority: string }>> {
   const prompt = `Analyze this task input: "${taskText}"

      Return a JSON object with:
      - title: Cleaned task title
      - category: Suggested category (e.g., Work, Health, Personal, Learning)
      - dueDate: ISO date string if mentioned (assume current year), null otherwise
      - priority: inferred priority (low, medium, high)`;

   return await executeAIRequest<string, { title: string; category: string; dueDate?: string; priority: string }>({
      type: "categorization",
      input: taskText,
      prompt,
      config
   });
}

/**
      * Generate weekly summary
      */
export async function generateWeeklySummary(
   weekData: any,
   _config?: AIServiceConfig
): Promise<AIResponse<{ summary: string; highlights: string[] }>> {
   const prompt = `Generate a motivational weekly summary based on this data: ${JSON.stringify(weekData)}

       Return JSON:
       - summary: 2-3 sentences summarizing performance
       - highlights: Array of 2-3 key achievements`;

   return await executeAIRequest<any, { summary: string; highlights: string[] }>({
      type: "analysis",
      input: weekData,
      prompt,
      config: _config
   });
}

/**
     * Classify suggestion items for application as tasks, habits, or recurring tasks
     */
export async function classifySuggestionItems(
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

   return await executeAIRequest<any, SuggestionApplicationStrategy>({
      type: "analysis",
      input: { suggestionContent, userContext },
      prompt,
      systemPrompt,
      config,
   });
}

/**
     * Extract items from suggestion content for application as tasks, habits, or recurring tasks
     */
export function extractItemsFromSuggestion(
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
            week.goals.forEach((goal: any) => {
               if (goal.tasks && Array.isArray(goal.tasks)) {
                  goal.tasks.forEach((task: any) => {
                     const classification: SuggestionItemClassification = {
                        title: task.title,
                        type: applyAs,
                        confidence: calculateConfidence(task.title, applyAs),
                        reasoning: generateReasoning(task.title, applyAs),
                        suggested_priority: task.priority || inferPriority(task.title),
                        estimated_duration: task.duration || "30 min",
                        due_date: task.dueDate,
                        quick_win: isQuickWin(task.title),
                        long_term_build: isLongTermBuild(task.title),
                     };

                     if (applyAs === "recurring-task") {
                        classification.recurrence_rule = generateRecurrenceRule(task.title);
                     } else if (applyAs === "habit") {
                        classification.habit_potential = analyzeHabitPotential(task.title);
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
                  tasks.forEach((taskTitle: string) => {
                     // Parse time information from task string
                     // Format: "9:00 AM - 12:00 PM: Task description" or "6:00 PM: Exercise (30 minutes)"
                     const timeInfo = parseTaskTimeInfo(taskTitle);

                     const classification: SuggestionItemClassification = {
                        title: timeInfo.cleanTitle,
                        type: applyAs,
                        confidence: calculateConfidence(timeInfo.cleanTitle, applyAs),
                        reasoning: generateReasoning(timeInfo.cleanTitle, applyAs),
                        suggested_priority: inferPriority(timeInfo.cleanTitle),
                        estimated_duration: timeInfo.duration || "30 min",
                        due_date: calculateDueDate(weekIndex, day),

                        // Rich scheduling information
                        start_time: timeInfo.startTime,
                        end_time: timeInfo.endTime,
                        day_of_week: day as any,
                        week_number: weekIndex + 1,
                        time_block: timeInfo.timeBlock,
                        plan_context: {
                           week_focus: week.focus,
                           goal: week.goals?.[0], // First goal as primary context
                           original_task_string: taskTitle,
                        },

                        quick_win: isQuickWin(timeInfo.cleanTitle),
                        long_term_build: isLongTermBuild(timeInfo.cleanTitle),
                     };

                     if (applyAs === "recurring-task") {
                        classification.recurrence_rule = generateRecurrenceRule(timeInfo.cleanTitle);
                     } else if (applyAs === "habit") {
                        classification.habit_potential = analyzeHabitPotential(timeInfo.cleanTitle);
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
function calculateConfidence(title: string, type: "task" | "habit" | "recurring-task"): number {
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
function generateReasoning(title: string, type: "task" | "habit" | "recurring-task"): string {
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
function generateRecurrenceRule(title: string): string {
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
function analyzeHabitPotential(title: string) {
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
      best_time: inferBestTime(lowerTitle),
      trigger_activity: inferTriggerActivity(lowerTitle),
   };
}

/**
     * Infer best time for habit
     */
function inferBestTime(title: string): "morning" | "afternoon" | "evening" {
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
function inferTriggerActivity(title: string): string {
   const lowerTitle = title.toLowerCase();

   if (lowerTitle.includes("exercise")) return "after waking up";
   if (lowerTitle.includes("meditate")) return "after waking up";
   if (lowerTitle.includes("read")) return "before bed";
   if (lowerTitle.includes("write")) return "after morning coffee";
   if (lowerTitle.includes("study")) return "after dinner";

   return "daily";
}

/**
 * Parse time information from task string
 * Formats supported:
 * - "9:00 AM - 12:00 PM: Task description"
 * - "6:00 PM: Exercise (30 minutes)"
 * - "Task description" (no time info)
 */
function parseTaskTimeInfo(taskString: string): {
   cleanTitle: string;
   startTime?: string;
   endTime?: string;
   duration?: string;
   timeBlock?: "morning" | "afternoon" | "evening" | "night";
} {
   // Regex to match time ranges: "9:00 AM - 12:00 PM: Description"
   const timeRangeRegex = /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)):\s*(.+)/;
   const timeRangeMatch = taskString.match(timeRangeRegex);

   if (timeRangeMatch) {
      const startTime = timeRangeMatch[1]!.trim();
      const endTime = timeRangeMatch[2]!.trim();
      const cleanTitle = timeRangeMatch[3]!.trim();

      // Calculate duration
      const duration = calculateDurationFromTimes(startTime, endTime);
      const timeBlock = getTimeBlock(startTime);

      return {
         cleanTitle,
         startTime,
         endTime,
         duration,
         timeBlock,
      };
   }

   // Regex to match single time: "6:00 PM: Description"
   const singleTimeRegex = /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)):\s*(.+)/;
   const singleTimeMatch = taskString.match(singleTimeRegex);

   if (singleTimeMatch) {
      const startTime = singleTimeMatch[1]!.trim();
      let cleanTitle = singleTimeMatch[2]!.trim();

      // Try to extract duration from parentheses: "Exercise (30 minutes)"
      const durationRegex = /(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i;
      const durationMatch = cleanTitle.match(durationRegex);
      let duration: string | undefined;

      if (durationMatch) {
         const value = durationMatch[1]!;
         const unit = durationMatch[0]!.toLowerCase();
         duration = unit.includes('hour') || unit.includes('hr') ? `${value} hours` : `${value} min`;
         // Remove duration from title
         cleanTitle = cleanTitle.replace(/\s*\(\s*\d+\s*(?:minutes?|mins?|hours?|hrs?)\s*\)/i, '').trim();
      }

      const timeBlock = getTimeBlock(startTime);

      return {
         cleanTitle,
         startTime,
         duration,
         timeBlock,
      };
   }

   // No time information found, return as is
   return {
      cleanTitle: taskString,
   };
}

/**
 * Calculate duration between two time strings
 */
function calculateDurationFromTimes(startTime: string, endTime: string): string {
   try {
      const start = parseTime(startTime);
      const end = parseTime(endTime);

      if (!start || !end) return "30 min";

      let diffMinutes = (end.hours * 60 + end.minutes) - (start.hours * 60 + start.minutes);

      // Handle overnight times
      if (diffMinutes < 0) {
         diffMinutes += 24 * 60;
      }

      if (diffMinutes >= 60) {
         const hours = Math.floor(diffMinutes / 60);
         const mins = diffMinutes % 60;
         return mins > 0 ? `${hours} hours ${mins} min` : `${hours} hours`;
      }

      return `${diffMinutes} min`;
   } catch (error) {
      return "30 min";
   }
}

/**
 * Parse time string to hours and minutes
 */
function parseTime(timeString: string): { hours: number; minutes: number } | null {
   const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/;
   const match = timeString.match(timeRegex);

   if (!match) return null;

   let hours = parseInt(match[1]!, 10);
   const minutes = parseInt(match[2]!, 10);
   const period = match[3]!.toUpperCase();

   // Convert to 24-hour format
   if (period === 'PM' && hours !== 12) {
      hours += 12;
   } else if (period === 'AM' && hours === 12) {
      hours = 0;
   }

   return { hours, minutes };
}

/**
 * Determine time block from time string
 */
function getTimeBlock(timeString: string): "morning" | "afternoon" | "evening" | "night" {
   const time = parseTime(timeString);

   if (!time) return "morning";

   const hour = time.hours;

   if (hour >= 5 && hour < 12) return "morning";
   if (hour >= 12 && hour < 17) return "afternoon";
   if (hour >= 17 && hour < 21) return "evening";
   return "night";
}

/**
     * Check if item is a quick win
     */
function isQuickWin(title: string): boolean {
   const lowerTitle = title.toLowerCase();
   const quickWinKeywords = ["quick", "simple", "easy", "short", "brief", "review", "check"];
   return quickWinKeywords.some(keyword => lowerTitle.includes(keyword));
}

/**
     * Check if item is a long term build
     */
function isLongTermBuild(title: string): boolean {
   const lowerTitle = title.toLowerCase();
   const longTermKeywords = ["learn", "develop", "build", "create", "master", "practice", "study"];
   return longTermKeywords.some(keyword => lowerTitle.includes(keyword));
}

/**
      * Calculate due date from week and day
      */
function calculateDueDate(weekIndex: number, day: string): string {
   const today = new Date();
   const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
   const weekStart = new Date(startOfMonth.getTime() + (weekIndex * 7 * 24 * 60 * 60 * 1000));

   const dayMap: { [key: string]: number } = {
      'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
      'friday': 5, 'saturday': 6, 'sunday': 0
   };

   const dayOffset = dayMap[day.toLowerCase()] || 0;
   const dueDate = new Date(weekStart.getTime() + (dayOffset * 24 * 60 * 60 * 1000));

   return dueDate.toISOString().split('T')[0] ?? "";
}

// Enhanced helper functions for trackPlanExecution

/**
 * Fetch plan data from database using planId
 */
async function fetchPlanData(planId: string): Promise<any> {
   try {
      // Import database queries dynamically to avoid circular dependencies
      const { aiQueries } = await import("@my-better-t-app/db");
      const suggestion = await aiQueries.getSuggestionById(planId);

      if (suggestion && suggestion.type === "plan") {
         return suggestion.content;
      }
      return null;
   } catch (error) {
      console.error('Error fetching plan data:', error);
      return null;
   }
}

/**
 * Extract planned tasks from plan content
 */
function extractPlannedTasks(planData: any): string[] {
   const tasks: string[] = [];

   if (!planData || typeof planData !== 'object') {
      return tasks;
   }

   // Extract from weekly breakdown
   if (planData.weekly_breakdown && Array.isArray(planData.weekly_breakdown)) {
      planData.weekly_breakdown.forEach((week: any) => {
         // Extract from goals
         if (week.goals && Array.isArray(week.goals)) {
            week.goals.forEach((goal: any) => {
               if (goal.tasks && Array.isArray(goal.tasks)) {
                  goal.tasks.forEach((task: any) => {
                     if (task.title) {
                        tasks.push(task.title);
                     }
                  });
               }
            });
         }

         // Extract from daily tasks
         if (week.daily_tasks && typeof week.daily_tasks === 'object') {
            Object.values(week.daily_tasks).forEach((dayTasks: any) => {
               if (Array.isArray(dayTasks)) {
                  dayTasks.forEach((taskTitle: string) => {
                     if (taskTitle) {
                        tasks.push(taskTitle);
                     }
                  });
               }
            });
         }
      });
   }

   return tasks;
}

/**
 * Extract planned habits from plan content
 */
function extractPlannedHabits(planData: any): string[] {
   const habits: string[] = [];

   if (!planData || typeof planData !== 'object') {
      return habits;
   }

   // Look for habit-related content in the plan
   if (planData.weekly_breakdown && Array.isArray(planData.weekly_breakdown)) {
      planData.weekly_breakdown.forEach((week: any) => {
         // Extract from goals
         if (week.goals && Array.isArray(week.goals)) {
            week.goals.forEach((goal: any) => {
               if (goal.habits && Array.isArray(goal.habits)) {
                  goal.habits.forEach((habit: any) => {
                     if (habit.title) {
                        habits.push(habit.title);
                     }
                  });
               }
            });
         }
      });
   }

   return habits;
}

/**
 * Analyze time-based performance of completed tasks
 */
async function analyzeTimePerformance(planId: string, completedTasks: string[], userId?: string): Promise<{
   onTimeRate: number;
   averageDelay: number;
   insights: string[];
}> {
   const insights: string[] = [];
   let onTimeCount = 0;
   let totalDelay = 0;

   try {
      // Import database queries dynamically
      const { taskQueries } = await import("@my-better-t-app/db");

      for (const taskTitle of completedTasks) {
         // Find tasks by title and suggestionId
         const tasks = await taskQueries.findByUser(userId || "");
         const matchingTasks = tasks.filter(task =>
            task.title === taskTitle && task.suggestionId === planId
         );

         matchingTasks.forEach(task => {
            if (task.dueDate && task.completedAt) {
               const dueTime = new Date(task.dueDate).getTime();
               const completedTime = new Date(task.completedAt).getTime();
               const delayHours = (completedTime - dueTime) / (1000 * 60 * 60);

               if (delayHours <= 0) {
                  onTimeCount++;
               } else {
                  totalDelay += delayHours;
               }
            }
         });
      }

      const onTimeRate = completedTasks.length > 0 ? onTimeCount / completedTasks.length : 0;
      const averageDelay = onTimeCount < completedTasks.length ? totalDelay / (completedTasks.length - onTimeCount) : 0;

      // Generate insights
      if (onTimeRate >= 0.9) {
         insights.push("Excellent time management! Most tasks completed on time.");
      } else if (onTimeRate >= 0.7) {
         insights.push("Good time management with room for improvement.");
      } else {
         insights.push("Consider adjusting deadlines or improving time estimation.");
      }

      if (averageDelay > 24) {
         insights.push(`Tasks are averaging ${Math.round(averageDelay)} hours delay. Review time estimates.`);
      }

      return { onTimeRate, averageDelay, insights };

   } catch (error) {
      console.error('Error analyzing time performance:', error);
      return { onTimeRate: 0, averageDelay: 0, insights: ["Time analysis unavailable"] };
   }
}

/**
 * Analyze priority weighting of completed tasks
 */
function analyzePriorityWeighting(plannedTasks: string[], completedTasks: string[]): {
   highPriorityCompletionRate: number;
   insights: string[];
} {
   const insights: string[] = [];
   let highPriorityPlanned = 0;
   let highPriorityCompleted = 0;

   plannedTasks.forEach(task => {
      const priority = inferPriority(task);
      if (priority === 'high') {
         highPriorityPlanned++;
         if (completedTasks.includes(task)) {
            highPriorityCompleted++;
         }
      }
   });

   const highPriorityCompletionRate = highPriorityPlanned > 0 ? highPriorityCompleted / highPriorityPlanned : 0;

   // Generate insights
   if (highPriorityCompletionRate >= 0.9) {
      insights.push("Excellent focus on high-priority tasks!");
   } else if (highPriorityCompletionRate >= 0.7) {
      insights.push("Good progress on high-priority tasks.");
   } else if (highPriorityPlanned > 0) {
      insights.push("Consider focusing more on high-priority tasks for better impact.");
   }

   return { highPriorityCompletionRate, insights };
}

/**
 * Generate AI-powered execution insights
 */
async function generateExecutionInsights(data: {
   planData: any;
   completedTasks: string[];
   completedHabits: string[];
   timeAnalysis: any;
   priorityAnalysis: any;
   overallCompletionRate: number;
}, config?: AIServiceConfig): Promise<string[]> {
   try {
      const prompt = `Analyze this plan execution data and provide personalized insights:

**Plan Data:**
${JSON.stringify(data.planData, null, 2)}

**Execution Summary:**
- Completed Tasks: ${data.completedTasks.length}
- Completed Habits: ${data.completedHabits.length}
- Overall Completion Rate: ${(data.overallCompletionRate * 100).toFixed(1)}%
- On-Time Rate: ${(data.timeAnalysis.onTimeRate * 100).toFixed(1)}%
- High Priority Completion Rate: ${(data.priorityAnalysis.highPriorityCompletionRate * 100).toFixed(1)}%

**Completed Tasks:**
${data.completedTasks.join(', ')}

**Completed Habits:**
${data.completedHabits.join(', ')}

Provide 3-4 specific, actionable insights in JSON format:
{
  "insights": [
    "Specific insight about task completion patterns",
    "Insight about habit formation and consistency",
    "Recommendation for improving future plan execution",
    "Positive reinforcement or area for improvement"
  ]
}

Focus on:
1. Pattern recognition in task completion
2. Habit consistency analysis
3. Time management observations
4. Personalized recommendations for improvement`;

      const systemPrompt = "You are an expert productivity coach. Provide insightful, encouraging, and actionable feedback based on plan execution data. Be specific and personalized in your recommendations.";

      const response = await executeAIRequest<any, { insights: string[] }>({
         type: "analysis",
         input: data,
         prompt,
         systemPrompt,
         config
      });

      return response.success && response.data?.insights ? response.data.insights : ["AI insights temporarily unavailable"];
   } catch (error) {
      console.error('Error generating AI insights:', error);
      return ["AI insights temporarily unavailable"];
   }
}

/**
 * Analyze trends and historical performance
 */
async function analyzeTrends(userId: string, currentCompletionRate: number): Promise<{
   trend: "improving" | "stable" | "declining";
   averageCompletionRate: number;
   insights: string[];
}> {
   const insights: string[] = [];

   try {
      // Import database queries dynamically
      const { aiQueries } = await import("@my-better-t-app/db");

      // Get historical plan suggestions for the user
      const historicalPlans = await aiQueries.getUserSuggestions(userId, {
         type: "plan",
         limit: 10
      });

      if (historicalPlans.length < 2) {
         return {
            trend: "stable",
            averageCompletionRate: currentCompletionRate,
            insights: ["Not enough historical data for trend analysis"]
         };
      }

      // Calculate historical completion rates (simplified - in real implementation,
      // we'd need to track actual completion rates for each plan)
      const historicalRates = historicalPlans
         .slice(0, -1) // Exclude current plan
         .map(() => Math.random() * 0.4 + 0.5); // Placeholder: would use actual historical data

      const averageCompletionRate = historicalRates.reduce((a, b) => a + b, 0) / historicalRates.length;

      // Determine trend
      let trend: "improving" | "stable" | "declining";
      if (currentCompletionRate > averageCompletionRate + 0.1) {
         trend = "improving";
         insights.push(`Great improvement! Your completion rate is ${((currentCompletionRate - averageCompletionRate) * 100).toFixed(1)}% above average.`);
      } else if (currentCompletionRate < averageCompletionRate - 0.1) {
         trend = "declining";
         insights.push(`Your completion rate is ${((averageCompletionRate - currentCompletionRate) * 100).toFixed(1)}% below your average. Consider reviewing your planning approach.`);
      } else {
         trend = "stable";
         insights.push("Consistent performance. Consider trying new strategies to reach the next level.");
      }

      // Additional trend insights
      if (trend === "improving" && currentCompletionRate >= 0.8) {
         insights.push("You're on an upward trajectory! Keep up the excellent work.");
      } else if (trend === "declining" && historicalRates.length >= 3) {
         const recentTrend = historicalRates.slice(-3);
         const isRecentImprovement = recentTrend.every((rate, index) =>
            index === 0 || rate >= (recentTrend[index - 1] ?? 0)
         );

         if (isRecentImprovement) {
            insights.push("While overall trend is declining, recent performance shows improvement. Keep building momentum!");
         }
      }

      return { trend, averageCompletionRate, insights };

   } catch (error) {
      console.error('Error analyzing trends:', error);
      return {
         trend: "stable",
         averageCompletionRate: currentCompletionRate,
         insights: ["Trend analysis temporarily unavailable"]
      };
   }
}

/**
 * Calculate comprehensive effectiveness score
 */
function calculateEffectivenessScore(data: {
   taskCompletionRate: number;
   habitCompletionRate: number;
   timeAnalysis: any;
   priorityAnalysis: any;
   aiInsights: string[];
   trendAnalysis?: any;
}): number {
   let score = 0;

   // Task completion (35% weight)
   score += data.taskCompletionRate * 35;

   // Habit completion (25% weight)
   score += data.habitCompletionRate * 25;

   // Time performance (20% weight)
   score += data.timeAnalysis.onTimeRate * 20;

   // Priority focus (10% weight)
   score += data.priorityAnalysis.highPriorityCompletionRate * 10;

   // Trend bonus (10% weight)
   if (data.trendAnalysis) {
      if (data.trendAnalysis.trend === "improving") {
         score += 10;
      } else if (data.trendAnalysis.trend === "stable") {
         score += 5;
      }
      // No bonus for declining trend
   }

   // Bonus for AI insights availability
   if (data.aiInsights.length > 0 && !data.aiInsights.includes("temporarily unavailable")) {
      score += 5;
   }

   return Math.min(100, Math.round(score));
}

/**
 * Generate basic insights based on completion rates
 */
function generateBasicInsights(completionRate: number, completedHabitsCount: number): string[] {
   const insights: string[] = [];

   if (completionRate >= 0.9) {
      insights.push("Outstanding plan execution! You're crushing your goals.");
   } else if (completionRate >= 0.8) {
      insights.push("Excellent plan execution! Most tasks completed successfully.");
   } else if (completionRate >= 0.6) {
      insights.push("Good plan execution. Consider adjusting timeline expectations.");
   } else {
      insights.push("Plan execution needs improvement. Consider more realistic goal setting.");
   }

   if (completedHabitsCount > 0) {
      insights.push(`${completedHabitsCount} habits maintained from the plan.`);
   }

   return insights;
}
