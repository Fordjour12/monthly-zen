import { z } from "zod";
import { protectedProcedure } from "../index";
import * as db from "@monthly-zen/db";
import type { CoachTone } from "@monthly-zen/db";

const updatePreferencesSchema = z.object({
  coachName: z.string().min(1).max(50).optional(),
  coachTone: z.enum(["encouraging", "direct", "analytical", "friendly"]).optional(),
  workingHoursStart: z.string().optional(),
  workingHoursEnd: z.string().optional(),
  defaultFocusArea: z.string().optional(),
});

export const preferencesRouter = {
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const preferences = await db.getUserPreferences(userId);
    return { success: true, data: preferences };
  }),

  update: protectedProcedure.input(updatePreferencesSchema).handler(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    const preferences = await db.createOrUpdatePreferences(userId, input);
    return { success: true, data: preferences };
  }),
};
