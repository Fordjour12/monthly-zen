import { db } from "../index";
import { eq, desc } from "drizzle-orm";
import { userGoals, userPreferences, user } from "../schema";

export interface CreateGoalPreferenceInput {
  userId: string;
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
  return db.transaction(async (tx) => {
    const [preference] = await tx
      .insert(userPreferences)
      .values({
        userId: input.userId,
        taskComplexity: input.taskComplexity,
        weekendPreference: input.weekendPreference,
        fixedCommitmentsJson: input.fixedCommitmentsJson as any,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          taskComplexity: input.taskComplexity,
          weekendPreference: input.weekendPreference,
          fixedCommitmentsJson: input.fixedCommitmentsJson as any,
          updatedAt: new Date(),
        },
      })
      .returning();

    const [goals] = await tx
      .insert(userGoals)
      .values({
        userId: input.userId,
        goalsText: "",
        focusAreas: input.focusAreas,
        inputSavedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userGoals.userId,
        set: {
          focusAreas: input.focusAreas,
          inputSavedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return {
      ...preference,
      goalsText: goals?.goalsText ?? "",
      focusAreas: goals?.focusAreas ?? "personal",
      resolutionsJson: goals?.resolutionsJson ?? { resolutions: [] },
      inputSavedAt: goals?.inputSavedAt ?? new Date(),
    };
  });
}

export async function getGoalPreferenceById(id: number) {
  const [preference] = await db
    .select({
      id: userPreferences.id,
      userId: userPreferences.userId,
      taskComplexity: userPreferences.taskComplexity,
      weekendPreference: userPreferences.weekendPreference,
      fixedCommitmentsJson: userPreferences.fixedCommitmentsJson,
      coachName: userPreferences.coachName,
      coachTone: userPreferences.coachTone,
      workingHoursStart: userPreferences.workingHoursStart,
      workingHoursEnd: userPreferences.workingHoursEnd,
      defaultFocusArea: userPreferences.defaultFocusArea,
      preferredTaskDuration: userPreferences.preferredTaskDuration,
      createdAt: userPreferences.createdAt,
      updatedAt: userPreferences.updatedAt,
      goalsText: userGoals.goalsText,
      focusAreas: userGoals.focusAreas,
      resolutionsJson: userGoals.resolutionsJson,
      inputSavedAt: userGoals.inputSavedAt,
    })
    .from(userPreferences)
    .leftJoin(userGoals, eq(userGoals.userId, userPreferences.userId))
    .where(eq(userPreferences.id, id));

  return preference;
}

export async function getLatestGoalPreference(userId: string) {
  const [preference] = await db
    .select({
      id: userPreferences.id,
      userId: userPreferences.userId,
      taskComplexity: userPreferences.taskComplexity,
      weekendPreference: userPreferences.weekendPreference,
      fixedCommitmentsJson: userPreferences.fixedCommitmentsJson,
      coachName: userPreferences.coachName,
      coachTone: userPreferences.coachTone,
      workingHoursStart: userPreferences.workingHoursStart,
      workingHoursEnd: userPreferences.workingHoursEnd,
      defaultFocusArea: userPreferences.defaultFocusArea,
      preferredTaskDuration: userPreferences.preferredTaskDuration,
      createdAt: userPreferences.createdAt,
      updatedAt: userPreferences.updatedAt,
      goalsText: userGoals.goalsText,
      focusAreas: userGoals.focusAreas,
      resolutionsJson: userGoals.resolutionsJson,
      inputSavedAt: userGoals.inputSavedAt,
    })
    .from(userPreferences)
    .leftJoin(userGoals, eq(userGoals.userId, userPreferences.userId))
    .where(eq(userPreferences.userId, userId))
    .orderBy(desc(userGoals.inputSavedAt))
    .limit(1);

  return preference;
}

export async function updateGoalPreference(
  userId: string,
  input: Omit<CreateGoalPreferenceInput, "userId">,
) {
  return db.transaction(async (tx) => {
    const [preference] = await tx
      .update(userPreferences)
      .set({
        taskComplexity: input.taskComplexity,
        weekendPreference: input.weekendPreference,
        fixedCommitmentsJson: input.fixedCommitmentsJson as any,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    const [goals] = await tx
      .update(userGoals)
      .set({
        focusAreas: input.focusAreas,
        inputSavedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userGoals.userId, userId))
      .returning();

    return {
      ...preference,
      goalsText: goals?.goalsText ?? "",
      focusAreas: goals?.focusAreas ?? "personal",
      resolutionsJson: goals?.resolutionsJson ?? { resolutions: [] },
      inputSavedAt: goals?.inputSavedAt ?? new Date(),
    };
  });
}

export async function upsertGoalPreference(
  userId: string,
  input: Omit<CreateGoalPreferenceInput, "userId">,
) {
  return db.transaction(async (tx) => {
    const [preference] = await tx
      .insert(userPreferences)
      .values({
        userId,
        taskComplexity: input.taskComplexity,
        weekendPreference: input.weekendPreference,
        fixedCommitmentsJson: input.fixedCommitmentsJson as any,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          taskComplexity: input.taskComplexity,
          weekendPreference: input.weekendPreference,
          fixedCommitmentsJson: input.fixedCommitmentsJson as any,
          updatedAt: new Date(),
        },
      })
      .returning();

    const [goals] = await tx
      .insert(userGoals)
      .values({
        userId,
        goalsText: "",
        focusAreas: input.focusAreas,
        inputSavedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userGoals.userId,
        set: {
          focusAreas: input.focusAreas,
          inputSavedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return {
      ...preference,
      goalsText: goals?.goalsText ?? "",
      focusAreas: goals?.focusAreas ?? "personal",
      resolutionsJson: goals?.resolutionsJson ?? { resolutions: [] },
      inputSavedAt: goals?.inputSavedAt ?? new Date(),
    };
  });
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
