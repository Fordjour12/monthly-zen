/**
 * Task Queries - Advanced task filtering and retrieval
 *
 * Provides query functions for the tasks router with filtering,
 * sorting, and user-scoped access.
 */

import { db } from "../index";
import { eq, asc, inArray, sql } from "drizzle-orm";
import { planTasks, monthlyPlans } from "../schema";

// ============================================
// TYPES
// ============================================

export interface TaskFilters {
  userId: string;
  monthYear?: string;
  status?: "all" | "completed" | "pending";
  focusArea?: string;
  difficultyLevel?: "simple" | "moderate" | "advanced";
  searchQuery?: string;
  sortBy?: "date" | "difficulty" | "focusArea";
  sortOrder?: "asc" | "desc";
}

// ============================================
// QUERY FUNCTIONS
// ============================================

/**
 * Get tasks with advanced filtering capabilities
 */
export async function getTasksWithFilters(filters: TaskFilters) {
  // Build the base query with all filters pushed to database
  let query = db
    .select({
      id: planTasks.id,
      planId: planTasks.planId,
      taskDescription: planTasks.taskDescription,
      focusArea: planTasks.focusArea,
      difficultyLevel: planTasks.difficultyLevel,
      schedulingReason: planTasks.schedulingReason,
      isCompleted: planTasks.isCompleted,
      completedAt: planTasks.completedAt,
      startTime: planTasks.startTime,
      endTime: planTasks.endTime,
      createdAt: planTasks.createdAt,
      updatedAt: planTasks.updatedAt,
      weekNumber: sql<number>`EXTRACT(WEEK FROM ${planTasks.startTime})`.as("weekNumber"),
      dayOfWeek: sql<string>`TO_CHAR(${planTasks.startTime}, 'Day')`.as("dayOfWeek"),
    })
    .from(planTasks)
    .innerJoin(monthlyPlans, eq(planTasks.planId, monthlyPlans.id))
    .where(eq(monthlyPlans.userId, filters.userId))
    .$dynamic();

  // Apply monthYear filter if specified
  if (filters.monthYear) {
    query = query.where(sql`TO_CHAR(${monthlyPlans.monthYear}, 'YYYY-MM') = ${filters.monthYear}`);
  }

  // Apply status filter
  if (filters.status === "completed") {
    query = query.where(eq(planTasks.isCompleted, true));
  } else if (filters.status === "pending") {
    query = query.where(eq(planTasks.isCompleted, false));
  }

  // Apply focus area filter (case-insensitive)
  if (filters.focusArea) {
    query = query.where(sql`LOWER(${planTasks.focusArea}) = ${filters.focusArea.toLowerCase()}`);
  }

  // Apply difficulty filter
  if (filters.difficultyLevel) {
    query = query.where(eq(planTasks.difficultyLevel, filters.difficultyLevel));
  }

  // Apply search filter using ILIKE for pattern matching
  if (filters.searchQuery) {
    const searchPattern = `%${filters.searchQuery.toLowerCase()}%`;
    query = query.where(
      sql`(
        LOWER(${planTasks.taskDescription}) LIKE ${searchPattern} OR
        LOWER(${planTasks.focusArea}) LIKE ${searchPattern} OR
        LOWER(COALESCE(${planTasks.schedulingReason}, '')) LIKE ${searchPattern}
      )`,
    );
  }

  // Apply sorting in database
  if (filters.sortBy === "difficulty") {
    query =
      filters.sortOrder === "desc"
        ? query.orderBy(sql`CASE ${planTasks.difficultyLevel}
        WHEN 'advanced' THEN 3
        WHEN 'moderate' THEN 2
        WHEN 'simple' THEN 1
        ELSE 0 END DESC`)
        : query.orderBy(sql`CASE ${planTasks.difficultyLevel}
        WHEN 'advanced' THEN 3
        WHEN 'moderate' THEN 2
        WHEN 'simple' THEN 1
        ELSE 0 END ASC`);
  } else if (filters.sortBy === "focusArea") {
    query =
      filters.sortOrder === "desc"
        ? query.orderBy(sql`${planTasks.focusArea} DESC`)
        : query.orderBy(sql`${planTasks.focusArea} ASC`);
  } else {
    // Default: sort by date
    query =
      filters.sortOrder === "desc"
        ? query.orderBy(sql`${planTasks.startTime} DESC`)
        : query.orderBy(sql`${planTasks.startTime} ASC`);
  }

  return await query;
}

/**
 * Get a single task with its associated user ID (for ownership validation)
 */
export async function getTaskWithUserId(taskId: number) {
  const result = await db
    .select({
      id: planTasks.id,
      planId: planTasks.planId,
      taskDescription: planTasks.taskDescription,
      focusArea: planTasks.focusArea,
      difficultyLevel: planTasks.difficultyLevel,
      schedulingReason: planTasks.schedulingReason,
      isCompleted: planTasks.isCompleted,
      completedAt: planTasks.completedAt,
      startTime: planTasks.startTime,
      endTime: planTasks.endTime,
      userId: monthlyPlans.userId,
    })
    .from(planTasks)
    .innerJoin(monthlyPlans, eq(planTasks.planId, monthlyPlans.id))
    .where(eq(planTasks.id, taskId))
    .limit(1);

  return result[0] || null;
}

/**
 * Get all unique focus areas for a user
 */
export async function getUserFocusAreas(userId: string) {
  // Get all plans for user
  const userPlans = await db
    .select({ id: monthlyPlans.id })
    .from(monthlyPlans)
    .where(eq(monthlyPlans.userId, userId));

  if (userPlans.length === 0) {
    return [];
  }

  const planIds = userPlans.map((p) => p.id);

  // Get distinct focus areas
  const tasks = await db
    .selectDistinct({ focusArea: planTasks.focusArea })
    .from(planTasks)
    .where(inArray(planTasks.planId, planIds));

  return tasks.map((t) => t.focusArea).filter(Boolean);
}

/**
 * Get all tasks for a user in a specific month
 */
export async function getTasksByUserIdAndMonth(userId: string, monthYear: string) {
  // Get plans for this user and month
  const userPlans = await db
    .select({ id: monthlyPlans.id, monthYear: monthlyPlans.monthYear })
    .from(monthlyPlans)
    .where(eq(monthlyPlans.userId, userId));

  // Filter by month
  const matchingPlans = userPlans.filter((p) => {
    const planMonth = new Date(p.monthYear).toISOString().slice(0, 7);
    return planMonth === monthYear;
  });

  if (matchingPlans.length === 0) {
    return [];
  }

  const planIds = matchingPlans.map((p) => p.id);

  // Get all tasks for these plans
  return await db
    .select()
    .from(planTasks)
    .where(inArray(planTasks.planId, planIds))
    .orderBy(asc(planTasks.startTime));
}
