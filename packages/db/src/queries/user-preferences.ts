import { db } from "../index";
import { eq } from "drizzle-orm";
import { userGoalsAndPreferences } from "../schema";
import type { CoachTone } from "../schema/user-goals-and-preferences";

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
  weekendPreference: "Work" | "Rest" | "Mixed";
  preferredTaskDuration?: number | null;
  fixedCommitmentsJson: any;
  updatedAt: Date;
}

export async function getUserPreferences(userId: string) {
  const [preferences] = await db
    .select()
    .from(userGoalsAndPreferences)
    .where(eq(userGoalsAndPreferences.userId, userId));

  return preferences;
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<Omit<UserPreferencesData, "id" | "userId" | "updatedAt">>,
) {
  const [preferences] = await db
    .update(userGoalsAndPreferences)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(userGoalsAndPreferences.userId, userId))
    .returning();

  return preferences;
}

export async function createOrUpdatePreferences(
  userId: string,
  data: Partial<Omit<UserPreferencesData, "id" | "userId" | "updatedAt">>,
) {
  const [preferences] = await db
    .insert(userGoalsAndPreferences)
    .values({
      userId,
      goalsText: data.goalsText || "",
      taskComplexity: (data.taskComplexity as any) || "Balanced",
      focusAreas: data.focusAreas || "personal",
      weekendPreference: (data.weekendPreference as any) || "Mixed",
      preferredTaskDuration: data.preferredTaskDuration || 45,
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
        ...data,
        updatedAt: new Date(),
      },
    })
    .returning();

  return preferences;
}
