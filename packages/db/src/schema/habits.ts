import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const HabitFrequency = {
  DAILY: "daily" as const,
  WEEKLY: "weekly" as const,
  CUSTOM: "custom" as const,
} as const;

export type HabitFrequency = (typeof HabitFrequency)[keyof typeof HabitFrequency];

export const WeekDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type WeekDay = (typeof WeekDays)[number];

export const habitColors = [
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#14B8A6", // teal
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
] as const;

export const habitIcons = [
  "💪", // fitness
  "📚", // reading
  "🧘", // meditation
  "💧", // water
  "😴", // sleep
  "🥗", // diet
  "✍️", // journal
  "🎯", // focus
  "🏃", // running
  "🧹", // cleaning
  "💰", // savings
  "🎨", // creative
] as const;

export const habits = pgTable(
  "habits",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),

    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),

    frequency: varchar("frequency", { length: 20 })
      .$type<HabitFrequency>()
      .notNull()
      .default("daily"),

    targetDays: jsonb("target_days")
      .$type<WeekDay[]>()
      .default(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),

    color: varchar("color", { length: 7 }).notNull().default(habitColors[5]),
    icon: varchar("icon", { length: 10 }).notNull().default("🎯"),

    reminderTime: timestamp("reminder_time"), // Future feature
    isArchived: boolean("is_archived").notNull().default(false),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("habits_userId_idx").on(table.userId)],
);

export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id")
    .references(() => habits.id)
    .notNull(),

  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  completedAt: timestamp("completed_at").notNull().defaultNow(),
  notes: text("notes"),
});

// Relations
export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(user, {
    fields: [habits.userId],
    references: [user.id],
  }),
  logs: many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, {
    fields: [habitLogs.habitId],
    references: [habits.id],
  }),
}));

// Helper function to check if a habit should be tracked on a given day
export function shouldTrackOnDay(
  frequency: HabitFrequency,
  targetDays: WeekDay[],
  date: Date,
): boolean {
  const dayNames: WeekDay[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayName = dayNames[date.getDay()];

  switch (frequency) {
    case "daily":
      return true;
    case "weekly":
    case "custom":
      return targetDays.includes(dayName as WeekDay);
    default:
      return true;
  }
}

// Helper function to get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
