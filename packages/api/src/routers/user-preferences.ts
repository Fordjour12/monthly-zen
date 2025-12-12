import { protectedProcedure } from "../index";
import { z } from "zod";
import { db } from "@my-better-t-app/db";
import { userPreferences, NewUserPreferences } from "@my-better-t-app/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@my-better-t-app/db/utils";

// Zod schema for user preferences
const userPreferencesSchema = z.object({
  theme: z.enum(["zen", "zen-light", "system"]).default("zen"),
  notificationsEnabled: z.boolean().default(true),
  dailyBriefingEnabled: z.boolean().default(true),
  taskRemindersEnabled: z.boolean().default(true),
  calendarRemindersEnabled: z.boolean().default(true),
  reminderTime: z.string().default("09:00"),
  defaultView: z.enum(["dashboard", "calendar", "tasks", "plan"]).default("dashboard"),
  aiSuggestionsEnabled: z.boolean().default(true),
  aiAssistantName: z.string().default("Beerus"),
  aiResponseStyle: z.enum(["professional", "casual", "friendly"]).default("professional"),
  focusModeEnabled: z.boolean().default(false),
  pomodoroDuration: z.number().min(1).max(120).default(25),
  dailyGoalMinutes: z.number().min(60).max(1440).default(480),
  shortBreakDuration: z.number().min(1).max(30).default(5),
  longBreakDuration: z.number().min(1).max(60).default(15),
  compactMode: z.boolean().default(false),
  showCompletedTasks: z.boolean().default(true),
  language: z.string().default("en"),
  timezone: z.string(),
  dateFormat: z.enum(["MM/dd/yyyy", "dd/MM/yyyy", "yyyy-MM-dd"]).default("MM/dd/yyyy"),
  autoSyncCalendar: z.boolean().default(true),
  defaultEventDuration: z.number().min(15).max(480).default(60),
  defaultTaskPriority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  taskAutoArchive: z.boolean().default(true),
  taskAutoArchiveDays: z.number().min(1).max(365).default(30),
  primaryCalendarId: z.string().nullable(),
  syncCalendars: z.array(z.string()).default([]),
  dataCollectionEnabled: z.boolean().default(false),
  analyticsEnabled: z.boolean().default(true),
  crashReportingEnabled: z.boolean().default(true),
  customPreferences: z.record(z.any()).default({}),
  onboardingCompleted: z.boolean().default(false),
});

export const userPreferencesRouter = {
  /**
   * Get user preferences for the current user
   */
  getPreferences: protectedProcedure
    .handler(async ({ context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        const preferences = await db.query.userPreferences.findFirst({
          where: eq(userPreferences.userId, userId),
        });

        // If no preferences exist, return default values
        if (!preferences) {
          const defaultPreferences = userPreferencesSchema.parse({
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
          return {
            success: true,
            data: defaultPreferences,
            exists: false,
          };
        }

        return {
          success: true,
          data: preferences,
          exists: true,
        };
      } catch (error) {
        console.error("Error fetching user preferences:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Update user preferences (creates if doesn't exist)
   */
  updatePreferences: protectedProcedure
    .input(userPreferencesSchema.partial())
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        // Check if preferences already exist
        const existingPreferences = await db.query.userPreferences.findFirst({
          where: eq(userPreferences.userId, userId),
        });

        let updatedPreferences;

        if (existingPreferences) {
          // Update existing preferences
          const updateData = {
            ...input,
            updatedAt: new Date(),
          };

          [updatedPreferences] = await db
            .update(userPreferences)
            .set(updateData)
            .where(eq(userPreferences.userId, userId))
            .returning();
        } else {
          // Create new preferences
          const newPreferences: NewUserPreferences = {
            id: generateId(),
            userId,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            ...input,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          [updatedPreferences] = await db
            .insert(userPreferences)
            .values(newPreferences)
            .returning();
        }

        return {
          success: true,
          data: updatedPreferences,
          created: !existingPreferences,
        };
      } catch (error) {
        console.error("Error updating user preferences:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Complete onboarding and save all preferences at once
   */
  completeOnboarding: protectedProcedure
    .input(userPreferencesSchema.extend({
      onboardingCompleted: z.literal(true),
    }))
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        // Check if preferences already exist
        const existingPreferences = await db.query.userPreferences.findFirst({
          where: eq(userPreferences.userId, userId),
        });

        const onboardingData: NewUserPreferences = {
          id: generateId(),
          userId,
          timezone: input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...input,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          createdAt: existingPreferences?.createdAt || new Date(),
          updatedAt: new Date(),
        };

        let result;

        if (existingPreferences) {
          // Update existing preferences
          [result] = await db
            .update(userPreferences)
            .set(onboardingData)
            .where(eq(userPreferences.userId, userId))
            .returning();
        } else {
          // Create new preferences
          [result] = await db
            .insert(userPreferences)
            .values(onboardingData)
            .returning();
        }

        return {
          success: true,
          data: result,
          created: !existingPreferences,
        };
      } catch (error) {
        console.error("Error completing onboarding:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Reset preferences to default values
   */
  resetPreferences: protectedProcedure
    .handler(async ({ context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        const defaultPreferences = userPreferencesSchema.parse({
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        const resetData: NewUserPreferences = {
          id: generateId(),
          userId,
          ...defaultPreferences,
          updatedAt: new Date(),
        };

        // Check if preferences exist
        const existingPreferences = await db.query.userPreferences.findFirst({
          where: eq(userPreferences.userId, userId),
        });

        let result;

        if (existingPreferences) {
          [result] = await db
            .update(userPreferences)
            .set(resetData)
            .where(eq(userPreferences.userId, userId))
            .returning();
        } else {
          resetData.createdAt = new Date();
          [result] = await db
            .insert(userPreferences)
            .values(resetData)
            .returning();
        }

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error("Error resetting preferences:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Delete user preferences (for account deletion)
   */
  deletePreferences: protectedProcedure
    .handler(async ({ context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      try {
        const deletedPreferences = await db
          .delete(userPreferences)
          .where(eq(userPreferences.userId, userId))
          .returning();

        return {
          success: true,
          deleted: deletedPreferences.length > 0,
        };
      } catch (error) {
        console.error("Error deleting preferences:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
};