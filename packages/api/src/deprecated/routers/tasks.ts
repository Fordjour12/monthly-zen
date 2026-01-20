/**
 * Tasks Router - Task Management API
 *
 * Provides task CRUD operations with advanced filtering, reminders, and statistics.
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

const createTaskInputSchema = z.object({
  taskDescription: z.string().min(1).max(500),
  focusArea: z.string().min(1).max(50),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  difficultyLevel: z.enum(["simple", "moderate", "advanced"]).optional(),
  schedulingReason: z.string().optional(),
  hasReminder: z.boolean().optional(),
  reminderTime: z.string().optional(), // ISO datetime
});

const updateTaskInputSchema = z.object({
  taskId: z.number(),
  taskDescription: z.string().min(1).max(500).optional(),
  focusArea: z.string().min(1).max(50).optional(),
  startTime: z.iso.datetime().optional(),
  endTime: z.iso.datetime().optional(),
  difficultyLevel: z.enum(["simple", "moderate", "advanced"]).optional(),
  schedulingReason: z.string().optional(),
  isCompleted: z.boolean().optional(),
});

const toggleTaskInputSchema = z.object({
  taskId: z.number(),
  isCompleted: z.boolean(),
});

const createReminderInputSchema = z.object({
  taskId: z.number(),
  reminderTime: z.iso.datetime(),
});

// ============================================
// TASKS ROUTER
// ============================================

export const tasksRouter = {
  /**
   * Get all user's tasks with optional filters
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

      // Get reminders for these tasks
      const taskReminders = await db.getTaskReminders(String(userId));
      const reminderMap = new Map(taskReminders.map((r) => [r.taskId, r]));

      // Combine task data with reminders
      const tasksWithReminders = tasks.map((task) => ({
        ...task,
        reminder: reminderMap.get(task.id) || null,
      }));

      return {
        success: true,
        data: tasksWithReminders,
        message: "Tasks retrieved successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch tasks");
    }
  }),

  /**
   * Get single task by ID with ownership validation
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
        if (task.userId !== String(userId)) {
          throw new Error("Access denied");
        }

        // Get reminder
        const reminder = await db.getTaskReminderByTaskId(input.taskId);

        return {
          success: true,
          data: { ...task, reminder },
          message: "Task retrieved successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch task");
      }
    }),

  /**
   * Create a new task
   */
  create: protectedProcedure.input(createTaskInputSchema).handler(async ({ input, context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      // Get user's current monthly plan or create a default one
      const userPlans = await db.getMonthlyPlansByUserId(String(userId));
      const currentPlan = userPlans.find((p) => {
        const planMonth = new Date(p.monthYear);
        const now = new Date();
        return (
          planMonth.getFullYear() === now.getFullYear() && planMonth.getMonth() === now.getMonth()
        );
      });

      // Default plan if none exists for current month
      const planId = currentPlan?.id || 1; // Would need to create a plan if none exists

      // Create the task
      const task = await db.createPlanTask({
        planId,
        taskDescription: input.taskDescription,
        focusArea: input.focusArea,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        difficultyLevel: input.difficultyLevel || "moderate",
        schedulingReason: input.schedulingReason || "",
        isCompleted: false,
      });

      // Create reminder if requested
      let reminder = null;
      if (input.hasReminder && input.reminderTime && task) {
        reminder = await db.createTaskReminder({
          taskId: task.id,
          userId: String(userId),
          reminderTime: new Date(input.reminderTime),
        });
      }

      return {
        success: true,
        data: { ...task, reminder },
        message: "Task created successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create task");
    }
  }),

  /**
   * Update a task (full update)
   */
  update: protectedProcedure.input(updateTaskInputSchema).handler(async ({ input, context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      // Ownership check first
      const existingTask = await db.getTaskWithUserId(input.taskId);
      if (!existingTask || existingTask.userId !== userId) {
        throw new Error("Task not found or access denied");
      }

      const { taskId, ...updates } = input;

      // Build update object with date conversions
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.startTime) {
        updateData.startTime = new Date(updates.startTime);
      }
      if (updates.endTime) {
        updateData.endTime = new Date(updates.endTime);
      }

      const updatedTask = await db.updatePlanTask(taskId, updateData);

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
   * Update task completion status
   */
  toggle: protectedProcedure.input(toggleTaskInputSchema).handler(async ({ input, context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      // Ownership check
      const task = await db.getTaskWithUserId(input.taskId);
      if (!task || task.userId !== userId) {
        throw new Error("Task not found or access denied");
      }

      const updatedTask = await db.updateTaskStatus(input.taskId, input.isCompleted);

      return {
        success: true,
        data: updatedTask,
        message: input.isCompleted ? "Task completed" : "Task marked as pending",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update task");
    }
  }),

  /**
   * Delete a task
   */
  delete: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        // Ownership check
        const task = await db.getTaskWithUserId(input.taskId);
        if (!task || task.userId !== userId) {
          throw new Error("Task not found or access denied");
        }

        // Delete reminder first
        await db.deleteTaskReminderByTaskId(input.taskId);

        // Delete the task
        await db.deletePlanTask(input.taskId);

        return {
          success: true,
          data: null,
          message: "Task deleted successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to delete task");
      }
    }),

  // ============================================
  // REMINDER ENDPOINTS
  // ============================================

  /**
   * Create or update task reminder
   */
  setReminder: protectedProcedure
    .input(createReminderInputSchema)
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        // Verify task ownership
        const task = await db.getTaskWithUserId(input.taskId);
        if (!task || task.userId !== userId) {
          throw new Error("Task not found or access denied");
        }

        // Check if reminder exists
        const existingReminder = await db.getTaskReminderByTaskId(input.taskId);

        let reminder;
        if (existingReminder) {
          // Update existing reminder
          await db.deleteTaskReminderByTaskId(input.taskId);
        }

        // Create new reminder
        reminder = await db.createTaskReminder({
          taskId: input.taskId,
          userId: String(userId),
          reminderTime: new Date(input.reminderTime),
        });

        return {
          success: true,
          data: reminder,
          message: "Reminder set successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to set reminder");
      }
    }),

  /**
   * Delete task reminder
   */
  deleteReminder: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        await db.deleteTaskReminderByTaskId(input.taskId);

        return {
          success: true,
          data: null,
          message: "Reminder deleted successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to delete reminder");
      }
    }),

  /**
   * Get all task reminders for the user
   */
  getReminders: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      const reminders = await db.getTaskReminders(String(userId));

      return {
        success: true,
        data: reminders,
        message: "Reminders retrieved successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch reminders");
    }
  }),

  // ============================================
  // LEGACY ENDPOINTS (maintained for compatibility)
  // ============================================

  getByPlanId: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

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
