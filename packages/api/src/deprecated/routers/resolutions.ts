import { z } from "zod";
import { protectedProcedure } from "../index";
import * as db from "@monthly-zen/db";

const createResolutionSchema = z.object({
  text: z.string().min(1).max(500),
  category: z
    .enum([
      "health",
      "career",
      "learning",
      "finance",
      "relationships",
      "personal",
      "productivity",
      "other",
    ])
    .default("other"),
  resolutionType: z.enum(["monthly", "yearly"]).default("monthly"),
  priority: z.number().min(1).max(3).default(2),
  targetDate: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(["monthly", "weekly"]).optional(),
});

const updateResolutionSchema = z.object({
  id: z.number(),
  text: z.string().min(1).max(500).optional(),
  category: z
    .enum([
      "health",
      "career",
      "learning",
      "finance",
      "relationships",
      "personal",
      "productivity",
      "other",
    ])
    .optional(),
  priority: z.number().min(1).max(3).optional(),
  isAchieved: z.boolean().optional(),
  targetDate: z.string().optional(),
});

export const resolutionsRouter = {
  // Create single resolution
  create: protectedProcedure.input(createResolutionSchema).handler(async ({ input, context }) => {
    const userId = context.session.user.id;

    const resolution = await db.createResolution({
      userId,
      ...input,
      targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
    });

    return { success: true, data: resolution };
  }),

  // Batch create resolutions (for onboarding)
  createBatch: protectedProcedure
    .input(
      z.object({
        resolutions: z.array(createResolutionSchema),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const resolutions = await Promise.all(
        input.resolutions.map((res) =>
          db.createResolution({
            userId,
            ...res,
            targetDate: res.targetDate ? new Date(res.targetDate) : undefined,
          }),
        ),
      );

      return {
        success: true,
        data: resolutions.map((r) => ({ id: r.id, text: r.text })),
      };
    }),

  // Get all resolutions for user
  getAll: protectedProcedure
    .input(
      z.object({
        includeArchived: z.boolean().default(false),
        resolutionType: z.enum(["monthly", "yearly"]).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      let resolutions = await db.getResolutionsByUser(userId, input.includeArchived);

      // Filter by type if specified
      if (input.resolutionType) {
        resolutions = resolutions.filter((r) => r.resolutionType === input.resolutionType);
      }

      // Calculate progress for each
      const resolutionsWithProgress = await Promise.all(
        resolutions.map(async (r) => ({
          ...r,
          progressPercent: await db.calculateResolutionProgress(r.id),
        })),
      );

      return { success: true, data: resolutionsWithProgress };
    }),

  // Get yearly resolutions
  getYearly: protectedProcedure
    .input(z.object({ year: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const resolutions = await db.getYearlyResolutions(userId, input.year);

      const withProgress = await Promise.all(
        resolutions.map(async (r) => ({
          ...r,
          progressPercent: await db.calculateResolutionProgress(r.id),
        })),
      );

      return { success: true, data: withProgress };
    }),

  // Get single resolution with tasks
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const resolution = await db.getResolutionById(input.id);
      if (!resolution || resolution.userId !== userId) {
        throw new Error("Resolution not found");
      }

      const progress = await db.calculateResolutionProgress(resolution.id);
      const tasks = await db.getResolutionsWithTasks(userId);

      return {
        success: true,
        data: { ...resolution, progressPercent: progress, tasks },
      };
    }),

  // Update resolution
  update: protectedProcedure.input(updateResolutionSchema).handler(async ({ input, context }) => {
    const userId = context.session.user.id;

    const existing = await db.getResolutionById(input.id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Resolution not found");
    }

    const { id, ...updateData } = input;
    const resolution = await db.updateResolution(id, updateData);

    return { success: true, data: resolution };
  }),

  // Archive resolution (soft delete)
  archive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const existing = await db.getResolutionById(input.id);
      if (!existing || existing.userId !== userId) {
        throw new Error("Resolution not found");
      }

      await db.archiveResolution(input.id);

      return { success: true, message: "Resolution archived" };
    }),

  // Delete resolution (hard delete)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const existing = await db.getResolutionById(input.id);
      if (!existing || existing.userId !== userId) {
        throw new Error("Resolution not found");
      }

      await db.deleteResolution(input.id);

      return { success: true, message: "Resolution deleted" };
    }),

  // Link task to resolution
  linkTask: protectedProcedure
    .input(z.object({ resolutionId: z.number(), taskId: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const resolution = await db.getResolutionById(input.resolutionId);
      if (!resolution || resolution.userId !== userId) {
        throw new Error("Resolution not found");
      }

      await db.linkTaskToResolution(input.taskId, input.resolutionId);

      return { success: true, message: "Task linked to resolution" };
    }),

  // Unlink task from resolution
  unlinkTask: protectedProcedure
    .input(z.object({ resolutionId: z.number(), taskId: z.number() }))
    .handler(async ({ input }) => {
      await db.unlinkTaskFromResolution(input.taskId, input.resolutionId);

      return { success: true, message: "Task unlinked from resolution" };
    }),

  // Get yearly summary
  getYearlySummary: protectedProcedure
    .input(z.object({ year: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const resolutions = await db.getYearlyResolutions(userId, input.year);

      const total = resolutions.length;
      const achieved = resolutions.filter((r) => r.isAchieved).length;
      const inProgress = total - achieved;

      // Calculate average progress
      let totalProgress = 0;
      for (const r of resolutions) {
        totalProgress += await db.calculateResolutionProgress(r.id);
      }
      const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;

      return {
        success: true,
        data: {
          year: input.year,
          totalResolutions: total,
          completed: achieved,
          inProgress,
          completionRate: total > 0 ? Math.round((achieved / total) * 100) : 0,
          averageProgress: avgProgress,
        },
      };
    }),
};
