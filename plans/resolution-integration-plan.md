# New Year Resolutions Integration Plan (Updated)

## Overview

Integrate structured New Year resolutions into the plan generation system. Currently, user goals are stored as plain text and not tracked. This plan adds first-class resolution entities linked to plans and tasks, along with customizable application preferences for a personalized experience.

## Current State

- User enters 3 goals in onboarding → stored as plain `goalsText` in `userGoalsAndPreferences`
- AI receives goals as context when generating plans
- No tracking of goal-to-task mapping or resolution achievement
- Weekly goals exist in `aiResponseRaw` but aren't linked to user intentions
- No user-customizable preferences for AI coach behavior

## Proposed Architecture

| Entity               | Purpose                          | Storage                           |
| -------------------- | -------------------------------- | --------------------------------- |
| **Resolutions**      | User's monthly/yearly intentions | New `monthly_resolutions` table   |
| **Weekly Goals**     | AI-generated sub-goals per week  | Already in `aiResponseRaw`        |
| **Coaching Goals**   | Long-term objectives             | Existing `coachingGoals` table    |
| **User Preferences** | Customizable app settings        | Updated `userGoalsAndPreferences` |

**Key Changes from Original Plan:**

1. Removed `relatedTaskIds` from resolution table (links via `planTasks.resolutionIds`)
2. Made `progressPercent` computed on-demand, not stored
3. Added `resolutionIds` column to `planTasks` for linking
4. Added `resolutionType` field (monthly | yearly)
5. Added `archivedAt` for soft-delete
6. Added resolution categories as enum/constant
7. Added full CRUD endpoints
8. Added customizable user preferences (coach tone, name, working hours, focus area)

---

## Application Preferences (User Settings)

These preferences are stored in `userGoalsAndPreferences` and influence plan generation and AI coaching:

| Preference        | Field          | Options                                                    | Purpose                                                  |
| ----------------- | -------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| **Focus Area**    | `focusArea`    | health, career, learning, personal, finance, relationships | Alias for resolution category; default AI prompt context |
| **AI Coach Tone** | `coachTone`    | encouraging, direct, analytical, friendly                  | Controls AI response style in coaching interactions      |
| **Coach Name**    | `coachName`    | string (e.g., "Alex", "Coach Zen")                         | Personalized AI coach identity                           |
| **Working Hours** | `workingHours` | { start: "09:00", end: "17:00" }                           | Default scheduling constraints                           |

### AI Coach Tone Options

| Tone          | Description                                                  | Use Case                                           |
| ------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| `encouraging` | Empathetic, celebrates progress, uses positive reinforcement | New Year resolutions, building habits              |
| `direct`      | Concise, action-focused, minimal fluff                       | Users who want efficiency, experienced users       |
| `analytical`  | Data-driven, metrics-focused, structured                     | Users tracking detailed progress, data enthusiasts |
| `friendly`    | Casual, conversational, informal                             | Users preferring a buddy over a coach              |

### Suggested Preferences for New Year Resolutions

| Setting       | Recommended Value         | Rationale                                 |
| ------------- | ------------------------- | ----------------------------------------- |
| Coach Tone    | `encouraging`             | New Year = high motivation, needs support |
| Coach Name    | `Coach`                   | Neutral, professional                     |
| Focus Area    | First resolution category | Aligns with user's primary goal           |
| Working Hours | User's actual hours       | Prevents scheduling conflicts             |

---

## Implementation Steps

### Phase 1: Database Schema

**Create `packages/db/src/constants/resolution-categories.ts`:**

```typescript
export const RESOLUTION_CATEGORIES = [
  { key: "health", label: "Health & Fitness", icon: "heart" },
  { key: "career", label: "Career & Work", icon: "briefcase" },
  { key: "learning", label: "Learning & Growth", icon: "book" },
  { key: "finance", label: "Finance", icon: "cash" },
  { key: "relationships", label: "Relationships", icon: "people" },
  { key: "personal", label: "Personal Development", icon: "person" },
  { key: "productivity", label: "Productivity", icon: "checkmark-circle" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal" },
] as const;

export type ResolutionCategory = typeof RESOLUTION_CATEGORIES[number]["key"];
```

**Create `packages/db/src/schema/monthly-resolutions.ts`:**

```typescript
export const resolutionTypeEnum = pgEnum("resolution_type", [
  "monthly",
  "yearly",
]);

export const monthlyResolutions = pgTable("monthly_resolutions", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),

  // Resolution content
  text: text("text").notNull(),
  category: varchar("category", { length: 50 }),
  resolutionType: resolutionTypeEnum("resolution_type").default("monthly").notNull(),
  priority: integer("priority").default(2), // 1=high, 2=medium, 3=low

  // Timeline
  startDate: timestamp("start_date").notNull().defaultNow(),
  targetDate: timestamp("target_date"),
  isRecurring: boolean("is_recurring").default(false),
  recurringInterval: varchar("recurring_interval", { length: 20 }),

  // Tracking
  isAchieved: boolean("is_achieved").default(false),
  achievedAt: timestamp("achieved_at"),
  archivedAt: timestamp("archived_at"), // Soft delete

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const resolutionsRelations = relations(monthlyResolutions, ({ one }) => ({
  user: one(user, {
    fields: [monthlyResolutions.userId],
    references: [user.id],
  }),
}));
```

**Update `packages/db/src/schema/plan-tasks.ts`:**

```typescript
export const planTasks = pgTable("plan_tasks", {
  // ...existing fields
  resolutionIds: jsonb("resolution_ids").$type<number[]>().default([]), // Link to resolutions
});
```

**Update `packages/db/src/schema/user-goals-and-preferences.ts`:**

```typescript
export const COACH_TONES = ["encouraging", "direct", "analytical", "friendly"] as const;
export type CoachTone = typeof COACH_TONES[number];

export const userGoalsAndPreferences = pgTable("user_goals_and_preferences", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => user.id).notNull(),

  // Existing fields
  goalsText: text("goals_text"),
  taskComplexity: text("task_complexity"),
  focusAreas: text("focus_areas"),
  weekendPreference: text("weekend_preference"),
  fixedCommitmentsJson: jsonb("fixed_commitments_json"),
  inputSavedAt: timestamp("input_saved_at"),

  // NEW: Application Preferences
  coachName: varchar("coach_name", { length: 50 }).default("Coach"),
  coachTone: varchar("coach_tone", { length: 20 })
    .$type<CoachTone>()
    .default("encouraging"),
  workingHoursStart: time("working_hours_start").default("09:00"),
  workingHoursEnd: time("working_hours_end").default("17:00"),
  defaultFocusArea: varchar("default_focus_area", { length: 50 }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

**Update `packages/db/src/schema/index.ts`:**

```typescript
export * from "./monthly-resolutions";
export * from "./resolution-categories";
export * from "./user-goals-and-preferences";
```

---

### Phase 2: TypeScript Types

**Update `packages/types/src/index.ts`:**

```typescript
export type ResolutionCategory =
  | "health"
  | "career"
  | "learning"
  | "finance"
  | "relationships"
  | "personal"
  | "productivity"
  | "other";

export type ResolutionType = "monthly" | "yearly";

export type CoachTone = "encouraging" | "direct" | "analytical" | "friendly";

export interface Resolution {
  id: string;
  userId: string;
  text: string;
  category: ResolutionCategory;
  resolutionType: ResolutionType;
  priority: 1 | 2 | 3;
  startDate: string;
  targetDate?: string;
  isRecurring: boolean;
  recurringInterval?: "monthly" | "weekly";
  isAchieved: boolean;
  achievedAt?: string;
  archivedAt?: string;
  progressPercent: number;
  linkedTaskCount: number;
  completedTaskCount: number;
}

export interface ResolutionWithProgress extends Resolution {
  tasks: {
    id: number;
    description: string;
    isCompleted: boolean;
    weekOf: string;
  }[];
}

export interface UserPreferences {
  coachName: string;
  coachTone: CoachTone;
  workingHoursStart: string;
  workingHoursEnd: string;
  defaultFocusArea?: string;
}

export interface StructuredAIResponse {
  monthly_summary: string;
  weekly_breakdown: WeeklyBreakdown[];
  resolutions_context: {
    addressed: string[];
    progress_indicators: string[];
  };
}
```

---

### Phase 3: Database Queries

**Create `packages/db/src/queries/monthly-resolutions.ts`:**

```typescript
import { db } from "../index";
import { eq, desc, and, isNull, gte, lte } from "drizzle-orm";
import { monthlyResolutions, planTasks } from "../schema";

export interface CreateResolutionInput {
  userId: string;
  text: string;
  category?: string;
  resolutionType?: "monthly" | "yearly";
  priority?: number;
  targetDate?: Date;
  isRecurring?: boolean;
  recurringInterval?: "monthly" | "weekly";
}

export async function createResolution(input: CreateResolutionInput) {
  const [resolution] = await db
    .insert(monthlyResolutions)
    .values({
      userId: input.userId,
      text: input.text,
      category: input.category || "other",
      resolutionType: input.resolutionType || "monthly",
      priority: input.priority || 2,
      targetDate: input.targetDate,
      isRecurring: input.isRecurring || false,
      recurringInterval: input.recurringInterval,
    })
    .returning();

  return resolution;
}

export async function getResolutionsByUser(userId: string, includeArchived = false) {
  const condition = eq(monthlyResolutions.userId, userId);

  const resolutions = await db
    .select()
    .from(monthlyResolutions)
    .where(and(condition, includeArchived ? undefined : isNull(monthlyResolutions.archivedAt)))
    .orderBy(desc(monthlyResolutions.createdAt));

  return resolutions;
}

export async function getResolutionById(id: number) {
  const [resolution] = await db
    .select()
    .from(monthlyResolutions)
    .where(eq(monthlyResolutions.id, id));

  return resolution;
}

export async function getYearlyResolutions(userId: string, year: number) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  const resolutions = await db
    .select()
    .from(monthlyResolutions)
    .where(
      and(
        eq(monthlyResolutions.userId, userId),
        eq(monthlyResolutions.resolutionType, "yearly"),
        gte(monthlyResolutions.startDate, startOfYear),
        lte(monthlyResolutions.startDate, endOfYear),
        isNull(monthlyResolutions.archivedAt),
      )
    )
    .orderBy(monthlyResolutions.priority);

  return resolutions;
}

export async function calculateResolutionProgress(resolutionId: number): Promise<number> {
  const [result] = await db
    .select({ total: db.fn.count<number>(planTasks.id) })
    .from(planTasks)
    .where(
      and(
        db.sql`${planTasks.resolutionIds} @> ${JSON.stringify([resolutionId])}`,
      )
    );

  const total = Number(result?.total) || 0;

  if (total === 0) return 0;

  const [completedResult] = await db
    .select({ completed: db.fn.count<number>(planTasks.id) })
    .from(planTasks)
    .where(
      and(
        db.sql`${planTasks.resolutionIds} @> ${JSON.stringify([resolutionId])}`,
        eq(planTasks.isCompleted, true),
      )
    );

  const completed = Number(completedResult?.completed) || 0;
  return Math.round((completed / total) * 100);
}

export async function updateResolution(
  id: number,
  input: Partial<CreateResolutionInput> & { isAchieved?: boolean }
) {
  const updateData: Record<string, unknown> = { ...input, updatedAt: new Date() };

  if (input.isAchieved) {
    updateData.achievedAt = new Date();
  }

  const [resolution] = await db
    .update(monthlyResolutions)
    .set(updateData)
    .where(eq(monthlyResolutions.id, id))
    .returning();

  return resolution;
}

export async function archiveResolution(id: number) {
  const [resolution] = await db
    .update(monthlyResolutions)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(monthlyResolutions.id, id))
    .returning();

  return resolution;
}

export async function deleteResolution(id: number) {
  await db
    .delete(monthlyResolutions)
    .where(eq(monthlyResolutions.id, id));
}

export async function linkTaskToResolution(taskId: number, resolutionId: number) {
  const [task] = await db
    .select({ resolutionIds: planTasks.resolutionIds })
    .from(planTasks)
    .where(eq(planTasks.id, taskId));

  const currentIds = task?.resolutionIds || [];
  if (!currentIds.includes(resolutionId)) {
    const newIds = [...currentIds, resolutionId];

    await db
      .update(planTasks)
      .set({ resolutionIds: newIds })
      .where(eq(planTasks.id, taskId));
  }
}

export async function unlinkTaskFromResolution(taskId: number, resolutionId: number) {
  const [task] = await db
    .select({ resolutionIds: planTasks.resolutionIds })
    .from(planTasks)
    .where(eq(planTasks.id, taskId));

  const currentIds = task?.resolutionIds || [];
  const newIds = currentIds.filter((id) => id !== resolutionId);

  await db
    .update(planTasks)
    .set({ resolutionIds: newIds })
    .where(eq(planTasks.id, taskId));
}

export async function getResolutionsWithTasks(userId: string) {
  const resolutions = await getResolutionsByUser(userId);

  const resolutionsWithTasks = await Promise.all(
    resolutions.map(async (resolution) => {
      const progress = await calculateResolutionProgress(resolution.id);

      const tasks = await db
        .select({
          id: planTasks.id,
          description: planTasks.taskDescription,
          isCompleted: planTasks.isCompleted,
          startTime: planTasks.startTime,
        })
        .from(planTasks)
        .where(
          and(
            db.sql`${planTasks.resolutionIds} @> ${JSON.stringify([resolution.id])}`,
          )
        );

      return {
        ...resolution,
        progressPercent: progress,
        linkedTaskCount: tasks.length,
        completedTaskCount: tasks.filter((t) => t.isCompleted).length,
        tasks,
      };
    })
  );

  return resolutionsWithTasks;
}
```

**Create `packages/db/src/queries/user-preferences.ts`:**

```typescript
import { db } from "../index";
import { eq } from "drizzle-orm";
import { userGoalsAndPreferences } from "../schema";

export async function getUserPreferences(userId: string) {
  const [preferences] = await db
    .select()
    .from(userGoalsAndPreferences)
    .where(eq(userGoalsAndPreferences.userId, userId));

  return preferences;
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<{
    coachName: string;
    coachTone: string;
    workingHoursStart: string;
    workingHoursEnd: string;
    defaultFocusArea: string;
  }>
) {
  const [preferences] = await db
    .update(userGoalsAndPreferences)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(userGoalsAndPreferences.userId, userId))
    .returning();

  return preferences;
}

export async function createOrUpdatePreferences(
  userId: string,
  data: Partial<{
    coachName: string;
    coachTone: string;
    workingHoursStart: string;
    workingHoursEnd: string;
    defaultFocusArea: string;
    goalsText: string;
    taskComplexity: string;
    focusAreas: string;
    weekendPreference: string;
    fixedCommitmentsJson: unknown;
  }>
) {
  const existing = await getUserPreferences(userId);

  if (existing) {
    return updateUserPreferences(userId, data);
  }

  const [preferences] = await db
    .insert(userGoalsAndPreferences)
    .values({
      userId,
      ...data,
    })
    .returning();

  return preferences;
}
```

---

### Phase 4: API Layer

**Create `packages/api/src/routers/resolutions.ts`:**

```typescript
import { z } from "zod";
import { protectedProcedure } from "../index";
import * as db from "@monthly-zen/db";

const createResolutionSchema = z.object({
  text: z.string().min(1).max(500),
  category: z.enum([
    "health", "career", "learning", "finance",
    "relationships", "personal", "productivity", "other"
  ]).default("other"),
  resolutionType: z.enum(["monthly", "yearly"]).default("monthly"),
  priority: z.number().min(1).max(3).default(2),
  targetDate: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(["monthly", "weekly"]).optional(),
});

const updateResolutionSchema = z.object({
  id: z.number(),
  text: z.string().min(1).max(500).optional(),
  category: z.enum([
    "health", "career", "learning", "finance",
    "relationships", "personal", "productivity", "other"
  ]).optional(),
  priority: z.number().min(1).max(3).optional(),
  isAchieved: z.boolean().optional(),
  targetDate: z.string().optional(),
});

export const resolutionsRouter = {
  create: protectedProcedure
    .input(createResolutionSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const resolution = await db.createResolution({
        userId,
        ...input,
        targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
      });

      return { success: true, data: resolution };
    }),

  createBatch: protectedProcedure
    .input(z.object({
      resolutions: z.array(createResolutionSchema),
    }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const resolutions = await Promise.all(
        input.resolutions.map((res) =>
          db.createResolution({
            userId,
            ...res,
            targetDate: res.targetDate ? new Date(res.targetDate) : undefined,
          })
        )
      );

      return {
        success: true,
        data: resolutions.map((r) => ({ id: r.id, text: r.text }))
      };
    }),

  getAll: protectedProcedure
    .input(z.object({
      includeArchived: z.boolean().default(false),
      resolutionType: z.enum(["monthly", "yearly"]).optional(),
    }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      let resolutions = await db.getResolutionsByUser(
        userId,
        input.includeArchived
      );

      if (input.resolutionType) {
        resolutions = resolutions.filter(
          (r) => r.resolutionType === input.resolutionType
        );
      }

      const resolutionsWithProgress = await Promise.all(
        resolutions.map(async (r) => ({
          ...r,
          progressPercent: await db.calculateResolutionProgress(r.id),
        }))
      );

      return { success: true, data: resolutionsWithProgress };
    }),

  getYearly: protectedProcedure
    .input(z.object({ year: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const resolutions = await db.getYearlyResolutions(userId, input.year);

      const withProgress = await Promise.all(
        resolutions.map(async (r) => ({
          ...r,
          progressPercent: await db.calculateResolutionProgress(r.id),
        }))
      );

      return { success: true, data: withProgress };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const resolution = await db.getResolutionById(input.id);
      if (!resolution || resolution.userId !== userId) {
        throw new Error("Resolution not found");
      }

      const progress = await db.calculateResolutionProgress(resolution.id);
      const tasks = await db.getResolutionsWithTasks(userId);

      return {
        success: true,
        data: { ...resolution, progressPercent: progress, tasks }
      };
    }),

  update: protectedProcedure
    .input(updateResolutionSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const existing = await db.getResolutionById(input.id);
      if (!existing || existing.userId !== userId) {
        throw new Error("Resolution not found");
      }

      const { id, ...updateData } = input;
      const resolution = await db.updateResolution(id, updateData);

      return { success: true, data: resolution };
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const existing = await db.getResolutionById(input.id);
      if (!existing || existing.userId !== userId) {
        throw new Error("Resolution not found");
      }

      await db.archiveResolution(input.id);

      return { success: true, message: "Resolution archived" };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const existing = await db.getResolutionById(input.id);
      if (!existing || existing.userId !== userId) {
        throw new Error("Resolution not found");
      }

      await db.deleteResolution(input.id);

      return { success: true, message: "Resolution deleted" };
    }),

  linkTask: protectedProcedure
    .input(z.object({ resolutionId: z.number(), taskId: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const resolution = await db.getResolutionById(input.resolutionId);
      if (!resolution || resolution.userId !== userId) {
        throw new Error("Resolution not found");
      }

      await db.linkTaskToResolution(input.taskId, input.resolutionId);

      return { success: true, message: "Task linked to resolution" };
    }),

  unlinkTask: protectedProcedure
    .input(z.object({ resolutionId: z.number(), taskId: z.number() }))
    .handler(async ({ input }) => {
      await db.unlinkTaskFromResolution(input.taskId, input.resolutionId);

      return { success: true, message: "Task unlinked from resolution" };
    }),

  getYearlySummary: protectedProcedure
    .input(z.object({ year: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const resolutions = await db.getYearlyResolutions(userId, input.year);

      const total = resolutions.length;
      const achieved = resolutions.filter((r) => r.isAchieved).length;
      const inProgress = total - achieved;

      let totalProgress = 0;
      for (const r of resolutions) {
        totalProgress += await db.calculateResolutionProgress(r.id);
      }
      const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;

      return {
        success: true,
        data: {
          year: input.year,
          totalResolutions: total,
          completed: achieved,
          inProgress,
          completionRate: total > 0 ? Math.round((achieved / total) * 100) : 0,
          averageProgress: avgProgress,
        },
      };
    }),
};
```

**Create `packages/api/src/routers/preferences.ts`:**

```typescript
import { z } from "zod";
import { protectedProcedure } from "../index";
import * as db from "@monthly-zen/db";

const updatePreferencesSchema = z.object({
  coachName: z.string().min(1).max(50).optional(),
  coachTone: z.enum(["encouraging", "direct", "analytical", "friendly"]).optional(),
  workingHoursStart: z.string().optional(),
  workingHoursEnd: z.string().optional(),
  defaultFocusArea: z.string().optional(),
});

export const preferencesRouter = {
  get: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const preferences = await db.getUserPreferences(userId);
      return { success: true, data: preferences };
    }),

  update: protectedProcedure
    .input(updatePreferencesSchema)
    .handler(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const preferences = await db.createOrUpdatePreferences(userId, input);
      return { success: true, data: preferences };
    }),
};
```

**Update `packages/api/src/routers/index.ts`:**

```typescript
export const appRouter = {
  resolutions: resolutionsRouter,
  preferences: preferencesRouter,
};
```

---

### Phase 5: Plan Generation Integration

**Update `packages/api/src/services/hybrid-plan-generation.ts`:**

```typescript
// Add function to get resolutions and preferences for plan generation
async function getPlanGenerationContext(userId: string) {
  const [resolutions, preferences] = await Promise.all([
    db.getResolutionsByUser(userId),
    db.getUserPreferences(userId),
  ]);

  const activeResolutions = resolutions.filter(
    (r) => !r.isAchieved && !r.archivedAt
  );

  return {
    resolutions: activeResolutions.map((r) => ({
      id: r.id,
      text: r.text,
      category: r.category,
      type: r.resolutionType,
      priority: r.priority,
    })),
    preferences: {
      coachName: preferences?.coachName || "Coach",
      coachTone: preferences?.coachTone || "encouraging",
      workingHoursStart: preferences?.workingHoursStart || "09:00",
      workingHoursEnd: preferences?.workingHoursEnd || "17:00",
      defaultFocusArea: preferences?.defaultFocusArea,
    },
  };
}

export async function generatePlan(input: GeneratePlanInput) {
  const { userId } = input;

  const { resolutions, preferences } = await getPlanGenerationContext(userId);

  const prompt = buildPromptWithResolutionsAndPreferences(input, resolutions, preferences);

  const aiResponse = await openRouter.generatePlan(prompt);

  const parsedResponse = responseExtractor.extractAllStructuredData(aiResponse);

  const draftKey = generateDraftKey();
  const draft = await saveDraft(userId, draftKey, {
    ...parsedResponse,
    resolutionsContext: {
      addressed: resolutions.map((r) => r.text),
      progressIndicators: [],
    },
  });

  return {
    success: true,
    draftKey,
    planData: parsedResponse,
    preferenceId: 1,
    generatedAt: new Date(),
  };
}

function buildPromptWithResolutionsAndPreferences(
  input: GeneratePlanInput,
  resolutions: Resolution[],
  preferences: { coachName: string; coachTone: string; workingHoursStart: string; workingHoursEnd: string; defaultFocusArea?: string }
): string {
  let prompt = basePrompt(input);

  // Add coach identity
  prompt += `

You are ${preferences.coachName}, an AI coaching assistant. Your communication style is ${preferences.coachTone}.
`;

  // Add working hours constraint
  prompt += `
User's working hours: ${preferences.workingHoursStart} - ${preferences.workingHoursEnd}
Schedule non-work tasks outside these hours when possible.
`;

  // Add default focus area
  if (preferences.defaultFocusArea) {
    prompt += `
User's primary focus area: ${preferences.defaultFocusArea}
Prioritize tasks related to this area while addressing resolutions.
`;
  }

  // Add resolutions
  if (resolutions.length > 0) {
    prompt += `
User's Active Resolutions:
${resolutions.map((r) => `- ${r.text} (${r.category}, priority: ${r.priority})`).join('\n')}

For each resolution, generate tasks that directly contribute to achieving it.
Consider the resolution category when assigning focus areas.
Link tasks to resolutions by including resolution_id in the task metadata.
Prioritize tasks for higher-priority resolutions.

Resolution Progress Tracking:
- If a resolution has linked completed tasks, it should show progress
- Balance tasks across all active resolutions
- Don't overwhelm with too many tasks per resolution
`;
  }

  return prompt;
}
```

---

### Phase 6: Frontend Updates

**Update `apps/native/app/onboarding/goals.tsx`:**

```typescript
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Container } from "@/components/ui/container";
import { Ionicons } from "@expo/vector-icons";
import { RESOLUTION_CATEGORIES } from "@monthly-zen/db/constants/resolution-categories";

interface ResolutionInput {
  text: string;
  category: string;
  priority: number;
}

export default function GoalsScreen() {
  const router = useRouter();
  const isJanuary = new Date().getMonth() === 0;

  const [resolutions, setResolutions] = useState<ResolutionInput[]>([
    { text: "", category: "other", priority: 2 },
    { text: "", category: "other", priority: 2 },
    { text: "", category: "other", priority: 2 },
  ]);

  const [preferences, setPreferences] = useState({
    coachName: "Coach",
    coachTone: "encouraging" as const,
  });

  const isNextDisabled = !resolutions[0].text.trim();

  const handleNext = async () => {
    const validResolutions = resolutions.filter((r) => r.text.trim());

    // TODO: Save resolutions and preferences
    // await orpc.resolutions.createBatch({ resolutions: validResolutions });
    // await orpc.preferences.update(preferences);

    router.push("/onboarding/generating");
  };

  const updateResolution = (index: number, field: keyof ResolutionInput, value: string | number) => {
    const updated = [...resolutions];
    updated[index] = { ...updated[index], [field]: value };
    setResolutions(updated);

    // Auto-set default focus area to first category
    if (field === "category" && index === 0) {
      setPreferences((prev) => ({ ...prev, focusArea: value as string }));
    }
  };

  return (
    <Container>
      <ScrollView className="flex-1 px-6 pt-12 pb-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-8 w-10 h-10 items-center justify-center bg-muted/20 rounded-full"
        >
          <Ionicons name="chevron-back" size={24} color="#525252" />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-foreground mb-4">
          {isJanuary
            ? `What do you want to achieve in ${new Date().getFullYear()}?`
            : "What do you want to achieve?"}
        </Text>
        <Text className="text-lg text-muted-foreground mb-8">
          Set your intentions for this month (and year)
        </Text>

        <View className="gap-4 mb-8">
          {resolutions.map((resolution, index) => (
            <View key={index} className="bg-surface rounded-2xl border border-border p-4">
              <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Resolution {index + 1}
              </Text>

              <TextInput
                className="text-foreground text-lg mb-3"
                placeholder="e.g., Read 2 books this month"
                placeholderTextColor="#a3a3a3"
                multiline
                value={resolution.text}
                onChangeText={(text) => updateResolution(index, "text", text)}
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                {RESOLUTION_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => updateResolution(index, "category", cat.key)}
                    className={`mr-2 px-3 py-1.5 rounded-full ${
                      resolution.category === cat.key ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        resolution.category === cat.key ? "text-white" : "text-foreground"
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-muted-foreground mr-2">Priority:</Text>
                {[1, 2, 3].map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => updateResolution(index, "priority", p)}
                    className={`flex-1 py-1.5 rounded-lg items-center ${
                      resolution.priority === p ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        resolution.priority === p ? "text-white" : "text-foreground"
                      }`}
                    >
                      {p === 1 ? "High" : p === 2 ? "Medium" : "Low"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Coach Preferences Section */}
        <Text className="text-xl font-bold text-foreground mb-4">
          Customize Your Coach
        </Text>

        <View className="bg-surface rounded-2xl border border-border p-4 mb-4">
          <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Coach Name
          </Text>
          <TextInput
            className="text-foreground text-lg mb-4"
            value={preferences.coachName}
            onChangeText={(text) => setPreferences((p) => ({ ...p, coachName: text }))}
            placeholder="e.g., Alex, Coach Zen"
            placeholderTextColor="#a3a3a3"
          />

          <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Coach Tone
          </Text>
          <View className="flex-row gap-2 flex-wrap">
            {["encouraging", "direct", "analytical", "friendly"].map((tone) => (
              <TouchableOpacity
                key={tone}
                onPress={() => setPreferences((p) => ({ ...p, coachTone: tone as any }))}
                className={`px-4 py-2 rounded-full ${
                  preferences.coachTone === tone ? "bg-primary" : "bg-muted"
                }`}
              >
                <Text
                  className={`text-sm capitalize ${
                    preferences.coachTone === tone ? "text-white" : "text-foreground"
                  }`}
                >
                  {tone}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="px-6 pb-10">
        <TouchableOpacity
          onPress={handleNext}
          disabled={isNextDisabled}
          className={`h-16 rounded-2xl items-center justify-center ${
            isNextDisabled ? "bg-muted" : "bg-primary"
          }`}
        >
          <Text className="text-white text-xl font-bold">Generate My Plan</Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
}
```

**Create `apps/native/components/resolutions/resolution-card.tsx`:**

```typescript
import React from "react";
import { View, Text, TouchableOpacity, ProgressViewIOS, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ResolutionCardProps {
  resolution: {
    id: number;
    text: string;
    category: string;
    priority: number;
    progressPercent: number;
    isAchieved: boolean;
  };
  onPress?: () => void;
  onToggleComplete?: () => void;
}

export function ResolutionCard({ resolution, onPress, onToggleComplete }: ResolutionCardProps) {
  const categoryColors: Record<string, string> = {
    health: "#EF4444",
    career: "#3B82F6",
    learning: "#8B5CF6",
    finance: "#22C55E",
    relationships: "#EC4899",
    personal: "#F97316",
    productivity: "#06B6D4",
    other: "#6B7280",
  };

  const color = categoryColors[resolution.category] || categoryColors.other;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface rounded-2xl border border-border p-4 mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <Text className="text-xs uppercase tracking-wider text-muted-foreground">
              {resolution.category}
            </Text>
            {resolution.priority === 1 && (
              <Ionicons name="flag" size={12} color="#EF4444" />
            )}
          </View>
          <Text className="text-lg font-semibold text-foreground">
            {resolution.text}
          </Text>
        </View>

        {resolution.isAchieved && (
          <View className="bg-green-100 px-2 py-1 rounded-full">
            <Text className="text-xs text-green-700 font-medium">Achieved</Text>
          </View>
        )}
      </View>

      <View className="mb-2">
        <View className="flex-row justify-between mb-1">
          <Text className="text-xs text-muted-foreground">Progress</Text>
          <Text className="text-xs font-medium text-foreground">
            {resolution.progressPercent}%
          </Text>
        </View>
        <View className="h-2 bg-muted rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${resolution.progressPercent}%`,
              backgroundColor: resolution.isAchieved ? "#22C55E" : color,
            }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}
```

**Create `apps/native/hooks/useResolutions.ts`:**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

export function useResolutions(options?: { includeArchived?: boolean }) {
  return useQuery({
    queryKey: ["resolutions", options],
    queryFn: () => orpc.resolutions.getAll.query(options || {}),
  });
}

export function useYearlyResolutions(year: number) {
  return useQuery({
    queryKey: ["resolutions", "yearly", year],
    queryFn: () => orpc.resolutions.getYearly.query({ year }),
    enabled: !!year,
  });
}

export function useCreateResolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      text: string;
      category: string;
      resolutionType?: "monthly" | "yearly";
      priority?: number;
    }) => orpc.resolutions.create.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolutions"] });
    },
  });
}

export function useUpdateResolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id: number;
      text?: string;
      category?: string;
      priority?: number;
      isAchieved?: boolean;
    }) => orpc.resolutions.update.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolutions"] });
    },
  });
}

export function useArchiveResolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => orpc.resolutions.archive.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolutions"] });
    },
  });
}
```

**Create `apps/native/hooks/usePreferences.ts`:**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: () => orpc.preferences.query(),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      coachName?: string;
      coachTone?: "encouraging" | "direct" | "analytical" | "friendly";
      workingHoursStart?: string;
      workingHoursEnd?: string;
      defaultFocusArea?: string;
    }) => orpc.preferences.update.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
    },
  });
}
```

---

### Phase 7: New Year Specific Features

**Special handling in `goals.tsx`:**

```typescript
const isJanuary = new Date().getMonth() === 0;

return (
  <Text className="text-3xl font-bold text-foreground mb-4">
    {isJanuary
      ? `What do you want to achieve in ${new Date().getFullYear()}?`
      : "What do you want to achieve?"}
  </Text>
);
```

**Yearly summary in Home dashboard:**

```typescript
const yearlySummary = useQuery({
  queryKey: ["resolutions", "summary", currentYear],
  queryFn: () => orpc.resolutions.getYearlySummary.query({ year: currentYear }),
});

return (
  <View className="bg-primary/10 p-4 rounded-2xl mb-4">
    <Text className="text-lg font-bold text-primary mb-2">
      {currentYear} Resolutions
    </Text>
    <View className="flex-row justify-between">
      <View>
        <Text className="text-3xl font-bold">
          {yearlySummary.data?.data.completed || 0}
        </Text>
        <Text className="text-sm text-muted-foreground">Completed</Text>
      </View>
      <View>
        <Text className="text-3xl font-bold">
          {yearlySummary.data?.data.inProgress || 0}
        </Text>
        <Text className="text-sm text-muted-foreground">In Progress</Text>
      </View>
      <View>
        <Text className="text-3xl font-bold">
          {yearlySummary.data?.data.completionRate || 0}%
        </Text>
        <Text className="text-sm text-muted-foreground">Completion</Text>
      </View>
    </View>
  </View>
);
```

---

## Migration Script

**Create `scripts/migrate-goals-to-resolutions.ts`:**

```typescript
import { db } from "../packages/db/src/index";
import { userGoalsAndPreferences, monthlyResolutions } from "../packages/db/src/schema";

async function migrate() {
  console.log("Starting migration...");

  const users = await db
    .select()
    .from(userGoalsAndPreferences)
    .where(db.sql`${userGoalsAndPreferences.goalsText} IS NOT NULL`);

  let totalMigrated = 0;

  for (const user of users) {
    const goals = user.goalsText.split('\n').filter(Boolean);

    for (const goalText of goals) {
      await db.insert(monthlyResolutions).values({
        userId: user.userId,
        text: goalText,
        category: 'other',
        resolutionType: 'monthly',
        priority: 2,
        startDate: user.inputSavedAt,
        isAchieved: false,
      });
      totalMigrated++;
    }
  }

  console.log(`Migration complete. Migrated ${totalMigrated} goals for ${users.length} users.`);
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
```

---

## Files to Modify/Create

| File                                                     | Change                                    |
| -------------------------------------------------------- | ----------------------------------------- |
| `packages/db/src/constants/resolution-categories.ts`     | **Create**                                |
| `packages/db/src/schema/monthly-resolutions.ts`          | **Create**                                |
| `packages/db/src/schema/plan-tasks.ts`                   | Add `resolutionIds` column                |
| `packages/db/src/schema/user-goals-and-preferences.ts`   | Add preference fields                     |
| `packages/db/src/schema/index.ts`                        | Export new schema                         |
| `packages/db/src/queries/monthly-resolutions.ts`         | **Create**                                |
| `packages/db/src/queries/user-preferences.ts`            | **Create**                                |
| `packages/types/src/index.ts`                            | Add Resolution and Preference types       |
| `packages/api/src/routers/resolutions.ts`                | **Create**                                |
| `packages/api/src/routers/preferences.ts`                | **Create**                                |
| `packages/api/src/routers/index.ts`                      | Export new routers                        |
| `packages/api/src/services/hybrid-plan-generation.ts`    | Integrate resolutions and preferences     |
| `apps/native/app/onboarding/goals.tsx`                   | Structured resolution input + preferences |
| `apps/native/components/resolutions/resolution-card.tsx` | **Create**                                |
| `apps/native/hooks/useResolutions.ts`                    | **Create**                                |
| `apps/native/hooks/usePreferences.ts`                    | **Create**                                |
| `scripts/migrate-goals-to-resolutions.ts`                | **Create**                                |

---

## Success Metrics

1. Users can create structured resolutions with categories and priorities
2. Plans generated with resolutions show task-to-resolution linking
3. Resolution progress updates automatically as tasks are completed
4. Yearly tracking view shows overall progress
5. Monthly plans feel aligned with user's larger goals
6. Existing goals migrate to new resolution structure
7. Users can customize coach name and tone
8. Working hours influence task scheduling

---

## Timeline

| Phase     | Task                    | Notes                                   |
| --------- | ----------------------- | --------------------------------------- |
| **Day 1** | Database Schema & Types | Constants, schema, queries, preferences |
| **Day 2** | API Layer               | Full CRUD + preferences + linking       |
| **Day 3** | Plan Generation         | AI prompt integration with preferences  |
| **Day 4** | Frontend - Onboarding   | New goals screen with preferences       |
| **Day 5** | Frontend - Components   | Resolution cards, hooks                 |
| **Day 6** | New Year Features       | Yearly summary, special UI              |
| **Day 7** | Migration & Testing     | Script, QA                              |

**Total: ~7 days**
