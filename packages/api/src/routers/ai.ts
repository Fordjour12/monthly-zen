import { protectedProcedure, publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { z } from "zod";
import {
   regeneratePlan,
   modifyPlan,
   populateCalendar,
   modifyCalendarSchedule,
   resolveCalendarConflicts,
   parsePlanForTasks,
   parsePlanForHabits,
   trackPlanExecution,
   categorizeTask,
   generateWeeklySummary,
   classifySuggestionItems,
} from "../services/ai-service";
import { generatePlan} from "../services/ai-service-mod"
import { aiQueries, taskQueries, habitQueries } from "@my-better-t-app/db/queries";
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
        * Generate a monthly plan based on user goals
        */
      generatePlan: protectedProcedure
         .input(
            z.object({
               userGoals: z.string().min(10, "Please provide more detailed goals"),
               model: z.string().optional(),
            })
         )
         .handler(async ({ input, context }) => {
            const userId = context.session?.user?.id;
            if (!userId) {
               throw new Error("User not authenticated");
            }

            try {
               // Generate Plan using AI service
               const PlanResult = await generatePlan(
                  input.userGoals,
                  { userId, model: input.model }
               );

               if (!PlanResult.success || !PlanResult.data) {
                  throw new Error(PlanResult.error || "Failed to generate Plan");
               }

               const PlanContent = PlanResult.data;
               console.log("PlanContent", PlanContent);

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
            const tasks = parsePlanForTasks(suggestion.content as PlanSuggestionContent);

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
            const habits = parsePlanForHabits(suggestion.content as PlanSuggestionContent);

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

            // Get user tasks and habits
            const userTasks = await taskQueries.getUserTasks(userId);
            const userHabits = await habitQueries.getUserHabits(userId);

            // Filter for completed items
            const completedTasks = userTasks
               .filter(t => t.status === "completed" || t.completedAt)
               .map(t => t.title);

            const completedHabits = userHabits
               .filter(h => h.currentStreak > 0) // Using currentStreak as proxy for activity
               .map(h => h.title);

            // Track effectiveness
            const effectiveness = await trackPlanExecution(
               input.planId,
               completedTasks,
               completedHabits,
               { userId } // Pass userId in config
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
            const result = await categorizeTask(input.text, { userId });
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
            const result = await generateWeeklySummary(input.weekData, { userId });
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
            const result = await classifySuggestionItems(
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
            applyAs: z.enum(["task", "habit", "recurring-task", "auto"]),
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
            let itemsToApply: any[] = input.selectedItems || [];
            if (!itemsToApply || itemsToApply.length === 0) {
               const classificationResult = await classifySuggestionItems(
                  suggestion.content,
                  {
                     current_tasks: userTasks,
                     current_habits: userHabits,
                  },
                  { userId }
               );

               console.log("Classification Result:", classificationResult);

               if (!classificationResult.success || !classificationResult.data) {
                  throw new Error("Failed to classify suggestion items");
               }

               // Filter by applyAs type, or include all if "auto"
               if (input.applyAs === "auto") {
                  // Auto mode: include all classified items with their types
                  itemsToApply = classificationResult.data.classifications.map((item: any) => ({
                     type: item.type, // Preserve the AI-classified type
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
                        triggerActivity: item.habit_potential.trigger_activity
                     } : undefined,
                  }));
               } else {
                  // Specific type mode: filter by requested type
                  itemsToApply = classificationResult.data.classifications
                     .filter((item: any) => item.type === input.applyAs)
                     .map((item: any) => ({
                        type: item.type,
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
                           triggerActivity: item.habit_potential.trigger_activity
                        } : undefined,
                     }));
               }
            }

            const createdItems: any[] = [];
            const appliedItems: any[] = [];

            // Apply items based on their type (auto mode uses item.type, specific mode uses input.applyAs)
            for (const item of itemsToApply) {
               try {
                  const itemType = input.applyAs === "auto" ? item.type : input.applyAs;

                  if (itemType === "task") {
                     const task = await taskQueries.createTask(userId, {
                        title: item.title,
                        description: item.description,
                        priority: item.priority || "medium",
                        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
                        suggestionId: input.suggestionId,
                     });
                     createdItems.push({ type: "task", ...task });
                     appliedItems.push({ itemId: task.id, itemType: "task", originalTitle: item.title });
                  } else if (itemType === "recurring-task") {
                     const task = await taskQueries.createRecurringTask(userId, {
                        title: item.title,
                        description: item.description,
                        priority: item.priority || "medium",
                        recurrenceRule: item.recurrenceRule || "FREQ=WEEKLY",
                        suggestionId: input.suggestionId,
                     });
                     createdItems.push({ type: "recurring-task", ...task });
                     appliedItems.push({ itemId: task.id, itemType: "recurring-task", originalTitle: item.title });
                  } else if (itemType === "habit") {
                     const habit = await habitQueries.createHabit(userId, {
                        title: item.title,
                        description: item.description,
                        frequency: item.frequency || "daily",
                        targetValue: item.habitPotential?.targetValue || 1,
                        bestTime: item.habitPotential?.bestTime,
                        triggerActivity: item.habitPotential?.triggerActivity,
                        suggestionId: input.suggestionId,
                     });
                     createdItems.push({ type: "habit", ...habit });
                     appliedItems.push({ itemId: habit.id, itemType: "habit", originalTitle: item.title });
                  }
               } catch (itemError) {
                  console.error(`Failed to create ${item.type || input.applyAs} "${item.title}":`, itemError);
                  // Continue with other items
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
            throw new Error(`Failed to apply suggestion: ${error instanceof Error ? error.message : "Unknown error"}`);
         }
      }),

   /**
    * Regenerate an existing plan based on user feedback
    */
   regeneratePlan: protectedProcedure
      .input(
         z.object({
            originalPlanId: z.string(),
            regenerationReason: z.string().min(10, "Please explain why you want to regenerate the plan"),
            model: z.string().optional(),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) throw new Error("User not authenticated");

         try {
            const result = await regeneratePlan(
               input.originalPlanId,
               input.regenerationReason,
               { userId, model: input.model }
            );

            if (!result.success || !result.data) {
               throw new Error(result.error || "Failed to regenerate plan");
            }

            const resultData = result.data as any; // Cast to access extra fields

            return {
               success: true,
               planId: result.data, // This would be the new plan ID
               content: result.data,
               message: "Plan regenerated successfully based on your feedback",
               improvements: resultData.improvements_made || [],
            };
         } catch (error) {
            console.error("Regenerate plan error:", error);
            throw new Error(`Failed to regenerate plan: ${error instanceof Error ? error.message : "Unknown error"}`);
         }
      }),

   /**
    * Modify an existing plan with specific adjustments
    */
   modifyPlan: protectedProcedure
      .input(
         z.object({
            planId: z.string(),
            userFeedback: z.string().optional(),
            completedTasks: z.array(z.string()).optional(),
            newGoals: z.array(z.string()).optional(),
            timeConstraints: z.string().optional(),
            priorityAdjustments: z.array(z.object({
               taskTitle: z.string(),
               newPriority: z.enum(["low", "medium", "high"]),
            })).optional(),
            weeklyAdjustments: z.array(z.object({
               week: z.number(),
               adjustments: z.array(z.string()),
            })).optional(),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) throw new Error("User not authenticated");

         try {
            const result = await modifyPlan(
               input.planId,
               {
                  userFeedback: input.userFeedback,
                  completedTasks: input.completedTasks,
                  newGoals: input.newGoals,
                  timeConstraints: input.timeConstraints,
                  priorityAdjustments: input.priorityAdjustments,
                  weeklyAdjustments: input.weeklyAdjustments,
               },
               { userId }
            );

            if (!result.success || !result.data) {
               throw new Error(result.error || "Failed to modify plan");
            }

            const resultData = result.data as any; // Cast to access extra fields

            return {
               success: true,
               planId: input.planId,
               content: result.data,
               message: "Plan modified successfully with your adjustments",
               modifications: resultData.modifications_applied || [],
               impact: resultData.impact_analysis || {},
            };
         } catch (error) {
            console.error("Modify plan error:", error);
            throw new Error(`Failed to modify plan: ${error instanceof Error ? error.message : "Unknown error"}`);
         }
      }),

   /**
    * Populate calendar with classified items from AI suggestions
    */
   populateCalendar: protectedProcedure
      .input(
         z.object({
            suggestionId: z.string(),
            classifiedItems: z.array(z.object({
               title: z.string(),
               type: z.enum(["task", "habit", "recurring-task"]),
               confidence: z.number(),
               reasoning: z.string(),
               suggested_priority: z.enum(["low", "medium", "high"]),
               suggested_frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
               estimated_duration: z.string().optional(),
               due_date: z.string().optional(),
               recurrence_rule: z.string().optional(),
               habit_potential: z.object({
                  is_habit: z.boolean(),
                  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
                  target_value: z.number().optional(),
                  streak_suggestion: z.number().optional(),
                  best_time: z.enum(["morning", "afternoon", "evening"]).optional(),
                  trigger_activity: z.string().optional(),
               }).optional(),
            })),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            avoidConflicts: z.boolean().default(true),
            preferredTimes: z.record(z.enum(["morning", "afternoon", "evening"]), z.string()).optional(),
            defaultDuration: z.number().min(15).max(240).default(30),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) throw new Error("User not authenticated");

         try {
            const result = await populateCalendar(
               userId,
               input.classifiedItems,
               {
                  startDate: input.startDate ? new Date(input.startDate) : undefined,
                  endDate: input.endDate ? new Date(input.endDate) : undefined,
                  avoidConflicts: input.avoidConflicts,
                  preferredTimes: input.preferredTimes,
                  defaultDuration: input.defaultDuration,
               }
            );

            if (!result.success || !result.data) {
               throw new Error(result.error || "Failed to populate calendar");
            }

            return {
               success: true,
               createdEvents: result.data.createdEvents,
               conflicts: result.data.conflicts,
               suggestions: result.data.suggestions,
               totalScheduled: result.data.totalScheduled,
               totalSkipped: result.data.totalSkipped,
               message: `Successfully scheduled ${result.data.totalScheduled} items in your calendar`,
            };
         } catch (error) {
            console.error("Populate calendar error:", error);
            throw new Error(`Failed to populate calendar: ${error instanceof Error ? error.message : "Unknown error"}`);
         }
      }),

   /**
    * Modify calendar schedule dynamically
    */
   modifyCalendarSchedule: protectedProcedure
      .input(
         z.object({
            rescheduleTasks: z.array(z.object({
               taskId: z.string(),
               newDate: z.string(),
               newTime: z.string().optional(),
            })).optional(),
            adjustHabits: z.array(z.object({
               habitId: z.string(),
               newTime: z.string(),
               newFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
            })).optional(),
            pauseItems: z.array(z.object({
               id: z.string(),
               type: z.enum(["task", "habit"]),
               pauseUntil: z.string(),
            })).optional(),
            resumeItems: z.array(z.object({
               id: z.string(),
               type: z.enum(["task", "habit"]),
            })).optional(),
            bulkReschedule: z.object({
               fromDate: z.string(),
               toDate: z.string(),
               reason: z.string(),
            }).optional(),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) throw new Error("User not authenticated");

         try {
            const result = await modifyCalendarSchedule(
               userId,
               {
                  rescheduleTasks: input.rescheduleTasks,
                  adjustHabits: input.adjustHabits,
                  pauseItems: input.pauseItems,
                  resumeItems: input.resumeItems,
                  bulkReschedule: input.bulkReschedule,
               }
            );

            if (!result.success || !result.data) {
               throw new Error(result.error || "Failed to modify calendar schedule");
            }

            return {
               success: true,
               modifiedEvents: result.data.modifiedEvents,
               impact: result.data.impact,
               warnings: result.data.warnings,
               conflicts: result.data.conflicts,
               message: "Calendar schedule modified successfully",
            };
         } catch (error) {
            console.error("Modify calendar schedule error:", error);
            throw new Error(`Failed to modify calendar schedule: ${error instanceof Error ? error.message : "Unknown error"}`);
         }
      }),

   /**
    * Resolve calendar conflicts using AI-powered strategies
    */
   resolveCalendarConflicts: protectedProcedure
      .input(
         z.object({
            conflicts: z.array(z.object({
               eventId: z.string(),
               conflictType: z.enum(["overlap", "resource", "time"]),
               conflictingEventIds: z.array(z.string()),
               severity: z.enum(["low", "medium", "high"]),
            })),
            strategy: z.enum(["prioritize", "reschedule", "split", "user_choice", "ai_optimized"]).default("ai_optimized"),
         })
      )
      .handler(async ({ input, context }) => {
         const userId = context.session?.user?.id;
         if (!userId) throw new Error("User not authenticated");

         try {
            const result = await resolveCalendarConflicts(
               userId,
               input.conflicts,
               input.strategy
            );

            if (!result.success || !result.data) {
               throw new Error(result.error || "Failed to resolve calendar conflicts");
            }

            return {
               success: true,
               resolutions: result.data.resolutions,
               summary: result.data.summary,
               warnings: result.data.warnings,
               message: `Successfully resolved ${result.data.summary.resolvedConflicts} out of ${result.data.summary.totalConflicts} conflicts`,
            };
         } catch (error) {
            console.error("Resolve calendar conflicts error:", error);
            throw new Error(`Failed to resolve calendar conflicts: ${error instanceof Error ? error.message : "Unknown error"}`);
         }
      }),
};


export type AIRouter = typeof AiRouter;
export type AIRouterClient = RouterClient<typeof AiRouter>;
