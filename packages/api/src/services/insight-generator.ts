import * as db from "@monthly-zen/db";
import { sql } from "drizzle-orm";

// Type imports from db package
import type { DayOfWeekPattern, FocusAreaPattern } from "@monthly-zen/db";

// ============================================
// PATTERN ANALYSIS FUNCTIONS
// ============================================

async function getDayOfWeekPatterns(userId: string, weeks: number = 8) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const result = await db.db.execute(sql`
    SELECT 
      EXTRACT(DOW FROM t.start_time) as day_of_week,
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE t.is_completed) as completed_tasks,
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
    dayName: dayNames[Number(row.day_of_week)],
    completionRate: Number(row.completion_rate) || 0,
    totalTasks: Number(row.total_tasks),
    avgTasksPerWeek: Number(row.total_tasks) / weeks,
    trend: "stable" as const, // Would need historical data to determine trend
  }));
}

async function getTimeOfDayPatterns(userId: string, weeks: number = 8) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const result = await db.db.execute(sql`
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

  // Find peak hours (top 25% completion rate)
  const sortedByCompletion = [...rows].sort((a, b) => b.completionRate - a.completionRate);
  const peakCount = Math.max(1, Math.floor(rows.length * 0.25));
  const peakHours = sortedByCompletion.slice(0, peakCount).map((r) => r.hour);

  return {
    patterns: rows,
    peakHours,
  };
}

async function getFocusAreaPatterns(userId: string, weeks: number = 8) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const result = await db.db.execute(sql`
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

async function detectBurnoutRisk(userId: string, weeks: number = 4) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const result = await db.db.execute(sql`
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

  // Calculate trend (compare last week to previous)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - weeks * 7 + 14);

  const recentResult = await db.db.execute(sql`
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

// ============================================
// INSIGHT GENERATION
// ============================================

export interface GeneratedInsight {
  type: "PeakEnergy" | "CompletionRate" | "SessionDuration" | "Challenges";
  title: string;
  description: string;
  reasoning?: string;
  suggestedAction?: string;
  confidence: string;
  priority: "high" | "medium" | "low";
  category: string;
  triggerData: Record<string, unknown>;
}

export async function generateInsight(userId: string): Promise<GeneratedInsight | null> {
  try {
    // Gather pattern data
    const [dayPatterns, , focusPatterns, burnoutRisk] = await Promise.all([
      getDayOfWeekPatterns(userId),
      getTimeOfDayPatterns(userId),
      getFocusAreaPatterns(userId),
      detectBurnoutRisk(userId),
    ]);

    // Find best and worst patterns
    const defaultPattern: DayOfWeekPattern = {
      dayOfWeek: 0,
      dayName: "Sunday",
      completionRate: 0,
      totalTasks: 0,
      avgTasksPerWeek: 0,
      trend: "stable",
    };

    const bestDay = dayPatterns.reduce(
      (best: DayOfWeekPattern, current: DayOfWeekPattern) =>
        current.completionRate > best.completionRate ? current : best,
      dayPatterns[0] || defaultPattern,
    );

    const worstDay = dayPatterns.reduce(
      (worst: DayOfWeekPattern, current: DayOfWeekPattern) =>
        current.completionRate < worst.completionRate ? current : worst,
      dayPatterns[0] || { ...defaultPattern, completionRate: 1 },
    );

    const strugglingFocusArea = focusPatterns.find(
      (fa: FocusAreaPattern) => fa.completionRate < 0.5 && fa.totalTasks >= 3,
    );

    // Generate insights based on patterns
    const insights: GeneratedInsight[] = [];

    // Burnout risk insight
    if (burnoutRisk.level === "high") {
      insights.push({
        type: "Challenges",
        title: "High Burnout Risk Detected",
        description: `Your productivity has dropped to ${burnoutRisk.score}%. Consider taking breaks and reducing workload.`,
        reasoning: burnoutRisk.indicators.join(", "),
        suggestedAction: "Reduce tasks by 30% and add recovery breaks",
        confidence: "90%",
        priority: "high",
        category: "burnout",
        triggerData: { burnoutRisk },
      });
    } else if (burnoutRisk.level === "medium" && burnoutRisk.isDeclining) {
      insights.push({
        type: "CompletionRate",
        title: "Productivity Declining",
        description:
          "Your completion rate is trending downward. Small adjustments now can prevent larger issues.",
        reasoning: burnoutRisk.indicators.join(", "),
        suggestedAction: "Review task list and prioritize essential items",
        confidence: "75%",
        priority: "medium",
        category: "productivity",
        triggerData: { burnoutRisk },
      });
    }

    // Best day insight
    if (bestDay.completionRate > 0.7 && bestDay.totalTasks >= 5) {
      insights.push({
        type: "PeakEnergy",
        title: `${bestDay.dayName} is Your Peak Day`,
        description: `You complete ${Math.round(bestDay.completionRate * 100)}% of tasks on ${bestDay.dayName}s. Schedule important work then.`,
        suggestedAction: `Block 2-3 hours for deep work next ${bestDay.dayName}`,
        confidence: `${Math.round(bestDay.completionRate * 100)}%`,
        priority: "medium",
        category: "scheduling",
        triggerData: { bestDay },
      });
    }

    // Worst day insight
    if (worstDay.completionRate < 0.5 && worstDay.totalTasks >= 3) {
      insights.push({
        type: "Challenges",
        title: `${worstDay.dayName} Productivity Gap`,
        description: `Only ${Math.round(worstDay.completionRate * 100)}% completion on ${worstDay.dayName}s. Consider lighter tasks or different scheduling.`,
        suggestedAction: "Schedule administrative or low-effort tasks on this day",
        confidence: `${Math.round(worstDay.completionRate * 100)}%`,
        priority: "low",
        category: "scheduling",
        triggerData: { worstDay },
      });
    }

    // Struggling focus area
    if (strugglingFocusArea) {
      insights.push({
        type: "CompletionRate",
        title: `"${strugglingFocusArea.focusArea}" Needs Attention`,
        description: `Only ${Math.round(strugglingFocusArea.completionRate * 100)}% completion rate. Break into smaller tasks.`,
        suggestedAction: "Complete one small task in this area today",
        confidence: "70%",
        priority: "medium",
        category: "alignment",
        triggerData: { focusArea: strugglingFocusArea },
      });
    }

    // Select the highest priority insight
    if (insights.length === 0) {
      // Default positive insight
      insights.push({
        type: "CompletionRate",
        title: "You're on Track!",
        description: "Your productivity patterns look healthy. Keep maintaining your momentum!",
        confidence: "80%",
        priority: "low",
        category: "general",
        triggerData: { dayPatterns, focusPatterns },
      });
    }

    // Sort by priority and return the best one
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const bestInsight = insights.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    )[0];

    // Store the insight in the database
    const storedInsight = await db.createInsight({
      userId,
      type: bestInsight.type,
      title: bestInsight.title,
      description: bestInsight.description,
      reasoning: bestInsight.reasoning,
      suggestedAction: bestInsight.suggestedAction,
      confidence: bestInsight.confidence,
      priority: bestInsight.priority,
      category: bestInsight.category,
      triggerData: bestInsight.triggerData,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      ...bestInsight,
      triggerData: { ...bestInsight.triggerData, storedId: storedInsight?.id },
    };
  } catch (error) {
    console.error("Error generating insight:", error);
    return null;
  }
}
