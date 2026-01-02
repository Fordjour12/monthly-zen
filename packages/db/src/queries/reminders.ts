/**
 * Reminder Queries - Task and habit reminder data access
 */

import { db } from "../index";
import { eq, and, desc } from "drizzle-orm";
import { taskReminders, habitReminders, notificationLogs, type DayOfWeek } from "../schema";

// ============================================
// TYPES
// ============================================

export interface CreateTaskReminderInput {
  taskId: number;
  userId: string;
  reminderTime: Date;
}

export interface CreateHabitReminderInput {
  habitId: number;
  userId: string;
  daysOfWeek: DayOfWeek[];
  reminderTime: string; // HH:MM format
}

// ============================================
// TASK REMINDER FUNCTIONS
// ============================================

/**
 * Create a task reminder
 */
export async function createTaskReminder(input: CreateTaskReminderInput) {
  const result = await db
    .insert(taskReminders)
    .values({
      taskId: input.taskId,
      userId: input.userId,
      reminderTime: input.reminderTime,
    })
    .returning();
  return result[0];
}

/**
 * Get task reminders for a user
 */
export async function getTaskReminders(userId: string) {
  return await db
    .select()
    .from(taskReminders)
    .where(eq(taskReminders.userId, userId))
    .orderBy(desc(taskReminders.reminderTime));
}

/**
 * Get task reminder by task ID
 */
export async function getTaskReminderByTaskId(taskId: number) {
  const result = await db
    .select()
    .from(taskReminders)
    .where(eq(taskReminders.taskId, taskId))
    .limit(1);
  return result[0] || null;
}

/**
 * Delete a task reminder
 */
export async function deleteTaskReminder(reminderId: number) {
  const result = await db.delete(taskReminders).where(eq(taskReminders.id, reminderId));
  return result.rowCount ?? 0;
}

/**
 * Delete task reminder by task ID
 */
export async function deleteTaskReminderByTaskId(taskId: number) {
  const result = await db.delete(taskReminders).where(eq(taskReminders.taskId, taskId));
  return result.rowCount ?? 0;
}

/**
 * Mark task reminder as acknowledged
 */
export async function acknowledgeTaskReminder(reminderId: number) {
  await db
    .update(taskReminders)
    .set({
      isAcknowledged: true,
      updatedAt: new Date(),
    })
    .where(eq(taskReminders.id, reminderId));
}

// ============================================
// HABIT REMINDER FUNCTIONS
// ============================================

/**
 * Create a habit reminder
 */
export async function createHabitReminder(input: CreateHabitReminderInput) {
  const daysOfWeek = input.daysOfWeek.join(",");
  const result = await db
    .insert(habitReminders)
    .values({
      habitId: input.habitId,
      userId: input.userId,
      daysOfWeek,
      reminderTime: input.reminderTime,
    })
    .returning();
  return result[0];
}

/**
 * Get habit reminder by habit ID
 */
export async function getHabitReminderByHabitId(habitId: number) {
  const result = await db
    .select()
    .from(habitReminders)
    .where(eq(habitReminders.habitId, habitId))
    .limit(1);
  return result[0] || null;
}

/**
 * Get habit reminders for a user
 */
export async function getHabitReminders(userId: string) {
  return await db
    .select({
      id: habitReminders.id,
      habitId: habitReminders.habitId,
      userId: habitReminders.userId,
      daysOfWeek: habitReminders.daysOfWeek,
      reminderTime: habitReminders.reminderTime,
      isEnabled: habitReminders.isEnabled,
    })
    .from(habitReminders)
    .where(and(eq(habitReminders.userId, userId), eq(habitReminders.isEnabled, true)));
}

/**
 * Update habit reminder
 */
export async function updateHabitReminder(
  habitId: number,
  updates: Partial<{ daysOfWeek: string; reminderTime: string; isEnabled: boolean }>,
) {
  const result = await db
    .update(habitReminders)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(habitReminders.habitId, habitId))
    .returning();
  return result[0];
}

/**
 * Delete a habit reminder
 */
export async function deleteHabitReminder(habitId: number) {
  const result = await db.delete(habitReminders).where(eq(habitReminders.habitId, habitId));
  return result.rowCount ?? 0;
}

/**
 * Toggle habit reminder
 */
export async function toggleHabitReminder(habitId: number, isEnabled: boolean) {
  const result = await db
    .update(habitReminders)
    .set({
      isEnabled,
      updatedAt: new Date(),
    })
    .where(eq(habitReminders.habitId, habitId));
  return result.rowCount ?? 0;
}

// ============================================
// NOTIFICATION LOG FUNCTIONS
// ============================================

/**
 * Log a notification
 */
export async function logNotification(input: {
  userId: string;
  type: string;
  referenceId: number;
  title: string;
  body?: string;
}) {
  const result = await db
    .insert(notificationLogs)
    .values({
      userId: input.userId,
      type: input.type,
      referenceId: input.referenceId,
      title: input.title,
      body: input.body,
      isSent: false,
    })
    .returning();
  return result[0];
}

/**
 * Mark notification as sent
 */
export async function markNotificationSent(logId: number) {
  await db
    .update(notificationLogs)
    .set({
      isSent: true,
      sentAt: new Date(),
    })
    .where(eq(notificationLogs.id, logId));
}

/**
 * Get pending notifications (not yet sent)
 */
export async function getPendingNotifications() {
  return await db.select().from(notificationLogs).where(eq(notificationLogs.isSent, false));
}

/**
 * Get notification logs for a user
 */
export async function getUserNotificationLogs(userId: string, limit = 50) {
  return await db
    .select()
    .from(notificationLogs)
    .where(eq(notificationLogs.userId, userId))
    .orderBy(desc(notificationLogs.createdAt))
    .limit(limit);
}
