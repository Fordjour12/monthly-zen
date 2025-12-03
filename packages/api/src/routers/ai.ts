import { protectedProcedure, publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { z } from "zod";
import { AIService } from "../services/ai-service";
import { aiQueries, taskQueries, habitQueries, calendarQueries } from "@my-better-t-app/db/queries";

export const AiRouter = {
   healthCheck: publicProcedure.handler(() => {
      return "OK form AI Router";
   }),
   privateData: protectedProcedure.handler(({ context }) => {
      return {
         message: "This is a private AI message",
         user: context.session?.user,
      };
   }),

   /**
        * Get all AI suggestions for the current user
        */
   getSuggestions: protectedProcedure
      .input(
         z.object({
            type: z.enum(["plan", "briefing", "reschedule"]).optional(),
            isApplied: z.boolean().optional(),
            limit: z.number().min(1).max(100).optional(),
            search: z.string().optional(),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;

         console.log("📋 Getting suggestions for user:", userId);

         if (!userId) {
            throw new Error("User not authenticated");
         }

         try {
            const suggestions = await aiQueries.getUserSuggestionsEnhanced(userId, {
               type: input.type,
               isApplied: input.isApplied,
               limit: input.limit || 50,
               search: input.search,
               sortBy: "createdAt",
               sortOrder: "desc",
            });

            return {
               suggestions,
               count: suggestions.length,
            };
         } catch (error) {
            console.error("Get suggestions error:", error);
            throw new Error(
               `Failed to get suggestions: ${error instanceof Error ? error.message : "Unknown error"}`
            );
         }
      }),

   /**
    * Apply a suggestion (mark as applied)
    */
   applySuggestion: protectedProcedure
      .input(
         z.object({
            suggestionId: z.string(),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) {
            throw new Error("User not authenticated");
         }

         try {
            // First check if the suggestion belongs to the user
            const suggestion = await aiQueries.getSuggestionById(input.suggestionId);
            if (!suggestion) {
               throw new Error("Suggestion not found");
            }
            if (suggestion.userId !== userId) {
               throw new Error("You don't have permission to update this suggestion");
            }

            // Mark as applied
            await aiQueries.markAsApplied(input.suggestionId);

            // Get the updated suggestion
            const updatedSuggestion = await aiQueries.getSuggestionById(input.suggestionId);

            return {
               success: true,
               suggestion: updatedSuggestion,
               message: "Suggestion applied successfully",
            };
         } catch (error) {
            console.error("Apply suggestion error:", error);
            throw new Error(
               `Failed to apply suggestion: ${error instanceof Error ? error.message : "Unknown error"}`
            );
         }
      }),

   /**
    * Generate a monthly plan based on user goals
    */
   generatePlan: protectedProcedure
      .input(
         z.object({
            userGoals: z.string().min(10, "Please provide more detailed goals"),
            workHours: z.string().optional(),
            energyPatterns: z.string().optional(),
            preferredTimes: z.string().optional(),
            model: z.string().optional(),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) {
            throw new Error("User not authenticated");
         }

         try {
            /*
               // Check if there's already a recent plan suggestion
               const recentPlans = await aiQueries.getRecentByType(userId, "plan", 0.5);
               console.log("🔍 Checking for recent plan suggestions...", recentPlans);
               if (recentPlans.length > 5) {
                  const recentPlan = recentPlans[0]!;
                  return {
                     suggestionId: recentPlan.id,
                     content: recentPlan.content,
                     isRecent: true,
                     message:
                        "Using recently generated plan. Generate new plan in 2 hours if needed.",
                  };
               }*/

            // Generate plan using AI service with caching and rate limiting
            const planResult = await AIService.generatePlan(
               input.userGoals,
               { userId, model: input.model }
            );

            if (!planResult.success || !planResult.data) {
               throw new Error(planResult.error || "Failed to generate plan");
            }

            const planContent = planResult.data;

            // Save suggestion to database
            const suggestion = await aiQueries.createSuggestion(
               userId,
               "plan",
               planContent
            );

            return {
               suggestionId: suggestion.id,
               content: planContent,
               isRecent: false,
               message: "Monthly plan generated successfully",
            };
         } catch (error) {
            console.error("Generate plan error:", error);
            throw new Error(
               `Failed to generate plan: ${error instanceof Error ? error.message : "Unknown error"}`
            );
         }
      }),

};

export type AIRouter = typeof AiRouter;
export type AIRouterClient = RouterClient<typeof AiRouter>;
