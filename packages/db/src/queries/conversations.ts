import { and, desc, eq } from "drizzle-orm";

import { db } from "../index";
import { conversations, messages } from "../schema";

export type ConversationRow = typeof conversations.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;

export async function createConversation(userId: string, title?: string | null) {
  const [row] = await db
    .insert(conversations)
    .values({
      userId,
      title: title ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return row;
}

export async function listConversations(userId: string, limit: number = 50) {
  return await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);
}

export async function getConversationById(userId: string, conversationId: string) {
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1);

  return row;
}

export async function addMessage(input: {
  conversationId: string;
  role: "system" | "user" | "assistant";
  content: string;
  status?: "streaming" | "final" | "error";
  meta?: Record<string, unknown> | null;
}) {
  const now = new Date();
  const [row] = await db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      status: input.status ?? "final",
      meta: input.meta ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return row;
}

export async function updateMessage(
  conversationId: string,
  messageId: string,
  patch: Partial<Pick<MessageRow, "content" | "status" | "meta">>,
) {
  const [row] = await db
    .update(messages)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(and(eq(messages.id, messageId), eq(messages.conversationId, conversationId)))
    .returning();

  return row;
}

export async function updateConversation(
  userId: string,
  conversationId: string,
  patch: Partial<Pick<ConversationRow, "title" | "lastMessagePreview">>,
) {
  const [row] = await db
    .update(conversations)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .returning();

  return row;
}

export async function listMessages(userId: string, conversationId: string, limit: number = 200) {
  const conversation = await getConversationById(userId, conversationId);
  if (!conversation) return [];

  return await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .limit(limit);
}

export async function getLatestAssistantMessage(userId: string, conversationId: string) {
  const conversation = await getConversationById(userId, conversationId);
  if (!conversation) return null;

  const [row] = await db
    .select()
    .from(messages)
    .where(and(eq(messages.conversationId, conversationId), eq(messages.role, "assistant")))
    .orderBy(desc(messages.createdAt))
    .limit(1);

  return row ?? null;
}

export async function deleteConversation(userId: string, conversationId: string) {
  const result = await db
    .delete(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));

  return (result.rowCount ?? 0) > 0;
}
