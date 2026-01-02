import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../index";
import { monthlyPlans } from "../schema/monthly-plans";
import { planTasks } from "../schema/plan-tasks";

export async function getTasksByDateRange(userId: string, startDate: Date, endDate: Date) {
  const result = await db
    .select({
      id: planTasks.id,
      taskDescription: planTasks.taskDescription,
      focusArea: planTasks.focusArea,
      startTime: planTasks.startTime,
      endTime: planTasks.endTime,
      difficultyLevel: planTasks.difficultyLevel,
      isCompleted: planTasks.isCompleted,
      completedAt: planTasks.completedAt,
    })
    .from(planTasks)
    .innerJoin(monthlyPlans, eq(planTasks.planId, monthlyPlans.id))
    .where(
      and(
        eq(monthlyPlans.userId, userId),
        gte(planTasks.startTime, startDate),
        lte(planTasks.startTime, endDate),
      ),
    )
    .orderBy(planTasks.startTime);
  return result;
}

export async function getTasksByDay(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select({
      id: planTasks.id,
      taskDescription: planTasks.taskDescription,
      focusArea: planTasks.focusArea,
      startTime: planTasks.startTime,
      endTime: planTasks.endTime,
      difficultyLevel: planTasks.difficultyLevel,
      isCompleted: planTasks.isCompleted,
      completedAt: planTasks.completedAt,
      schedulingReason: planTasks.schedulingReason,
    })
    .from(planTasks)
    .innerJoin(monthlyPlans, eq(planTasks.planId, monthlyPlans.id))
    .where(
      and(
        eq(monthlyPlans.userId, userId),
        gte(planTasks.startTime, startOfDay),
        lte(planTasks.startTime, endOfDay),
      ),
    )
    .orderBy(planTasks.startTime);
  return result;
}

export async function getUniqueFocusAreas(userId: string) {
  const result = await db
    .selectDistinct({
      focusArea: planTasks.focusArea,
    })
    .from(planTasks)
    .innerJoin(monthlyPlans, eq(planTasks.planId, monthlyPlans.id))
    .where(eq(monthlyPlans.userId, userId));

  // Get counts per focus area
  const focusAreas = await Promise.all(
    result.map(async ({ focusArea }) => {
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(planTasks)
        .innerJoin(monthlyPlans, eq(planTasks.planId, monthlyPlans.id))
        .where(and(eq(monthlyPlans.userId, userId), eq(planTasks.focusArea, focusArea)));
      const count = countResult[0]?.count ?? 0;
      return { name: focusArea, count };
    }),
  );
  return focusAreas;
}
