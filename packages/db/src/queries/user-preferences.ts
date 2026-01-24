import { db } from "../index";
import { eq } from "drizzle-orm";
import { userGoals, userPreferences } from "../schema";
import type { CoachTone, FixedCommitmentsJson } from "../schema/user-preferences";
import type { ResolutionsJson } from "../schema/user-goals";

export interface UserPreferencesData {
  id: number;
  userId: string;
  coachName: string;
  coachTone: CoachTone;
  workingHoursStart: string;
  workingHoursEnd: string;
  defaultFocusArea?: string | null;
  goalsText: string;
  taskComplexity: "Simple" | "Balanced" | "Ambitious";
  focusAreas: string;
  resolutionsJson: ResolutionsJson;
  weekendPreference: "Work" | "Rest" | "Mixed";
  preferredTaskDuration?: number | null;
  fixedCommitmentsJson: FixedCommitmentsJson;
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
      updatedAt: userPreferences.updatedAt,
      goalsText: userGoals.goalsText,
      focusAreas: userGoals.focusAreas,
      resolutionsJson: userGoals.resolutionsJson,
    })
    .from(userPreferences)
    .leftJoin(userGoals, eq(userGoals.userId, userPreferences.userId))
    .where(eq(userPreferences.userId, userId));

  return preferences;
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<Omit<UserPreferencesData, "id" | "userId" | "updatedAt">>,
) {
  const { goalsText, focusAreas, resolutionsJson, ...preferenceUpdates } = updates;
  const shouldUpdateGoals =
    goalsText !== undefined || focusAreas !== undefined || resolutionsJson !== undefined;

  const [preferences] = await db
    .update(userPreferences)
    .set({ ...preferenceUpdates, updatedAt: new Date() })
    .where(eq(userPreferences.userId, userId))
    .returning();

  if (shouldUpdateGoals) {
    await db
      .insert(userGoals)
      .values({
        userId,
        goalsText: goalsText ?? "",
        focusAreas: focusAreas ?? "personal",
        resolutionsJson: (resolutionsJson as ResolutionsJson) || { resolutions: [] },
        inputSavedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userGoals.userId,
        set: {
          ...(goalsText !== undefined ? { goalsText } : {}),
          ...(focusAreas !== undefined ? { focusAreas } : {}),
          ...(resolutionsJson !== undefined
            ? { resolutionsJson: resolutionsJson as ResolutionsJson }
            : {}),
          inputSavedAt: new Date(),
          updatedAt: new Date(),
        },
      });
  }

  if (!preferences) return preferences;

  const merged = await getUserPreferences(userId);
  return merged || preferences;
}

export async function createOrUpdatePreferences(
  userId: string,
  data: Partial<Omit<UserPreferencesData, "id" | "userId" | "updatedAt">>,
) {
  return db.transaction(async (tx) => {
    const [preferences] = await tx
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

    const [goals] = await tx
      .insert(userGoals)
      .values({
        userId,
        goalsText: data.goalsText || "",
        focusAreas: data.focusAreas || "personal",
        resolutionsJson: (data.resolutionsJson as ResolutionsJson) || { resolutions: [] },
        inputSavedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userGoals.userId,
        set: {
          goalsText: data.goalsText,
          focusAreas: data.focusAreas,
          resolutionsJson: data.resolutionsJson as ResolutionsJson,
          inputSavedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return {
      ...preferences,
      goalsText: goals?.goalsText ?? "",
      focusAreas: goals?.focusAreas ?? "personal",
      resolutionsJson: goals?.resolutionsJson ?? { resolutions: [] },
    };
  });
}
