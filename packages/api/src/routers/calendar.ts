import { protectedProcedure } from "../index";
import { z } from "zod";
import { calendarQueries } from "@my-better-t-app/db";

export const calendarRouter = {
  /**
   * Get all calendar events for current user
   */
  getEvents: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        let events;

        // Filter by date range if provided
        if (input.startDate && input.endDate) {
          const startDate = new Date(input.startDate);
          const endDate = new Date(input.endDate);
          events = await calendarQueries.findByDateRange(userId, startDate, endDate);
        } else {
          // Get all events for the user (limit to reasonable range)
          const today = new Date();
          const futureDate = new Date(today.getFullYear(), today.getMonth() + 3, 0); // 3 months from now
          events = await calendarQueries.findByDateRange(userId, today, futureDate);
        }

        return {
          success: true,
          data: events,
        };
      } catch (error) {
        console.error("Error fetching calendar events:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get events for a specific date range
   */
  getEventsByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        const events = await calendarQueries.findByDateRange(userId, startDate, endDate);

        return {
          success: true,
          data: events,
        };
      } catch (error) {
        console.error("Error fetching events by date range:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get today's events
   */
  getTodayEvents: protectedProcedure
    .handler(async ({ context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        const events = await calendarQueries.findToday(userId);

        return {
          success: true,
          data: events,
        };
      } catch (error) {
        console.error("Error fetching today's events:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Create a new calendar event
   */
  createEvent: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        startTime: z.string(),
        endTime: z.string(),
        location: z.string().optional(),
        allDay: z.boolean().default(false),
        taskId: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        // TODO: Implement calendar event creation
        // This would need to be added to calendarQueries
        return {
          success: false,
          error: "Event creation not yet implemented",
        };
      } catch (error) {
        console.error("Error creating calendar event:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Update an existing calendar event
   */
  updateEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
        allDay: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        // TODO: Implement calendar event update
        // This would need to be added to calendarQueries
        return {
          success: false,
          error: "Event update not yet implemented",
        };
      } catch (error) {
        console.error("Error updating calendar event:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Delete a calendar event
   */
  deleteEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        // TODO: Implement calendar event deletion
        // This would need to be added to calendarQueries
        return {
          success: false,
          error: "Event deletion not yet implemented",
        };
      } catch (error) {
        console.error("Error deleting calendar event:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get event by ID
   */
  getEventById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        // TODO: Implement get event by ID
        // This would need to be added to calendarQueries
        return {
          success: false,
          error: "Get event by ID not yet implemented",
        };
      } catch (error) {
        console.error("Error fetching event by ID:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
};