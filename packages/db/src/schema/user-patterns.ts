import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, jsonb, varchar, integer } from "drizzle-orm/pg-core";
import { user } from "./auth";

export type DayOfWeekPattern = {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  dayName: string;
  completionRate: number;
  totalTasks: number;
  avgTasksPerWeek: number;
  trend: "improving" | "declining" | "stable";
};

export type TimeOfDayPattern = {
  hour: number; // 0-23
  completionRate: number;
  taskCount: number;
  peakHours: number[];
};

export type FocusAreaPattern = {
  focusArea: string;
  completionRate: number;
  totalTasks: number;
  trend: "improving" | "declining" | "stable";
  avgDuration: number; // in minutes
};

export type ProductivityScore = {
  overall: number; // 0-100
  consistency: number;
  quality: number;
  momentum: number;
};

export type UserPatternsJson = {
  dayOfWeekPatterns: DayOfWeekPattern[];
  timeOfDayPatterns: TimeOfDayPattern;
  focusAreaPatterns: FocusAreaPattern[];
  productivityScore: ProductivityScore;
  burnoutRisk: {
    level: "low" | "medium" | "high";
    score: number;
    indicators: string[];
  };
  peakProductivityPeriod: {
    dayOfWeek: number;
    timeRange: { start: string; end: string };
  };
  seasonalPatterns: {
    month: string;
    productivityTrend: "up" | "down" | "stable";
  }[];
};

export const userPatterns = pgTable("user_patterns", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),

  // Pattern analysis period
  analysisStartDate: timestamp("analysis_start_date").notNull(),
  analysisEndDate: timestamp("analysis_end_date").notNull(),

  // Core pattern data
  patternsJson: jsonb("patterns_json").notNull().$type<UserPatternsJson>(),

  // Analysis metadata
  dataPointsAnalyzed: integer("data_points_analyzed").notNull(), // Number of tasks/days analyzed
  confidenceLevel: varchar("confidence_level", { length: 20 }), // high, medium, low

  // Versioning for cache invalidation
  version: integer("version").default(1),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userPatternsRelations = relations(userPatterns, ({ one }) => ({
  user: one(user, {
    fields: [userPatterns.userId],
    references: [user.id],
  }),
}));

// Coaching goals - separate from monthly plans
export const coachingGoals = pgTable("coaching_goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),

  // Goal content
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }), // productivity, health, learning, work, personal

  // Target
  targetMetric: varchar("target_metric", { length: 100 }), // e.g., "complete_90%_tasks"
  currentValue: varchar("current_value", { length: 100 }),
  targetValue: varchar("target_value", { length: 100 }).notNull(),

  // Timeline
  startDate: timestamp("start_date").notNull(),
  targetDate: timestamp("target_date").notNull(),
  completedAt: timestamp("completed_at"),

  // Progress tracking
  progressPercent: integer("progress_percent").default(0),
  milestones: jsonb("milestones"), // [{ date, value, achieved }]

  // Status
  status: varchar("status", { length: 20 }).default("active"), // active, completed, abandoned, paused

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const coachingGoalsRelations = relations(coachingGoals, ({ one }) => ({
  user: one(user, {
    fields: [coachingGoals.userId],
    references: [user.id],
  }),
}));
