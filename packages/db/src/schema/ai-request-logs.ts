import { pgTable, serial, timestamp, jsonb } from "drizzle-orm/pg-core";

export const aiRequestLogs = pgTable("ai_request_logs", {
  id: serial("id").primaryKey(),
  responsePayload: jsonb("response_payload").notNull(),
  responseTimestamp: timestamp("response_timestamp").notNull().defaultNow(),
});

export type AIRequestLogs = typeof aiRequestLogs.$inferSelect;
export type NewAIRequestLogs = typeof aiRequestLogs.$inferInsert;
