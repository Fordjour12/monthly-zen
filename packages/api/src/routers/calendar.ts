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
        const startTime = new Date(input.startTime);
        const endTime = new Date(input.endTime);

        // Validate date logic
        if (startTime >= endTime) {
          return {
            success: false,
            error: "Start time must be before end time",
          };
        }

        // Check for overlapping events
        const overlappingEvents = await calendarQueries.findOverlappingEvents(
          userId,
          startTime,
          endTime
        );

        if (overlappingEvents.length > 0) {
          return {
            success: false,
            error: "Event conflicts with existing calendar events",
            conflicts: overlappingEvents.map(event => ({
              id: event.id,
              title: event.title,
              startTime: new Date(event.startTime).toISOString(),
              endTime: new Date(event.endTime).toISOString(),
            })),
          };
        }

        const event = await calendarQueries.createEvent(userId, {
          title: input.title,
          description: input.description,
          startTime,
          endTime,
          taskId: input.taskId,
        });

        return {
          success: true,
          data: event,
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
        // First check if event exists and belongs to user
        const existingEvent = await calendarQueries.findById(input.id);
        if (!existingEvent) {
          return {
            success: false,
            error: "Event not found",
          };
        }

        if (existingEvent.userId !== userId) {
          return {
            success: false,
            error: "Not authorized to update this event",
          };
        }

        // Prepare update data
        const updateData: any = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.startTime !== undefined) updateData.startTime = new Date(input.startTime);
        if (input.endTime !== undefined) updateData.endTime = new Date(input.endTime);

        // Validate date logic if both times are provided
        if (updateData.startTime && updateData.endTime) {
          if (updateData.startTime >= updateData.endTime) {
            return {
              success: false,
              error: "Start time must be before end time",
            };
          }
        }

        // Check for overlapping events (excluding current event)
        const startTime = updateData.startTime || new Date(existingEvent.startTime);
        const endTime = updateData.endTime || new Date(existingEvent.endTime);
        
        const overlappingEvents = await calendarQueries.findOverlappingEvents(
          userId,
          startTime,
          endTime,
          input.id
        );

        if (overlappingEvents.length > 0) {
          return {
            success: false,
            error: "Updated event conflicts with existing calendar events",
            conflicts: overlappingEvents.map(event => ({
              id: event.id,
              title: event.title,
              startTime: new Date(event.startTime).toISOString(),
              endTime: new Date(event.endTime).toISOString(),
            })),
          };
        }

        const updatedEvent = await calendarQueries.updateEvent(input.id, updateData);

        return {
          success: true,
          data: updatedEvent,
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
        // First check if event exists and belongs to user
        const existingEvent = await calendarQueries.findById(input.id);
        if (!existingEvent) {
          return {
            success: false,
            error: "Event not found",
          };
        }

        if (existingEvent.userId !== userId) {
          return {
            success: false,
            error: "Not authorized to delete this event",
          };
        }

        await calendarQueries.deleteEvent(input.id);

        return {
          success: true,
          message: "Event deleted successfully",
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
        const event = await calendarQueries.findById(input.id);
        
        if (!event) {
          return {
            success: false,
            error: "Event not found",
          };
        }

        if (event.userId !== userId) {
          return {
            success: false,
            error: "Not authorized to view this event",
          };
        }

        return {
          success: true,
          data: event,
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