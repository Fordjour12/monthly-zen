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
  // First, get plan IDs for this user
  const userPlans = await db
    .select({ id: monthlyPlans.id, monthYear: monthlyPlans.monthYear })
    .from(monthlyPlans)
    .where(eq(monthlyPlans.userId, filters.userId));

  if (userPlans.length === 0) {
    return [];
  }

  // Filter plans by month if specified
  let planIds = userPlans.map((p) => p.id);
  if (filters.monthYear) {
    const filteredPlans = userPlans.filter((p) => {
      const planMonth = new Date(p.monthYear).toISOString().slice(0, 7);
      return planMonth === filters.monthYear;
    });
    planIds = filteredPlans.map((p) => p.id);
    if (planIds.length === 0) return [];
  }

  // Build the base query with computed week/day info
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
    .where(inArray(planTasks.planId, planIds))
    .$dynamic();

  // Execute and filter in memory for complex conditions
  let tasks = await query;

  // Apply status filter
  if (filters.status === "completed") {
    tasks = tasks.filter((t) => t.isCompleted);
  } else if (filters.status === "pending") {
    tasks = tasks.filter((t) => !t.isCompleted);
  }

  // Apply focus area filter
  if (filters.focusArea) {
    tasks = tasks.filter((t) => t.focusArea.toLowerCase() === filters.focusArea!.toLowerCase());
  }

  // Apply difficulty filter
  if (filters.difficultyLevel) {
    tasks = tasks.filter(
      (t) => t.difficultyLevel?.toLowerCase() === filters.difficultyLevel!.toLowerCase(),
    );
  }

  // Apply search filter
  if (filters.searchQuery) {
    const searchLower = filters.searchQuery.toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.taskDescription.toLowerCase().includes(searchLower) ||
        t.focusArea.toLowerCase().includes(searchLower) ||
        (t.schedulingReason && t.schedulingReason.toLowerCase().includes(searchLower)),
    );
  }

  // Apply sorting
  const sortOrder = filters.sortOrder === "desc" ? -1 : 1;

  tasks.sort((a, b) => {
    switch (filters.sortBy) {
      case "difficulty": {
        const diffOrder = { simple: 1, moderate: 2, advanced: 3 };
        const aVal = diffOrder[(a.difficultyLevel as keyof typeof diffOrder) || "simple"] || 0;
        const bVal = diffOrder[(b.difficultyLevel as keyof typeof diffOrder) || "simple"] || 0;
        return (aVal - bVal) * sortOrder;
      }
      case "focusArea":
        return a.focusArea.localeCompare(b.focusArea) * sortOrder;
      case "date":
      default:
        return (new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) * sortOrder;
    }
  });

  return tasks;
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
