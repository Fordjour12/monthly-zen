import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const quotaHistory = pgTable("quota_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),

  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  monthYear: text("month_year").notNull(),

  totalAllowed: integer("total_allowed").notNull(),
  generationsUsed: integer("generations_used").notNull(),
  totalRequested: integer("total_requested").default(0),

  wasAutoReset: timestamp("was_auto_reset"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type QuotaHistory = typeof quotaHistory.$inferSelect;
export type NewQuotaHistory = typeof quotaHistory.$inferInsert;

export const quotaHistoryRelations = relations(quotaHistory, ({ one }) => ({
  user: one(user, {
    fields: [quotaHistory.userId],
    references: [user.id],
  }),
}));
