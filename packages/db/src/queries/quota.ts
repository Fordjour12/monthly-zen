import { db } from "../index";
import { generationQuota, quotaHistory } from "../schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { GenerationQuota } from "../schema/generation-quota";

function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    return date;
  }
  const parts = date.toISOString().split("T");
  return parts[0] ?? date.toISOString().slice(0, 10);
}

export async function getCurrentQuota(
  userId: string,
  monthYear: string,
): Promise<GenerationQuota | null> {
  const result = await db
    .select()
    .from(generationQuota)
    .where(and(eq(generationQuota.userId, userId), eq(generationQuota.monthYear, monthYear)))
    .orderBy(desc(generationQuota.id))
    .limit(1);

  return result[0] ?? null;
}

export async function getLatestQuota(userId: string): Promise<GenerationQuota | null> {
  const result = await db
    .select()
    .from(generationQuota)
    .where(eq(generationQuota.userId, userId))
    .orderBy(desc(generationQuota.id))
    .limit(1);

  return result[0] ?? null;
}

export async function getQuotaHistory(userId: string, limit: number = 10) {
  const result = await db
    .select()
    .from(quotaHistory)
    .where(eq(quotaHistory.userId, userId))
    .orderBy(desc(quotaHistory.createdAt))
    .limit(limit);

  return result;
}

export async function createGenerationQuota(input: {
  userId: string;
  monthYear: string;
  totalAllowed: number;
  generationsUsed: number;
  resetsOn: Date | string;
}): Promise<GenerationQuota | null> {
  const result = await db
    .insert(generationQuota)
    .values({
      userId: input.userId,
      monthYear: input.monthYear,
      totalAllowed: input.totalAllowed,
      generationsUsed: input.generationsUsed,
      resetsOn: formatDate(input.resetsOn),
    })
    .returning();

  return result[0] ?? null;
}

export async function updateGenerationQuota(
  quotaId: number,
  updates: {
    totalAllowed?: number;
    generationsUsed?: number;
    resetsOn?: Date | string;
  },
): Promise<GenerationQuota | null> {
  const current = await db
    .select()
    .from(generationQuota)
    .where(eq(generationQuota.id, quotaId))
    .limit(1);

  if (!current[0]) {
    throw new Error(`Quota with ID ${quotaId} not found`);
  }

  const values: Record<string, Date | number | string> = {};
  if (updates.totalAllowed !== undefined) {
    values.totalAllowed = updates.totalAllowed;
  }
  if (updates.generationsUsed !== undefined) {
    values.generationsUsed = updates.generationsUsed;
  }
  if (updates.resetsOn !== undefined) {
    values.resetsOn = formatDate(updates.resetsOn);
  }

  const result = await db
    .update(generationQuota)
    .set(values)
    .where(eq(generationQuota.id, quotaId))
    .returning();

  return result[0] ?? null;
}

/**
 * Atomically decrements the quota. Returns null if quota not found or quota would be exceeded.
 * This performs a check-and-set in a single query to prevent race conditions.
 */
export async function decrementGenerationQuota(quotaId: number): Promise<GenerationQuota | null> {
  // Use a transaction-like approach with a WHERE clause that checks the quota
  const result = await db
    .update(generationQuota)
    .set({
      generationsUsed: sql`${generationQuota.generationsUsed} + 1`,
    })
    .where(
      sql`${generationQuota.id} = ${quotaId} AND ${generationQuota.generationsUsed} < ${generationQuota.totalAllowed}`,
    )
    .returning();

  if (!result[0]) {
    // Either quota not found or quota would be exceeded
    const current = await db
      .select()
      .from(generationQuota)
      .where(eq(generationQuota.id, quotaId))
      .limit(1);

    if (!current[0]) {
      throw new Error(`Quota with ID ${quotaId} not found`);
    }
    // Quota would be exceeded
    return null;
  }

  return result[0];
}

export async function archiveQuota(input: {
  id: number;
  userId: string;
  monthYear: string;
  totalAllowed: number;
  generationsUsed: number;
  resetsOn: Date | string;
  periodStart: string;
}): Promise<void> {
  await db.insert(quotaHistory).values({
    userId: input.userId,
    periodStart: new Date(input.periodStart),
    periodEnd: typeof input.resetsOn === "string" ? new Date(input.resetsOn) : input.resetsOn,
    monthYear: input.monthYear,
    totalAllowed: input.totalAllowed,
    generationsUsed: input.generationsUsed,
    totalRequested: 0,
    wasAutoReset: typeof input.resetsOn === "string" ? new Date(input.resetsOn) : input.resetsOn,
  });
}

export async function createQuotaHistoryEntry(input: {
  userId: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  monthYear: string;
  totalAllowed: number;
  generationsUsed: number;
  totalRequested: number;
  wasAutoReset: Date | string;
}) {
  const result = await db
    .insert(quotaHistory)
    .values({
      userId: input.userId,
      periodStart:
        typeof input.periodStart === "string" ? new Date(input.periodStart) : input.periodStart,
      periodEnd: typeof input.periodEnd === "string" ? new Date(input.periodEnd) : input.periodEnd,
      monthYear: input.monthYear,
      totalAllowed: input.totalAllowed,
      generationsUsed: input.generationsUsed,
      totalRequested: input.totalRequested,
      wasAutoReset:
        typeof input.wasAutoReset === "string" ? new Date(input.wasAutoReset) : input.wasAutoReset,
    })
    .returning();

  return result[0];
}
