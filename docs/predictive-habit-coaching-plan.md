# Predictive Habit Coaching Feature Plan

AI analyzes user's task completion patterns over time to provide proactive insights and suggestions that humans might miss, helping users maintain consistent habits and avoid burnout.

---

## Overview

**Example Insight:**

> "I noticed that every third week of the month, your sleep and exercise habits drop by 40%. Would you like to schedule a 'Maintenance Mode' for next week to avoid burnout?"

**Core Capability:**

- Detects patterns in task completion data across multiple time dimensions
- Generates actionable insights based on observed trends
- Suggests concrete actions users can take
- Tracks user responses to insights for learning

---

## 1. Design Decisions

| Question                     | Decision                                             | Rationale                                                             |
| ---------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| Pattern Analysis Granularity | **Option C** - Weekly + Day-of-week                  | Captures both monthly rhythm patterns and weekday/weekend differences |
| Analysis Trigger             | **Option D** - Monthly deep + Weekly quick           | Balances proactivity with system load (AI calls are expensive)        |
| Insight Persistence          | **Option B** - Last 3 months                         | Provides trend context without overwhelming user with history         |
| User Actions                 | **Option D** - All actions (Dismiss, Accept, Snooze) | Gives users flexibility in responding                                 |
| AI Integration               | **Option C** - Hybrid (rules + AI)                   | Saves tokens with simple rules, uses AI for complex insights          |
| Display Location             | **Option A + C** - Dashboard + Dedicated Page        | Dashboard for visibility, page for history                            |
| Maintenance Mode             | **Option C** - AI-enabled recovery                   | Powerful feature that feels personalized when suggested by AI         |

---

## 2. Database Schema Changes

### 2.1 Create Insights Table

**File:** `packages/db/src/schema/habit-insights.ts` (new file)

```typescript
import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const habitInsights = pgTable("habit_insights", {
  id: serial("id").primaryKey(),

  userId: text("user_id")
    .references(() => user.id)
    .notNull(),

  insightType: text("insight_type", { enum: ["PeakEnergy", "CompletionRate", "SessionDuration", "Challenges", "BurnoutRisk", "RecoveryNeeded"] })
    .notNull(),

  title: text("title").notNull(), // e.g., "Third Week Drop-off Detected"
  description: text("description").notNull(), // e.g., "Sleep and exercise tasks drop by 40%..."

  // Pattern Data (JSON for flexibility)
  patternData: jsonb("pattern_data").notNull(), // e.g., { weeks: [1,2,3,4], values: [90,85,45,80], trend: "drop" }

  // Suggested Action
  suggestedAction: text("suggested_action").notNull(), // e.g., "Schedule Maintenance Mode for Week 3"
  actionType: text("action_type", { enum: ["MaintenanceMode", "ScheduleRecovery", "AdjustWorkload", "FocusShift", "HabitReinforcement"] })
    .notNull(),

  // Metadata
  confidence: integer("confidence").default(0), // 0-100, how confident AI is about this pattern
  dataSource: text("data_source", { enum: ["RuleBased", "AIGenerated", "Hybrid"] })
    .notNull(),

  // User Response
  userResponse: text("user_response", { enum: ["Pending", "Accepted", "Dismissed", "Snoozed"] })
    .default("Pending"),
  respondedAt: timestamp("responded_at"),
  snoozedUntil: timestamp("snoozed_until"),
  responseReason: text("response_reason"), // Why user dismissed or snoozed

  // Timestamps
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // When insight is no longer relevant

  // Week/Month context for grouping
  targetMonth: text("target_month"), // e.g., "2025-01"
  targetWeek: integer("target_week"), // e.g., 3
});

export const habitInsightsRelations = relations(habitInsights, ({ one }) => ({
  user: one(user, {
    fields: [habitInsights.userId],
    references: [user.id],
  }),
}));
```

### 2.2 Create Insight Actions Table

**File:** `packages/db/src/schema/insight-actions.ts` (new file)

```typescript
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { habitInsights } from "./habit-insights";

export const insightActions = pgTable("insight_actions", {
  id: serial("id").primaryKey(),
  insightId: integer("insight_id")
    .references(() => habitInsights.id)
    .notNull(),

  action: text("action", { enum: ["MaintenanceModeScheduled", "RecoveryWeekAdded", "WorkloadReduced", "FocusAreaChanged", "NoAction"] })
    .notNull(),

  // If action resulted in plan modification
  modifiedPlanId: integer("modified_plan_id"), // FK to monthly_plans if applicable
  modifiedTaskIds: integer[]("modified_task_ids"), // Array of affected task IDs

  // Effect tracking (to measure insight usefulness)
  outcome: text("outcome", { enum: ["Pending", "Successful", "PartiallySuccessful", "Unsuccessful", "Unknown"] })
    .default("Pending"),
  outcomeNote: text("outcome_note"), // User feedback on how it went

  executedAt: timestamp("executed_at").notNull().defaultNow(),
});
```

### 2.3 Add Columns to monthly_plans

**File:** `packages/db/src/schema/monthly-plans.ts` (append)

```typescript
// Add these new columns to monthlyPlans table
maintenanceModeEnabled: boolean("maintenance_mode_enabled").default(false),
maintenanceModeWeeks: integer[]("maintenance_mode_weeks"), // e.g., [3] for week 3
insightGeneratedFrom: integer("insight_generated_from"), // FK to habit_insights if this plan was created from insight
```

### 2.4 Add Insight Types to Enums

**File:** `packages/db/src/schema/enums.ts` (append)

```typescript
export const insightTypeEnum = pgEnum("insight_type", [
  "PeakEnergy",         // When user is most productive
  "CompletionRate",      // High/low completion trends
  "SessionDuration",     // Long/short work sessions
  "Challenges",         // Recurring obstacles
  "BurnoutRisk",        // Predictive - likely to burn out
  "RecoveryNeeded",      // Need for recovery week
]);

export const insightResponseEnum = pgEnum("insight_response", [
  "Pending",
  "Accepted",
  "Dismissed",
  "Snoozed",
]);

export const insightSourceEnum = pgEnum("insight_source", [
  "RuleBased",      // Predefined pattern rules
  "AIGenerated",    // Pure AI analysis
  "Hybrid",         // Rules + AI validation
]);
```

### 2.5 Update Schema Index File

**File:** `packages/db/src/schema/index.ts` (add exports)

```typescript
export * from "./habit-insights";
export * from "./insight-actions";
```

---

## 3. Pattern Detection Queries

**File:** `packages/db/src/queries/pattern-detection.ts` (new file)

```typescript
import { db } from "../index";
import { sql } from "drizzle-orm";
import { monthlyPlans } from "../schema/monthly-plans";
import { planTasks } from "../schema/plan-tasks";

// ============================================
// TYPES
// ============================================

export interface WeeklyPattern {
  weekNumber: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  focusAreaBreakdown: Record<string, { total: number; completed: number; }>;
}

export interface DayOfWeekPattern {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgTasksPerDay: number;
}

export interface TimeOfDayPattern {
  hourOfDay: number; // 0-23
  totalCompletions: number;
  completionRate: number;
  avgTaskDuration: number; // in minutes
}

export interface FocusAreaTrend {
  focusArea: string;
  months: Array<{
    month: string;
    completionRate: number;
  }>;
  trend: "improving" | "declining" | "stable" | "fluctuating";
}

// ============================================
// WEEKLY PATTERN DETECTION
// ============================================

/**
 * Get task completion data grouped by week for a specific month
 * Identifies which weeks have higher/lower completion rates
 */
export async function getWeeklyCompletionPatterns(
  userId: string,
  monthYear: string
): Promise<WeeklyPattern[]> {
  const [year, month] = monthYear.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const result = await db.execute(sql`
    WITH dated_tasks AS (
      SELECT
        pt.*,
        DATE_PART('week', pt.start_time) - DATE_PART('week', DATE_TRUNC('month', pt.start_time)) + 1 as week_number,
        EXTRACT(DOW FROM pt.start_time) as day_of_week
      FROM plan_tasks pt
      JOIN monthly_plans mp ON pt.plan_id = mp.id
      WHERE mp.user_id = ${userId}
        AND pt.start_time >= ${startDate}
        AND pt.end_time <= ${endDate}
    )
    SELECT
      week_number as "weekNumber",
      COUNT(*) as "totalTasks",
      COUNT(CASE WHEN pt.is_completed = true THEN 1 END) as "completedTasks",
      ROUND(
        COUNT(CASE WHEN pt.is_completed = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100,
        1
      ) as "completionRate"
    FROM dated_tasks
    GROUP BY week_number
    ORDER BY week_number
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows || [];

  // Get focus area breakdown for each week
  const patterns = await Promise.all(
    rows.map(async (row: any) => {
      const breakdown = await db.execute(sql`
        SELECT
          pt.focus_area as "focusArea",
          COUNT(*) as "total",
          COUNT(CASE WHEN pt.is_completed = true THEN 1 END) as "completed"
        FROM plan_tasks pt
        JOIN monthly_plans mp ON pt.plan_id = mp.id
        WHERE mp.user_id = ${userId}
          AND DATE_PART('week', pt.start_time) - DATE_PART('week', DATE_TRUNC('month', pt.start_time)) + 1 = ${Number(row.weekNumber)}
          AND pt.start_time >= ${startDate}
          AND pt.end_time <= ${endDate}
        GROUP BY pt.focus_area
      `);

      const breakdownRows = Array.isArray(breakdown) ? breakdown : (breakdown as any).rows || [];
      const breakdownMap: Record<string, { total: number; completed: number }> = {};

      breakdownRows.forEach((b: any) => {
        breakdownMap[b.focusArea] = {
          total: Number(b.total),
          completed: Number(b.completed),
        };
      });

      return {
        weekNumber: Number(row.weekNumber),
        totalTasks: Number(row.totalTasks),
        completedTasks: Number(row.completedTasks),
        completionRate: Number(row.completionRate),
        focusAreaBreakdown: breakdownMap,
      };
    })
  );

  return patterns;
}

// ============================================
// DAY-OF-WEEK PATTERN DETECTION
// ============================================

/**
 * Analyze which days of the week have highest completion rates
 */
export async function getDayOfWeekPatterns(
  userId: string,
  monthsToAnalyze: number = 3
): Promise<DayOfWeekPattern[]> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsToAnalyze);

  const result = await db.execute(sql`
    SELECT
      EXTRACT(DOW FROM pt.start_time)::int as "dayOfWeek",
      COUNT(*) as "totalTasks",
      COUNT(CASE WHEN pt.is_completed = true THEN 1 END) as "completedTasks",
      ROUND(
        COUNT(CASE WHEN pt.is_completed = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100,
        1
      ) as "completionRate",
      ROUND(COUNT(*)::numeric / COUNT(DISTINCT DATE(pt.start_time)), 1) as "avgTasksPerDay"
    FROM plan_tasks pt
    JOIN monthly_plans mp ON pt.plan_id = mp.id
    WHERE mp.user_id = ${userId}
      AND pt.start_time >= ${startDate}
    GROUP BY EXTRACT(DOW FROM pt.start_time)
    ORDER BY dayOfWeek
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows || [];

  return rows.map((row: any) => ({
    dayOfWeek: Number(row.dayOfWeek),
    totalTasks: Number(row.totalTasks),
    completedTasks: Number(row.completedTasks),
    completionRate: Number(row.completionRate),
    avgTasksPerDay: Number(row.avgTasksPerDay),
  }));
}

// ============================================
// FOCUS AREA TREND ANALYSIS
// ============================================

/**
 * Track completion rate trends per focus area over time
 */
export async function getFocusAreaTrends(
  userId: string,
  monthsToAnalyze: number = 3
): Promise<FocusAreaTrend[]> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsToAnalyze);

  const result = await db.execute(sql`
    WITH monthly_focus_stats AS (
      SELECT
        TO_CHAR(mp.month_year, 'YYYY-MM') as "month",
        pt.focus_area as "focusArea",
        COUNT(*) as "totalTasks",
        COUNT(CASE WHEN pt.is_completed = true THEN 1 END) as "completedTasks",
        ROUND(
          COUNT(CASE WHEN pt.is_completed = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100,
          1
        ) as "completionRate"
      FROM plan_tasks pt
      JOIN monthly_plans mp ON pt.plan_id = mp.id
      WHERE mp.user_id = ${userId}
        AND pt.start_time >= ${startDate}
      GROUP BY TO_CHAR(mp.month_year, 'YYYY-MM'), pt.focus_area
    )
    SELECT
      focus_area as "focusArea",
      ARRAY_AGG(month ORDER BY month) as "months",
      ARRAY_AGG(completion_rate ORDER BY month) as "completionRates"
    FROM monthly_focus_stats
    GROUP BY focus_area
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows || [];

  return rows.map((row: any) => {
    const rates = row.completionRates as number[];
    let trend: FocusAreaTrend["trend"] = "stable";

    // Simple trend detection
    const firstHalf = rates.slice(0, Math.floor(rates.length / 2));
    const secondHalf = rates.slice(Math.floor(rates.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (avgSecond > avgFirst + 10) trend = "improving";
    else if (avgSecond < avgFirst - 10) trend = "declining";
    else if (Math.max(...rates) - Math.min(...rates) > 20) trend = "fluctuating";

    return {
      focusArea: row.focusArea,
      months: row.months.map((m: string, i: number) => ({
        month: m,
        completionRate: rates[i],
      })),
      trend,
    };
  });
}

// ============================================
// BURNOUT RISK DETECTION
// ============================================

/**
 * Detect signs of potential burnout based on patterns
 * High task completion rate + long streaks followed by sudden drops
 */
export async function detectBurnoutRisk(
  userId: string,
  monthsToAnalyze: number = 3
): Promise<{
  hasRisk: boolean;
  signals: string[];
  riskLevel: "Low" | "Medium" | "High";
}> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsToAnalyze);

  // Check for multiple burnout signals
  const result = await db.execute(sql`
    WITH weekly_stats AS (
      SELECT
        DATE_PART('week', pt.start_time) as week_num,
        TO_CHAR(pt.start_time, 'YYYY-MM') as month,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN pt.is_completed = true THEN 1 END) as completed_tasks,
        ROUND(
          COUNT(CASE WHEN pt.is_completed = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100,
          1
        ) as completion_rate
      FROM plan_tasks pt
      JOIN monthly_plans mp ON pt.plan_id = mp.id
      WHERE mp.user_id = ${userId}
        AND pt.start_time >= ${startDate}
      GROUP BY week_num, month
      ORDER BY month, week_num
    )
    SELECT
      AVG(completion_rate) as avg_completion,
      STDDEV(completion_rate) as completion_stddev,
      MIN(completion_rate) as min_completion,
      MAX(completion_rate) as max_completion,
      COUNT(CASE WHEN completion_rate < 50 THEN 1 END) as low_completion_weeks
    FROM weekly_stats
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows || [];
  const stats = rows[0];

  const signals: string[] = [];
  let riskLevel: "Low" | "Medium" | "High" = "Low";

  if (!stats) {
    return { hasRisk: false, signals: [], riskLevel: "Low" };
  }

  // Signal 1: High average completion with high variability (overwork then crash)
  if (stats.avg_completion > 80 && stats.completion_stddev > 20) {
    signals.push("High completion rate with large week-to-week fluctuations");
    riskLevel = "Medium";
  }

  // Signal 2: Multiple low completion weeks
  if (stats.low_completion_weeks >= 2) {
    signals.push("Multiple weeks with completion rate below 50%");
    riskLevel = riskLevel === "Medium" ? "High" : "Medium";
  }

  // Signal 3: Large gap between best and worst weeks
  if (stats.max_completion - stats.min_completion > 40) {
    signals.push("Large performance gap between best and worst weeks");
    if (riskLevel === "Low") riskLevel = "Medium";
  }

  return {
    hasRisk: signals.length > 0,
    signals,
    riskLevel,
  };
}

// ============================================
// RECOVERY WEEK RECOMMENDATION
// ============================================

/**
 * Recommend which week(s) should be recovery weeks based on historical data
 */
export async function recommendRecoveryWeeks(
  userId: string,
  targetMonth: string
): Promise<number[]> {
  // Get weekly patterns for this month
  const patterns = await getWeeklyCompletionPatterns(userId, targetMonth);

  // Identify weeks with consistently low completion
  const lowPerformanceWeeks = patterns
    .filter((p) => p.completionRate < 60)
    .map((p) => p.weekNumber);

  // If consistent pattern (e.g., always week 3), recommend that week
  const weekCounts = lowPerformanceWeeks.reduce((acc, week) => {
    acc[week] = (acc[week] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const recommendedWeeks = Object.entries(weekCounts)
    .filter(([_, count]) => count >= 2) // Pattern appears at least twice
    .map(([week]) => Number(week))
    .sort((a, b) => a - b);

  return recommendedWeeks;
}
```

---

## 4. Rule-Based Insight Generation

**File:** `packages/api/src/services/insight-generator.ts` (new file)

```typescript
import type * as db from "@monthly-zen/db";
import {
  getWeeklyCompletionPatterns,
  getDayOfWeekPatterns,
  getFocusAreaTrends,
  detectBurnoutRisk,
  recommendRecoveryWeeks,
} from "@monthly-zen/db";

// ============================================
// TYPES
// ============================================

export interface InsightCandidate {
  insightType: db.InsightType;
  title: string;
  description: string;
  patternData: any;
  suggestedAction: string;
  actionType: db.ActionType;
  confidence: number;
  dataSource: db.DataSource;
}

// ============================================
// RULE DEFINITIONS
// ============================================

const RULES = {
  // Rule 1: Third Week Drop-off
  thirdWeekDropOff: {
    name: "Third Week Drop-off",
    check: (patterns: any[]) => {
      if (patterns.length < 3) return null;

      const week3Rates = patterns.filter((p) => p.weekNumber === 3).map((p) => p.completionRate);
      const avgOtherWeeks = patterns
        .filter((p) => p.weekNumber !== 3)
        .reduce((sum, p) => sum + p.completionRate, 0) /
        (patterns.length - 1);

      if (week3Rates.length === 0) return null;

      const avgWeek3 = week3Rates.reduce((a, b) => a + b, 0) / week3Rates.length;

      if (avgWeek3 < avgOtherWeeks - 20) {
        return {
          dropPercentage: Math.round(avgOtherWeeks - avgWeek3),
          avgOtherWeeks: Math.round(avgOtherWeeks),
          avgWeek3: Math.round(avgWeek3),
        };
      }

      return null;
    },
    generate: (data: any) => ({
      insightType: "CompletionRate" as const,
      title: "Third Week Drop-off Detected",
      description: `I noticed that Week 3 of the month has a ${data.dropPercentage}% lower completion rate than other weeks (${data.avgWeek3}% vs ${data.avgOtherWeeks}% avg). This pattern might indicate fatigue or competing priorities mid-month.`,
      patternData: data,
      suggestedAction: "Schedule a 'Maintenance Mode' for Week 3 with reduced workload and more rest time.",
      actionType: "MaintenanceMode" as const,
      confidence: 85,
      dataSource: "RuleBased" as const,
    }),
  },

  // Rule 2: Best Performance Day
  bestPerformanceDay: {
    name: "Best Performance Day",
    check: (patterns: any[]) => {
      const sorted = [...patterns].sort((a, b) => b.completionRate - a.completionRate);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];

      if (!best || !worst) return null;

      const gap = best.completionRate - worst.completionRate;
      if (gap < 30) return null; // Only highlight if significant difference

      return {
        bestDay: best.dayOfWeek,
        bestRate: best.completionRate,
        worstDay: worst.dayOfWeek,
        worstRate: worst.completionRate,
        dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      };
    },
    generate: (data: any) => ({
      insightType: "PeakEnergy" as const,
      title: `${data.dayNames[data.bestDay]} is Your Most Productive Day`,
      description: `Your completion rate on ${data.dayNames[data.bestDay]}s is ${data.bestRate}%, compared to ${data.worstRate}% on ${data.dayNames[data.worstDay]}s. Consider scheduling your most challenging tasks for ${data.dayNames[data.bestDay]}s.`,
      patternData: data,
      suggestedAction: "Reschedule high-priority tasks to your best performance day this month.",
      actionType: "FocusShift" as const,
      confidence: 75,
      dataSource: "RuleBased" as const,
    }),
  },

  // Rule 3: Burnout Risk
  burnoutRisk: {
    name: "Burnout Risk",
    check: (riskData: any) => {
      if (!riskData.hasRisk || riskData.riskLevel !== "High") return null;

      return riskData;
    },
    generate: (data: any) => ({
      insightType: "BurnoutRisk" as const,
      title: "Burnout Risk Detected",
      description: `I'm detecting signs of potential burnout: ${data.signals.join(", ")}. Your performance is showing high variability which suggests overworking followed by exhaustion.`,
      patternData: data,
      suggestedAction: "Schedule a recovery week with only essential tasks and increased rest.",
      actionType: "RecoveryNeeded" as const,
      confidence: data.riskLevel === "High" ? 90 : 70,
      dataSource: "Hybrid" as const, // Use AI to validate/refine
    }),
  },

  // Rule 4: Declining Focus Area
  decliningFocusArea: {
    name: "Declining Focus Area",
    check: (trends: any[]) => {
      const declining = trends.filter((t) => t.trend === "declining");
      return declining.length > 0 ? declining : null;
    },
    generate: (data: any) => {
      const areas = data.map((t: any) => t.focusArea).join(", ");
      return {
        insightType: "Challenges" as const,
        title: "Declining Performance in Focus Areas",
        description: `The following focus areas are showing declining trends: ${areas}. Consider adjusting your approach or reducing scope in these areas.`,
        patternData: data,
        suggestedAction: "Reduce task complexity in declining areas or break into smaller chunks.",
        actionType: "AdjustWorkload" as const,
        confidence: 65,
        dataSource: "RuleBased" as const,
      };
    },
  },
};

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export async function generateRuleBasedInsights(
  userId: string,
  targetMonth: string
): Promise<InsightCandidate[]> {
  const insights: InsightCandidate[] = [];

  // Run all rule checks in parallel
  const [
    weeklyPatterns,
    dayOfWeekPatterns,
    focusAreaTrends,
    burnoutRisk,
    recoveryWeeks,
  ] = await Promise.all([
    getWeeklyCompletionPatterns(userId, targetMonth),
    getDayOfWeekPatterns(userId, 3),
    getFocusAreaTrends(userId, 3),
    detectBurnoutRisk(userId, 3),
    recommendRecoveryWeeks(userId, targetMonth),
  ]);

  // Apply Rule 1: Third Week Drop-off
  const week3Result = RULES.thirdWeekDropOff.check(weeklyPatterns);
  if (week3Result) {
    insights.push(RULES.thirdWeekDropOff.generate(week3Result));
  }

  // Apply Rule 2: Best Performance Day
  const bestDayResult = RULES.bestPerformanceDay.check(dayOfWeekPatterns);
  if (bestDayResult) {
    insights.push(RULES.bestPerformanceDay.generate(bestDayResult));
  }

  // Apply Rule 3: Burnout Risk
  const burnoutResult = RULES.burnoutRisk.check(burnoutRisk);
  if (burnoutResult) {
    insights.push(RULES.burnoutRisk.generate(burnoutResult));
  }

  // Apply Rule 4: Declining Focus Areas
  const decliningResult = RULES.decliningFocusArea.check(focusAreaTrends);
  if (decliningResult) {
    insights.push(RULES.decliningFocusArea.generate(decliningResult));
  }

  // Sort by confidence and return top insights
  return insights
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // Return max 5 insights
}
```

---

## 5. AI-Enhanced Insight Generation

**File:** `packages/api/src/services/ai-insight-generator.ts` (new file)

```typescript
import { getOpenRouterService } from "../lib/openrouter";

export async function generateAIInsights(
  userId: string,
  patternData: {
    weeklyPatterns: any[];
    dayOfWeekPatterns: any[];
    focusAreaTrends: any[];
    burnoutRisk: any;
  }
): Promise<InsightCandidate[]> {
  const openRouter = getOpenRouterService();

  const prompt = `
You are a productivity coach analyzing a user's monthly plan task completion patterns.

ANALYZE THE FOLLOWING PATTERN DATA:

Weekly Patterns (last month):
${JSON.stringify(patternData.weeklyPatterns, null, 2)}

Day of Week Patterns (last 3 months):
${JSON.stringify(patternData.dayOfWeekPatterns, null, 2)}

Focus Area Trends (last 3 months):
${JSON.stringify(patternData.focusAreaTrends, null, 2)}

Burnout Risk Assessment:
${JSON.stringify(patternData.burnoutRisk, null, 2)}

YOUR TASK:
Generate 1-3 insightful, actionable observations that a human might miss.

For each insight, provide:
1. **Type**: One of: PeakEnergy, CompletionRate, SessionDuration, Challenges, BurnoutRisk, RecoveryNeeded
2. **Title**: Short, clear (e.g., "Mid-Month Slump Detected")
3. **Description**: 2-3 sentences explaining what you noticed
4. **Pattern Data**: JSON object with the specific data supporting this insight
5. **Suggested Action**: Concrete action the user can take
6. **Action Type**: One of: MaintenanceMode, ScheduleRecovery, AdjustWorkload, FocusShift, HabitReinforcement
7. **Confidence**: 0-100 score

FOCUS ON:
- Patterns that appear consistently
- Subtle trends that develop over time
- Correlations between different data points
- Predictive observations (what will likely happen)

OUTPUT FORMAT (JSON):
\`\`\`json
{
  "insights": [
    {
      "insightType": "...",
      "title": "...",
      "description": "...",
      "patternData": { ... },
      "suggestedAction": "...",
      "actionType": "...",
      "confidence": 85
    }
  ]
}
\`\`\`

Be specific and actionable. Don't state the obvious.
  `;

  try {
    const response = await openRouter.generatePlan(prompt);

    // Parse AI response
    const parsed = JSON.parse(response.rawContent);

    return parsed.insights.map((insight: any) => ({
      ...insight,
      dataSource: "AIGenerated" as const,
    }));
  } catch (error) {
    console.error("[AI Insight Generation] Failed:", error);
    return []; // Fall back to rule-based only
  }
}
```

---

## 6. API Layer Changes

### 6.1 Create Insights Router

**File:** `packages/api/src/routers/insights.ts` (new file)

```typescript
import { z } from "zod";
import { protectedProcedure } from "../index";
import {
  generateRuleBasedInsights,
  generateAIInsights,
} from "../services/insight-generator";
import * as db from "@monthly-zen/db";

export const insightsRouter = {
  // Get active insights for user
  getActiveInsights: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new Error("Authentication required");

      const insights = await db.getActiveInsights(userId);

      return { success: true, data: insights };
    }),

  // Get insights history
  getInsightsHistory: protectedProcedure
    .input(z.object({
      months: z.number().min(1).max(12).default(3),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new Error("Authentication required");

      const insights = await db.getInsightsHistory(userId, input.months, input.limit);

      return { success: true, data: insights };
    }),

  // Generate insights for a specific month
  generateInsights: protectedProcedure
    .input(z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/),
      useAI: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new Error("Authentication required");

      // Check if already generated insights for this month
      const existing = await db.getInsightsForMonth(userId, input.month);
      if (existing && existing.length > 0) {
        return { success: true, data: existing, regenerated: false };
      }

      let insights = await generateRuleBasedInsights(userId, input.month);

      // Optionally enhance with AI
      if (input.useAI) {
        const [
          weeklyPatterns,
          dayOfWeekPatterns,
          focusAreaTrends,
          burnoutRisk,
        ] = await Promise.all([
          db.getWeeklyCompletionPatterns(userId, input.month),
          db.getDayOfWeekPatterns(userId, 3),
          db.getFocusAreaTrends(userId, 3),
          db.detectBurnoutRisk(userId, 3),
        ]);

        const aiInsights = await generateAIInsights(userId, {
          weeklyPatterns,
          dayOfWeekPatterns,
          focusAreaTrends,
          burnoutRisk,
        });

        // Merge insights, remove duplicates
        insights = [...insights, ...aiInsights].slice(0, 5);
      }

      // Save insights to database
      const savedInsights = await Promise.all(
        insights.map((insight) =>
          db.createHabitInsight({
            userId,
            ...insight,
            targetMonth: input.month,
          })
        )
      );

      return { success: true, data: savedInsights, generated: true };
    }),

  // Respond to insight
  respondToInsight: protectedProcedure
    .input(z.object({
      insightId: z.number(),
      response: z.enum(["Accepted", "Dismissed", "Snoozed"]),
      responseReason: z.string().optional(),
      snoozeDuration: z.enum(["1week", "2weeks", "1month"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new Error("Authentication required");

      // Verify ownership
      const insight = await db.getInsightById(input.insightId);
      if (!insight || insight.userId !== userId) {
        throw new Error("Insight not found");
      }

      // Calculate snooze date
      let snoozedUntil = null;
      if (input.response === "Snoozed" && input.snoozeDuration) {
        const now = new Date();
        switch (input.snoozeDuration) {
          case "1week":
            snoozedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case "2weeks":
            snoozedUntil = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            break;
          case "1month":
            snoozedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      // Update insight
      const updated = await db.updateInsightResponse(input.insightId, {
        userResponse: input.response,
        respondedAt: new Date(),
        snoozedUntil,
        responseReason: input.responseReason,
      });

      // If accepted, create action record
      if (input.response === "Accepted") {
        await db.createInsightAction({
          insightId: input.insightId,
          action: "NoAction", // Default, may be updated if plan modified
          outcome: "Pending",
        });
      }

      return { success: true, data: updated };
    }),

  // Schedule maintenance mode
  scheduleMaintenanceMode: protectedProcedure
    .input(z.object({
      insightId: z.number(),
      planId: z.number().optional(),
      weeks: z.array(z.number().min(1).max(4)),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new Error("Authentication required");

      // Create or update plan with maintenance mode
      if (input.planId) {
        await db.updateMaintenanceMode(input.planId, {
          enabled: true,
          weeks: input.weeks,
          insightId: input.insightId,
        });
      }

      return { success: true };
    }),
};
```

### 6.2 Register Router

**File:** `packages/api/src/routers/index.ts` (modify)

```typescript
// Add to exports
export const appRouter = {
  // ... existing routers
  insights: insightsRouter,
};
```

---

## 7. Database Query Functions

**File:** `packages/db/src/queries/habit-insights.ts` (new file)

```typescript
import { db } from "../index";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { habitInsights, monthlyPlans } from "../schema/habit-insights";

// ============================================
// INSIGHT QUERIES
// ============================================

export async function createHabitInsight(
  userId: string,
  insight: any
) {
  const result = await db
    .insert(habitInsights)
    .values({
      userId,
      insightType: insight.insightType,
      title: insight.title,
      description: insight.description,
      patternData: insight.patternData,
      suggestedAction: insight.suggestedAction,
      actionType: insight.actionType,
      confidence: insight.confidence,
      dataSource: insight.dataSource,
      targetMonth: insight.targetMonth,
      targetWeek: insight.targetWeek,
      // Set expiration to 3 months from now
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    })
    .returning();

  return result[0];
}

export async function getActiveInsights(
  userId: string
): Promise<any[]> {
  const now = new Date();

  const result = await db
    .select()
    .from(habitInsights)
    .where(
      and(
        eq(habitInsights.userId, userId),
        gte(habitInsights.expiresAt, now),
        sql`${habitInsights.userResponse} = 'Pending'`
      )
    )
    .orderBy(desc(habitInsights.confidence));

  return result;
}

export async function getInsightsHistory(
  userId: string,
  months: number,
  limit: number
): Promise<any[]> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const result = await db
    .select()
    .from(habitInsights)
    .where(
      and(
        eq(habitInsights.userId, userId),
        gte(habitInsights.generatedAt, startDate)
      )
    )
    .orderBy(desc(habitInsights.generatedAt))
    .limit(limit);

  return result;
}

export async function getInsightsForMonth(
  userId: string,
  month: string
): Promise<any[]> {
  const result = await db
    .select()
    .from(habitInsights)
    .where(
      and(
        eq(habitInsights.userId, userId),
        eq(habitInsights.targetMonth, month)
      )
    );

  return result;
}

export async function getInsightById(
  insightId: number
): Promise<any | null> {
  const result = await db
    .select()
    .from(habitInsights)
    .where(eq(habitInsights.id, insightId))
    .limit(1);

  return result[0] || null;
}

export async function updateInsightResponse(
  insightId: number,
  updates: {
    userResponse: string;
    respondedAt: Date;
    snoozedUntil: Date | null;
    responseReason?: string;
  }
) {
  const result = await db
    .update(habitInsights)
    .set(updates)
    .where(eq(habitInsights.id, insightId))
    .returning();

  return result[0];
}

export async function updateMaintenanceMode(
  planId: number,
  updates: { enabled: boolean; weeks: number[]; insightId: number }
) {
  const result = await db
    .update(monthlyPlans)
    .set({
      maintenanceModeEnabled: updates.enabled,
      maintenanceModeWeeks: updates.weeks,
      insightGeneratedFrom: updates.insightId,
    })
    .where(eq(monthlyPlans.id, planId))
    .returning();

  return result[0];
}

// ============================================
// INSIGHT ACTIONS QUERIES
// ============================================

export async function createInsightAction(
  action: {
    insightId: number;
    action: string;
    modifiedPlanId?: number;
    modifiedTaskIds?: number[];
  }
) {
  const result = await db
    .insert(insightActions)
    .values({
      ...action,
      outcome: "Pending",
      executedAt: new Date(),
    })
    .returning();

  return result[0];
}
```

---

## 8. Frontend Components

### 8.1 Web App - Insights Card

**File:** `apps/web/src/components/insights-card.tsx` (new file)

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Check, X, Clock } from "lucide-react";

export function InsightsCard() {
  const queryClient = useQueryClient();
  const { data: insights, isLoading } = useQuery(
    orpc.insights.getActiveInsights.queryOptions()
  );

  const respondMutation = useMutation({
    ...orpc.insights.respondToInsight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.insights.getActiveInsights.getQueryKey() });
    },
  });

  if (isLoading) return <div>Loading insights...</div>;
  if (!insights || insights.data.length === 0) return null;

  const activeInsights = insights.data;

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Pattern Insights
            </CardTitle>
            <CardDescription>
              {activeInsights.length} {activeInsights.length === 1 ? "suggestion" : "suggestions"} based on your patterns
            </CardDescription>
          </div>
          <Badge variant="secondary">{activeInsights.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeInsights.map((insight) => (
          <div key={insight.id} className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold">{insight.title}</h4>
              <Badge variant={
                insight.confidence >= 80 ? "default" :
                insight.confidence >= 60 ? "secondary" :
                "outline"
              }>
                {insight.confidence}% confidence
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {insight.description}
            </p>
            <div className="p-3 bg-background rounded-md border">
              <div className="text-sm font-medium mb-1">Suggested Action</div>
              <div className="text-sm">{insight.suggestedAction}</div>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex gap-2">
        {activeInsights.map((insight) => (
          <div key={insight.id} className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => respondMutation.mutate({
                insightId: insight.id,
                response: "Snoozed",
                snoozeDuration: "1week",
              })}
            >
              <Clock className="h-4 w-4 mr-1" />
              Remind Later
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => respondMutation.mutate({
                insightId: insight.id,
                response: "Dismissed",
              })}
            >
              <X className="h-4 w-4 mr-1" />
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => respondMutation.mutate({
                insightId: insight.id,
                response: "Accepted",
              })}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
          </div>
        ))}
      </CardFooter>
    </Card>
  );
}
```

### 8.2 Native App - Insights Banner

**File:** `apps/native/components/insights/insights-banner.tsx` (new file)

```tsx
import React from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/orpc";
import { useSemanticColors } from "@/utils/theme";

interface Insight {
  id: number;
  title: string;
  description: string;
  suggestedAction: string;
  confidence: number;
}

export function InsightsBanner() {
  const queryClient = useQueryClient();
  const { primary, background, text, muted, success, destructive } = useSemanticColors();

  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: () => client.insights.getActiveInsights.query(),
  });

  const respondMutation = useMutation({
    mutationFn: (variables: any) =>
      client.insights.respondToInsight.mutate(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });

  if (isLoading) {
    return (
      <View className="p-4 bg-amber-100 dark:bg-amber-900/20">
        <ActivityIndicator size="small" color={primary} />
      </View>
    );
  }

  if (!insights || insights.data.length === 0) return null;

  const activeInsights = insights.data as Insight[];

  const renderItem = ({ item }: { item: Insight }) => (
    <View className="mb-3 p-4 bg-background rounded-lg border border-amber-500/50">
      <View className="flex-row items-start justify-between mb-2">
        <Text className="flex-1 font-semibold text-base">{item.title}</Text>
        <View className={`ml-2 px-2 py-1 rounded ${
          item.confidence >= 80 ? "bg-green-100 dark:bg-green-900/30" :
          item.confidence >= 60 ? "bg-blue-100 dark:bg-blue-900/30" :
          "bg-gray-100 dark:bg-gray-800"
        }`}>
          <Text className="text-xs font-medium">{item.confidence}%</Text>
        </View>
      </View>

      <Text className="text-sm text-muted mb-3">{item.description}</Text>

      <View className="p-3 bg-muted/50 rounded-lg mb-3">
        <Text className="text-xs font-semibold uppercase text-muted mb-1">
          Suggested Action
        </Text>
        <Text className="text-sm">{item.suggestedAction}</Text>
      </View>

      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 py-2.5 px-4 rounded-lg bg-muted items-center justify-center"
          onPress={() => respondMutation.mutate({
            insightId: item.id,
            response: "Snoozed",
            snoozeDuration: "1week",
          })}
        >
          <Ionicons name="time-outline" size={18} color={text} />
          <Text className="ml-1 text-sm font-medium">Remind Later</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 py-2.5 px-4 rounded-lg border items-center justify-center"
          onPress={() => respondMutation.mutate({
            insightId: item.id,
            response: "Dismissed",
          })}
        >
          <Ionicons name="close-outline" size={18} color={text} />
          <Text className="ml-1 text-sm font-medium">Dismiss</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 py-2.5 px-4 rounded-lg bg-primary items-center justify-center"
          onPress={() => respondMutation.mutate({
            insightId: item.id,
            response: "Accepted",
          })}
        >
          <Ionicons name="checkmark-outline" size={18} color={background} />
          <Text className="ml-1 text-sm font-medium">Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="bg-amber-50 dark:bg-amber-900/10">
      <View className="px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="bulb" size={20} color="#f59e0b" />
          <Text className="ml-2 font-semibold text-base">
            {activeInsights.length} {activeInsights.length === 1 ? "Insight" : "Insights"}
          </Text>
        </View>
      </View>

      <FlashList
        data={activeInsights}
        renderItem={renderItem}
        estimatedItemSize={300}
        contentContainerClassName="px-4 pb-4"
      />
    </View>
  );
}
```

### 8.3 Dashboard Integration

**File:** `apps/web/src/routes/dashboard.tsx` (modify)

Add to dashboard:

```tsx
import { InsightsCard } from "@/components/insights-card";

// In dashboard component, after stats cards:
<div className="col-span-1 lg:col-span-2">
  <InsightsCard />
</div>
```

**File:** `apps/native/components/tasks/task-dashboard.tsx` (modify)

```tsx
import { InsightsBanner } from "@/components/insights/insights-banner";

// Add after header and before task list:
<InsightsBanner />
```

---

## 9. Automated Analysis Triggers

### 9.1 Weekly Quick Check

**File:** `packages/api/src/cron/weekly-analysis.ts` (new file)

```typescript
import * as db from "@monthly-zen/db";
import { generateRuleBasedInsights } from "../services/insight-generator";

export async function runWeeklyAnalysis(userId: string) {
  const currentMonth = new Date().toISOString().slice(0, 7); // "2025-01"

  // Check if insights already exist for this month
  const existing = await db.getInsightsForMonth(userId, currentMonth);
  if (existing && existing.length > 0) {
    return { analyzed: false, reason: "Already generated" };
  }

  // Generate rule-based insights (no AI to save tokens)
  const insights = await generateRuleBasedInsights(userId, currentMonth);

  if (insights.length === 0) {
    return { analyzed: false, reason: "No patterns detected" };
  }

  // Save insights
  await Promise.all(
    insights.map((insight) =>
      db.createHabitInsight({
        userId,
        ...insight,
        targetMonth: currentMonth,
      })
    )
  );

  return { analyzed: true, insightsGenerated: insights.length };
}
```

### 9.2 Monthly Deep Analysis

**File:** `packages/api/src/cron/monthly-analysis.ts` (new file)

```typescript
import * as db from "@monthly-zen/db";
import {
  generateRuleBasedInsights,
  generateAIInsights,
} from "../services/insight-generator";
import {
  getWeeklyCompletionPatterns,
  getDayOfWeekPatterns,
  getFocusAreaTrends,
  detectBurnoutRisk,
} from "@monthly-zen/db";

export async function runMonthlyAnalysis(userId: string) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Get all pattern data
  const [
    weeklyPatterns,
    dayOfWeekPatterns,
    focusAreaTrends,
    burnoutRisk,
  ] = await Promise.all([
    getWeeklyCompletionPatterns(userId, currentMonth),
    getDayOfWeekPatterns(userId, 3),
    getFocusAreaTrends(userId, 3),
    detectBurnoutRisk(userId, 3),
  ]);

  // Generate rule-based insights
  let insights = await generateRuleBasedInsights(userId, currentMonth);

  // Enhance with AI insights
  const aiInsights = await generateAIInsights(userId, {
    weeklyPatterns,
    dayOfWeekPatterns,
    focusAreaTrends,
    burnoutRisk,
  });

  // Merge, remove duplicates, limit to top 5
  insights = [...insights, ...aiInsights]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  // Save insights
  const saved = await Promise.all(
    insights.map((insight) =>
      db.createHabitInsight({
        userId,
        ...insight,
        targetMonth: currentMonth,
      })
    )
  );

  return { analyzed: true, insightsGenerated: saved.length };
}
```

---

## 10. Database Migration

**File:** `packages/db/drizzle/migrations/001_add_habit_insights.sql` (new file)

```sql
-- Create habit_insights table
CREATE TABLE IF NOT EXISTS habit_insights (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('PeakEnergy', 'CompletionRate', 'SessionDuration', 'Challenges', 'BurnoutRisk', 'RecoveryNeeded')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  suggested_action TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('MaintenanceMode', 'ScheduleRecovery', 'AdjustWorkload', 'FocusShift', 'HabitReinforcement')),
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  data_source TEXT NOT NULL CHECK (data_source IN ('RuleBased', 'AIGenerated', 'Hybrid')),
  user_response TEXT DEFAULT 'Pending' CHECK (user_response IN ('Pending', 'Accepted', 'Dismissed', 'Snoozed')),
  responded_at TIMESTAMP,
  snoozed_until TIMESTAMP,
  response_reason TEXT,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  target_month TEXT,
  target_week INTEGER
);

-- Create index for fast lookups
CREATE INDEX idx_habit_insights_user_id ON habit_insights(user_id);
CREATE INDEX idx_habit_insights_expires ON habit_insights(expires_at);
CREATE INDEX idx_habit_insights_month ON habit_insights(target_month);

-- Create insight_actions table
CREATE TABLE IF NOT EXISTS insight_actions (
  id SERIAL PRIMARY KEY,
  insight_id INTEGER NOT NULL REFERENCES habit_insights(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('MaintenanceModeScheduled', 'RecoveryWeekAdded', 'WorkloadReduced', 'FocusAreaChanged', 'NoAction')),
  modified_plan_id INTEGER,
  modified_task_ids INTEGER[],
  outcome TEXT DEFAULT 'Pending' CHECK (outcome IN ('Pending', 'Successful', 'PartiallySuccessful', 'Unsuccessful', 'Unknown')),
  outcome_note TEXT,
  executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add maintenance mode columns to monthly_plans
ALTER TABLE monthly_plans ADD COLUMN IF NOT EXISTS maintenance_mode_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE monthly_plans ADD COLUMN IF NOT EXISTS maintenance_mode_weeks INTEGER[];
ALTER TABLE monthly_plans ADD COLUMN IF NOT EXISTS insight_generated_from INTEGER REFERENCES habit_insights(id);
```

---

## 11. Implementation Order

### Phase 1: Database Foundation

1. Create habit-insights schema
2. Create insight-actions schema
3. Add maintenance mode columns to monthly-plans
4. Create migration file
5. Run migration with `bun run db:push`

### Phase 2: Pattern Detection

6. Implement weekly pattern queries
7. Implement day-of-week pattern queries
8. Implement focus area trend queries
9. Implement burnout risk detection
10. Implement recovery week recommendation

### Phase 3: Insight Generation

11. Create rule-based insight generator
12. Define pattern rules (Week 3 drop, best day, burnout, declining trends)
13. Implement AI insight generator
14. Test both generation methods

### Phase 4: API Layer

15. Create insights router
16. Implement getActiveInsights endpoint
17. Implement generateInsights endpoint
18. Implement respondToInsight endpoint
19. Implement scheduleMaintenanceMode endpoint
20. Register router in main index

### Phase 5: Database Queries

21. Create habit-insights query functions
22. Implement CRUD operations for insights
23. Implement response tracking
24. Implement maintenance mode updates

### Phase 6: Web Frontend

25. Create InsightsCard component
26. Add to dashboard
27. Add insights history page
28. Integrate insight response actions

### Phase 7: Native App

29. Create InsightsBanner component
30. Add to task dashboard
31. Implement insight response UI
32. Test responsive design

### Phase 8: Automation

33. Implement weekly analysis cron
34. Implement monthly analysis cron
35. Set up scheduled tasks (or use external cron service)
36. Test automatic insight generation

### Phase 9: Testing & Polish

37. End-to-end test insight generation
38. Test all response actions (Accept, Dismiss, Snooze)
39. Test maintenance mode integration
40. Performance testing with large datasets

### Phase 10: Launch

41. Roll out to subset of users (beta)
42. Monitor insight acceptance rates
43. Refine rules based on feedback
44. Full rollout

---

## 12. Edge Cases & Considerations

### 12.1 Insufficient Data

- **Scenario:** User has < 1 month of task data
- **Behavior:** Show "Build up your history" message instead of insights
- **Threshold:** Need at least 20 completed tasks across 2+ weeks

### 12.2 Stale Insights

- **Scenario:** Insight from 3 months ago still pending
- **Behavior:** Auto-dismiss insights after 90 days
- **Implementation:** `expiresAt` field with 90-day default

### 12.3 Duplicate Insights

- **Scenario:** Same insight generated in multiple months
- **Behavior:** Check for similar insights before creating new one
- **Deduplication:** Compare insight type + pattern data

### 12.4 User Ignores All Insights

- **Scenario:** User consistently dismisses insights
- **Behavior:** Reduce frequency of generation to monthly only
- **Feedback Loop:** Track dismissal rate, adjust accordingly

### 12.5 AI Token Limits

- **Scenario:** User exceeds quota during insight generation
- **Fallback:** Use rule-based insights only
- **User Notification:** "AI insights unavailable, showing rule-based suggestions"

### 12.6 Maintenance Mode Conflicts

- **Scenario:** User schedules maintenance mode on existing plan
- **Behavior:** Allow modification, mark weeks as reduced-intensity
- **Implementation:** Update plan with flag, don't regenerate

---

## 13. Success Metrics

- **Insight Acceptance Rate:** % of insights users accept (vs dismiss/snooze)
- **Insight Action Rate:** % of accepted insights that result in actual action
- **Insight Accuracy:** Track outcome of accepted insights (Successful vs Unsuccessful)
- **User Satisfaction:** Survey after accepting an insight
- **Pattern Detection Quality:** Compare predicted patterns vs actual month performance
- **Token Usage:** Monitor AI insight generation costs vs rule-based
- **Maintenance Mode Adoption:** How often users enable maintenance mode
- **Retention Impact:** Do insights improve month-over-month retention?

---

## 14. Future Enhancements

### 14.1 Machine Learning Model

- Train custom model on user task completion data
- Improve prediction accuracy over time
- Personalize insights per user

### 14.2 Social Comparison

- "Users with similar goals tend to schedule recovery weeks in..."
- Anonymous benchmarking (opt-in only)

### 14.3 Real-time Notifications

- Push notification when insight is generated
- In-app banner when significant pattern detected

### 14.4 Advanced AI Integration

- Multi-step conversations about insights
- Ask follow-up questions for deeper analysis

### 14.5 Visualization

- Charts showing patterns over time
- Trend graphs for focus areas
- Burnout risk dashboard

---

## Summary

This feature transforms Monthly Zen from a reactive planning tool to a proactive productivity coach. By analyzing patterns in user behavior and providing timely, actionable insights, users can:

1. **Anticipate challenges** before they become problems
2. **Maintain consistency** by recognizing their best days/weeks
3. **Avoid burnout** through predictive recovery suggestions
4. **Continuously improve** by learning from their own data

The hybrid approach (rules + AI) balances cost-effectiveness with personalization, providing value even without heavy AI usage.
