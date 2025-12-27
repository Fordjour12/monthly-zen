/**
 * Tasks Router - Task Management API
 *
 * Provides task CRUD operations with advanced filtering capabilities.
 * Adapted from testing-server REST API to oRPC architecture.
 */

import { z } from "zod";
import { protectedProcedure } from "../index";
import * as db from "@monthly-zen/db";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const getTasksInputSchema = z.object({
  month: z.string().optional(),
  status: z.enum(["all", "completed", "pending"]).optional(),
  focusArea: z.string().optional(),
  difficultyLevel: z.enum(["simple", "moderate", "advanced"]).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["date", "difficulty", "focusArea"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

const updateTaskInputSchema = z.object({
  taskId: z.number(),
  isCompleted: z.boolean(),
});

// ============================================
// TASKS ROUTER
// ============================================

export const tasksRouter = {
  /**
   * Get all user's tasks with optional filters
   *
   * Adapts: GET /api/tasks
   */
  list: protectedProcedure.input(getTasksInputSchema).handler(async ({ input, context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      const tasks = await db.getTasksWithFilters({
        userId: String(userId),
        monthYear: input.month,
        status: input.status,
        focusArea: input.focusArea,
        difficultyLevel: input.difficultyLevel,
        searchQuery: input.search,
        sortBy: input.sortBy || "date",
        sortOrder: input.sortOrder || "asc",
      });

      return {
        success: true,
        data: tasks,
        message: "Tasks retrieved successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch tasks");
    }
  }),

  /**
   * Get single task by ID with ownership validation
   *
   * Adapts: GET /api/tasks/:taskId
   */
  getById: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        const task = await db.getTaskWithUserId(input.taskId);

        if (!task) {
          throw new Error("Task not found");
        }

        // Ownership check
        if (task.userId !== userId) {
          throw new Error("Access denied");
        }

        return {
          success: true,
          data: task,
          message: "Task retrieved successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch task");
      }
    }),

  /**
   * Update task completion status with ownership validation
   *
   * Adapts: PATCH /api/tasks/:taskId
   */
  update: protectedProcedure.input(updateTaskInputSchema).handler(async ({ input, context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      // Ownership check first
      const task = await db.getTaskWithUserId(input.taskId);
      if (!task || task.userId !== userId) {
        throw new Error("Task not found or access denied");
      }

      const updatedTask = await db.updateTaskStatus(input.taskId, input.isCompleted);

      return {
        success: true,
        data: updatedTask,
        message: "Task updated successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update task");
    }
  }),

  /**
   * Get all tasks for a specific plan with ownership validation
   *
   * Adapts: GET /api/tasks/plan/:planId
   */
  getByPlanId: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        // Verify user owns the plan using the helper function
        const planOwnership = await db.verifyPlanOwnership(input.planId, userId);
        if (!planOwnership) {
          throw new Error("Plan not found or access denied");
        }

        const tasks = await db.getTasksByPlanId(input.planId);

        return {
          success: true,
          data: tasks,
          message: "Plan tasks retrieved successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch plan tasks");
      }
    }),

  /**
   * Get all unique focus areas for user
   *
   * Adapts: GET /api/tasks/focus-areas
   */
  getFocusAreas: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      const focusAreas = await db.getUserFocusAreas(String(userId));

      return {
        success: true,
        data: focusAreas,
        message: "Focus areas retrieved successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch focus areas");
    }
  }),

  /**
   * Get all tasks for user in specific month
   *
   * Bonus feature - not in original testing-server
   */
  getByMonth: protectedProcedure
    .input(
      z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format. Use YYYY-MM"),
      }),
    )
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        const tasks = await db.getTasksByUserIdAndMonth(String(userId), input.month);

        return {
          success: true,
          data: tasks,
          message: "Monthly tasks retrieved successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch monthly tasks");
      }
    }),
};
