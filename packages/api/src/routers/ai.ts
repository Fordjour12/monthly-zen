import { protectedProcedure, publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { z } from "zod";
import { AIService } from "../services/ai-service";
import { aiQueries } from "@my-better-t-app/db/queries";
import type { PlanSuggestionContent } from "@my-better-t-app/db";

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
            // Generate Plan using AI service with caching and rate limiting
            const PlanResult = await AIService.generatePlan(
               input.userGoals,
               { userId, model: input.model }
            );

            if (!PlanResult.success || !PlanResult.data) {
               throw new Error(PlanResult.error || "Failed to generate Plan");
            }

            const PlanContent = PlanResult.data;

            // Save suggestion to database
            const suggestion = await aiQueries.createSuggestion(
               userId,
               "plan",
               PlanContent
            );

            return {
               suggestionId: suggestion.id,
               content: PlanContent,
               isRecent: false,
               message: "Monthly Plan generated successfully",
            };
         } catch (error) {
            console.error("Generate Plan error:", error);
            throw new Error(
               `Failed to generate Plan: ${error instanceof Error ? error.message : "Unknown error"}`
            );
         }
      }),

   /**
     * Generate a monthly plan with progress simulation
     */
   generatePlanWithProgress: protectedProcedure
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
            // Generate Plan with progress simulation
            const PlanResult = await AIService.generatePlanWithProgress(
               input.userGoals,
               (stage: string, message: string) => {
                  // This would normally be sent via WebSocket or Server-Sent Events
                  // For now, we'll just log the progress
                  console.log(`Plan Generation [${stage}]: ${message}`);
               },
               { userId, model: input.model }
            );

            if (!PlanResult.success || !PlanResult.data) {
               throw new Error(PlanResult.error || "Failed to generate Plan");
            }

            const PlanContent = PlanResult.data;

            // Save suggestion to database
            const suggestion = await aiQueries.createSuggestion(
               userId,
               "plan",
               PlanContent
            );

            return {
               suggestionId: suggestion.id,
               content: PlanContent,
               isRecent: false,
               message: "Monthly Plan generated successfully",
            };
         } catch (error) {
            console.error("Generate Plan error:", error);
            throw new Error(
               `Failed to generate Plan: ${error instanceof Error ? error.message : "Unknown error"}`
            );
         }
      }),

   /**
     * Convert plan to tasks
     */
   convertPlanToTasks: protectedProcedure
      .input(
         z.object({
            planId: z.string(),
            selectedWeeks: z.array(z.number()).optional(),
            selectedMilestones: z.array(z.string()).optional(),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) {
            throw new Error("User not authenticated");
         }

         try {
            // Get the plan
            const suggestion = await aiQueries.getSuggestionById(input.planId);
            if (!suggestion) {
               throw new Error("Plan not found");
            }
            if (suggestion.userId !== userId) {
               throw new Error("You don't have permission to access this plan");
            }

            // Parse plan for tasks
            const tasks = AIService.parsePlanForTasks(suggestion.content as PlanSuggestionContent);

            // Filter by selected weeks and milestones if provided
            let filteredTasks = tasks;
            if (input.selectedWeeks && input.selectedWeeks.length > 0) {
               filteredTasks = tasks.filter(task => 
                  input.selectedWeeks!.includes(task.week)
               );
            }
            if (input.selectedMilestones && input.selectedMilestones.length > 0) {
               filteredTasks = filteredTasks.filter(task => 
                  task.day === 'milestone' && input.selectedMilestones!.includes(task.title)
               );
            }

            // Create tasks (this would integrate with taskQueries)
            console.log(`Creating ${filteredTasks.length} tasks from plan:`, filteredTasks);

            return {
               success: true,
               tasks: filteredTasks,
               message: `Successfully converted plan to ${filteredTasks.length} tasks`,
            };
         } catch (error) {
            console.error("Convert plan to tasks error:", error);
            throw new Error(
               `Failed to convert plan to tasks: ${error instanceof Error ? error.message : "Unknown error"}`
            );
         }
      }),

   /**
     * Convert plan to habits
     */
   convertPlanToHabits: protectedProcedure
      .input(
         z.object({
            planId: z.string(),
            autoDetectFrequency: z.boolean().default(true),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) {
            throw new Error("User not authenticated");
         }

         try {
            // Get the plan
            const suggestion = await aiQueries.getSuggestionById(input.planId);
            if (!suggestion) {
               throw new Error("Plan not found");
            }
            if (suggestion.userId !== userId) {
               throw new Error("You don't have permission to access this plan");
            }

            // Parse plan for habits
            const habits = AIService.parsePlanForHabits(suggestion.content as PlanSuggestionContent);

            // Create habits (this would integrate with habitQueries)
            console.log(`Creating ${habits.length} habits from plan:`, habits);

            return {
               success: true,
               habits,
               message: `Successfully identified ${habits.length} potential habits from plan`,
            };
         } catch (error) {
            console.error("Convert plan to habits error:", error);
            throw new Error(
               `Failed to convert plan to habits: ${error instanceof Error ? error.message : "Unknown error"}`
            );
         }
      }),

   /**
     * Get plan history
     */
   getPlanHistory: protectedProcedure
      .input(
         z.object({
            limit: z.number().max(50).default(10),
            month: z.string().optional(),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) {
            throw new Error("User not authenticated");
         }

         try {
            const suggestions = await aiQueries.getUserSuggestionsEnhanced(userId, {
               type: "plan",
               limit: input.limit,
               sortBy: "createdAt",
               sortOrder: "desc",
            });

            // Filter by month if provided
            let filteredSuggestions = suggestions;
            if (input.month) {
               filteredSuggestions = suggestions.filter(suggestion => {
                  const suggestionDate = new Date(suggestion.createdAt);
                  return suggestionDate.toLocaleDateString('en-US', { 
                     month: 'long', 
                     year: 'numeric' 
                  }) === input.month;
               });
            }

            return {
               success: true,
               plans: filteredSuggestions,
               count: filteredSuggestions.length,
            };
         } catch (error) {
            console.error("Get plan history error:", error);
            throw new Error(
               `Failed to get plan history: ${error instanceof Error ? error.message : "Unknown error"}`
            );
         }
      }),

   /**
     * Track plan execution effectiveness
     */
   getPlanEffectiveness: protectedProcedure
      .input(
         z.object({
            planId: z.string(),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) {
            throw new Error("User not authenticated");
         }

         try {
            // Get the plan and track execution
            const suggestion = await aiQueries.getSuggestionById(input.planId);
            if (!suggestion) {
               throw new Error("Plan not found");
            }
            if (suggestion.userId !== userId) {
               throw new Error("You don't have permission to access this plan");
            }

            // Mock completed tasks and habits for demonstration
            const completedTasks = ["Task 1", "Task 2", "Task 3"];
            const completedHabits = ["Exercise", "Reading"];

            // Track effectiveness
            const effectiveness = await AIService.trackPlanExecution(
               input.planId,
               completedTasks,
               completedHabits
            );

            return {
               success: true,
               effectiveness,
            };
         } catch (error) {
            console.error("Get plan effectiveness error:", error);
            throw new Error(
               `Failed to get plan effectiveness: ${error instanceof Error ? error.message : "Unknown error"}`
            );
         }
      }),

};

export type AIRouter = typeof AiRouter;
export type AIRouterClient = RouterClient<typeof AiRouter>;
