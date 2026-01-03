import { relations } from "drizzle-orm";
import { pgTable, serial, text, varchar, timestamp, jsonb, time } from "drizzle-orm/pg-core";
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

// Coach tone enum
export const COACH_TONES = ["encouraging", "direct", "analytical", "friendly"] as const;
export type CoachTone = (typeof COACH_TONES)[number];

export const userGoalsAndPreferences = pgTable("user_goals_and_preferences", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),

  // Original goal-setting fields
  goalsText: text("goals_text").notNull(),
  taskComplexity: complexityEnum("task_complexity").notNull(),
  focusAreas: varchar("focus_areas", { length: 150 }).notNull(),
  weekendPreference: weekendEnum("weekend_preference").notNull(),

  fixedCommitmentsJson: jsonb("fixed_commitments_json").notNull().$type<FixedCommitmentsJson>(),

  inputSavedAt: timestamp("input_saved_at").notNull().defaultNow(),

  // Application Preferences
  coachName: varchar("coach_name", { length: 50 }).default("Coach").notNull(),
  coachTone: varchar("coach_tone", { length: 20 })
    .$type<CoachTone>()
    .default("encouraging")
    .notNull(),
  workingHoursStart: time("working_hours_start").default("09:00").notNull(),
  workingHoursEnd: time("working_hours_end").default("17:00").notNull(),
  defaultFocusArea: varchar("default_focus_area", { length: 50 }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const preferencesRelations = relations(userGoalsAndPreferences, ({ one }) => ({
  user: one(user, {
    fields: [userGoalsAndPreferences.userId],
    references: [user.id],
  }),
}));
