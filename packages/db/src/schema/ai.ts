import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const aiSuggestions = sqliteTable(
  "ai_suggestions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["plan", "briefing", "reschedule"],
    }).notNull(),
    content: text("content", { mode: "json" }).notNull(),
    isApplied: integer("is_applied", { mode: "boolean" })
      .notNull()
      .default(false),
    isArchived: integer("is_archived", { mode: "boolean" })
      .notNull()
      .default(false),
    status: text("status", {
      enum: ["draft", "active", "archived", "applied"],
    })
      .notNull()
      .default("active"),
    metadata: text("metadata", { mode: "json" }),
    effectivenessScore: integer("effectiveness_score").default(0),
    appliedItems: text("applied_items", { mode: "json" }),
    applicationHistory: text("application_history", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("aiSuggestions_userId_idx").on(table.userId),
    index("aiSuggestions_type_idx").on(table.type),
    index("aiSuggestions_isApplied_idx").on(table.isApplied),
    index("aiSuggestions_isArchived_idx").on(table.isArchived),
    index("aiSuggestions_status_idx").on(table.status),
    index("aiSuggestions_createdAt_idx").on(table.createdAt),
    index("aiSuggestions_userTypeStatus_idx").on(
      table.userId,
      table.type,
      table.status
    ),
  ]
);

export const suggestionAppliedItems = sqliteTable(
  "suggestion_applied_items",
  {
    id: text("id").primaryKey(),
    suggestionId: text("suggestion_id")
      .notNull()
      .references(() => aiSuggestions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    itemType: text("item_type", {
      enum: ["task", "habit", "recurring-task"],
    }).notNull(),
    itemId: text("item_id").notNull(),
    originalTitle: text("original_title").notNull(),
    appliedAt: integer("applied_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    confidenceScore: integer("confidence_score"), // Store as 0-100 for easier querying
    metadata: text("metadata", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("suggestionAppliedItems_suggestionId_idx").on(table.suggestionId),
    index("suggestionAppliedItems_userId_idx").on(table.userId),
    index("suggestionAppliedItems_itemType_idx").on(table.itemType),
    index("suggestionAppliedItems_itemId_idx").on(table.itemId),
    index("suggestionAppliedItems_appliedAt_idx").on(table.appliedAt),
    index("suggestionAppliedItems_suggestionUser_idx").on(
      table.suggestionId,
      table.userId
    ),
  ]
);

export const aiSuggestionsRelations = relations(aiSuggestions, ({ one, many }) => ({
  user: one(user, {
    fields: [aiSuggestions.userId],
    references: [user.id],
  }),
  appliedItems: many(suggestionAppliedItems),
}));

export const suggestionAppliedItemsRelations = relations(suggestionAppliedItems, ({ one }) => ({
  suggestion: one(aiSuggestions, {
    fields: [suggestionAppliedItems.suggestionId],
    references: [aiSuggestions.id],
  }),
  user: one(user, {
    fields: [suggestionAppliedItems.userId],
    references: [user.id],
  }),
}));
