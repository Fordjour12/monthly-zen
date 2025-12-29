import { db } from "../index";
import { eq, desc } from "drizzle-orm";
import { userGoalsAndPreferences } from "../schema";

export interface CreateGoalPreferenceInput {
  userId: string;
  goalsText: string;
  taskComplexity: "Simple" | "Balanced" | "Ambitious";
  focusAreas: string;
  weekendPreference: "Work" | "Rest" | "Mixed";
  fixedCommitmentsJson: {
    commitments: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      description: string;
    }>;
  };
}

export async function createGoalPreference(input: CreateGoalPreferenceInput) {
  const [preference] = await db
    .insert(userGoalsAndPreferences)
    .values({
      userId: input.userId,
      goalsText: input.goalsText,
      taskComplexity: input.taskComplexity,
      focusAreas: input.focusAreas,
      weekendPreference: input.weekendPreference,
      fixedCommitmentsJson: input.fixedCommitmentsJson as any,
    })
    .returning();

  return preference;
}

export async function getGoalPreferenceById(id: number) {
  const [preference] = await db
    .select()
    .from(userGoalsAndPreferences)
    .where(eq(userGoalsAndPreferences.id, id));

  return preference;
}

export async function getLatestGoalPreference(userId: string) {
  const [preference] = await db
    .select()
    .from(userGoalsAndPreferences)
    .where(eq(userGoalsAndPreferences.userId, userId))
    .orderBy(desc(userGoalsAndPreferences.inputSavedAt))
    .limit(1);

  return preference;
}
