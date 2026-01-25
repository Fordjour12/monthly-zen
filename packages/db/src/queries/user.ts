import { eq } from "drizzle-orm";

import { db } from "../index";
import { user } from "../schema";

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
