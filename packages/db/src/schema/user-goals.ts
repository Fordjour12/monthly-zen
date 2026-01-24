import { relations } from "drizzle-orm";
import { pgTable, serial, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth";

export type PlanningResolution = {
  title: string;
  category: string;
  targetCount: number;
};

export type ResolutionsJson = {
  resolutions: PlanningResolution[];
};

export const userGoals = pgTable("user_goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull()
    .unique(),

  goalsText: text("goals_text").notNull().default(""),
  focusAreas: varchar("focus_areas", { length: 255 }).notNull().default("personal"),
  resolutionsJson: jsonb("resolutions_json")
    .notNull()
    .$type<ResolutionsJson>()
    .default({ resolutions: [] }),
  inputSavedAt: timestamp("input_saved_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userGoalsRelations = relations(userGoals, ({ one }) => ({
  user: one(user, {
    fields: [userGoals.userId],
    references: [user.id],
  }),
}));
