import { db } from "../index";
import { eq } from "drizzle-orm";
import { userPreferences } from "../schema";
import type { CoachTone, FixedCommitmentsJson } from "../schema/user-preferences";

type DbTransaction = Parameters<typeof db.transaction>[0] extends (tx: infer T) => any ? T : never;

export interface UserPreferencesData {
  id: number;
  userId: string;
  coachName: string;
  coachTone: CoachTone;
  workingHoursStart: string;
  workingHoursEnd: string;
  defaultFocusArea?: string | null;
  taskComplexity: "Simple" | "Balanced" | "Ambitious";
  weekendPreference: "Work" | "Rest" | "Mixed";
  preferredTaskDuration?: number | null;
  fixedCommitmentsJson: FixedCommitmentsJson;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserPreferences(userId: string) {
  const [preferences] = await db
    .select({
      id: userPreferences.id,
      userId: userPreferences.userId,
      coachName: userPreferences.coachName,
      coachTone: userPreferences.coachTone,
      workingHoursStart: userPreferences.workingHoursStart,
      workingHoursEnd: userPreferences.workingHoursEnd,
      defaultFocusArea: userPreferences.defaultFocusArea,
      taskComplexity: userPreferences.taskComplexity,
      weekendPreference: userPreferences.weekendPreference,
      preferredTaskDuration: userPreferences.preferredTaskDuration,
      fixedCommitmentsJson: userPreferences.fixedCommitmentsJson,
      createdAt: userPreferences.createdAt,
      updatedAt: userPreferences.updatedAt,
    })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));

  return preferences;
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<Omit<UserPreferencesData, "id" | "userId" | "updatedAt">>,
) {
  const [preferences] = await db
    .update(userPreferences)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(userPreferences.userId, userId))
    .returning();

  if (!preferences) return preferences;

  return preferences;
}

export async function createOrUpdatePreferences(
  userId: string,
  data: Partial<Omit<UserPreferencesData, "id" | "userId" | "updatedAt">>,
  transaction?: DbTransaction,
) {
  const run = async (executor: DbTransaction) => {
    const [preferences] = await executor
      .insert(userPreferences)
      .values({
        userId,
        taskComplexity: (data.taskComplexity as any) || "Balanced",
        weekendPreference: (data.weekendPreference as any) || "Mixed",
        preferredTaskDuration: data.preferredTaskDuration || 45,
        fixedCommitmentsJson: (data.fixedCommitmentsJson as FixedCommitmentsJson) || {
          commitments: [],
        },
        coachName: data.coachName || "Coach",
        coachTone: (data.coachTone as CoachTone) || "encouraging",
        workingHoursStart: data.workingHoursStart || "09:00",
        workingHoursEnd: data.workingHoursEnd || "17:00",
        defaultFocusArea: data.defaultFocusArea,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          taskComplexity: data.taskComplexity,
          weekendPreference: data.weekendPreference,
          preferredTaskDuration: data.preferredTaskDuration,
          fixedCommitmentsJson: data.fixedCommitmentsJson as FixedCommitmentsJson,
          coachName: data.coachName,
          coachTone: data.coachTone,
          workingHoursStart: data.workingHoursStart,
          workingHoursEnd: data.workingHoursEnd,
          defaultFocusArea: data.defaultFocusArea,
          updatedAt: new Date(),
        },
      })
      .returning();

    return preferences;
  };

  if (transaction) {
    return run(transaction);
  }

  return db.transaction(async (tx) => run(tx));
}
