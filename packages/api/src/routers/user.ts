import { z } from "zod";
import { protectedProcedure } from "../index";
import { updateUserProfile, completeOnboarding, getUserOnboardingStatus } from "@monthly-zen/db";

export const userRouter = {
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
