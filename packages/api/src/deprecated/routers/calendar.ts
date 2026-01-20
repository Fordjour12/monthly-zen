import { z } from "zod";
import { protectedProcedure } from "../index";
import {
  getTasksByDateRange,
  getTasksByDay,
  getUniqueFocusAreas,
  updateTaskStatus,
  getHabitConsistency,
  getMilestones,
} from "@monthly-zen/db";

export const calendarRouter = {
  getTasks: protectedProcedure
    .input(z.object({ month: z.string() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;
        if (!userId) {
          throw new Error("Authentication required");
        }

        const [year, monthNum] = input.month.split("-").map(Number);
        if (!year || !monthNum) throw new Error("Invalid month format");
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0);

        const tasks = await getTasksByDateRange(userId, startDate, endDate);
        return { success: true, data: tasks };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch tasks");
      }
    }),

  getTasksForDay: protectedProcedure
    .input(z.object({ date: z.string() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;
        if (!userId) {
          throw new Error("Authentication required");
        }

        const selectedDate = new Date(input.date);
        const tasks = await getTasksByDay(userId, selectedDate);
        return { success: true, data: tasks };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch tasks");
      }
    }),

  getFocusAreas: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("Authentication required");
      }

      const focusAreas = await getUniqueFocusAreas(userId);

      const colorPalette = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
      const focusAreasWithColors = focusAreas.map((fa, i) => ({
        ...fa,
        color: colorPalette[i % colorPalette.length],
      }));

      return { success: true, data: focusAreasWithColors };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch focus areas");
    }
  }),

  getHabitStats: protectedProcedure
    .input(z.object({ month: z.string() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;
        if (!userId) {
          throw new Error("Authentication required");
        }

        const [year, monthNum] = input.month.split("-").map(Number);
        if (!year || !monthNum) throw new Error("Invalid month format");
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0);

        const habitStats = await getHabitConsistency(userId, startDate, endDate);
        return { success: true, data: habitStats };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch habit stats");
      }
    }),

  getMilestones: protectedProcedure
    .input(z.object({ month: z.string() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;
        if (!userId) {
          throw new Error("Authentication required");
        }

        const [year, monthNum] = input.month.split("-").map(Number);
        if (!year || !monthNum) throw new Error("Invalid month format");
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0);

        const milestones = await getMilestones(userId, startDate, endDate);
        return { success: true, data: milestones };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch milestones");
      }
    }),

  updateTaskStatus: protectedProcedure
    .input(z.object({ taskId: z.number(), isCompleted: z.boolean() }))
    .handler(async ({ input }) => {
      try {
        const updatedTask = await updateTaskStatus(input.taskId, input.isCompleted);
        return { success: true, data: updatedTask };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to update task status");
      }
    }),
};
