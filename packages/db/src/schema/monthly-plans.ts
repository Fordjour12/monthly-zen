import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { userGoalsAndPreferences } from "./user-goals-and-preferences";

export const monthlyPlans = pgTable("monthly_plans", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  preferenceId: integer("preference_id")
    .references(() => userGoalsAndPreferences.id)
    .notNull(),

  monthYear: date("month_year").notNull(),
  aiPrompt: text("ai_prompt").notNull(),
  aiResponseRaw: jsonb("ai_response_raw").notNull(),
  monthlySummary: text("monthly_summary"),
  rawAiResponse: text("raw_ai_response"),
  extractionConfidence: integer("extraction_confidence").default(0),
  extractionNotes: text("extraction_notes"),

  // Draft fields
  status: text("status", { enum: ["DRAFT", "CONFIRMED"] })
    .notNull()
    .default("CONFIRMED"),
  draftKey: text("draft_key").unique(),
  expiresAt: timestamp("expires_at"),

  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const plansRelations = relations(monthlyPlans, ({ one }) => ({
  user: one(user, {
    fields: [monthlyPlans.userId],
    references: [user.id],
  }),
  preferences: one(userGoalsAndPreferences, {
    fields: [monthlyPlans.preferenceId],
    references: [userGoalsAndPreferences.id],
  }),
}));
