import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { userGoalsAndPreferences } from "./user-goals-and-preferences";

export const planDrafts = pgTable("plan_drafts", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  draftKey: text("draft_key").notNull().unique(),

  planData: jsonb("plan_data").notNull(),

  goalPreferenceId: integer("goal_preference_id").references(() => userGoalsAndPreferences.id),
  monthYear: text("month_year").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const planDraftsRelations = relations(planDrafts, ({ one }) => ({
  user: one(user, {
    fields: [planDrafts.userId],
    references: [user.id],
  }),
  preferences: one(userGoalsAndPreferences, {
    fields: [planDrafts.goalPreferenceId],
    references: [userGoalsAndPreferences.id],
  }),
}));
