import { relations } from "drizzle-orm";
import { pgTable, serial, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { monthlyPlans } from "./monthly-plans";

export const planTasks = pgTable("plan_tasks", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id")
    .references(() => monthlyPlans.id)
    .notNull(),

  taskDescription: text("task_description").notNull(),
  focusArea: varchar("focus_area", { length: 50 }).notNull(),

  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),

  difficultyLevel: varchar("difficulty_level", { length: 20 }),
  schedulingReason: varchar("scheduling_reason", { length: 100 }),

  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

export const tasksRelations = relations(planTasks, ({ one }) => ({
  plan: one(monthlyPlans, {
    fields: [planTasks.planId],
    references: [monthlyPlans.id],
  }),
}));
