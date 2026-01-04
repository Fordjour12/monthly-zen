/**
 * Habit Queries - Habit tracking data access layer
 *
 * Provides query functions for habit management with
 * filtering, statistics, and user-scoped access.
 */

import { db } from "../index";
import { eq, asc, and, desc, gte, lte, inArray } from "drizzle-orm";
import { habits, habitLogs, type HabitFrequency, type WeekDay, getTodayDate } from "../schema";

// ============================================
// TYPES
// ============================================

export interface CreateHabitInput {
  userId: string;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  targetDays?: WeekDay[];
  color: string;
  icon: string;
}

export interface HabitWithStatus {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  frequency: HabitFrequency;
  targetDays: WeekDay[];
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  isCompletedToday: boolean;
  currentStreak: number;
  completionRate: number;
}

export interface HabitLog {
  id: number;
  habitId: number;
  date: string;
  completedAt: Date;
  notes: string | null;
}

export interface HabitStats {
  totalHabits: number;
  completedToday: number;
  completionRate: number;
  currentStreak: number;
}

// ============================================
// QUERY FUNCTIONS
// ============================================

/**
 * Create a new habit
 */
export async function createHabit(input: CreateHabitInput) {
  const result = await db
    .insert(habits)
    .values({
      userId: input.userId,
      name: input.name,
      description: input.description || null,
      frequency: input.frequency,
      targetDays: input.targetDays || [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      color: input.color,
      icon: input.icon,
    })
    .returning();

  return result[0];
}

/**
 * Get all habits for a user with today's completion status
 */
export async function getHabitsWithStatus(userId: string, targetDate?: string) {
  const today = targetDate || getTodayDate();

  // Get all non-archived habits
  const userHabits = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.isArchived, false)))
    .orderBy(asc(habits.createdAt));

  if (userHabits.length === 0) {
    return [];
  }

  // Fetch all logs for all habits in a single query (eliminate N+1)
  const habitIds = userHabits.map((h) => h.id);
  const thirtyDaysAgo = getDateString(30);

  const allLogs = await db
    .select({
      habitId: habitLogs.habitId,
      date: habitLogs.date,
    })
    .from(habitLogs)
    .where(and(inArray(habitLogs.habitId, habitIds), gte(habitLogs.date, thirtyDaysAgo)))
    .orderBy(asc(habitLogs.date));

  // Get today's logs for completion status
  const todayLogs = allLogs.filter((log) => log.date === today);
  const completedHabitIds = new Set(todayLogs.map((log) => log.habitId));

  // Group logs by habit for streak calculation
  const logsByHabit = new Map<number, string[]>();
  for (const log of allLogs) {
    const existing = logsByHabit.get(log.habitId) || [];
    existing.push(log.date);
    logsByHabit.set(log.habitId, existing);
  }

  // Calculate statistics for each habit
  const habitsWithStatus: HabitWithStatus[] = userHabits.map((habit) => {
    const targetDays = habit.targetDays || [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    const habitLogs = logsByHabit.get(habit.id) || [];
    const stats = calculateStatsFromLogs(habitLogs, targetDays, today);

    return {
      ...habit,
      targetDays,
      isCompletedToday: completedHabitIds.has(habit.id),
      currentStreak: stats.currentStreak,
      completionRate: stats.completionRate,
    };
  });

  return habitsWithStatus;
}

/**
 * Calculate stats from a list of log dates (single source of truth for streak calculation)
 */
function calculateStatsFromLogs(
  logDates: string[],
  targetDays: WeekDay[],
  today: string,
): { currentStreak: number; longestStreak: number; completionRate: number } {
  const completionDates = new Set(logDates);
  const totalCompletions = completionDates.size;

  // Calculate streak
  const { currentStreak, longestStreak } = calculateStreaks(completionDates, targetDays, today);

  // Calculate completion rate (last 30 days)
  const recentCompletions = logDates.filter((d) => d >= getDateString(30)).length;
  const totalDays = 30;
  const completionRate = Math.round((recentCompletions / totalDays) * 100);

  return { currentStreak, longestStreak, completionRate };
}

/**
 * Get a single habit by ID
 */
export async function getHabitById(habitId: number) {
  const result = await db.select().from(habits).where(eq(habits.id, habitId)).limit(1);

  return result[0] || null;
}

/**
 * Get a habit with user ID for ownership validation
 */
export async function getHabitWithUserId(habitId: number) {
  const result = await db
    .select({
      id: habits.id,
      userId: habits.userId,
      name: habits.name,
      description: habits.description,
      frequency: habits.frequency,
      targetDays: habits.targetDays,
      color: habits.color,
      icon: habits.icon,
      isArchived: habits.isArchived,
      createdAt: habits.createdAt,
      updatedAt: habits.updatedAt,
    })
    .from(habits)
    .where(eq(habits.id, habitId))
    .limit(1);

  return result[0] || null;
}

/**
 * Update a habit
 */
export async function updateHabit(
  habitId: number,
  updates: Partial<Omit<CreateHabitInput, "userId">>,
) {
  const result = await db
    .update(habits)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(habits.id, habitId))
    .returning();

  return result[0];
}

/**
 * Delete a habit
 */
export async function deleteHabit(habitId: number) {
  // First delete all logs
  await db.delete(habitLogs).where(eq(habitLogs.habitId, habitId));

  // Then delete the habit
  const result = await db.delete(habits).where(eq(habits.id, habitId));
  return result.rowCount ?? 0;
}

/**
 * Archive a habit (soft delete)
 */
export async function archiveHabit(habitId: number) {
  const result = await db
    .update(habits)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(habits.id, habitId));

  return result.rowCount ?? 0;
}

/**
 * Toggle habit completion for a specific date
 */
export async function toggleHabitCompletion(
  habitId: number,
  date: string,
  notes?: string,
): Promise<{ isCompleted: boolean; logId?: number }> {
  // Check if already completed today
  const existingLog = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)))
    .limit(1);

  if (existingLog[0]) {
    // Remove the completion
    await db.delete(habitLogs).where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)));
    return { isCompleted: false };
  }

  // Add completion log
  const result = await db
    .insert(habitLogs)
    .values({
      habitId,
      date,
      notes: notes || null,
    })
    .returning();

  return { isCompleted: true, logId: result[0]?.id };
}

/**
 * Get habit logs for a specific date range
 */
export async function getHabitLogs(habitId: number, startDate: string, endDate: string) {
  const logs = await db
    .select()
    .from(habitLogs)
    .where(
      and(
        eq(habitLogs.habitId, habitId),
        gte(habitLogs.date, startDate),
        lte(habitLogs.date, endDate),
      ),
    )
    .orderBy(desc(habitLogs.completedAt));

  return logs;
}

/**
 * Get all habit logs for a user in a date range (for calendar view)
 */
export async function getUserHabitLogs(userId: string, startDate: string, endDate: string) {
  const userHabitIds = await db
    .select({ id: habits.id })
    .from(habits)
    .where(eq(habits.userId, userId));

  if (userHabitIds.length === 0) {
    return [];
  }

  const habitIds = userHabitIds.map((h) => h.id);

  const logs = await db
    .select({
      id: habitLogs.id,
      habitId: habitLogs.habitId,
      date: habitLogs.date,
      completedAt: habitLogs.completedAt,
      notes: habitLogs.notes,
      habitName: habits.name,
      habitColor: habits.color,
    })
    .from(habitLogs)
    .innerJoin(habits, eq(habitLogs.habitId, habits.id))
    .where(
      and(
        inArray(habitLogs.habitId, habitIds),
        gte(habitLogs.date, startDate),
        lte(habitLogs.date, endDate),
      ),
    )
    .orderBy(desc(habitLogs.completedAt));

  return logs;
}

// ============================================
// STATISTICS HELPERS
// ============================================

interface HabitStatistics {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  totalCompletions: number;
  totalDays: number;
}

/**
 * Calculate statistics for a habit
 */
async function calculateHabitStats(habitId: number): Promise<HabitStatistics> {
  const habit = await getHabitById(habitId);
  if (!habit) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      totalCompletions: 0,
      totalDays: 0,
    };
  }

  const targetDays = habit.targetDays || [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  // Get all logs for this habit
  const allLogs = await db
    .select({ date: habitLogs.date })
    .from(habitLogs)
    .where(eq(habitLogs.habitId, habitId))
    .orderBy(asc(habitLogs.date));

  const completionDates = new Set(allLogs.map((log) => log.date));
  const totalCompletions = completionDates.size;

  // Calculate streak
  const { currentStreak, longestStreak } = calculateStreaks(
    completionDates,
    targetDays,
    getTodayDate(),
  );

  // Calculate completion rate (last 30 days)
  const thirtyDaysAgo = getDateString(30);
  const recentLogs = allLogs.filter((log) => log.date >= thirtyDaysAgo);
  const recentCompletions = new Set(recentLogs.map((log) => log.date)).size;
  const totalDays = 30; // Last 30 days
  const completionRate = Math.round((recentCompletions / totalDays) * 100);

  return {
    currentStreak,
    longestStreak,
    completionRate,
    totalCompletions,
    totalDays,
  };
}

/**
 * Calculate current and longest streaks from completion dates
 */
function calculateStreaks(
  completionDates: Set<string>,
  targetDays: WeekDay[],
  today: string,
): { currentStreak: number; longestStreak: number } {
  if (completionDates.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sortedDates = Array.from(completionDates).sort();
  const dayNames: WeekDay[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate streaks considering target days
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr + "T00:00:00");
    const dayName = dayNames[date.getDay()];

    // Only count days that are in the target days
    if (!targetDays.includes(dayName as WeekDay)) {
      continue;
    }

    if (prevDate) {
      const diffDays = Math.floor((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }

    // Check if this is today or yesterday (for current streak)
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = getDateStringFromDate(yesterdayDate);
    if (dateStr === today || dateStr === yesterday) {
      currentStreak = tempStreak;
    }

    prevDate = date;
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}

/**
 * Get overall habit statistics for a user
 */
export async function getUserHabitStats(userId: string): Promise<HabitStats> {
  const habitsWithStatus = await getHabitsWithStatus(userId);

  const totalHabits = habitsWithStatus.length;
  const completedToday = habitsWithStatus.filter((h) => h.isCompletedToday).length;
  const avgCompletionRate =
    totalHabits > 0
      ? Math.round(habitsWithStatus.reduce((sum, h) => sum + h.completionRate, 0) / totalHabits)
      : 0;
  const maxStreak = Math.max(...habitsWithStatus.map((h) => h.currentStreak), 0);

  return {
    totalHabits,
    completedToday,
    completionRate: avgCompletionRate,
    currentStreak: maxStreak,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return getDateStringFromDate(date);
}

function getDateString(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysFromNow);
  return getDateStringFromDate(date);
}

function getDateStringFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
