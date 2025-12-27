import { db } from "../index";
import { eq, and, desc } from "drizzle-orm";
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
    .where(
      and(
        eq(monthlyPlans.userId, userId),
        eq(monthlyPlans.monthYear, monthYear),
        eq(monthlyPlans.status, "CONFIRMED"),
      ),
    )
    .orderBy(monthlyPlans.generatedAt)
    .limit(1);

  return plan;
}

export async function getMonthlyPlanById(planId: number) {
  const [plan] = await db.select().from(monthlyPlans).where(eq(monthlyPlans.id, planId)).limit(1);

  return plan || null;
}

export async function getMonthlyPlansByUser(userId: string, limit = 20, offset = 0) {
  const plans = await db
    .select({
      id: monthlyPlans.id,
      userId: monthlyPlans.userId,
      monthYear: monthlyPlans.monthYear,
      monthlySummary: monthlyPlans.monthlySummary,
      status: monthlyPlans.status,
      generatedAt: monthlyPlans.generatedAt,
      extractionConfidence: monthlyPlans.extractionConfidence,
    })
    .from(monthlyPlans)
    .where(eq(monthlyPlans.userId, userId))
    .orderBy(desc(monthlyPlans.generatedAt))
    .limit(limit)
    .offset(offset);

  return plans;
}

export async function getMonthlyPlansByUserWithTaskCount(userId: string) {
  const plans = await db
    .select()
    .from(monthlyPlans)
    .leftJoin(planTasks, eq(monthlyPlans.id, planTasks.planId))
    .where(eq(monthlyPlans.userId, userId))
    .orderBy(desc(monthlyPlans.generatedAt));

  const planMap = new Map<number, typeof monthlyPlans.$inferSelect & { taskCount: number }>();

  for (const row of plans) {
    const plan = row.monthly_plans;
    const task = row.plan_tasks;
    const existing = planMap.get(plan.id);
    if (existing) {
      if (task) {
        existing.taskCount = (existing.taskCount || 0) + 1;
      }
    } else {
      planMap.set(plan.id, { ...plan, taskCount: task ? 1 : 0 });
    }
  }

  return Array.from(planMap.values());
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

export async function getMonthlyPlanWithTasks(planId: number) {
  const plan = await getMonthlyPlanById(planId);

  if (!plan) {
    return null;
  }

  const tasks = await db.select().from(planTasks).where(eq(planTasks.planId, planId));

  return {
    ...plan,
    tasks,
  };
}

/**
 * Verify that a user owns a specific plan
 * Returns true if the user owns the plan, false otherwise
 */
export async function verifyPlanOwnership(planId: number, userId: string): Promise<boolean> {
  const [plan] = await db
    .select({ userId: monthlyPlans.userId })
    .from(monthlyPlans)
    .where(eq(monthlyPlans.id, planId))
    .limit(1);

  return plan?.userId === userId;
}
