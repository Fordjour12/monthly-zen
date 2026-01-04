import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  jsonb,
  time,
  integer,
} from "drizzle-orm/pg-core";
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
    .notNull()
    .unique(), // Enforce 1:1 relationship

  // Core Goal Architecture
  goalsText: text("goals_text").notNull().default(""),
  motivation: text("motivation").default(""),
  lifeStyle: text("lifestyle_description").default(""),
  focusAreas: varchar("focus_areas", { length: 255 }).notNull().default("personal"),

  // Tactical Preferences
  taskComplexity: complexityEnum("task_complexity").notNull().default("Balanced"),
  weekendPreference: weekendEnum("weekend_preference").notNull().default("Mixed"),
  preferredTaskDuration: integer("preferred_task_duration").default(45), // in minutes

  // Schedule Logic
  fixedCommitmentsJson: jsonb("fixed_commitments_json")
    .notNull()
    .$type<FixedCommitmentsJson>()
    .default({ commitments: [] }),
  workingHoursStart: time("working_hours_start").default("09:00").notNull(),
  workingHoursEnd: time("working_hours_end").default("17:00").notNull(),

  // AI Companion Personality
  coachName: varchar("coach_name", { length: 50 }).default("Coach").notNull(),
  coachTone: varchar("coach_tone", { length: 20 })
    .$type<CoachTone>()
    .default("encouraging")
    .notNull(),

  // Registry Metadata
  defaultFocusArea: varchar("default_focus_area", { length: 50 }),
  inputSavedAt: timestamp("input_saved_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const preferencesRelations = relations(userGoalsAndPreferences, ({ one }) => ({
  user: one(user, {
    fields: [userGoalsAndPreferences.userId],
    references: [user.id],
  }),
}));
