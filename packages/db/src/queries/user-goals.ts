import { db } from "../index";
import { eq, desc } from "drizzle-orm";
import { userGoalsAndPreferences, user } from "../schema";

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

export async function updateGoalPreference(
  userId: string,
  input: Omit<CreateGoalPreferenceInput, "userId">,
) {
  const [preference] = await db
    .update(userGoalsAndPreferences)
    .set({
      ...input,
      inputSavedAt: new Date(),
    })
    .where(eq(userGoalsAndPreferences.userId, userId))
    .returning();

  return preference;
}

export async function upsertGoalPreference(
  userId: string,
  input: Omit<CreateGoalPreferenceInput, "userId">,
) {
  const existing = await getLatestGoalPreference(userId);

  if (existing) {
    return updateGoalPreference(userId, input);
  }

  return createGoalPreference({ userId, ...input });
}

export async function updateUserProfile(userId: string, input: { name?: string; image?: string }) {
  const [updatedUser] = await db
    .update(user)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning();

  return updatedUser;
}

export async function completeOnboarding(userId: string) {
  const [updatedUser] = await db
    .update(user)
    .set({
      hasCompletedOnboarding: true,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning();

  return updatedUser;
}

export async function getUserOnboardingStatus(userId: string) {
  const [result] = await db
    .select({ hasCompletedOnboarding: user.hasCompletedOnboarding })
    .from(user)
    .where(eq(user.id, userId));

  return result?.hasCompletedOnboarding ?? false;
}
