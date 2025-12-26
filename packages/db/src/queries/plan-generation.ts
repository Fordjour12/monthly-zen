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

  return newPlan?.id || 0;
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
