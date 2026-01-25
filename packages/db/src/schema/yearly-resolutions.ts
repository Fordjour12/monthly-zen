import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { resolutionTypeEnum } from "./enums";

export const yearlyResolutions = pgTable(
  "yearly_resolutions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),

    // Resolution content
    text: text("text").notNull(),
    category: varchar("category", { length: 50 }),
    resolutionType: resolutionTypeEnum("resolution_type").default("yearly").notNull(),
    priority: integer("priority").default(2), // 1=high, 2=medium, 3=low

    // Timeline
    startDate: timestamp("start_date").notNull().defaultNow(),
    targetDate: timestamp("target_date"),
    isRecurring: boolean("is_recurring").default(false),
    recurringInterval: varchar("recurring_interval", { length: 20 }),

    // Tracking
    isAchieved: boolean("is_achieved").default(false),
    achievedAt: timestamp("achieved_at"),
    archivedAt: timestamp("archived_at"), // Soft delete

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("resolution_userId_idx").on(table.userId)],
);

export const resolutionsRelations = relations(yearlyResolutions, ({ one }) => ({
  user: one(user, {
    fields: [yearlyResolutions.userId],
    references: [user.id],
  }),
}));
