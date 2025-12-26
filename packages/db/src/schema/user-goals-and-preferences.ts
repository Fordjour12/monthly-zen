import { relations } from "drizzle-orm";
import { pgTable, serial, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { complexityEnum, weekendEnum } from "./enums";

export type FixedCommitment = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  description: string;
};

export type FixedCommitmentsJson = {
  commitments: FixedCommitment[];
};

export const userGoalsAndPreferences = pgTable("user_goals_and_preferences", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),

  goalsText: text("goals_text").notNull(),
  taskComplexity: complexityEnum("task_complexity").notNull(),
  focusAreas: varchar("focus_areas", { length: 150 }).notNull(),
  weekendPreference: weekendEnum("weekend_preference").notNull(),

  fixedCommitmentsJson: jsonb("fixed_commitments_json").notNull().$type<FixedCommitmentsJson>(),

  inputSavedAt: timestamp("input_saved_at").notNull().defaultNow(),
});

export const preferencesRelations = relations(userGoalsAndPreferences, ({ one }) => ({
  user: one(user, {
    fields: [userGoalsAndPreferences.userId],
    references: [user.id],
  }),
}));
