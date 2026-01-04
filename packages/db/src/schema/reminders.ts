import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  time,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { habits } from "./habits";
import { user } from "./auth";

// ============================================
// TASK REMINDERS
// ============================================

export const taskReminders = pgTable(
  "task_reminders",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id").notNull(),
    userId: text("user_id").notNull(),

    reminderTime: timestamp("reminder_time").notNull(),
    isSent: boolean("is_sent").notNull().default(false),
    isAcknowledged: boolean("is_acknowledged").notNull().default(false),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("task_reminders_userId_idx").on(table.userId)],
);

// ============================================
// HABIT REMINDERS
// ============================================

export const habitReminders = pgTable(
  "habit_reminders",
  {
    id: serial("id").primaryKey(),
    habitId: integer("habit_id")
      .references(() => habits.id)
      .notNull(),
    userId: text("user_id").notNull(),

    // Days of week to send reminder (comma-separated: "monday,tuesday,wednesday")
    daysOfWeek: varchar("days_of_week", { length: 50 })
      .notNull()
      .default("monday,tuesday,wednesday,thursday,friday,saturday,sunday"),

    // Time of day for reminder (HH:MM format)
    reminderTime: time("reminder_time", { withTimezone: false }).notNull().default("09:00"),

    isEnabled: boolean("is_enabled").notNull().default(true),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("habit_reminders_userId_idx").on(table.userId)],
);

// ============================================
// NOTIFICATION LOG
// ============================================

export const notificationLogs = pgTable(
  "notification_logs",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),

    // Notification type: "task_reminder", "habit_reminder"
    type: varchar("type", { length: 50 }).notNull(),

    // Reference ID (taskId or habitId)
    referenceId: integer("reference_id").notNull(),

    title: varchar("title", { length: 200 }).notNull(),
    body: varchar("body", { length: 500 }),

    isSent: boolean("is_sent").notNull().default(false),
    sentAt: timestamp("sent_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("notification_logs_userId_idx").on(table.userId)],
);

// Relations
export const habitRemindersRelations = relations(habitReminders, ({ one }) => ({
  habit: one(habits, {
    fields: [habitReminders.habitId],
    references: [habits.id],
  }),
  user: one(user, {
    fields: [habitReminders.userId],
    references: [user.id],
  }),
}));

// Helper functions
export function parseDaysOfWeek(daysString: string): string[] {
  return daysString.split(",").filter(Boolean);
}

export function formatDaysOfWeek(days: string[]): string {
  return days.join(",");
}

// Days of week constants
export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
