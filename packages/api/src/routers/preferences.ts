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

const updatePreferencesSchema = z.object({
  coachName: z.string().min(1).max(50).optional(),
  coachTone: z.enum(["encouraging", "direct", "analytical", "friendly"]).optional(),
  workingHoursStart: z.string().optional(),
  workingHoursEnd: z.string().optional(),
  defaultFocusArea: z.string().optional(),
  taskComplexity: z.enum(["Simple", "Balanced", "Ambitious"]).optional(),
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
    const logger = context.logger ?? console;
    logger.info({
      event: "preferences.update.start",
      userId,
    });

    try {
      const preferences = await db.db.transaction(async (tx) => {
        const updated = await db.createOrUpdatePreferences(userId, input, tx);
        return updated;
      });

      logger.info({
        event: "preferences.update.success",
        userId,
      });

      return { success: true, data: preferences };
    } catch (error) {
      logger.error({
        event: "preferences.update.failure",
        userId,
        error,
      });
      throw error;
    }
  }),
};
