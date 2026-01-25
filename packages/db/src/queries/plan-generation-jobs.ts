import { db } from "../index";
import { desc, eq } from "drizzle-orm";
import { planGenerationJobs } from "../schema";

export async function createPlanGenerationJob(input: { userId: string; requestPayload: unknown }) {
  const [job] = await db
    .insert(planGenerationJobs)
    .values({
      userId: input.userId,
      requestPayload: input.requestPayload,
      status: "pending",
    })
    .returning();

  return job;
}

export async function updatePlanGenerationJob(
  jobId: number,
  updates: Partial<{
    status: "pending" | "running" | "completed" | "failed";
    responseText: string | null;
    planId: number | null;
    conversationId: string | null;
    errorMessage: string | null;
  }>,
) {
  const [job] = await db
    .update(planGenerationJobs)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(planGenerationJobs.id, jobId))
    .returning();

  return job;
}

export async function getPlanGenerationJobById(jobId: number) {
  const [job] = await db.select().from(planGenerationJobs).where(eq(planGenerationJobs.id, jobId));

  return job || null;
}

export async function getLatestPlanGenerationJobByUser(userId: string) {
  const [job] = await db
    .select()
    .from(planGenerationJobs)
    .where(eq(planGenerationJobs.userId, userId))
    .orderBy(desc(planGenerationJobs.createdAt))
    .limit(1);

  return job || null;
}
