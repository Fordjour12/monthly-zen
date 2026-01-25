import { z } from "zod";
import { protectedProcedure } from "../index";
import * as db from "@monthly-zen/db";
import { generateInsight } from "../services/insight-generator";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createGoalInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().optional(),
  targetMetric: z.string().optional(),
  targetValue: z.string().min(1),
  startDate: z.iso.datetime(),
  targetDate: z.iso.datetime(),
});

const updateGoalProgressSchema = z.object({
  goalId: z.number(),
  progressPercent: z.number().min(0).max(100),
  currentValue: z.string().optional(),
});

const dismissInsightSchema = z.object({
  insightId: z.number(),
  action: z.string().optional(),
});

const markInsightReadSchema = z.object({
  insightId: z.number(),
});

// ============================================
// COACHING ROUTER
// ============================================

export const coachingRouter = {
  /**
   * Get all active coaching insights for the user
   */
  getInsights: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session.user.id;
      const insights = await db.getActiveInsights(userId);

      return {
        success: true,
        data: insights,
        message: "Insights retrieved successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch insights");
    }
  }),

  /**
   * Get a single insight by ID
   */
  getInsightById: protectedProcedure
    .input(z.object({ insightId: z.number() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session.user.id;
        const insight = await db.getInsightById(input.insightId);

        if (!insight) {
          throw new Error("Insight not found");
        }

        if (insight.userId !== userId) {
          throw new Error("Access denied");
        }

        return {
          success: true,
          data: insight,
          message: "Insight retrieved successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch insight");
      }
    }),

  /**
   * Mark an insight as read
   */
  markAsRead: protectedProcedure
    .input(markInsightReadSchema)
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session.user.id;
        const insight = await db.getInsightById(input.insightId);

        if (!insight || insight.userId !== userId) {
          throw new Error("Insight not found or access denied");
        }

        await db.markInsightAsRead(input.insightId);

        return {
          success: true,
          message: "Insight marked as read",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to mark insight as read");
      }
    }),

  /**
   * Dismiss an insight
   */
  dismiss: protectedProcedure.input(dismissInsightSchema).handler(async ({ input, context }) => {
    try {
      const userId = context.session.user.id;
      const insight = await db.getInsightById(input.insightId);

      if (!insight || insight.userId !== userId) {
        throw new Error("Insight not found or access denied");
      }

      await db.dismissInsight(input.insightId, input.action);

      // Log the session
      await db.createCoachingSession({
        userId,
        sessionType: "insight_dismissed",
        insightId: input.insightId,
        context: { action: input.action },
      });

      return {
        success: true,
        message: "Insight dismissed",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to dismiss insight");
    }
  }),

  /**
   * Generate new coaching insights using AI
   */
  generateInsights: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session.user.id;

      // Generate new insight
      const insight = await generateInsight(userId);

      if (!insight) {
        return {
          success: false,
          message: "Could not generate insights at this time",
        };
      }

      // Log the generation session
      await db.createCoachingSession({
        userId,
        sessionType: "insight_generated",
        context: { insightType: insight.type },
      });

      return {
        success: true,
        data: insight,
        message: "Insight generated successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to generate insights");
    }
  }),

  /**
   * Get user patterns
   */
  getPatterns: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session.user.id;
      const patterns = await db.getLatestPatterns(userId);

      return {
        success: true,
        data: patterns,
        message: "Patterns retrieved successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch patterns");
    }
  }),

  /**
   * Get coaching goals
   */
  getGoals: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session.user.id;
      const goals = await db.getActiveGoals(userId);

      return {
        success: true,
        data: goals,
        message: "Goals retrieved successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch goals");
    }
  }),

  /**
   * Create a new coaching goal
   */
  createGoal: protectedProcedure
    .input(createGoalInputSchema)
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session.user.id;

        const goal = await db.createCoachingGoal({
          userId,
          title: input.title,
          description: input.description,
          category: input.category,
          targetMetric: input.targetMetric,
          targetValue: input.targetValue,
          startDate: new Date(input.startDate),
          targetDate: new Date(input.targetDate),
        });

        if (!goal) {
          throw new Error("Failed to create goal");
        }

        // Log the session
        await db.createCoachingSession({
          userId,
          sessionType: "goal_created",
          context: { goalId: goal.id },
        });

        return {
          success: true,
          data: goal,
          message: "Goal created successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to create goal");
      }
    }),

  /**
   * Update goal progress
   */
  updateGoalProgress: protectedProcedure
    .input(updateGoalProgressSchema)
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session.user.id;

        await db.updateGoalProgress(input.goalId, input.progressPercent, input.currentValue);

        // Log the session
        await db.createCoachingSession({
          userId,
          sessionType: "goal_progress_updated",
          context: { goalId: input.goalId, progress: input.progressPercent },
        });

        return {
          success: true,
          message: "Goal progress updated",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to update goal progress");
      }
    }),

  /**
   * Complete a goal
   */
  completeGoal: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session.user.id;

        await db.completeGoal(input.goalId);

        // Log the session
        await db.createCoachingSession({
          userId,
          sessionType: "goal_completed",
          context: { goalId: input.goalId },
        });

        return {
          success: true,
          message: "Goal completed!",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to complete goal");
      }
    }),

  /**
   * Get coaching stats
   */
  getStats: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session.user.id;
      const stats = await db.getInsightsStats(userId);

      return {
        success: true,
        data: stats,
        message: "Stats retrieved successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch stats");
    }
  }),

  /**
   * Get recent coaching sessions
   */
  getSessionHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(20) }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session.user.id;
        const sessions = await db.getRecentSessions(userId, input.limit);

        return {
          success: true,
          data: sessions,
          message: "Session history retrieved successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch session history");
      }
    }),
};
