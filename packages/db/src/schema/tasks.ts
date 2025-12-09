import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { goals } from "./goals";
import { aiSuggestions } from "./ai";

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    goalId: text("goal_id").references(() => goals.id, {
      onDelete: "set null",
    }),
    suggestionId: text("suggestion_id").references(() => aiSuggestions.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: integer("due_date", { mode: "timestamp_ms" }),

    // Scheduling information from AI-generated plans
    startTime: integer("start_time", { mode: "timestamp_ms" }), // Specific start time for the task
    endTime: integer("end_time", { mode: "timestamp_ms" }), // Specific end time for the task
    estimatedDuration: integer("estimated_duration"), // Duration in minutes
    dayOfWeek: text("day_of_week", {
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    }), // Day of week from plan
    weekNumber: integer("week_number"), // Week number in the plan (1-4 typically)
    timeBlock: text("time_block", {
      enum: ["morning", "afternoon", "evening", "night"],
    }), // General time of day
    planContext: text("plan_context"), // JSON string with additional context (focus area, week focus, etc.)

    status: text("status", {
      enum: ["pending", "completed", "skipped"],
    })
      .notNull()
      .default("pending"),
    priority: text("priority", {
      enum: ["low", "medium", "high"],
    })
      .notNull()
      .default("medium"),
    isRecurring: integer("is_recurring", { mode: "boolean" })
      .notNull()
      .default(false),
    recurrenceRule: text("recurrence_rule"),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("tasks_userId_idx").on(table.userId),
    index("tasks_goalId_idx").on(table.goalId),
    index("tasks_suggestionId_idx").on(table.suggestionId),
    index("tasks_status_idx").on(table.status),
    index("tasks_priority_idx").on(table.priority),
    index("tasks_dueDate_idx").on(table.dueDate),
    index("tasks_isRecurring_idx").on(table.isRecurring),
    index("tasks_startTime_idx").on(table.startTime),
    index("tasks_weekNumber_idx").on(table.weekNumber),
    index("tasks_dayOfWeek_idx").on(table.dayOfWeek),
  ]
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(user, {
    fields: [tasks.userId],
    references: [user.id],
  }),
  goal: one(goals, {
    fields: [tasks.goalId],
    references: [goals.id],
  }),
  suggestion: one(aiSuggestions, {
    fields: [tasks.suggestionId],
    references: [aiSuggestions.id],
  }),
}));
