import { db } from "@monthly-zen/db";
import { sql } from "drizzle-orm";

export interface MorningIntention {
  title: string;
  reason: string;
  confidence: number;
  patternType: "peak-energy" | "burnout-risk" | "focus-area" | "general";
  suggestedAction?: string;
}

async function getDayOfWeekPatterns(userId: string, weeks: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const result = await db.execute(sql`
    SELECT 
      EXTRACT(DOW FROM t.start_time) as day_of_week,
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE t.is_completed) as completed_tasks,
      COUNT(*) FILTER (WHERE t.is_completed)::FLOAT / COUNT(*) as completion_rate
    FROM tasks t
    WHERE t.user_id = ${userId}
      AND t.start_time >= ${startDate}
    GROUP BY EXTRACT(DOW FROM t.start_time)
    ORDER BY completion_rate DESC
  `);

  return result.rows.map((row: any) => ({
    dayOfWeek: Number(row.day_of_week),
    totalTasks: Number(row.total_tasks),
    completedTasks: Number(row.completed_tasks),
    completionRate: Number(row.completion_rate),
  }));
}

async function detectBurnoutRisk(userId: string, weeks: number) {
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
    FROM tasks t
    WHERE t.user_id = ${userId}
      AND t.start_time >= ${startDate}
  `);

  const row = result.rows[0] as any;
  const completionRate =
    row.total_tasks > 0 ? Number(row.completed_tasks) / Number(row.total_tasks) : 1;

  const hasRisk = completionRate < 0.4;
  const riskLevel = completionRate < 0.2 ? "High" : completionRate < 0.4 ? "Medium" : "Low";

  return { hasRisk, riskLevel, completionRate };
}

async function getFocusAreaTrends(userId: string, weeks: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const result = await db.execute(sql`
    SELECT 
      t.focus_area,
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE t.is_completed) as completed_tasks,
      COUNT(*) FILTER (WHERE t.is_completed)::FLOAT / COUNT(*) as completion_rate
    FROM tasks t
    WHERE t.user_id = ${userId}
      AND t.start_time >= ${startDate}
      AND t.focus_area IS NOT NULL
    GROUP BY t.focus_area
    ORDER BY completion_rate ASC
  `);

  return result.rows.map((row: any) => ({
    focusArea: row.focus_area,
    totalTasks: Number(row.total_tasks),
    completedTasks: Number(row.completed_tasks),
    completionRate: Number(row.completion_rate),
    trend: Number(row.completion_rate) < 0.5 ? "declining" : "stable",
  }));
}

function getDayName(day: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
}

export async function generateMorningIntention(userId: string): Promise<MorningIntention | null> {
  const now = new Date();
  const dayOfWeek = now.getDay();

  try {
    const [dayPatterns, burnoutRisk, focusTrends] = await Promise.all([
      getDayOfWeekPatterns(userId, 3),
      detectBurnoutRisk(userId, 3),
      getFocusAreaTrends(userId, 3),
    ]);

    const bestDay = dayPatterns.reduce(
      (best: (typeof dayPatterns)[0], current: (typeof dayPatterns)[0]) =>
        current.completionRate > best.completionRate ? current : best,
      dayPatterns[0] || { dayOfWeek, completionRate: 0 },
    );

    if (burnoutRisk.hasRisk && burnoutRisk.riskLevel === "High") {
      return {
        title: "Prioritize Rest Today",
        reason: "Your patterns show signs of burnout risk. Consider lighter tasks and more breaks.",
        confidence: 90,
        patternType: "burnout-risk",
        suggestedAction: "Reduce workload by 30% and add recovery breaks",
      };
    }

    if (bestDay && bestDay.dayOfWeek === dayOfWeek && dayPatterns.length > 0) {
      return {
        title: "Schedule Deep Work Now",
        reason: `${getDayName(bestDay.dayOfWeek)} is your most productive day. Save 2-3 hours for challenging tasks.`,
        confidence: Math.round(bestDay.completionRate * 100),
        patternType: "peak-energy",
        suggestedAction: "Block 2 hours for high-priority work",
      };
    }

    const declining = focusTrends.find((t: any) => t.trend === "declining");
    if (declining) {
      return {
        title: "Revisit Your Goals",
        reason: `Your "${declining.focusArea}" focus area is showing declining trends. Small progress today can help.`,
        confidence: 75,
        patternType: "focus-area",
        suggestedAction: "Complete one small task in this area",
      };
    }

    return {
      title: "Maintain Your Momentum",
      reason: "You're on track with your monthly goals. Keep up the consistent effort!",
      confidence: 80,
      patternType: "general",
    };
  } catch (error) {
    console.error("Error generating morning intention:", error);
    return {
      title: "Stay Focused Today",
      reason: "Take it one task at a time. You've got this!",
      confidence: 50,
      patternType: "general",
    };
  }
}
