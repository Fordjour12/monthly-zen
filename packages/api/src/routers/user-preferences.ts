import { protectedProcedure } from "../index";
import { userPreferencesQueries } from "@my-better-t-app/db/queries";
import { z } from "zod";
import type { RouterClient } from "@orpc/server";
import type { UserPreferences } from "@my-better-t-app/db/types";

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
            const preferences = await userPreferencesQueries.findByUserId(userId);

            if (preferences) {
               return {
                  success: true,
                  data: preferences,
                  exists: true,
               };
            } else {
               // Return default preferences if none exist
               const defaultPrefs = await userPreferencesQueries.getWithDefaults(userId);
               return {
                  success: true,
                  data: defaultPrefs,
                  exists: false,
               };
            }
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
      .input(
         // Use Zod schema for updates
         z.record(z.string(), z.unknown()) // Allow any fields but validate it's a record
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) {
            throw new Error("User not authenticated");
         }

         try {
            const updatedPreferences = await userPreferencesQueries.update(userId, input);

            return {
               success: true,
               data: updatedPreferences,
               created: false,
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
      .input(
         // Use Zod schema for onboarding completion
         z.object({
            onboardingCompleted: z.literal(true)
         }).catchall(z.unknown()) // Allow any other fields
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) {
            throw new Error("User not authenticated");
         }

         try {
            // Extract onboardingCompleted and other fields
            const { onboardingCompleted, ...otherPrefs } = input;

            const result = await userPreferencesQueries.completeOnboarding(userId, otherPrefs);

            return {
               success: true,
               data: result,
               created: true,
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
            const resetPrefs = await userPreferencesQueries.resetToDefaults(userId);

            return {
               success: true,
               data: resetPrefs,
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
            await userPreferencesQueries.delete(userId);

            return {
               success: true,
               deleted: true,
            };
         } catch (error) {
            console.error("Error deleting preferences:", error);
            return {
               success: false,
               error: error instanceof Error ? error.message : "Unknown error",
            };
         }
      }),

   /**
    * Get preference statistics (admin only)
    */
   getStats: protectedProcedure
      .handler(async ({ context }) => {
         // This could be restricted to admin users
         const userId = context.session?.user?.id;
         if (!userId) {
            throw new Error("User not authenticated");
         }

         try {
            const stats = await userPreferencesQueries.getStats();

            return {
               success: true,
               data: stats,
            };
         } catch (error) {
            console.error("Error getting preference statistics:", error);
            return {
               success: false,
               error: error instanceof Error ? error.message : "Unknown error",
            };
         }
      }),

   /**
    * Get preference analytics (for user insights)
    */
   getAnalytics: protectedProcedure
      .handler(async ({ context }) => {
         const userId = context.session?.user?.id;
         if (!userId) {
            throw new Error("User not authenticated");
         }

         try {
            const userPrefs = await userPreferencesQueries.findByUserId(userId);
            const allStats = await userPreferencesQueries.getStats();

            if (!userPrefs) {
               return {
                  success: false,
                  error: "User preferences not found",
               };
            }

            // Calculate user-specific analytics
            const userAnalytics = {
               onboardingCompleted: userPrefs.onboardingCompleted,
               onboardingCompletedAt: userPrefs.onboardingCompletedAt,
               preferencesAge: userPrefs.updatedAt
                  ? Math.floor((Date.now() - new Date(userPrefs.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) // days
                  : 0,
               customizationLevel: calculateCustomizationLevel(userPrefs),
               productivityScore: calculateProductivityScore(userPrefs),
            };

            return {
               success: true,
               data: {
                  user: userAnalytics,
                  global: allStats,
               },
            };
         } catch (error) {
            console.error("Error getting preference analytics:", error);
            return {
               success: false,
               error: error instanceof Error ? error.message : "Unknown error",
            };
         }
      }),
};

export type UserPreferencesRouter = typeof userPreferencesRouter;
export type UserPreferencesRouterClient = RouterClient<typeof userPreferencesRouter>;

// Helper functions for analytics
function calculateCustomizationLevel(preferences: UserPreferences): number {
   let score = 0;

   // Check if user has customized default values
   if (preferences.theme !== 'zen') score += 10;
   if (preferences.defaultView !== 'dashboard') score += 5;
   if (preferences.aiAssistantName !== 'Beerus') score += 5;
   if (preferences.aiResponseStyle !== 'professional') score += 5;
   if (preferences.dailyGoalMinutes !== 480) score += 10;
   if (preferences.pomodoroDuration !== 25) score += 5;

   // Check boolean preferences
   if (!preferences.notificationsEnabled) score += 5;
   if (!preferences.dailyBriefingEnabled) score += 5;
   if (preferences.focusModeEnabled) score += 10;
   if (preferences.compactMode) score += 5;
   if (!preferences.showCompletedTasks) score += 5;

   // Check custom values
   if (preferences.reminderTime !== '09:00') score += 5;
   if (preferences.language !== 'en') score += 10;
   if (preferences.dateFormat !== 'MM/dd/yyyy') score += 5;
   if (preferences.defaultTaskPriority !== 'medium') score += 5;

   return Math.min(score, 100); // Cap at 100
}

function calculateProductivityScore(preferences: UserPreferences): number {
   let score = 50; // Base score

   // Productivity features
   if (preferences.focusModeEnabled) score += 15;
   if (preferences.notificationsEnabled && preferences.taskRemindersEnabled) score += 10;
   if (preferences.dailyBriefingEnabled) score += 10;
   if (preferences.aiSuggestionsEnabled) score += 10;

   // Good defaults
   if (preferences.dailyGoalMinutes >= 480 && preferences.dailyGoalMinutes <= 600) score += 5;
   if (preferences.showCompletedTasks) score += 5;

   // Balanced approach
   if (preferences.pomodoroDuration >= 25 && preferences.pomodoroDuration <= 30) score += 5;

   return Math.min(Math.max(score, 0), 100); // Keep between 0-100
}
