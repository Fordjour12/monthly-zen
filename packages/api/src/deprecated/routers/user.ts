import { z } from "zod";
import { protectedProcedure } from "../index";
import {
  getLatestGoalPreference,
  upsertGoalPreference,
  updateUserProfile,
  completeOnboarding,
  getUserOnboardingStatus,
} from "@monthly-zen/db";

export const userRouter = {
  getPreferences: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    const preferences = await getLatestGoalPreference(userId);
    return preferences || null;
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        taskComplexity: z.enum(["Simple", "Balanced", "Ambitious"]),
        focusAreas: z.string().min(1),
        weekendPreference: z.enum(["Work", "Rest", "Mixed"]),
        fixedCommitmentsJson: z.object({
          commitments: z.array(
            z.object({
              dayOfWeek: z.string(),
              startTime: z.string(),
              endTime: z.string(),
              description: z.string(),
            }),
          ),
        }),
      }),
    )
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      const result = await upsertGoalPreference(userId, input);
      return result;
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        image: z.url().optional().or(z.literal("")),
      }),
    )
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      const result = await updateUserProfile(userId, input);
      return result;
    }),

  completeOnboarding: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    await completeOnboarding(userId);
    return { success: true };
  }),

  getOnboardingStatus: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    const hasCompleted = await getUserOnboardingStatus(userId);
    return { hasCompletedOnboarding: hasCompleted };
  }),
};
