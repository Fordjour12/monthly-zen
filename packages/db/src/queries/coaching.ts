import { db } from "../index";
import { coachingInsights, coachingSessions, userPatterns, coachingGoals } from "../schema";
import { eq, desc, asc, and, gte, lte, isNull, sql } from "drizzle-orm";

// ============================================
// Coaching Insights Queries
// ============================================

export interface CreateInsightInput {
  userId: string;
  type: "PeakEnergy" | "CompletionRate" | "SessionDuration" | "Challenges";
  title: string;
  description: string;
  reasoning?: string;
  suggestedAction?: string;
  confidence?: string;
  priority?: "high" | "medium" | "low";
  category?: string;
  triggerData?: Record<string, unknown>;
  actionsJson?: {
    actions: { label: string; value: string; type: "primary" | "secondary" | "destructive" }[];
  };
  expiresAt?: Date;
}

export async function createInsight(input: CreateInsightInput) {
  const result = await db
    .insert(coachingInsights)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      description: input.description,
      reasoning: input.reasoning,
      suggestedAction: input.suggestedAction,
      confidence: input.confidence,
      priority: input.priority || "medium",
      category: input.category,
      triggerData: input.triggerData ? JSON.parse(JSON.stringify(input.triggerData)) : null,
      actionsJson: input.actionsJson,
      expiresAt: input.expiresAt,
    })
    .returning();

  return result[0];
}

export async function getActiveInsights(userId: string, limit = 10) {
  const result = await db
    .select()
    .from(coachingInsights)
    .where(
      and(
        eq(coachingInsights.userId, userId),
        eq(coachingInsights.isArchived, false),
        // Either no expiry or expiry in the future
        or(isNull(coachingInsights.expiresAt), gte(coachingInsights.expiresAt, new Date())),
      ),
    )
    .orderBy(desc(coachingInsights.priority), desc(coachingInsights.generatedAt))
    .limit(limit);

  return result;
}

export async function getInsightById(insightId: number) {
  const result = await db
    .select()
    .from(coachingInsights)
    .where(eq(coachingInsights.id, insightId))
    .limit(1);

  return result[0] || null;
}

export async function markInsightAsRead(insightId: number) {
  await db.update(coachingInsights).set({ isRead: true }).where(eq(coachingInsights.id, insightId));
}

export async function dismissInsight(insightId: number, action?: string) {
  await db
    .update(coachingInsights)
    .set({
      isArchived: true,
      dismissedAt: new Date(),
      actionTaken: action,
    })
    .where(eq(coachingInsights.id, insightId));
}

export async function archiveOldInsights(userId: string, daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  await db
    .update(coachingInsights)
    .set({ isArchived: true })
    .where(
      and(
        eq(coachingInsights.userId, userId),
        lte(coachingInsights.generatedAt, cutoffDate),
        eq(coachingInsights.isArchived, false),
      ),
    );
}

// ============================================
// Coaching Sessions Queries
// ============================================

export interface CreateSessionInput {
  userId: string;
  sessionType: string;
  insightId?: number;
  context?: Record<string, unknown>;
}

export async function createCoachingSession(input: CreateSessionInput) {
  const result = await db
    .insert(coachingSessions)
    .values({
      userId: input.userId,
      sessionType: input.sessionType,
      insightId: input.insightId,
      context: input.context ? JSON.parse(JSON.stringify(input.context)) : null,
    })
    .returning();

  return result[0];
}

export async function getRecentSessions(userId: string, limit = 20) {
  return await db
    .select()
    .from(coachingSessions)
    .where(eq(coachingSessions.userId, userId))
    .orderBy(desc(coachingSessions.createdAt))
    .limit(limit);
}

// ============================================
// User Patterns Queries
// ============================================

export async function getLatestPatterns(userId: string) {
  const result = await db
    .select()
    .from(userPatterns)
    .where(eq(userPatterns.userId, userId))
    .orderBy(desc(userPatterns.createdAt))
    .limit(1);

  return result[0] || null;
}

export async function saveUserPatterns(
  userId: string,
  patterns: Record<string, unknown>,
  dataPointsAnalyzed: number,
  analysisStartDate: Date,
  analysisEndDate: Date,
) {
  // Check if we need to update or insert
  const existing = await getLatestPatterns(userId);

  if (existing && existing.version !== null) {
    await db
      .update(userPatterns)
      .set({
        patternsJson: JSON.parse(JSON.stringify(patterns)),
        dataPointsAnalyzed,
        analysisStartDate,
        analysisEndDate,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(userPatterns.id, existing.id));

    return { ...existing, patternsJson: patterns };
  }

  const result = await db
    .insert(userPatterns)
    .values({
      userId,
      patternsJson: JSON.parse(JSON.stringify(patterns)),
      dataPointsAnalyzed,
      analysisStartDate,
      analysisEndDate,
      confidenceLevel:
        dataPointsAnalyzed > 20 ? "high" : dataPointsAnalyzed > 10 ? "medium" : "low",
    })
    .returning();

  return result[0];
}

// ============================================
// Coaching Goals Queries
// ============================================

export interface CreateGoalInput {
  userId: string;
  title: string;
  description?: string;
  category?: string;
  targetMetric?: string;
  currentValue?: string;
  targetValue: string;
  startDate: Date;
  targetDate: Date;
}

export async function createCoachingGoal(input: CreateGoalInput) {
  const result = await db
    .insert(coachingGoals)
    .values({
      userId: input.userId,
      title: input.title,
      description: input.description,
      category: input.category,
      targetMetric: input.targetMetric,
      currentValue: input.currentValue,
      targetValue: input.targetValue,
      startDate: input.startDate,
      targetDate: input.targetDate,
    })
    .returning();

  return result[0];
}

export async function getActiveGoals(userId: string) {
  return await db
    .select()
    .from(coachingGoals)
    .where(and(eq(coachingGoals.userId, userId), eq(coachingGoals.status, "active")))
    .orderBy(asc(coachingGoals.targetDate));
}

export async function updateGoalProgress(
  goalId: number,
  progressPercent: number,
  currentValue?: string,
) {
  await db
    .update(coachingGoals)
    .set({
      progressPercent,
      currentValue,
      updatedAt: new Date(),
    })
    .where(eq(coachingGoals.id, goalId));
}

export async function completeGoal(goalId: number) {
  await db
    .update(coachingGoals)
    .set({
      status: "completed",
      progressPercent: 100,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(coachingGoals.id, goalId));
}

// ============================================
// Analytics Queries
// ============================================

export async function getInsightsStats(userId: string) {
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(coachingInsights)
    .where(eq(coachingInsights.userId, userId));

  const archivedResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(coachingInsights)
    .where(and(eq(coachingInsights.userId, userId), eq(coachingInsights.isArchived, true)));

  const actionedResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(coachingInsights)
    .where(
      and(eq(coachingInsights.userId, userId), sql`${coachingInsights.actionTaken} IS NOT NULL`),
    );

  return {
    totalInsights: totalResult[0]?.count || 0,
    archivedInsights: archivedResult[0]?.count || 0,
    actionedInsights: actionedResult[0]?.count || 0,
  };
}

// Helper for optional expiry condition
function or(condition1: any, condition2: any) {
  return sql`(${condition1} OR ${condition2})`;
}
