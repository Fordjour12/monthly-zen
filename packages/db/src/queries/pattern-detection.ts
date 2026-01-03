import { db } from "../index";
import { sql } from "drizzle-orm";
import type { DayOfWeekPattern, FocusAreaPattern } from "../schema/user-patterns";

export interface BurnoutRiskResult {
  level: "low" | "medium" | "high";
  score: number;
  indicators: string[];
  isDeclining: boolean;
}

export interface TimeOfDayPatternsResult {
  patterns: Array<{ hour: number; completionRate: number; taskCount: number }>;
  peakHours: number[];
}

export async function getDayOfWeekPatterns(
  userId: string,
  weeks: number = 8,
): Promise<DayOfWeekPattern[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const result = await db.execute(sql`
    SELECT 
      EXTRACT(DOW FROM t.start_time) as day_of_week,
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE t.is_completed)::FLOAT / NULLIF(COUNT(*), 0) as completion_rate
    FROM plan_tasks t
    JOIN monthly_plans mp ON t.plan_id = mp.id
    WHERE mp.user_id = ${userId}
      AND t.start_time >= ${startDate}
    GROUP BY EXTRACT(DOW FROM t.start_time)
    ORDER BY completion_rate DESC
  `);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return result.rows.map((row: any) => ({
    dayOfWeek: Number(row.day_of_week),
    dayName: dayNames[Number(row.day_of_week)] || "Unknown",
    completionRate: Number(row.completion_rate) || 0,
    totalTasks: Number(row.total_tasks),
    avgTasksPerWeek: Number(row.total_tasks) / weeks,
    trend: "stable" as const,
  }));
}

export async function getTimeOfDayPatterns(
  userId: string,
  weeks: number = 8,
): Promise<TimeOfDayPatternsResult> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const result = await db.execute(sql`
    SELECT 
      EXTRACT(HOUR FROM t.start_time) as hour,
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE t.is_completed)::FLOAT / NULLIF(COUNT(*), 0) as completion_rate
    FROM plan_tasks t
    JOIN monthly_plans mp ON t.plan_id = mp.id
    WHERE mp.user_id = ${userId}
      AND t.start_time >= ${startDate}
    GROUP BY EXTRACT(HOUR FROM t.start_time)
    ORDER BY completion_rate DESC
  `);

  const rows = result.rows.map((row: any) => ({
    hour: Number(row.hour),
    completionRate: Number(row.completion_rate) || 0,
    taskCount: Number(row.total_tasks),
  }));

  const sortedByCompletion = [...rows].sort((a, b) => b.completionRate - a.completionRate);
  const peakCount = Math.max(1, Math.floor(rows.length * 0.25));
  const peakHours = sortedByCompletion.slice(0, peakCount).map((r) => r.hour);

  return {
    patterns: rows,
    peakHours,
  };
}

export async function getFocusAreaPatterns(
  userId: string,
  weeks: number = 8,
): Promise<FocusAreaPattern[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const result = await db.execute(sql`
    SELECT 
      t.focus_area,
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE t.is_completed)::FLOAT / NULLIF(COUNT(*), 0) as completion_rate,
      AVG(EXTRACT(EPOCH FROM (t.end_time - t.start_time)) / 60) as avg_duration_minutes
    FROM plan_tasks t
    JOIN monthly_plans mp ON t.plan_id = mp.id
    WHERE mp.user_id = ${userId}
      AND t.start_time >= ${startDate}
      AND t.focus_area IS NOT NULL
    GROUP BY t.focus_area
    ORDER BY completion_rate ASC
  `);

  return result.rows.map((row: any) => ({
    focusArea: row.focus_area,
    completionRate: Number(row.completion_rate) || 0,
    totalTasks: Number(row.total_tasks),
    avgDuration: Number(row.avg_duration_minutes) || 0,
    trend: Number(row.completion_rate) < 0.5 ? ("declining" as const) : ("stable" as const),
  }));
}

export async function detectBurnoutRisk(
  userId: string,
  weeks: number = 4,
): Promise<BurnoutRiskResult> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const result = await db.execute(sql`
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE t.is_completed) as completed_tasks,
      AVG(
        CASE 
          WHEN t.is_completed = true 
          THEN EXTRACT(HOUR FROM t.completed_at) - EXTRACT(HOUR FROM t.start_time)
          ELSE NULL 
        END
      ) as avg_completion_hour
    FROM plan_tasks t
    JOIN monthly_plans mp ON t.plan_id = mp.id
    WHERE mp.user_id = ${userId}
      AND t.start_time >= ${startDate}
  `);

  const row = result.rows[0] as any;
  const totalTasks = Number(row.total_tasks) || 0;
  const completedTasks = Number(row.completed_tasks) || 0;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 1;

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - weeks * 7 + 14);

  const recentResult = await db.execute(sql`
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE t.is_completed) as completed_tasks
    FROM plan_tasks t
    JOIN monthly_plans mp ON t.plan_id = mp.id
    WHERE mp.user_id = ${userId}
      AND t.start_time >= ${twoWeeksAgo}
  `);

  const recentRow = recentResult.rows[0] as any;
  const recentTotal = Number(recentRow.total_tasks) || 0;
  const recentCompleted = Number(recentRow.completed_tasks) || 0;
  const recentRate = recentTotal > 0 ? recentCompleted / recentTotal : 1;

  const isDeclining = recentRate < completionRate && recentTotal > 5;
  const hasRisk = completionRate < 0.4 || (isDeclining && completionRate < 0.6);
  const riskLevel = completionRate < 0.2 ? "high" : completionRate < 0.4 ? "medium" : "low";

  const indicators: string[] = [];
  if (completionRate < 0.4) indicators.push("Low completion rate");
  if (isDeclining) indicators.push("Declining productivity");
  if (recentTotal > 20) indicators.push("High workload");

  return {
    level: hasRisk ? riskLevel : "low",
    score: Math.round(completionRate * 100),
    indicators,
    isDeclining,
  };
}
