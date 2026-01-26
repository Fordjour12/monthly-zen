import { pgTable, serial, text, timestamp, integer, jsonb, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { monthlyPlans } from "./monthly-plans";
import { conversations } from "./conversations";

export type PlanGenerationStatus = "pending" | "running" | "completed" | "failed";

export const planGenerationJobs = pgTable("plan_generation_jobs", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  status: text("status", { enum: ["pending", "running", "completed", "failed"] })
    .notNull()
    .default("pending"),
  requestPayload: jsonb("request_payload").notNull(),
  responseText: text("response_text"),
  planId: integer("plan_id").references(() => monthlyPlans.id),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
