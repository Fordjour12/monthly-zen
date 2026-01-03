import { db } from "../index";
import { eq, desc, and, isNull, gte, lte, sql, count } from "drizzle-orm";
import { monthlyResolutions, planTasks } from "../schema";

export interface CreateResolutionInput {
  userId: string;
  text: string;
  category?: string;
  resolutionType?: "monthly" | "yearly";
  priority?: number;
  targetDate?: Date;
  isRecurring?: boolean;
  recurringInterval?: "monthly" | "weekly";
}

export async function createResolution(input: CreateResolutionInput) {
  const [resolution] = await db
    .insert(monthlyResolutions)
    .values({
      userId: input.userId,
      text: input.text,
      category: input.category || "other",
      resolutionType: input.resolutionType || "monthly",
      priority: input.priority || 2,
      targetDate: input.targetDate,
      isRecurring: input.isRecurring || false,
      recurringInterval: input.recurringInterval,
    })
    .returning();

  return resolution;
}

export async function getResolutionsByUser(userId: string, includeArchived = false) {
  const condition = eq(monthlyResolutions.userId, userId);

  const resolutions = await db
    .select()
    .from(monthlyResolutions)
    .where(and(condition, includeArchived ? undefined : isNull(monthlyResolutions.archivedAt)))
    .orderBy(desc(monthlyResolutions.createdAt));

  return resolutions;
}

export async function getResolutionById(id: number) {
  const [resolution] = await db
    .select()
    .from(monthlyResolutions)
    .where(eq(monthlyResolutions.id, id));

  return resolution;
}

export async function getYearlyResolutions(userId: string, year: number) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  const resolutions = await db
    .select()
    .from(monthlyResolutions)
    .where(
      and(
        eq(monthlyResolutions.userId, userId),
        eq(monthlyResolutions.resolutionType, "yearly"),
        gte(monthlyResolutions.startDate, startOfYear),
        lte(monthlyResolutions.startDate, endOfYear),
        isNull(monthlyResolutions.archivedAt),
      ),
    )
    .orderBy(monthlyResolutions.priority);

  return resolutions;
}

export async function calculateResolutionProgress(resolutionId: number): Promise<number> {
  // Count total linked tasks using sql for JSONB contains
  const [totalResult] = await db
    .select({ total: count() })
    .from(planTasks)
    .where(sql`${planTasks.resolutionIds} @> ${JSON.stringify([resolutionId])}`);

  const total = Number(totalResult?.count) || 0;

  if (total === 0) return 0;

  const [completedResult] = await db
    .select({ completed: count() })
    .from(planTasks)
    .where(
      and(
        sql`${planTasks.resolutionIds} @> ${JSON.stringify([resolutionId])}`,
        eq(planTasks.isCompleted, true),
      ),
    );

  const completed = Number(completedResult?.completed) || 0;
  return Math.round((completed / total) * 100);
}

export async function updateResolution(
  id: number,
  input: Partial<CreateResolutionInput> & { isAchieved?: boolean },
) {
  const updateData: Record<string, unknown> = { ...input, updatedAt: new Date() };

  if (input.isAchieved) {
    updateData.achievedAt = new Date();
  }

  const [resolution] = await db
    .update(monthlyResolutions)
    .set(updateData)
    .where(eq(monthlyResolutions.id, id))
    .returning();

  return resolution;
}

export async function archiveResolution(id: number) {
  const [resolution] = await db
    .update(monthlyResolutions)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(monthlyResolutions.id, id))
    .returning();

  return resolution;
}

export async function deleteResolution(id: number) {
  await db.delete(monthlyResolutions).where(eq(monthlyResolutions.id, id));
}

export async function linkTaskToResolution(taskId: number, resolutionId: number) {
  // Get current resolutionIds
  const [task] = await db
    .select({ resolutionIds: planTasks.resolutionIds })
    .from(planTasks)
    .where(eq(planTasks.id, taskId));

  const currentIds = task?.resolutionIds || [];
  if (!currentIds.includes(resolutionId)) {
    const newIds = [...currentIds, resolutionId];

    await db.update(planTasks).set({ resolutionIds: newIds }).where(eq(planTasks.id, taskId));
  }
}

export async function unlinkTaskFromResolution(taskId: number, resolutionId: number) {
  const [task] = await db
    .select({ resolutionIds: planTasks.resolutionIds })
    .from(planTasks)
    .where(eq(planTasks.id, taskId));

  const currentIds = task?.resolutionIds || [];
  const newIds = currentIds.filter((id) => id !== resolutionId);

  await db.update(planTasks).set({ resolutionIds: newIds }).where(eq(planTasks.id, taskId));
}

export async function getResolutionsWithTasks(userId: string) {
  const resolutions = await getResolutionsByUser(userId);

  // For each resolution, get linked tasks
  const resolutionsWithTasks = await Promise.all(
    resolutions.map(async (resolution) => {
      const progress = await calculateResolutionProgress(resolution.id);

      // Get linked tasks
      const tasks = await db
        .select({
          id: planTasks.id,
          description: planTasks.taskDescription,
          isCompleted: planTasks.isCompleted,
          startTime: planTasks.startTime,
        })
        .from(planTasks)
        .where(sql`${planTasks.resolutionIds} @> ${JSON.stringify([resolution.id])}`);

      return {
        ...resolution,
        progressPercent: progress,
        linkedTaskCount: tasks.length,
        completedTaskCount: tasks.filter((t) => t.isCompleted).length,
        tasks,
      };
    }),
  );

  return resolutionsWithTasks;
}
