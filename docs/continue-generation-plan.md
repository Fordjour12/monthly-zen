# Continue Generation Feature Plan

Allows users to continue plan generation from the previous month, using their progress, unfinished tasks, and goals status as context for the new monthly plan.

---

## 1. Database Schema Changes

### 1.1 Add Columns to `monthly_plans` Table

**File:** `packages/db/src/schema/monthly-plans.ts`

```typescript
// Add these columns to monthlyPlans table
parentPlanId: integer("parent_plan_id").references(() => monthlyPlans.id),
continuationType: continuationTypeEnum("continuation_type").default("NEW_PLAN"),
completionRate: integer("completion_rate"), // 0-100
unfinishedTasksCount: integer("unfinished_tasks_count"),
goalsAchievedJson: jsonb("goals_achieved_json"), // { goal: string, achieved: boolean }[]
isAbandoned: boolean("is_abandoned").default(false),
abandonedReason: text("abandoned_reason"), // User-provided reason for abandoning task

// Note: Abandoned tasks are kept in DB for analytics/audit trail
// They will not appear in continuation context for future plans
```

### 1.2 Add Continuation Type Enum

**File:** `packages/db/src/schema/enums.ts`

```typescript
export const continuationTypeEnum = pgEnum("continuation_type", [
  "NEW_PLAN",
  "CONTINUED_FROM_PREVIOUS",
]);
```

### 1.3 Add Query Functions

**File:** `packages/db/src/queries/monthly-plans.ts`

```typescript
// Get the most recent confirmed plan for context (IMMEDIATE PREVIOUS MONTH ONLY)
// Only looks at the immediately preceding month, not multiple months back
export async function getLatestConfirmedPlan(userId: string) {
  return await db.query.monthlyPlans.findFirst({
    where: and(
      eq(monthlyPlans.userId, userId),
      eq(monthlyPlans.status, "CONFIRMED")
    ),
    orderBy: [desc(monthlyPlans.monthYear)],
  });
}

// Get previous month plan with completion metrics
export async function getPreviousMonthPlanWithContext(userId: string, currentMonthYear: string) {
  const previousMonth = subMonths(new Date(currentMonthYear), 1);
  return await db.query.monthlyPlans.findFirst({
    where: and(
      eq(monthlyPlans.userId, userId),
      eq(monthlyPlans.status, "CONFIRMED"),
      // Add date comparison for previous month
    ),
    orderBy: [desc(monthlyPlans.monthYear)],
  });
}

// Get previous month tasks with completion status
export async function getPreviousMonthTasks(userId: string, planId: number) {
  return await db.query.planTasks.findMany({
    where: eq(planTasks.planId, planId),
    orderBy: [desc(planTasks.isCompleted), asc(planTasks.startTime)],
  });
}

// Calculate completion metrics for a plan
export async function calculatePlanCompletionMetrics(planId: number) {
  const tasks = await getPreviousMonthTasks(userId, planId);
  const total = tasks.length;
  const completed = tasks.filter(t => t.isCompleted).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    totalTasks: total,
    completedTasks: completed,
    completionRate: rate,
    unfinishedTasks: tasks.filter(t => !t.isCompleted),
  };
}
```

---

## 2. API Layer Changes

### 2.1 Update Plan Router Schema

**File:** `packages/api/src/routers/plan.ts`

```typescript
const generateInputSchema = z.object({
  // Existing fields...
  continueFromPreviousMonth: z.boolean().optional().default(false),
  previousPlanId: z.number().optional(),
  carryForwardUnfinishedTasks: z.boolean().optional().default(true),
  abandonSpecificTasks: z.array(z.number()).optional(), // Task IDs to abandon
  continuationEmphasis: z.enum(["high", "medium", "low"]).optional().default("medium"),
});

const continueGeneration.object({
  previousPlanId: zInputSchema = z.number(),
  carryForwardTasks: z.array(z.number()), // Task IDs to carry forward
  abandonTasks: z.array(z.number()), // Task IDs to abandon
  newMonthYear: z.string(),
  // Existing generation input fields...
});
```

### 2.2 Add New Endpoints

**File:** `packages/api/src/routers/plan.ts`

```typescript
// Get previous month context for user review
getPreviousMonthContext: protectedProcedure
  .input(z.object({ monthYear: z.string() }))
  .query(async ({ ctx, input }) => {
    const previousPlan = await getPreviousMonthPlanWithContext(ctx.session.user.id, input.monthYear);
    if (!previousPlan) return null;

    const metrics = await calculatePlanCompletionMetrics(previousPlan.id);
    const goalsStatus = previousPlan.goalsAchievedJson || [];

    return {
      planId: previousPlan.id,
      monthYear: previousPlan.monthYear,
      completionRate: metrics.completionRate,
      totalTasks: metrics.totalTasks,
      completedTasks: metrics.completedTasks,
      unfinishedTasks: metrics.unfinishedTasks.map(t => ({
        id: t.id,
        description: t.taskDescription,
        focusArea: t.focusArea,
        priority: t.schedulingReason, // Extract priority from scheduling_reason
        originalWeek: getWeekFromDate(t.startTime),
      })),
      goalsStatus,
      monthlySummary: previousPlan.monthlySummary,
    };
  }),

// Confirm continuation settings and generate
continueGeneration: protectedProcedure
  .input(continueGenerationInputSchema)
  .mutation(async ({ ctx, input }) => {
    // Mark abandoned tasks
    for (const taskId of input.abandonTasks) {
      await ctx.db.update(planTasks)
        .set({ isAbandoned: true })
        .where(eq(planTasks.id, taskId));
    }

    // Call generatePlan with continuation context
    return await generatePlan({
      userId: ctx.session.user.id,
      // ... existing fields
      previousPlanId: input.previousPlanId,
      carryForwardTaskIds: input.carryForwardTasks,
      continuationEmphasis: input.continuationEmphasis,
    });
  }),
```

---

## 3. Service Layer Changes

### 3.1 Update GeneratePlan Input Interface

**File:** `packages/api/src/services/hybrid-plan-generation.ts`

```typescript
export interface GeneratePlanInput {
  // Existing fields...
  previousPlanId?: number;
  carryForwardTaskIds?: number[]; // Specific tasks to include
  continuationEmphasis?: "high" | "medium" | "low";
}

export interface PreviousPlanContext {
  summary: string;
  completionRate: number;
  goalsStatus: { goal: string; achieved: boolean }[];
  unfinishedTasks: {
    id: number;
    description: string;
    focusArea: string;
    priority: string;
    originalWeek: number;
  }[];
  completedTasksSummary: string; // Summarized by focus area
}
```

### 3.2 Add Context Retrieval Function

**File:** `packages/api/src/services/hybrid-plan-generation.ts`

```typescript
async function getPreviousPlanContext(
  db: any,
  userId: string,
  previousPlanId: number,
  carryForwardTaskIds?: number[]
): Promise<PreviousPlanContext | null> {
  const previousPlan = await db.query.monthlyPlans.findFirst({
    where: and(
      eq(monthlyPlans.id, previousPlanId),
      eq(monthlyPlans.userId, userId)
    ),
  });

  if (!previousPlan) return null;

  const tasks = await db.query.planTasks.findMany({
    where: eq(planTasks.planId, previousPlanId),
  });

  const completed = tasks.filter(t => t.isCompleted);
  const unfinished = carryForwardTaskIds
    ? tasks.filter(t => carryForwardTaskIds.includes(t.id) && !t.isCompleted)
    : tasks.filter(t => !t.isCompleted);

  // Summarize completed tasks by focus area
  const completedByFocus = completed.reduce((acc, task) => {
    const area = task.focusArea || "Other";
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const completedTasksSummary = Object.entries(completedByFocus)
    .map(([area, count]) => `${area}: ${count} tasks`)
    .join(", ");

  return {
    summary: previousPlan.monthlySummary || "No summary available",
    completionRate: previousPlan.completionRate || 0,
    goalsStatus: (previousPlan.goalsAchievedJson as any[]) || [],
    unfinishedTasks: unfinished.map(t => ({
      id: t.id,
      description: t.taskDescription,
      focusArea: t.focusArea || "General",
      priority: extractPriority(t.schedulingReason),
      originalWeek: getWeekNumber(new Date(t.startTime)),
    })),
    completedTasksSummary,
  };
}

function extractPriority(reason: string): string {
  // Extract priority indicator from scheduling_reason
  if (reason.toLowerCase().includes("high")) return "HIGH";
  if (reason.toLowerCase().includes("medium")) return "MEDIUM";
  return "LOW";
}

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
}
```

### 3.3 Update BuildPrompt for Continuation

**File:** `packages/api/src/services/hybrid-plan-generation.ts`

```typescript
function buildPrompt(
  input: GeneratePlanInput,
  monthYear: string,
  previousContext?: PreviousPlanContext
): string {
  let prompt = `Generate a monthly plan for ${formatMonthYear(monthYear)}.

USER PREFERENCES:
- Task Complexity: ${input.taskComplexity}
- Focus Areas: ${input.focusAreas}
- Weekend Preference: ${input.weekendPreference}
- Fixed Commitments: ${formatFixedCommitments(input.fixedCommitmentsJson)}

GOALS:
${input.goalsText}`;

  if (previousContext) {
    const emphasisMultiplier = {
      high: "HEAVY",
      medium: "MODERATE",
      low: "MINIMAL",
    }[input.continuationEmphasis || "medium"];

    prompt += `

═══════════════════════════════════════════
PREVIOUS MONTH CONTEXT (Use ${emphasisMultiplier} emphasis)
═══════════════════════════════════════════

📊 PREVIOUS MONTH COMPLETION: ${previousContext.completionRate}%

📋 COMPLETED TASKS SUMMARY:
${previousContext.completedTasksSummary || "No completed tasks data"}

🎯 GOALS STATUS FROM PREVIOUS MONTH:
${previousContext.goalsStatus.map(g =>
  `${g.achieved ? "✅" : "❌"} ${g.goal}`
).join("\n")}

📌 UNFINISHED TASKS TO CONSIDER (${previousContext.unfinishedTasks.length}):
${previousContext.unfinishedTasks.map(t =>
  `[${t.priority}] ${t.description} (was Week ${t.originalWeek}, ${t.focusArea})`
).join("\n")}

═══════════════════════════════════════════
CONTINUATION INSTRUCTIONS
═══════════════════════════════════════════

For the NEW monthly plan, you must:

1. REVIEW UNFINISHED TASKS above and decide:
   - ✅ RE-SCHEDULE: Tasks still relevant, adapt for new month
   - ⏸️ DEFER: Tasks to push to later weeks (not this month)
   - ❌ DROP: Tasks no longer relevant (do NOT include)

2. For RE-SCHEDULED tasks:
   - Do NOT copy exact dates from previous month
   - Re-calculate based on new month calendar
   - Adjust timing if the task scope has changed

3. For goals that were NOT ACHIEVED:
   - Consider why they failed (time? complexity? priority?)
   - Propose adjusted approach or timeline
   - Break into smaller milestones if needed

4. For goals that WERE ACHIEVED:
   - Optionally add maintenance/ongoing tasks
   - Or move to new goals for this month

5. PRIORITIZATION:
   - HIGH priority: Must be scheduled in first 2 weeks
   - MEDIUM priority: Can be scheduled in weeks 2-3
   - LOW priority: Schedule if time permits

OUTPUT FORMAT:
Provide the same StructuredAIResponse format as before.
Add field "continuationNotes" summarizing:
- Which unfinished tasks were carried forward
- Which were dropped and why
- How goals were adjusted based on previous month

${emphasisMultiplier === "HEAVY" ? "IMPORTANT: Give significant weight to previous month context. The plan should feel like a natural continuation." : ""}
${emphasisMultiplier === "MINIMAL" ? "IMPORTANT: Previous context is just background info. Focus primarily on new month goals." : ""}`;
  }

  return prompt;
}
```

### 3.4 Update GeneratePlan Main Function

**File:** `packages/api/src/services/hybrid-plan-generation.ts`

```typescript
export async function generatePlan(input: GeneratePlanInput) {
  // Existing quota check...

  const monthYear = getNextMonthYear(input.currentMonthYear);

  // Get previous plan context if continuing
  let previousContext: PreviousPlanContext | null = null;
  if (input.continueFromPreviousMonth && input.previousPlanId) {
    previousContext = await getPreviousPlanContext(
      db,
      input.userId,
      input.previousPlanId,
      input.carryForwardTaskIds
    );
  }

  const prompt = buildPrompt(input, monthYear, previousContext);
  // ... existing AI call and response parsing

  // Store parent plan reference in draft
  const draft = await createPlanDraft({
    userId: input.userId,
    monthYear,
    aiPrompt: prompt,
    // ... other fields
    parentPlanId: input.previousPlanId,
    continuationType: previousContext ? "CONTINUED_FROM_PREVIOUS" : "NEW_PLAN",
  });

  return { draftKey: draft.draftKey, isContinuation: !!previousContext };
}
```

---

## 4. Frontend Changes

### 4.1 Web App - Add Continuation Selection Screen

**File:** `apps/web/src/routes/generate-plan.tsx` (new or existing)

**UX Flow:**

1. User clicks "Generate Plan" for a new month
2. Check if previous month plan exists (API call)
3. **If no previous plan:** Skip continuation screen, go directly to fresh start
4. **If previous plan exists:** Show continuation selection screen
5. User makes per-generation choice (continue or fresh start)

```tsx
function ContinueFromPreviousMonth() {
  const { data: previousContext } = orpc.plan.getPreviousMonthContext.useQuery({
    monthYear: selectedMonthYear,
  });

  // HIDE continuation option if no previous plan exists (cleaner onboarding)
  if (!previousContext) {
    return null; // or redirect to fresh start flow
  }

  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [abandonedTasks, setAbandonedTasks] = useState<number[]>([]);

  return (
    <div className="space-y-6">
      {/* Completion Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Continue Your Progress</CardTitle>
          <CardDescription>
            Based on your {formatMonth(previousContext.monthYear)} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {previousContext.completionRate}%
              </div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {previousContext.completedTasks}
              </div>
              <div className="text-sm text-muted-foreground">Tasks Done</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">
                {previousContext.unfinishedTasks.length}
              </div>
              <div className="text-sm text-muted-foreground">Unfinished</div>
            </div>
          </div>

          {/* Goals Status */}
          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Goals Progress</h4>
            {previousContext.goalsStatus.map((goal, i) => (
              <div key={i} className="flex items-center gap-2">
                <span>{goal.achieved ? "✅" : "❌"}</span>
                <span>{goal.goal}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unfinished Tasks Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Unfinished Tasks</CardTitle>
          <CardDescription>
            Select tasks to carry forward to this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {previousContext.unfinishedTasks.map(task => (
              <div
                key={task.id}
                className={`p-3 rounded-lg border ${
                  abandonedTasks.includes(task.id)
                    ? "bg-muted opacity-50"
                    : selectedTasks.includes(task.id)
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedTasks.includes(task.id) && !abandonedTasks.includes(task.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTasks([...selectedTasks, task.id]);
                        setAbandonedTasks(abandonedTasks.filter(id => id !== task.id));
                      } else {
                        setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                        setAbandonedTasks([...abandonedTasks, task.id]);
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{task.description}</span>
                      <Badge variant={getPriorityVariant(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {task.focusArea} • Was Week {task.originalWeek}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setSelectedTasks(previousContext.unfinishedTasks.map(t => t.id))}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTasks([]);
                setAbandonedTasks(previousContext.unfinishedTasks.map(t => t.id));
              }}
            >
              Abandon All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Continuation Emphasis */}
      <Card>
        <CardHeader>
          <CardTitle>How much to continue?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={emphasis} onValueChange={setEmphasis}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="high" id="high" />
              <Label htmlFor="high">
                <strong>Heavy continuation</strong> - Strong emphasis on unfinished tasks
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium">
                <strong>Moderate balance</strong> - Blend of continuation and new focus
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="low" id="low" />
              <Label htmlFor="low">
                <strong>Light continuation</strong> - Previous context as background only
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => setStep("fresh-start")}
          className="flex-1"
        >
          Skip - Fresh Start
        </Button>
        <Button
          onClick={() => generateWithContinuation()}
          disabled={isGenerating}
          className="flex-1"
        >
          {isGenerating ? "Generating..." : "Continue →"}
        </Button>
      </div>
    </div>
  );
}
```

### 4.2 Native App - Continuation Modal

**File:** `apps/native/components/plan/continue-generation-modal.tsx` (new)

**UX Flow:**

1. User taps "Generate Plan" for a new month
2. Check for previous month plan
3. **If no previous plan:** Skip modal, proceed to fresh start
4. **If previous plan exists:** Show modal for per-generation choice

```tsx
export function ContinueGenerationModal({ visible, onClose, onConfirm }: Props) {
  const { data: previousContext, isLoading } = usePreviousMonthContext(monthYear);

  if (isLoading) return <LoadingSpinner />;

  // HIDE modal if no previous plan exists
  if (!previousContext) {
    onFreshStart(); // Auto-proceed to fresh start
    return null;
  }

  return (
    <Modal visible={visible} presentationStyle="pageSheet">
      <View style={styles.container}>
        <Text style={styles.title}>Continue Your Progress</Text>
        <Text style={styles.subtitle}>
          Based on your {formatMonth(previousContext.monthYear)} plan
        </Text>

        {/* Completion Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{previousContext.completionRate}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{previousContext.completedTasks}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{previousContext.unfinishedTasks.length}</Text>
            <Text style={styles.statLabel}>Unfinished</Text>
          </View>
        </View>

        {/* Unfinished Tasks List */}
        <FlatList
          data={previousContext.unfinishedTasks}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.taskItem,
                selectedTasks.includes(item.id) && styles.taskItemSelected,
              ]}
              onPress={() => toggleTask(item.id)}
            >
              <Checkbox checked={selectedTasks.includes(item.id)} />
              <View style={styles.taskContent}>
                <Text style={styles.taskDescription}>{item.description}</Text>
                <View style={styles.taskMeta}>
                  <Badge>{item.focusArea}</Badge>
                  <Badge variant={getPriorityVariant(item.priority)}>
                    {item.priority}
                  </Badge>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button title="Select All" onPress={selectAll} variant="outline" />
          <Button title="Abandon All" onPress={abandonAll} variant="outline" />
        </View>

        {/* Continuation Emphasis */}
        <Picker
          selectedValue={emphasis}
          onValueChange={setEmphasis}
          style={styles.picker}
        >
          <Picker.Item label="Heavy Continuation" value="high" />
          <Picker.Item label="Moderate Balance" value="medium" />
          <Picker.Item label="Light Continuation" value="low" />
        </Picker>

        {/* Actions */}
        <View style={styles.actions}>
          <Button title="Fresh Start" onPress={onFreshStart} variant="outline" />
          <Button title="Continue" onPress={onConfirm} />
        </View>
      </View>
    </Modal>
  );
}
```

### 4.3 Add Hook for Previous Month Context

**File:** `apps/web/src/hooks/usePreviousMonthContext.ts`

```typescript
export function usePreviousMonthContext(monthYear: string) {
  return useQuery({
    ...orpc.plan.getPreviousMonthContext,
    input: { monthYear },
    enabled: !!monthYear,
  });
}
```

**File:** `apps/native/hooks/usePlanData.ts` (extend existing)

```typescript
export function usePreviousMonthContext(monthYear: string) {
  const query = useQuery({
    queryKey: ["previousMonthContext", monthYear],
    queryFn: () => client.plan.getPreviousMonthContext.query({ monthYear }),
    enabled: !!monthYear,
  });

  return {
    ...query,
    unfinishedTasks: query.data?.unfinishedTasks || [],
    selectedTasks: query.data?.unfinishedTasks.map(t => t.id) || [],
  };
}
```

---

## 5. Token Optimization Strategy

### 5.1 Summary Compression Rules

**Target: 800-1200 tokens for previous context**

```typescript
function compressPreviousContext(context: PreviousPlanContext): string {
  // 1. Goals: Max 10 items, simple format
  const goalsSummary = context.goalsStatus
    .slice(0, 10)
    .map(g => `${g.achieved ? "✅" : "❌"} ${g.goal}`)
    .join("\n");

  // 2. Unfinished Tasks: Max 10 items, one line each
  const unfinishedSummary = context.unfinishedTasks
    .slice(0, 10)
    .map(t => `[${t.priority}] ${t.description}`)
    .join("\n");

  // 3. Completed: Grouped summary, no details
  const completedSummary = context.completedTasksSummary || "None";

  return `PREVIOUS MONTH:
Completion: ${context.completionRate}%
Goals (${context.goalsStatus.length}):
${goalsSummary}
Unfinished (${Math.min(context.unfinishedTasks.length, 10)}):
${unfinishedSummary}
Completed: ${completedSummary}`;
}
```

### 5.2 Token Budget Allocation

| Section          | Max Tokens | Purpose             |
| ---------------- | ---------- | ------------------- |
| User Preferences | 200        | Fixed user settings |
| Goals            | 300        | New month goals     |
| Previous Context | 800-1200   | Historical data     |
| Instructions     | 400        | AI guidance         |
| Response Format  | 200        | Output structure    |
| **Total**        | **~2200**  | Plus AI response    |

---

## 6. Implementation Order

### Phase 1: Database & Backend Foundation

1. Add schema columns and enums
2. Add query functions for previous plan data
3. Implement context retrieval service function

### Phase 2: API Layer

4. Update generate input schema
5. Add getPreviousMonthContext endpoint
6. Add continueGeneration mutation

### Phase 3: AI Prompt Integration

7. Update buildPrompt with continuation section
8. Add continuation notes to AI response format
9. Test prompt generation with context

### Phase 4: Web Frontend

10. Add continuation selection screen
11. Integrate with generate plan flow
12. Add previous context hook

### Phase 5: Native App

13. Add continue generation modal
14. Hook up to existing plan generation flow

### Phase 6: Polish & Edge Cases

15. Handle no-previous-plan case
16. Add abandoned task tracking
17. Optimize token usage based on testing

---

## 7. Edge Cases & Considerations

### 7.1 No Previous Plan Exists

- **Frontend:** Hide continuation option entirely (cleaner onboarding for new users)
- **Backend:** Return null for context query, proceed with fresh start
- **User Experience:** New users never see continuation UI, reducing cognitive load

### 7.2 User Skipped a Month

- **Behavior:** Only look at IMMEDIATE previous month
- **If no plan exists:** Hide continuation option, proceed with fresh start
- **Note:** No fallback to older plans - each month is self-contained

### 7.3 All Tasks Completed

- **UI:** Show "Great job!" message, emphasize new goals
- **AI Prompt:** Reduce continuation emphasis, focus on new challenges

### 7.4 High Unfinished Task Count (>20)

- **Auto-grouping:** Group by focus area, show counts instead of all tasks
- **AI Prompt:** Summarize as "X tasks in Y focus areas, see details below"

### 7.5 Abandoned Task Tracking

- **Storage:** Store as "abandoned" with user-provided reason, keep in DB
- **Purpose:** Analytics/audit trail to understand user behavior over time
- **UI:** Show abandoned count in plan analytics
- **AI:** Never suggest abandoned tasks in continuation context
- **History:** Users can view which tasks they abandoned and why

### 7.6 Token Limit Handling

- **Fallback:** If context > 1500 tokens, truncate unfinished tasks
- **Priority:** Keep high-priority unfinished tasks, drop low-priority
- **Message:** Add note "X tasks truncated for context limit"

---

## 9. Key Design Decisions

The following decisions were made during planning:

| Question                | Decision                                         | Rationale                                  |
| ----------------------- | ------------------------------------------------ | ------------------------------------------ |
| Abandoned tasks         | **Option A** - Store with reason, keep in DB     | Analytics/audit trail for user insights    |
| How far back            | **Option A** - Immediate previous month only     | Simpler implementation, clear boundaries   |
| No previous plan        | **Option A** - Hide continuation option entirely | Cleaner onboarding for new users           |
| Continuation preference | **Option A** - Per-generation choice each time   | Users consciously choose, more intentional |

### 9.1 Abandoned Task Storage

Abandoned tasks are preserved in the database with:

- `isAbandoned: true` flag
- `abandonedReason: text` for user-provided explanation
- These tasks never appear in continuation context
- Available for historical review in analytics

### 9.2 Per-Generation Choice Model

Users make a fresh choice each month:

- Continuation is NOT remembered as a preference
- No persistent "always continue" setting
- Each plan generation is an independent decision
- Reduces accidental carry-forward of unwanted patterns

---

## 10. Success Metrics

- **Adoption Rate:** % of users who use continuation feature
- **Completion Rate Improvement:** Compare completion rates between continued vs fresh plans
- **User Satisfaction:** Survey after using continuation
- **Token Usage:** Monitor API costs with new context
- **Task Carry-forward:** Track how often carried-forward tasks get completed
