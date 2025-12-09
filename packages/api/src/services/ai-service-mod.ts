import {executeAIRequest} from "../lib/executeAIRequest"
import type {  AIResponse, AIServiceConfig } from "../lib/index.d";
import type {
   PlanSuggestionContent,
   TaskPriority,
} from "@my-better-t-app/db";

/**
      * Generate plan based on user goals using Monthly Planning Prompt
      */
export async function generatePlan(
   userGoals: string,
   config?: AIServiceConfig
):Promise<AIResponse<PlanSuggestionContent>>{
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

      const currentDate = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const prompt = `You are an intelligent monthly planning assistant specializing in plan regeneration and improvement. Your task is to create an improved version of a previous plan based on user feedback and execution insights.

**Original Plan:**
${JSON.stringify(originalPlan, null, 2)}

**User Regeneration Reason:**
${regenerationReason}

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
         input: { originalPlan, regenerationReason  },
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
