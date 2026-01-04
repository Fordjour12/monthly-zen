import { db } from "../index";
import { eq } from "drizzle-orm";
import { userGoalsAndPreferences } from "../schema";
import type { CoachTone } from "../schema/user-goals-and-preferences";

export interface UserPreferencesData {
  coachName: string;
  coachTone: CoachTone;
  workingHoursStart: string;
  workingHoursEnd: string;
  defaultFocusArea?: string;
}

export async function getUserPreferences(userId: string) {
  const [preferences] = await db
    .select({
      id: userGoalsAndPreferences.id,
      userId: userGoalsAndPreferences.userId,
      coachName: userGoalsAndPreferences.coachName,
      coachTone: userGoalsAndPreferences.coachTone,
      workingHoursStart: userGoalsAndPreferences.workingHoursStart,
      workingHoursEnd: userGoalsAndPreferences.workingHoursEnd,
      defaultFocusArea: userGoalsAndPreferences.defaultFocusArea,
    })
    .from(userGoalsAndPreferences)
    .where(eq(userGoalsAndPreferences.userId, userId));

  return preferences;
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<{
    coachName: string;
    coachTone: CoachTone;
    workingHoursStart: string;
    workingHoursEnd: string;
    defaultFocusArea: string;
  }>,
) {
  const [preferences] = await db
    .update(userGoalsAndPreferences)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(userGoalsAndPreferences.userId, userId))
    .returning({
      id: userGoalsAndPreferences.id,
      userId: userGoalsAndPreferences.userId,
      coachName: userGoalsAndPreferences.coachName,
      coachTone: userGoalsAndPreferences.coachTone,
      workingHoursStart: userGoalsAndPreferences.workingHoursStart,
      workingHoursEnd: userGoalsAndPreferences.workingHoursEnd,
      defaultFocusArea: userGoalsAndPreferences.defaultFocusArea,
    });

  return preferences;
}

export async function createOrUpdatePreferences(
  userId: string,
  data: Partial<{
    coachName: string;
    coachTone: CoachTone;
    workingHoursStart: string;
    workingHoursEnd: string;
    defaultFocusArea: string;
    goalsText: string;
    taskComplexity: string;
    focusAreas: string;
    weekendPreference: string;
    fixedCommitmentsJson: unknown;
  }>,
) {
  // Use upsert to avoid read-then-write pattern
  const [preferences] = await db
    .insert(userGoalsAndPreferences)
    .values({
      userId,
      goalsText: data.goalsText || "",
      taskComplexity: (data.taskComplexity as "Simple" | "Balanced" | "Ambitious") || "Balanced",
      focusAreas: data.focusAreas || "personal",
      weekendPreference: (data.weekendPreference as "Work" | "Rest" | "Mixed") || "Mixed",
      fixedCommitmentsJson: (data.fixedCommitmentsJson as any) || { commitments: [] },
      coachName: data.coachName || "Coach",
      coachTone: (data.coachTone as CoachTone) || "encouraging",
      workingHoursStart: data.workingHoursStart || "09:00",
      workingHoursEnd: data.workingHoursEnd || "17:00",
      defaultFocusArea: data.defaultFocusArea,
    })
    .onConflictDoUpdate({
      target: userGoalsAndPreferences.userId,
      set: {
        coachName: data.coachName || "Coach",
        coachTone: (data.coachTone as CoachTone) || "encouraging",
        workingHoursStart: data.workingHoursStart || "09:00",
        workingHoursEnd: data.workingHoursEnd || "17:00",
        defaultFocusArea: data.defaultFocusArea,
        goalsText: data.goalsText || "",
        taskComplexity: (data.taskComplexity as "Simple" | "Balanced" | "Ambitious") || "Balanced",
        focusAreas: data.focusAreas || "personal",
        weekendPreference: (data.weekendPreference as "Work" | "Rest" | "Mixed") || "Mixed",
        fixedCommitmentsJson: (data.fixedCommitmentsJson as any) || { commitments: [] },
        updatedAt: new Date(),
      },
    })
    .returning({
      id: userGoalsAndPreferences.id,
      userId: userGoalsAndPreferences.userId,
      coachName: userGoalsAndPreferences.coachName,
      coachTone: userGoalsAndPreferences.coachTone,
      workingHoursStart: userGoalsAndPreferences.workingHoursStart,
      workingHoursEnd: userGoalsAndPreferences.workingHoursEnd,
      defaultFocusArea: userGoalsAndPreferences.defaultFocusArea,
    });

  return preferences;
}
