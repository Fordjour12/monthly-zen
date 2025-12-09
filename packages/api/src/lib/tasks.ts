import type { PlanSuggestionContent } from "@my-better-t-app/db";
import type { PlanHabit, PlanTask } from ".";


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
