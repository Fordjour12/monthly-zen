import { createMonthlyPlan } from "./monthly-plans";
import { createPlanTasks } from "./plan-tasks";

export async function saveGeneratedPlan(
  userId: string,
  preferenceId: number,
  monthYear: string,
  aiPrompt: string,
  aiResponse: {
    rawContent: string;
    metadata: { contentLength: number; format: "json" | "text" | "mixed" };
  },
  planData: any,
  monthlySummary?: string,
  extractionConfidence?: number,
  extractionNotes?: string,
) {
  const newPlan = await createMonthlyPlan({
    userId,
    preferenceId,
    monthYear,
    aiPrompt,
    aiResponseRaw: planData,
    monthlySummary,
    rawAiResponse: aiResponse.rawContent,
    extractionConfidence,
    extractionNotes,
  });

  if (!newPlan) {
    return 0;
  }

  // Extract and save tasks
  try {
    const tasksToSave: any[] = [];
    const planId = newPlan.id;

    // Handle both potential structures (raw parsed object or direct properties)
    const weeks = planData.weekly_breakdown || (planData as any).weeks || [];

    if (Array.isArray(weeks)) {
      for (const week of weeks) {
        if (week.daily_tasks) {
          for (const [day, dayTasks] of Object.entries(week.daily_tasks)) {
            if (Array.isArray(dayTasks)) {
              for (const task of dayTasks as any[]) {
                // Parse dates - ensure they are Date objects
                const startTime = new Date(task.start_time);
                const endTime = new Date(task.end_time);

                tasksToSave.push({
                  planId,
                  taskDescription: task.task_description || task.description,
                  focusArea: task.focus_area || "General",
                  startTime: isNaN(startTime.getTime()) ? new Date() : startTime,
                  endTime: isNaN(endTime.getTime()) ? new Date() : endTime,
                  difficultyLevel: (task.difficulty_level || "moderate").toLowerCase(),
                  schedulingReason: task.scheduling_reason || "",
                  isCompleted: false,
                });
              }
            }
          }
        }
      }
    }

    if (tasksToSave.length > 0) {
      await createPlanTasks(tasksToSave);
      console.log(`[saveGeneratedPlan] Saved ${tasksToSave.length} tasks for plan ${planId}`);
    } else {
      console.warn(`[saveGeneratedPlan] No tasks found to save for plan ${planId}`);
    }
  } catch (error) {
    console.error(`[saveGeneratedPlan] Failed to save tasks for plan ${newPlan.id}:`, error);
    // We don't throw here to ensure the plan itself is at least returned,
    // though in a perfect world we might want a transaction.
  }

  return newPlan.id;
}

export async function savePlanTasks(
  planId: number,
  tasks: Array<{
    taskDescription: string;
    focusArea: string;
    startTime: Date;
    endTime: Date;
    difficultyLevel: "simple" | "moderate" | "advanced";
    schedulingReason: string;
    isCompleted: boolean;
  }>,
) {
  if (tasks.length === 0) return [];

  const taskInputs = tasks.map((task) => ({
    planId,
    ...task,
  }));

  return await createPlanTasks(taskInputs);
}
