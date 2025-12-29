# Critique: Predictive Habit Coaching Plan

Generated as an assessment of `docs/predictive-habit-coaching-plan.md`

---

## Executive Summary

The plan is comprehensive and well-structured with a solid hybrid approach (rules + AI). However, there are several critical implementation issues, schema problems, and logic gaps that need addressing before implementation can begin.

**Overall Assessment:** The architecture is sound, but critical bugs would cause:

- Performance issues (N+1 queries)
- Broken logic (recovery weeks never find patterns)
- Incomplete features (maintenance mode not implemented)
- Runtime errors (missing type safety)

---

## Critical Issues (Must Fix)

### 1. **Schema Import/Export Mismatch** 🔴

**Location:** Lines 95-122

```typescript
// insight-actions.ts
import { habitInsights } from "./habit-insights";  // ✗ Importing file, not symbol
```

**Problem:** The import references the file path, not the exported symbol. The schema file exports `habitInsights` (the table definition), but this import won't work.

**Current (Broken):**

```typescript
import { habitInsights } from "./habit-insights";
```

**Should Be:**

```typescript
import { habitInsights } from "../schema/habit-insights";
```

**Also missing:** The schema needs to export from `packages/db/src/schema/index.ts`:

```typescript
export * from "./habit-insights";
export * from "./insight-actions";
```

---

### 2. **N+1 Query Problem in Pattern Detection** 🔴

**Location:** Lines 265-299 (Section 3, `getWeeklyCompletionPatterns`)

```typescript
// For each week, this runs a SEPARATE query
const patterns = await Promise.all(
  rows.map(async (row: any) => {
    const breakdown = await db.execute(sql`
      SELECT pt.focus_area as "focusArea", ...
      FROM plan_tasks pt
      ...
      GROUP BY pt.focus_area
    `);
    // Process breakdown...
  })
);
```

**Impact:**

- For a 4-week month: 5 queries (1 main + 4 breakdowns)
- For 3 months of data: 13+ queries per user
- As user base grows, this will become a major performance bottleneck

**Fix:** Use a single aggregated query:

```typescript
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
        FLOOR((EXTRACT(DAY FROM pt.start_time) - 1) / 7) + 1 as week_number
      FROM plan_tasks pt
      JOIN monthly_plans mp ON pt.plan_id = mp.id
      WHERE mp.user_id = ${userId}
        AND pt.start_time >= ${startDate}
        AND pt.end_time <= ${endDate}
    )
    SELECT
      week_number as "weekNumber",
      focus_area as "focusArea",
      COUNT(*) as "totalTasks",
      COUNT(CASE WHEN is_completed = true THEN 1 END) as "completedTasks"
    FROM dated_tasks
    GROUP BY week_number, focus_area
    ORDER BY week_number
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows || [];

  // Aggregate focus areas by week in memory
  const weekMap = new Map<number, WeeklyPattern>();

  for (const row of rows) {
    const weekNum = Number(row.weekNumber);
    const focusArea = row.focusArea;
    const total = Number(row.totalTasks);
    const completed = Number(row.completedTasks);

    if (!weekMap.has(weekNum)) {
      weekMap.set(weekNum, {
        weekNumber: weekNum,
        totalTasks: 0,
        completedTasks: 0,
        focusAreaBreakdown: {},
      });
    }

    const pattern = weekMap.get(weekNum)!;
    pattern.totalTasks += total;
    pattern.completedTasks += completed;
    pattern.focusAreaBreakdown[focusArea] = {
      total,
      completed,
    };
  }

  // Calculate completion rates
  for (const [_, pattern] of weekMap) {
    pattern.completionRate = pattern.totalTasks > 0
      ? Math.round((pattern.completedTasks / pattern.totalTasks) * 100)
      : 0;
  }

  return Array.from(weekMap.values()).sort((a, b) => a.weekNumber - b.weekNumber);
}
```

---

### 3. **Duplicate Pattern Data Fetching** 🔴

**Location:** Lines 691-703 (Section 4) and Lines 891-913 (Section 6.1)

**First fetch in `generateRuleBasedInsights`:**

```typescript
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
```

**Then AGAIN in `generateInsights` mutation (lines 891-902):**

```typescript
if (input.useAI) {
  const [
    weeklyPatterns,        // ✗ Duplicate fetch!
    dayOfWeekPatterns,     // ✗ Duplicate fetch!
    focusAreaTrends,       // ✗ Duplicate fetch!
    burnoutRisk,           // ✗ Duplicate fetch!
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
  // ...
}
```

**Problem:** All pattern data is fetched twice when `useAI: true`.

**Fix:** Return pattern data from `generateRuleBasedInsights`:

```typescript
// In insight-generator.ts
export async function generateRuleBasedInsights(
  userId: string,
  targetMonth: string
): Promise<{
  insights: InsightCandidate[];
  patternData: {
    weeklyPatterns: any[];
    dayOfWeekPatterns: any[];
    focusAreaTrends: any[];
    burnoutRisk: any;
  };
}> {
  // ... existing code ...

  return {
    insights: sortedInsights,
    patternData: {
      weeklyPatterns,
      dayOfWeekPatterns,
      focusAreaTrends,
      burnoutRisk,
    },
  };
}
```

Then in the mutation:

```typescript
const { insights, patternData } = await generateRuleBasedInsights(userId, input.month);

if (input.useAI) {
  const aiInsights = await generateAIInsights(userId, patternData);
  insights = [...insights, ...aiInsights].slice(0, 5);
}
```

---

### 4. **Broken Recovery Week Logic** 🔴

**Location:** Lines 507-527 (Section 3, `recommendRecoveryWeeks`)

```typescript
export async function recommendRecoveryWeeks(
  userId: string,
  targetMonth: string
): Promise<number[]> {
  const patterns = await getWeeklyCompletionPatterns(userId, targetMonth);

  // Identify weeks with LOW completion
  const lowPerformanceWeeks = patterns
    .filter((p) => p.completionRate < 60)
    .map((p) => p.weekNumber);

  // Count occurrences across... what?
  const weekCounts = lowPerformanceWeeks.reduce((acc, week) => {
    acc[week] = (acc[week] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // "Pattern appears at least twice" - but we're only looking at ONE month!
  const recommendedWeeks = Object.entries(weekCounts)
    .filter(([_, count]) => count >= 2)  // ✗ Will NEVER match for single month
    .map(([week]) => Number(week));

  return recommendedWeeks;
}
```

**Problem:**

- For a single target month, each week appears exactly once
- The `count >= 2` filter will always fail
- This function will **always return an empty array**

**Fix Option A:** Check historical data for consistent patterns

```typescript
export async function recommendRecoveryWeeks(
  userId: string,
  targetMonth: string
): Promise<number[]> {
  const [year, month] = targetMonth.split("-").map(Number);

  // Check last 3 months for consistent low weeks
  const lowWeeks: Record<number, number> = {};

  for (let i = 0; i < 3; i++) {
    const checkMonth = new Date(year, month - 1 - i, 1);
    const monthStr = `${checkMonth.getFullYear()}-${String(checkMonth.getMonth() + 1).padStart(2, "0")}`;

    const patterns = await getWeeklyCompletionPatterns(userId, monthStr);
    patterns
      .filter((p) => p.completionRate < 60)
      .forEach((p) => {
        lowWeeks[p.weekNumber] = (lowWeeks[p.weekNumber] || 0) + 1;
      });
  }

  // Recommend weeks that are low in at least 2 of 3 months
  return Object.entries(lowWeeks)
    .filter(([_, count]) => count >= 2)
    .map(([week]) => Number(week))
    .sort((a, b) => a - b);
}
```

**Fix Option B:** Use simple threshold for current month

```typescript
export async function recommendRecoveryWeeks(
  userId: string,
  targetMonth: string
): Promise<number[]> {
  const patterns = await getWeeklyCompletionPatterns(userId, targetMonth);

  // Recommend weeks with very low completion (< 50%)
  const lowWeeks = patterns
    .filter((p) => p.completionRate < 50)
    .map((p) => p.weekNumber);

  return lowWeeks.sort((a, b) => a - b);
}
```

---

### 5. **Missing Type Safety** 🔴

**Location:** Lines 1036-1060 (Section 7, `createHabitInsight`)

```typescript
export async function createHabitInsight(
  userId: string,
  insight: any  // ✗ No type
) {
  const result = await db
    .insert(habitInsights)
    .values({
      userId,
      insightType: insight.insightType,  // ✗ 'any' - no validation
      title: insight.title,
      description: insight.description,
      patternData: insight.patternData,
      suggestedAction: insight.suggestedAction,
      actionType: insight.actionType,
      confidence: insight.confidence,
      dataSource: insight.dataSource,
      targetMonth: insight.targetMonth,
      targetWeek: insight.targetWeek,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    })
    .returning();

  return result[0];
}
```

**Fix:** Define proper types

```typescript
export interface InsightCandidate {
  insightType: string;
  title: string;
  description: string;
  patternData: Record<string, any>;
  suggestedAction: string;
  actionType: string;
  confidence: number;
  dataSource: "RuleBased" | "AIGenerated" | "Hybrid";
  targetMonth?: string;
  targetWeek?: number;
}

export async function createHabitInsight(
  userId: string,
  insight: InsightCandidate
) {
  // TypeScript will now validate all required fields
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
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    })
    .returning();

  return result[0];
}
```

---

### 6. **Maintenance Mode Incomplete Implementation** 🔴

**Problem:** The plan adds columns to `monthly_plans` for maintenance mode but:

1. **No logic exists** for how maintenance mode affects plan generation
2. **No endpoint** to create a maintenance mode plan (only to flag existing plans)
3. **No AI integration** to generate a reduced-intensity plan
4. **No task filtering** to show only essential tasks during maintenance

**Missing Function - `generateMaintenanceModePlan`:**

```typescript
// In hybrid-plan-generation.ts
export async function generateMaintenanceModePlan(
  userId: string,
  targetMonth: string,
  maintenanceWeeks: number[]
): Promise<GeneratePlanResult> {
  // 1. Get user's existing preferences
  const preferences = await getLatestGoalPreference(userId);

  // 2. Build special maintenance mode prompt
  const prompt = buildMaintenanceModePrompt({
    ...preferences,
    maintenanceWeeks,
    instruction: "This is a MAINTENANCE WEEK - reduced workload with focus on essential tasks only.",
  });

  // 3. Generate plan with reduced task count
  const result = await generatePlanFromPrompt(userId, prompt, targetMonth);

  return result;
}

function buildMaintenanceModePrompt(input: GeneratePlanInput & { maintenanceWeeks: number[] }): string {
  return `
MAINTENANCE MODE PLAN for ${formatMonthYear(input.targetMonth)}

MAINTENANCE WEEKS: ${input.maintenanceWeeks.join(", ")}

SPECIAL INSTRUCTIONS:
- REDUCE total tasks by 50% compared to normal
- Only include ESSENTIAL tasks (high priority, recurring habits)
- Remove ambitious/stretch goals
- Add buffer time for rest and recovery
- Schedule lighter days during maintenance weeks

USER PREFERENCES:
- Task Complexity: Minimal (Simplified)
- Focus Areas: ${input.focusAreas}
- Weekend Preference: Rest-focused
- Fixed Commitments: ${formatFixedCommitments(input.fixedCommitmentsJson)}

GOALS (simplified for maintenance):
${input.goalsText}

Generate a reduced-intensity plan for the maintenance weeks.
  `.trim();
}
```

---

## Medium Issues (Should Fix)

### 7. **Untyped `any` Throughout Pattern Queries** 🟡

**Location:** Throughout Section 3

```typescript
const rows = Array.isArray(result) ? result : (result as any).rows || [];

rows.map((row: any) => ({
  weekNumber: Number(row.weekNumber),
  // ...
}));
```

**Fix:** Define proper return types

```typescript
export interface WeeklyPattern {
  weekNumber: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  focusAreaBreakdown: Record<string, { total: number; completed: number }>;
}

export interface DayOfWeekPattern {
  dayOfWeek: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgTasksPerDay: number;
}
```

---

### 8. **Native App Render Issue** 🟡

**Location:** Lines 1368-1426 (Section 8.2)

The design shows all insights in a list, but:

- The system generates max 5 insights
- Users with many insights could have overwhelming lists
- Mobile screen space is limited

**Recommendations:**

1. **Show only top 1-2 insights in banner**
2. **Add "View All Insights" link to dedicated page**
3. **Use horizontal scrolling** for multiple insights

```tsx
// Better approach - show only top insight
const topInsight = activeInsights[0];

if (!topInsight) return null;

return (
  <View className="bg-amber-50 p-4">
    <View className="flex-row items-center mb-2">
      <Ionicons name="bulb" size={20} color="#f59e0b" />
      <Text className="ml-2 font-semibold">Pattern Insight</Text>
    </View>
    <InsightCard insight={topInsight} onRespond={handleRespond} />
    {activeInsights.length > 1 && (
      <TouchableOpacity onPress={() => navigate("/insights")}>
        <Text className="mt-2 text-sm text-amber-600">
          +{activeInsights.length - 1} more insights
        </Text>
      </TouchableOpacity>
    )}
  </View>
);
```

---

### 9. **Missing Scheduling Infrastructure** 🟡

**Section 9** mentions "cron" but no implementation exists.

**Options for implementation:**

1. **External cron service** (e.g., EasyCron, Cronhooks)

   ```bash
   # Example: Call endpoint weekly
   curl https://api.monthlyzen.com/cron/weekly-analysis
   ```

2. **In-app scheduler** (simple approach)

   ```typescript
   // In server startup
   setInterval(() => {
     runWeeklyAnalysisForAllUsers();
   }, 7 * 24 * 60 * 60 * 1000); // Every 7 days
   ```

3. **Cloud scheduler** (Vercel Cron, Railway Cron)
   ```json
   // vercel.json
   {
     "crons": [
       {
         "path": "/api/cron/weekly",
         "schedule": "0 0 * * 0" // Every Sunday at midnight
       }
     ]
   }
   ```

**Recommendation:** Use cloud scheduler for production, in-app for development.

---

### 10. **No Data Sufficiency Check** 🟡

**Section 12.1** mentions showing "Build up your history" but no implementation.

**Missing Function:**

```typescript
export async function hasSufficientData(userId: string): Promise<{
  sufficient: boolean;
  completedTasks: number;
  weeksActive: number;
}> {
  // Check last 3 months
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  const result = await db.execute(sql`
    SELECT
      COUNT(*) as total_tasks,
      COUNT(DISTINCT DATE_TRUNC('week', start_time)) as weeks_active,
      COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_tasks
    FROM plan_tasks pt
    JOIN monthly_plans mp ON pt.plan_id = mp.id
    WHERE mp.user_id = ${userId}
      AND pt.start_time >= ${startDate}
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows || [];
  const stats = rows[0];

  return {
    sufficient: stats.completed_tasks >= 20 && stats.weeks_active >= 2,
    completedTasks: Number(stats.completed_tasks),
    weeksActive: Number(stats.weeks_active),
  };
}
```

---

### 11. **No Deduplication Logic** 🟡

**Section 12.3** mentions checking for duplicates but no implementation.

**Missing Function:**

```typescript
export async function findSimilarInsight(
  userId: string,
  insightType: string,
  patternData: Record<string, any>
): Promise<number | null> {
  // Check for similar insight in last 2 months
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 2);

  const result = await db
    .select({ id: habitInsights.id, patternData: habitInsights.patternData })
    .from(habitInsights)
    .where(
      and(
        eq(habitInsights.userId, userId),
        eq(habitInsights.insightType, insightType),
        gte(habitInsights.generatedAt, startDate),
        eq(habitInsights.userResponse, "Pending")
      )
    );

  // Simple check: same target week
  for (const row of result) {
    if (row.patternData?.targetWeek === patternData?.targetWeek) {
      return row.id;
    }
  }

  return null;
}
```

---

## Minor Issues

### 12. **Inconsistent Confidence Interpretation** 🟢

**Problem:** Different rules use different confidence numbers without clear meaning.

**Solution:** Document confidence bands

```typescript
/**
 * Confidence Levels:
 * - 80-100: High confidence - clear, consistent pattern detected
 * - 60-79: Medium confidence - notable trend, worth considering
 * - 40-59: Low confidence - suggestive, may need more data
 * - 0-39: Very low - speculative, use sparingly
 */
```

---

### 13. **Missing Index on insight_actions** 🟢

**Migration** creates `insight_actions` table but no indexes.

**Add to migration:**

```sql
CREATE INDEX idx_insight_actions_insight_id ON insight_actions(insight_id);
CREATE INDEX idx_insight_actions_outcome ON insight_actions(outcome);
```

---

### 14. **Web Card UI Has Redundant Buttons** 🟢

**Location:** Lines 1274-1312

Current code creates nested buttons:

```tsx
// WRONG - creates duplicate buttons for each insight
<CardFooter className="flex gap-2">
  {activeInsights.map((insight) => (
    <div key={insight.id} className="flex gap-2">
      <Button>Accept</Button>...
    </div>
  ))}
</CardFooter>
```

**Fix:**

```tsx
// CORRECT - single set of actions
<CardFooter className="flex gap-2">
  <Button onClick={() => acceptAllInsights(activeInsights.map(i => i.id))}>
    Accept All
  </Button>
  <Button onClick={() => dismissAll(activeInsights.map(i => i.id))}>
    Dismiss All
  </Button>
</CardFooter>
```

Or, handle each insight's actions inline within CardContent, not in footer.

---

### 15. **Week Number Calculation Bug** 🟢

**Location:** Lines 241-242

```sql
DATE_PART('week', pt.start_time) - DATE_PART('week', DATE_TRUNC('month', pt.start_time)) + 1 as week_number
```

**Problem:** Week calculation across month boundaries is tricky with week numbers.

**Better approach:**

```sql
FLOOR((EXTRACT(DAY FROM pt.start_time) - 1) / 7) + 1 as week_of_month
```

This gives:

- Days 1-7 = Week 1
- Days 8-14 = Week 2
- Days 15-21 = Week 3
- Days 22-28 = Week 4
- Days 29-31 = Week 5

Simpler and more predictable.

---

### 16. **Missing Export of New Query Functions** 🟢

**Section 3** creates `pattern-detection.ts` but doesn't export from `packages/db/src/queries/index.ts`.

**Add:**

```typescript
// In packages/db/src/queries/index.ts
export * from "./pattern-detection";
export * from "./habit-insights";
```

---

## Missing Components Summary

| Component                                  | Status         | Priority |
| ------------------------------------------ | -------------- | -------- |
| `hasSufficientData()` check function       | **Missing**    | High     |
| `generateMaintenanceModePlan()` function   | **Missing**    | High     |
| Deduplication logic (`findSimilarInsight`) | **Missing**    | Medium   |
| Scheduling/cron infrastructure             | **Missing**    | Medium   |
| Maintenance mode in buildPrompt            | **Missing**    | High     |
| Proper type definitions for insights       | **Incomplete** | High     |
| Indexes on insight_actions                 | **Missing**    | Low      |
| Export pattern-detection from queries      | **Missing**    | Low      |

---

## Recommendations Summary

### High Priority (Must Fix Before Implementation)

1. **Fix N+1 query** in `getWeeklyCompletionPatterns` - use single aggregated query
2. **Fix recommendRecoveryWeeks logic** - check historical data or change threshold
3. **Add type safety** - define `InsertInsight`, `InsightCandidate` interfaces
4. **Fix duplicate data fetching** - return pattern data from `generateRuleBasedInsights`
5. **Implement maintenance mode** - add generation logic and AI integration
6. **Add data sufficiency check** - implement `hasSufficientData()`

### Medium Priority (Should Fix During Implementation)

7. **Add proper indexes** to migration
8. **Implement deduplication** - add `findSimilarInsight()` function
9. **Fix web card UI** - handle buttons correctly
10. **Add cron/scheduler** - decide on approach, implement
11. **Define confidence thresholds** - document what confidence means

### Low Priority (Nice to Have)

12. **Fix week number calculation** - use day-of-month formula
13. **Export pattern-detection** from queries index
14. **Review Native UI** - consider single-insight display

---

## Strengths of the Plan

1. **Good hybrid approach** - Rules for cost, AI for nuance
2. **Comprehensive pattern detection** - Weekly, daily, focus area, burnout
3. **Clear user actions** - Accept, Dismiss, Snooze with tracking
4. **Good edge case coverage** - Stale insights, duplicates, AI fallback
5. **Solid success metrics** - Measurable outcomes defined

---

## Conclusion

The plan is fundamentally sound and well-architected. Once the critical bugs are fixed:

1. **N+1 query → single aggregated query**
2. **Recovery week logic → check historical data**
3. **Duplicate fetching → return pattern data from generator**
4. **Type safety → proper TypeScript interfaces**
5. **Maintenance mode → implement full generation flow**

The feature will be ready for implementation. The hybrid approach (rules + AI) provides excellent value while managing costs, and the comprehensive pattern detection covers meaningful productivity insights.

**Ready for implementation after:** All 6 high-priority fixes are applied.
