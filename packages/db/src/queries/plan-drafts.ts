import { db } from "../index";
import { eq, and, lt, desc } from "drizzle-orm";
import { monthlyPlans } from "../schema";

export function generateDraftKey(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `draft_${userId.slice(-6)}_${timestamp}_${random}`;
}

export async function createDraft(
  userId: string,
  planData: any,
  preferenceId: number,
  monthYear: string,
  aiPrompt: string,
  ttlHours: number = 24,
): Promise<{ draftKey: string }> {
  const draftKey = generateDraftKey(userId);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);

  await db.insert(monthlyPlans).values({
    userId,
    preferenceId,
    monthYear,
    aiPrompt,
    aiResponseRaw: planData,
    draftKey,
    expiresAt,
    status: "DRAFT",
  });

  return { draftKey };
}

export async function getDraft(userId: string, draftKey: string): Promise<any | null> {
  const [draft] = await db
    .select()
    .from(monthlyPlans)
    .where(
      and(
        eq(monthlyPlans.userId, userId),
        eq(monthlyPlans.draftKey, draftKey),
        eq(monthlyPlans.status, "DRAFT"),
      ),
    );

  if (!draft || (draft.expiresAt && new Date() > draft.expiresAt)) {
    return null;
  }

  // Map back to expected structure for compatibility
  return {
    ...draft,
    planData: draft.aiResponseRaw,
    goalPreferenceId: draft.preferenceId,
  };
}

export async function deleteDraft(userId: string, draftKey: string): Promise<void> {
  await db
    .delete(monthlyPlans)
    .where(
      and(
        eq(monthlyPlans.userId, userId),
        eq(monthlyPlans.draftKey, draftKey),
        eq(monthlyPlans.status, "DRAFT"),
      ),
    );
}

export async function getLatestDraft(userId: string): Promise<any | null> {
  const [draft] = await db
    .select()
    .from(monthlyPlans)
    .where(and(eq(monthlyPlans.userId, userId), eq(monthlyPlans.status, "DRAFT")))
    .orderBy(desc(monthlyPlans.generatedAt))
    .limit(1);

  if (!draft || (draft.expiresAt && new Date() > draft.expiresAt)) {
    return null;
  }

  return {
    ...draft,
    planData: draft.aiResponseRaw,
    goalPreferenceId: draft.preferenceId,
  };
}

export async function cleanupExpiredDrafts(): Promise<number> {
  const result = await db
    .delete(monthlyPlans)
    .where(and(lt(monthlyPlans.expiresAt, new Date()), eq(monthlyPlans.status, "DRAFT")));

  return result.rowCount || 0;
}
