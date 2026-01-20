import { z } from "zod";
import { protectedProcedure } from "../index";
import * as db from "@monthly-zen/db";

const updatePreferencesSchema = z.object({
  coachName: z.string().min(1).max(50).optional(),
  coachTone: z.enum(["encouraging", "direct", "analytical", "friendly"]).optional(),
  workingHoursStart: z.string().optional(),
  workingHoursEnd: z.string().optional(),
  defaultFocusArea: z.string().optional(),
  goalsText: z.string().optional(),
  taskComplexity: z.enum(["Simple", "Balanced", "Ambitious"]).optional(),
  focusAreas: z.string().optional(),
  weekendPreference: z.enum(["Work", "Rest", "Mixed"]).optional(),
  preferredTaskDuration: z.number().optional(),
  fixedCommitmentsJson: z.any().optional(),
});

export const preferencesRouter = {
  get: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    const preferences = await db.getUserPreferences(userId);
    return { success: true, data: preferences };
  }),

  update: protectedProcedure.input(updatePreferencesSchema).handler(async ({ input, context }) => {
    const userId = context.session.user.id;
    const preferences = await db.createOrUpdatePreferences(userId, input);
    return { success: true, data: preferences };
  }),
};
