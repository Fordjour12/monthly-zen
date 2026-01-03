/**
 * Habits Router - Habit Tracking API
 *
 * Provides habit CRUD operations, completion tracking, and statistics.
 */

import { z } from "zod";
import { protectedProcedure } from "../index";
import * as db from "@monthly-zen/db";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createHabitInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "custom"]),
  targetDays: z
    .array(z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]))
    .optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string(),
});

const updateHabitInputSchema = z.object({
  habitId: z.number(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "custom"]).optional(),
  targetDays: z
    .array(z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]))
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  icon: z.string().optional(),
});

const toggleHabitInputSchema = z.object({
  habitId: z.number(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // YYYY-MM-DD format
  notes: z.string().optional(),
});

const getLogsInputSchema = z.object({
  habitId: z.number(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// ============================================
// HABITS ROUTER
// ============================================

export const habitsRouter = {
  /**
   * Get all habits for the authenticated user with today's status
   *
   * Adapts: GET /api/habits
   */
  list: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      const habits = await db.getHabitsWithStatus(String(userId));

      return {
        success: true,
        data: habits,
        message: "Habits retrieved successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch habits");
    }
  }),

  /**
   * Create a new habit
   *
   * Adapts: POST /api/habits
   */
  create: protectedProcedure.input(createHabitInputSchema).handler(async ({ input, context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      const habit = await db.createHabit({
        userId: String(userId),
        name: input.name,
        description: input.description,
        frequency: input.frequency,
        targetDays: input.targetDays,
        color: input.color,
        icon: input.icon,
      });

      return {
        success: true,
        data: habit,
        message: "Habit created successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create habit");
    }
  }),

  /**
   * Get a single habit by ID
   *
   * Adapts: GET /api/habits/:habitId
   */
  getById: protectedProcedure
    .input(z.object({ habitId: z.number() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        const habit = await db.getHabitWithUserId(input.habitId);

        if (!habit) {
          throw new Error("Habit not found");
        }

        // Ownership check
        if (habit.userId !== String(userId)) {
          throw new Error("Access denied");
        }

        return {
          success: true,
          data: habit,
          message: "Habit retrieved successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch habit");
      }
    }),

  /**
   * Update a habit
   *
   * Adapts: PATCH /api/habits/:habitId
   */
  update: protectedProcedure.input(updateHabitInputSchema).handler(async ({ input, context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      // Verify ownership
      const existingHabit = await db.getHabitWithUserId(input.habitId);
      if (!existingHabit || existingHabit.userId !== String(userId)) {
        throw new Error("Habit not found or access denied");
      }

      const { habitId, ...updates } = input;

      const updatedHabit = await db.updateHabit(habitId, updates);

      return {
        success: true,
        data: updatedHabit,
        message: "Habit updated successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update habit");
    }
  }),

  /**
   * Delete a habit
   *
   * Adapts: DELETE /api/habits/:habitId
   */
  delete: protectedProcedure
    .input(z.object({ habitId: z.number() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        // Verify ownership
        const existingHabit = await db.getHabitWithUserId(input.habitId);
        if (!existingHabit || existingHabit.userId !== String(userId)) {
          throw new Error("Habit not found or access denied");
        }

        await db.deleteHabit(input.habitId);

        return {
          success: true,
          data: null,
          message: "Habit deleted successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to delete habit");
      }
    }),

  /**
   * Toggle habit completion for a specific date
   *
   * Adapts: POST /api/habits/:habitId/toggle
   */
  toggle: protectedProcedure.input(toggleHabitInputSchema).handler(async ({ input, context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      // Verify ownership
      const existingHabit = await db.getHabitWithUserId(input.habitId);
      if (!existingHabit || existingHabit.userId !== String(userId)) {
        throw new Error("Habit not found or access denied");
      }

      const date = input.date || getTodayDate();
      const result = await db.toggleHabitCompletion(input.habitId, date, input.notes);

      return {
        success: true,
        data: {
          habitId: input.habitId,
          date,
          isCompleted: result.isCompleted,
          logId: result.logId,
        },
        message: result.isCompleted ? "Habit completed" : "Habit uncompleted",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to toggle habit");
    }
  }),

  /**
   * Get habit logs for a date range
   *
   * Adapts: GET /api/habits/:habitId/logs
   */
  getLogs: protectedProcedure.input(getLogsInputSchema).handler(async ({ input, context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      // Verify ownership
      const existingHabit = await db.getHabitWithUserId(input.habitId);
      if (!existingHabit || existingHabit.userId !== String(userId)) {
        throw new Error("Habit not found or access denied");
      }

      const logs = await db.getHabitLogs(input.habitId, input.startDate, input.endDate);

      return {
        success: true,
        data: logs,
        message: "Habit logs retrieved successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch habit logs");
    }
  }),

  /**
   * Get habit statistics for the authenticated user
   *
   * Adapts: GET /api/habits/stats
   */
  getStats: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      const stats = await db.getUserHabitStats(String(userId));

      return {
        success: true,
        data: stats,
        message: "Habit statistics retrieved successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch habit statistics");
    }
  }),

  /**
   * Get all habit logs for a user in a date range (for calendar view)
   *
   * Adapts: GET /api/habits/logs
   */
  getAllLogs: protectedProcedure
    .input(
      z.object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        const logs = await db.getUserHabitLogs(String(userId), input.startDate, input.endDate);

        return {
          success: true,
          data: logs,
          message: "Habit logs retrieved successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch habit logs");
      }
    }),
};

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
