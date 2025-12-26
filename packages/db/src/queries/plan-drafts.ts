import { db } from "../index";
import { eq, and, lt, desc } from "drizzle-orm";
import { planDrafts } from "../schema";

export function generateDraftKey(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `draft_${userId.slice(-6)}_${timestamp}_${random}`;
}

export async function createDraft(
  userId: string,
  planData: any,
  goalPreferenceId: number,
  monthYear: string,
  ttlHours: number = 24,
): Promise<{ draftKey: string }> {
  const draftKey = generateDraftKey(userId);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);

  await db.insert(planDrafts).values({
    userId,
    draftKey,
    planData,
    goalPreferenceId,
    monthYear,
    expiresAt,
  });

  return { draftKey };
}

export async function getDraft(userId: string, draftKey: string): Promise<any | null> {
  const [draft] = await db
    .select()
    .from(planDrafts)
    .where(and(eq(planDrafts.userId, userId), eq(planDrafts.draftKey, draftKey)));

  if (!draft || new Date() > draft.expiresAt) {
    return null;
  }

  return draft;
}

export async function deleteDraft(userId: string, draftKey: string): Promise<void> {
  await db
    .delete(planDrafts)
    .where(and(eq(planDrafts.userId, userId), eq(planDrafts.draftKey, draftKey)));
}

export async function getLatestDraft(userId: string): Promise<any | null> {
  const [draft] = await db
    .select()
    .from(planDrafts)
    .where(eq(planDrafts.userId, userId))
    .orderBy(desc(planDrafts.createdAt))
    .limit(1);

  if (!draft || new Date() > draft.expiresAt) {
    return null;
  }

  return draft;
}

export async function cleanupExpiredDrafts(): Promise<number> {
  const result = await db.delete(planDrafts).where(lt(planDrafts.expiresAt, new Date()));

  return result.rowCount || 0;
}
