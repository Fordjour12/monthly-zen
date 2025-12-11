import { executeAIRequest, fetchPlanData, type AIResponse } from "../core/ai-service-core";
import type { AIServiceConfig } from "../core/ai-service-core";
import type {
  PlanSuggestionContent,
  TaskPriority,
} from "@my-better-t-app/db";

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

/**
 * Generate plan based on user goals using enhanced personalization and context
 */
export async function generatePlan(
  userGoals: string,
  config?: AIServiceConfig,
  userContext?: any
): Promise<AIResponse<PlanSuggestionContent>> {
  const currentDate = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build enhanced context from user data if available
  const userInsights = userContext ? buildUserInsights(userContext) : getDefaultInsights();

  const prompt = `You are an intelligent monthly planning assistant specializing in personalized, actionable plans. Your task is to transform user goals into a structured monthly plan tailored to their unique patterns, preferences, and history.

**User Input:**
${userGoals}

**Enhanced User Context:**
${userInsights}

**Context:**
- Current month: ${currentMonth}
- Current date: ${currentDate}

**Your Enhanced Responsibilities:**
1. Parse and deeply understand the user's goals
2. Break down large goals into weekly milestones considering user's proven capabilities
3. Create daily tasks that match the user's documented productivity patterns and time availability
4. Align tasks with user's peak energy periods and preferred work styles
5. Consider user's historical completion rates and adjust difficulty accordingly
6. Identify potential conflicts considering user's current commitments and energy patterns
7. Suggest optimal timing based on user's documented patterns and preferences

**Personalized Planning Requirements:**
- Match task difficulty to user's completion rate history (adjust if <70% or >90%)
- Schedule high-focus tasks during user's peak energy periods
- Respect user's preferred session duration and avoid overloading
- Consider seasonal/monthly patterns in user's productivity
- Align with user's defined success metrics and values
- Account for user's time zone and typical work hours

**Output Format (JSON):**
{
  "monthly_summary": "Personalized overview acknowledging user's patterns and goals",
  "weekly_breakdown": [
    {
      "week": 1,
      "focus": "Theme aligned with user's current priorities and energy patterns",
      "goals": ["Weekly goal tailored to user's capabilities and preferences"],
      "daily_tasks": {
        "Monday": ["Task matched to user's Monday energy and time availability"],
        "Tuesday": ["Task aligned with user's Tuesday patterns"]
      }
    }
  ],
  "personalization_notes": ["How the plan was adapted to user's specific patterns"],
  "productivity_insights": ["Key observations about user's productivity patterns used in planning"],
  "potential_conflicts": ["Conflicts identified based on user's current commitments"],
  "success_metrics": ["Metrics aligned with user's documented preferences"],
  "energy_management": ["Suggestions for maintaining energy based on user's patterns"]
}

**Enhanced Constraints:**
- Daily task load matches user's historical completion patterns
- Task complexity adjusted based on user's proven capabilities
- Timing considers user's peak energy periods and documented preferences
- Includes personalized strategies for overcoming user's common challenges
- Respects user's work-life balance preferences and time constraints
- Provides flexibility options that match user's adaptive planning style`;

  const systemPrompt = `You are an expert personalized planning assistant with deep expertise in creating monthly plans that adapt to individual user patterns, energy levels, and proven capabilities. Create highly personalized plans that leverage the user's documented strengths while addressing their specific challenges. Focus on realistic, achievable planning that builds on their historical success patterns.`;

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
 * Build comprehensive user insights from gathered context
 */
function buildUserInsights(userContext: any): string {
  const insights: string[] = [];

  // Goals and aspirations
  if (userContext.activeGoals?.length > 0) {
    insights.push(`**Current Active Goals:** ${userContext.activeGoals.map((g: any) => g.title).join(', ')}`);
  }

  // Task completion patterns
  if (userContext.productivityMetrics?.averageCompletionRate) {
    const completionRate = (userContext.productivityMetrics.averageCompletionRate * 100).toFixed(1);
    insights.push(`**Historical Completion Rate:** ${completionRate}%`);

    if (userContext.productivityMetrics.averageCompletionRate < 0.7) {
      insights.push(`**Planning Style:** Conservative approach recommended (lower completion rate history)`);
    } else if (userContext.productivityMetrics.averageCompletionRate > 0.9) {
      insights.push(`**Planning Style:** Ambitious goals achievable (high completion rate history)`);
    }
  }

  // Time availability and preferences
  if (userContext.timePreferences?.averageDailyHours) {
    insights.push(`**Daily Time Availability:** ${userContext.timePreferences.averageDailyHours} hours for focused work`);
  }

  if (userContext.timePreferences?.peakEnergyPeriods?.length > 0) {
    insights.push(`**Peak Energy Periods:** ${userContext.timePreferences.peakEnergyPeriods.join(', ')}`);
  }

  // Work style preferences
  if (userContext.workPreferences?.deepWorkPreferred) {
    insights.push(`**Work Style:** Prefers deep, focused work sessions`);
  }

  if (userContext.workPreferences?.taskBatchingPreferred) {
    insights.push(`**Task Management:** Works best with similar tasks grouped together`);
  }

  // Values and success metrics
  if (userContext.personalValues?.length > 0) {
    insights.push(`**Core Values:** ${userContext.personalValues.join(', ')}`);
  }

  if (userContext.successMetrics?.preferredMetrics?.length > 0) {
    insights.push(`**Success Metrics:** Focus on ${userContext.successMetrics.preferredMetrics.join(', ')}`);
  }

  // Recent commitments and constraints
  if (userContext.existingCommitments?.timeConstraints?.length > 0) {
    insights.push(`**Current Time Constraints:** ${userContext.existingCommitments.timeConstraints.join(', ')}`);
  }

  // Recent plan insights
  if (userContext.recentPlanInsights) {
    if (userContext.recentPlanInsights.commonChallenges?.length > 0) {
      insights.push(`**Common Challenges:** ${userContext.recentPlanInsights.commonChallenges.join(', ')}`);
    }

    if (userContext.recentPlanInsights.successPatterns?.length > 0) {
      insights.push(`**Success Patterns:** ${userContext.recentPlanInsights.successPatterns.join(', ')}`);
    }
  }

  // Productivity patterns
  if (userContext.productivityMetrics?.mostProductiveDay) {
    insights.push(`**Most Productive Day:** ${userContext.productivityMetrics.mostProductiveDay}`);
  }

  if (userContext.productivityMetrics?.mostProductiveTime) {
    insights.push(`**Most Productive Time:** ${userContext.productivityMetrics.mostProductiveTime}`);
  }

  // Energy management
  if (userContext.workPreferences?.regularBreaksPreferred) {
    insights.push(`**Energy Management:** Requires regular breaks for sustained productivity`);
  }

  return insights.join('\n') || 'No specific user insights available';
}

/**
 * Get default insights for users without historical data
 */
function getDefaultInsights(): string {
  return `**Default User Profile:**
- **Planning Style:** Balanced approach with moderate ambition
- **Time Availability:** Standard work hours (6-8 hours daily for focused tasks)
- **Peak Energy Periods:** Morning (9AM-12PM) and Early Afternoon (1PM-4PM)
- **Work Style:** Prefers structured approach with clear milestones
- **Task Management:** Works best with 3-4 major tasks per day
- **Energy Management:** Benefits from regular breaks and task variety
- **Success Metrics:** Focus on completion rates and consistent progress
- **Values:** Work-life balance, steady progress, skill development
- **Current Commitments:** Standard workload with flexibility for important goals`;
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