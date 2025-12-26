import { db } from "../index";
import { eq, and } from "drizzle-orm";
import { monthlyPlans, planTasks } from "../schema";

export interface CreateMonthlyPlanInput {
  userId: string;
  preferenceId: number;
  monthYear: string;
  aiPrompt: string;
  aiResponseRaw: any;
  monthlySummary?: string;
  rawAiResponse?: string;
  extractionConfidence?: number;
  extractionNotes?: string;
}

export async function createMonthlyPlan(input: CreateMonthlyPlanInput) {
  const [plan] = await db
    .insert(monthlyPlans)
    .values({
      userId: input.userId,
      preferenceId: input.preferenceId,
      monthYear: input.monthYear,
      aiPrompt: input.aiPrompt,
      aiResponseRaw: input.aiResponseRaw,
      monthlySummary: input.monthlySummary,
      rawAiResponse: input.rawAiResponse,
      extractionConfidence: input.extractionConfidence,
      extractionNotes: input.extractionNotes,
    })
    .returning();

  return plan;
}

export async function getMonthlyPlanByUserAndMonth(userId: string, monthYear: string) {
  const [plan] = await db
    .select()
    .from(monthlyPlans)
    .where(and(eq(monthlyPlans.userId, userId), eq(monthlyPlans.monthYear, monthYear)))
    .orderBy(monthlyPlans.generatedAt)
    .limit(1);

  return plan;
}

export async function getCurrentMonthlyPlanWithTasks(userId: string, monthYear: string) {
  const plan = await getMonthlyPlanByUserAndMonth(userId, monthYear);

  if (!plan) {
    return null;
  }

  const tasks = await db.select().from(planTasks).where(eq(planTasks.planId, plan.id));

  return {
    ...plan,
    tasks,
  };
}
