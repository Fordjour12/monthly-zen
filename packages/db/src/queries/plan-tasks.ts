import { db } from "../index";
import { eq } from "drizzle-orm";
import { planTasks } from "../schema";

export interface CreatePlanTaskInput {
  planId: number;
  taskDescription: string;
  focusArea: string;
  startTime: Date;
  endTime: Date;
  difficultyLevel: "simple" | "moderate" | "advanced";
  schedulingReason: string;
  isCompleted: boolean;
}

export async function createPlanTask(input: CreatePlanTaskInput) {
  const [task] = await db
    .insert(planTasks)
    .values({
      planId: input.planId,
      taskDescription: input.taskDescription,
      focusArea: input.focusArea,
      startTime: input.startTime,
      endTime: input.endTime,
      difficultyLevel: input.difficultyLevel,
      schedulingReason: input.schedulingReason,
      isCompleted: input.isCompleted,
    })
    .returning();

  return task;
}

export async function createPlanTasks(inputs: CreatePlanTaskInput[]) {
  if (inputs.length === 0) return [];

  const tasks = await db.insert(planTasks).values(inputs).returning();

  return tasks;
}

export async function updateTaskStatus(taskId: number, isCompleted: boolean) {
  const [task] = await db
    .update(planTasks)
    .set({
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    })
    .where(eq(planTasks.id, taskId))
    .returning();

  return task;
}

export async function getTasksByPlanId(planId: number) {
  return await db.select().from(planTasks).where(eq(planTasks.planId, planId));
}

/**
 * Update a task (full update)
 */
export async function updatePlanTask(
  taskId: number,
  updates: Partial<{
    taskDescription: string;
    focusArea: string;
    startTime: Date;
    endTime: Date;
    difficultyLevel: string;
    schedulingReason: string;
  }>,
) {
  const [task] = await db
    .update(planTasks)
    .set({
      ...updates,
    })
    .where(eq(planTasks.id, taskId))
    .returning();

  return task;
}

/**
 * Delete a task
 */
export async function deletePlanTask(taskId: number) {
  const result = await db.delete(planTasks).where(eq(planTasks.id, taskId));
  return result.rowCount ?? 0;
}
