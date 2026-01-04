import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  timestamp,
  jsonb,
  varchar,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { insightTypeEnum } from "./enums";

export type InsightAction = {
  label: string;
  value: string;
  type: "primary" | "secondary" | "destructive";
};

export type InsightActionsJson = {
  actions: InsightAction[];
};

export const coachingInsights = pgTable("coaching_insights", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),

  // Insight content
  type: insightTypeEnum("insight_type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  reasoning: text("reasoning"), // Why this insight was generated
  suggestedAction: text("suggested_action"), // Recommended action

  // Metadata
  confidence: varchar("confidence", { length: 10 }), // e.g., "85%", "high", "medium"
  priority: varchar("priority", { length: 20 }).default("medium"), // high, medium, low
  category: varchar("category", { length: 50 }), // productivity, burnout, alignment, scheduling, pattern

  // Pattern data that triggered this insight
  triggerData: jsonb("trigger_data"), // JSON with patterns that triggered this

  // Actions available for this insight
  actionsJson: jsonb("actions_json").$type<InsightActionsJson>(),

  // Status
  isRead: boolean("is_read").default(false),
  isArchived: boolean("is_archived").default(false),
  dismissedAt: timestamp("dismissed_at"),
  actionTaken: text("action_taken"), // What action user took

  // Timestamps
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // When insight becomes stale
});

export const coachingInsightsRelations = relations(coachingInsights, ({ one, many }) => ({
  user: one(user, {
    fields: [coachingInsights.userId],
    references: [user.id],
  }),
  sessions: many(coachingSessions),
}));

// Coaching sessions - track when user interacts with coaching
export const coachingSessions = pgTable("coaching_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),

  sessionType: varchar("session_type", { length: 50 }).notNull(), // daily_brief, weekly_review, insight_generated
  insightId: integer("insight_id").references(() => coachingInsights.id), // Optional link to insight

  // Session data
  context: jsonb("context"), // Any relevant context data

  // Actions taken
  insightsViewed: integer("insights_viewed").default(0),
  actionsTaken: integer("actions_taken").default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coachingSessionsRelations = relations(coachingSessions, ({ one }) => ({
  user: one(user, {
    fields: [coachingSessions.userId],
    references: [user.id],
  }),
  insight: one(coachingInsights, {
    fields: [coachingSessions.insightId],
    references: [coachingInsights.id],
  }),
}));
