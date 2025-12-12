import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const userPreferences = sqliteTable("user_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),

  // Theme preferences
  theme: text("theme", { enum: ["zen", "zen-light", "system"] }).default("zen").notNull(),

  // Notification preferences
  notificationsEnabled: integer("notifications_enabled", { mode: "boolean" }).default(true).notNull(),
  dailyBriefingEnabled: integer("daily_briefing_enabled", { mode: "boolean" }).default(true).notNull(),
  taskRemindersEnabled: integer("task_reminders_enabled", { mode: "boolean" }).default(true).notNull(),
  calendarRemindersEnabled: integer("calendar_reminders_enabled", { mode: "boolean" }).default(true).notNull(),
  reminderTime: text("reminder_time").default("09:00").notNull(),

  // App behavior preferences
  defaultView: text("default_view", { enum: ["dashboard", "calendar", "tasks", "plan"] }).default("dashboard").notNull(),
  aiSuggestionsEnabled: integer("ai_suggestions_enabled", { mode: "boolean" }).default(true).notNull(),
  aiAssistantName: text("ai_assistant_name").default("Beerus").notNull(),
  aiResponseStyle: text("ai_response_style", { enum: ["professional", "casual", "friendly"] }).default("professional").notNull(),

  // Productivity preferences
  focusModeEnabled: integer("focus_mode_enabled", { mode: "boolean" }).default(false).notNull(),
  pomodoroDuration: integer("pomodoro_duration").default(25).notNull(),
  dailyGoalMinutes: integer("daily_goal_minutes").default(480).notNull(),
  shortBreakDuration: integer("short_break_duration").default(5).notNull(),
  longBreakDuration: integer("long_break_duration").default(15).notNull(),

  // UI preferences
  compactMode: integer("compact_mode", { mode: "boolean" }).default(false).notNull(),
  showCompletedTasks: integer("show_completed_tasks", { mode: "boolean" }).default(true).notNull(),

  // Regional preferences
  language: text("language").default("en").notNull(),
  timezone: text("timezone").notNull(),
  dateFormat: text("date_format", { enum: ["MM/dd/yyyy", "dd/MM/yyyy", "yyyy-MM-dd"] }).default("MM/dd/yyyy").notNull(),

  // Calendar & task preferences
  autoSyncCalendar: integer("auto_sync_calendar", { mode: "boolean" }).default(true).notNull(),
  defaultEventDuration: integer("default_event_duration").default(60).notNull(),
  defaultTaskPriority: text("default_task_priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium").notNull(),
  taskAutoArchive: integer("task_auto_archive", { mode: "boolean" }).default(true).notNull(),
  taskAutoArchiveDays: integer("task_auto_archive_days").default(30).notNull(),

  // Calendar integration
  primaryCalendarId: text("primary_calendar_id"),
  syncCalendars: text("sync_calendars", { mode: "json" }), // JSON array of calendar IDs

  // Privacy & analytics
  dataCollectionEnabled: integer("data_collection_enabled", { mode: "boolean" }).default(false).notNull(),
  analyticsEnabled: integer("analytics_enabled", { mode: "boolean" }).default(true).notNull(),
  crashReportingEnabled: integer("crash_reporting_enabled", { mode: "boolean" }).default(true).notNull(),

  // Custom preferences (JSON for extensibility)
  customPreferences: text("custom_preferences", { mode: "json" }),

  // Metadata
  onboardingCompleted: integer("onboarding_completed", { mode: "boolean" }).default(false).notNull(),
  onboardingCompletedAt: integer("onboarding_completed_at", { mode: "timestamp_ms" }),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("user_preferences_userId_idx").on(table.userId),
  index("user_preferences_theme_idx").on(table.theme),
]);

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(user, {
    fields: [userPreferences.userId],
    references: [user.id],
  }),
}));

// Types for TypeScript
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;