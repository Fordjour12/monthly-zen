import * as db from "@monthly-zen/db";
import { z } from "zod";

import { protectedProcedure } from "../index";

const fixedCommitmentsSchema = z.object({
  commitments: z.array(
    z.object({
      dayOfWeek: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      description: z.string(),
    }),
  ),
});

const resolutionsSchema = z.object({
  resolutions: z.array(
    z.object({
      title: z.string().min(1),
      category: z.string().min(1),
      targetCount: z.number().int().min(1),
    }),
  ),
});

const updatePreferencesSchema = z.object({
  coachName: z.string().min(1).max(50).optional(),
  coachTone: z.enum(["encouraging", "direct", "analytical", "friendly"]).optional(),
  workingHoursStart: z.string().optional(),
  workingHoursEnd: z.string().optional(),
  defaultFocusArea: z.string().optional(),
  taskComplexity: z.enum(["Simple", "Balanced", "Ambitious"]).optional(),
  focusAreas: z.string().optional(),
  resolutionsJson: resolutionsSchema.optional(),
  weekendPreference: z.enum(["Work", "Rest", "Mixed"]).optional(),
  preferredTaskDuration: z.number().optional(),
  fixedCommitmentsJson: fixedCommitmentsSchema.optional(),
});

export const preferencesRouter = {
  hello: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    console.log(`[Preferences Hello] request received for user ${userId}`);
    return {
      success: true,
      data: "Hello world",
    };
  }),
  get: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    const preferences = await db.getUserPreferences(userId);
    return { success: true, data: preferences };
  }),

  update: protectedProcedure.input(updatePreferencesSchema).handler(async ({ input, context }) => {
    const userId = context.session.user.id;
    const preferences = await db.createOrUpdatePreferences(userId, input);

    if (input.resolutionsJson) {
      await db.replaceYearlyResolutionsForUser(userId, input.resolutionsJson.resolutions);
    }

    return { success: true, data: preferences };
  }),
};
