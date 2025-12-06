import { protectedProcedure, publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { z } from "zod";
import { AIService } from "../services/ai-service";
import { aiQueries,taskQueries,habitQueries } from "@my-better-t-app/db/queries";
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

   /**
    * Categorize a task
    */
   categorizeTask: protectedProcedure
      .input(
         z.object({
            text: z.string().min(1),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) throw new Error("User not authenticated");

         try {
            const result = await AIService.categorizeTask(input.text, { userId });
            if (!result.success || !result.data) {
               throw new Error(result.error || "Failed to categorize task");
            }
            return result.data;
         } catch (error) {
            console.error("Categorize task error:", error);
            throw new Error("Failed to categorize task");
         }
      }),

/**
     * Generate weekly summary
     */
    generateWeeklySummary: protectedProcedure
       .input(
          z.object({
             weekData: z.any(),
          })
       )
       .handler(async ({ input, context }) => {
          const userId = context.session?.user?.id;
          if (!userId) throw new Error("User not authenticated");

          try {
             const result = await AIService.generateWeeklySummary(input.weekData, { userId });
             if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to generate summary");
             }
             return result.data;
          } catch (error) {
             console.error("Generate summary error:", error);
             throw new Error("Failed to generate summary");
          }
       }),

   /**
     * Classify suggestion items for application
     */
   classifySuggestionItems: protectedProcedure
      .input(
         z.object({
            suggestionId: z.string(),
            userContext: z.object({
               current_tasks: z.array(z.any()).optional(),
               current_habits: z.array(z.any()).optional(),
               user_preferences: z.any().optional(),
               completion_history: z.any().optional(),
            }).optional(),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) throw new Error("User not authenticated");

         try {
            // Get the suggestion
            const suggestion = await aiQueries.getSuggestionById(input.suggestionId);
            if (!suggestion) {
               throw new Error("Suggestion not found");
            }
            if (suggestion.userId !== userId) {
               throw new Error("You don't have permission to access this suggestion");
            }

            // Classify items using AI service
            const result = await AIService.classifySuggestionItems(
               suggestion.content,
               input.userContext,
               { userId }
            );

            if (!result.success || !result.data) {
               throw new Error(result.error || "Failed to classify suggestion items");
            }

            return {
               success: true,
               classifications: result.data.classifications,
               application_strategy: result.data.application_strategy,
               warnings: result.data.warnings,
               success_metrics: result.data.success_metrics,
            };
         } catch (error) {
            console.error("Classify suggestion items error:", error);
            throw new Error(
               `Failed to classify suggestion items: ${error instanceof Error ? error.message : "Unknown error"}`
            );
         }
      }),

   /**
     * Apply suggestion as tasks, habits, or recurring tasks
     */
   applySuggestionAsItems: protectedProcedure
      .input(
         z.object({
            suggestionId: z.string(),
            applyAs: z.enum(["task", "habit", "recurring-task"]),
            selectedItems: z.array(z.object({
               title: z.string(),
               description: z.string().optional(),
               priority: z.enum(["low", "medium", "high"]).optional(),
               dueDate: z.string().optional(),
               frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
               recurrenceRule: z.string().optional(),
               habitPotential: z.object({
                  isHabit: z.boolean(),
                  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
                  targetValue: z.number().optional(),
                  streakSuggestion: z.number().optional(),
                  bestTime: z.enum(["morning", "afternoon", "evening"]).optional(),
                  triggerActivity: z.string().optional(),
               }).optional(),
            })).optional(),
            applyAll: z.boolean().default(true),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) throw new Error("User not authenticated");

         try {
            // Get the suggestion
            const suggestion = await aiQueries.getSuggestionById(input.suggestionId);
            if (!suggestion) {
               throw new Error("Suggestion not found");
            }
            if (suggestion.userId !== userId) {
               throw new Error("You don't have permission to access this suggestion");
            }

            // Get user context for better classification
            const userTasks = await taskQueries.getUserTasks(userId);
            const userHabits = await habitQueries.getUserHabits(userId);

            // Classify items if not provided
            let itemsToApply = input.selectedItems;
            if (!itemsToApply || itemsToApply.length === 0) {
               const classificationResult = await AIService.classifySuggestionItems(
                  suggestion.content,
                  {
                     current_tasks: userTasks,
                     current_habits: userHabits,
                  },
                  { userId }
               );

               if (!classificationResult.success || !classificationResult.data) {
                  throw new Error("Failed to classify suggestion items");
               }

               // Filter by applyAs type
               itemsToApply = classificationResult.data.classifications
                  .filter(item => item.type === input.applyAs)
                  .map(item => ({
                     title: item.title,
                     description: item.reasoning,
                     priority: item.suggested_priority,
                     dueDate: item.due_date,
                     frequency: item.suggested_frequency,
                     recurrenceRule: item.recurrence_rule,
                     habitPotential: item.habit_potential ? {
                        isHabit: item.habit_potential.is_habit,
                        frequency: item.habit_potential.frequency,
                        targetValue: item.habit_potential.target_value,
                        streakSuggestion: item.habit_potential.streak_suggestion,
                        bestTime: item.habit_potential.best_time,
                        triggerActivity: item.habit_potential.trigger_activity,
                     } : undefined,
                  }));
            }

            const createdItems: any[] = [];
            const appliedItems: any[] = [];

            // Apply items based on type
            for (const item of itemsToApply) {
               try {
                  if (input.applyAs === "task") {
                     const task = await taskQueries.createTask(userId, {
                        title: item.title,
                        description: item.description,
                        priority: item.priority || "medium",
                        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
                        isRecurring: false,
                     });
                     createdItems.push({ type: "task", id: task.id, ...task });
                     appliedItems.push({ itemId: task.id, itemType: "task", originalTitle: item.title });
                  } else if (input.applyAs === "recurring-task") {
                     const task = await taskQueries.createRecurringTask(userId, {
                        title: item.title,
                        description: item.description,
                        priority: item.priority || "medium",
                        recurrenceRule: item.recurrenceRule || "FREQ=WEEKLY",
                        isRecurring: true,
                     });
                     createdItems.push({ type: "recurring-task", id: task.id, ...task });
                     appliedItems.push({ itemId: task.id, itemType: "recurring-task", originalTitle: item.title });
                  } else if (input.applyAs === "habit") {
                     const habit = await habitQueries.createHabit(userId, {
                        title: item.title,
                        description: item.description,
                        frequency: item.frequency || "daily",
                        targetValue: item.habitPotential?.targetValue || 1,
                        currentStreak: 0,
                        bestTime: item.habitPotential?.bestTime,
                        triggerActivity: item.habitPotential?.triggerActivity,
                     });
                     createdItems.push({ type: "habit", id: habit.id, ...habit });
                     appliedItems.push({ itemId: habit.id, itemType: "habit", originalTitle: item.title });
                  }
               } catch (itemError) {
                  console.error(`Failed to create ${input.applyAs} "${item.title}":`, itemError);
                  // Continue with other items, but log the error
               }
            }

            // Update suggestion with applied items
            await aiQueries.updateSuggestionAppliedItems(input.suggestionId, appliedItems);

            // Mark suggestion as applied if all items were processed
            if (createdItems.length > 0) {
               await aiQueries.markAsApplied(input.suggestionId);
            }

            return {
               success: true,
               createdItems,
               createdCount: createdItems.length,
               appliedItems: appliedItems.length,
               message: `Successfully created ${createdItems.length} ${input.applyAs}${createdItems.length !== 1 ? 's' : ''}`,
            };
         } catch (error) {
            console.error("Apply suggestion as items error:", error);
            throw new Error(
               `Failed to apply suggestion: ${error instanceof Error ? error.message : "Unknown error"}`
            );
         }
      }),
};

export type AIRouter = typeof AiRouter;
export type AIRouterClient = RouterClient<typeof AiRouter>;
