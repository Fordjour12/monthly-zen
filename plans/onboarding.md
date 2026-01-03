# IMPLEMENTATION PLAN: Onboarding + Life Areas + Challenges

## Updated: 2026-01-03

### Changes from previous version:

- **Onboarding state**: Save locally first (faster), then sync to DB in background
- **Simplified onboarding**: Removed Screen 4 (Success/Handoff) - merged into generating screen
- **Fixed loop holds**: Added handling for new users, edge cases, sync issues

---

## Current State Analysis

### What Exists

- Auth flow: Sign up/sign in with email
- Auth store: Zustand with persist (SecureStore)
- Plan generation: AI-powered with complexity, weekends, commitments
- Coaching insights: Burnout detection, peak energy, focus area patterns
- Focus areas: Free text field (stored as strings in DB)
- Template categories: 5 hardcoded areas (productivity, wellness, finance, learning, creativity)
- Empty states: Good UX for empty data across all screens

### What's Missing

- Onboarding flow: None - users land on Home immediately after signup
- Onboarding tracking: No flag to show/hide onboarding
- Life area management: No enum/constants, hardcoded in templates
- Life balance coaching: Insight generator doesn't check area dominance
- New life areas: relationships, spirituality, home_management missing
- Explore tab: Referenced in layout but doesn't exist
- Challenges: Schema has "Challenges" type but not implemented
- Contributor docs: No CONTRIBUTING.md for technical users

---

## PHASE 1: Onboarding (Simplified)

### Screen 1: Welcome

**File:** `apps/native/app/onboarding/welcome.tsx`

- Title: "Welcome to Monthly Zen"
- Subtitle: "AI-powered monthly planning to help you achieve your goals without burning out"
- Visual: HeroUI native components, clean minimalist design
- CTA: "Get Started" button
- Skip option: "I know what I'm doing" → goes straight to Home

### Screen 2: Quick Goals

**File:** `apps/native/app/onboarding/goals.tsx`

- Title: "What are your top 3 goals this month?"
- 3 input fields (multiline):
  - Goal 1
  - Goal 2
  - Goal 3
- Validation: At least 1 required, max 3
- Back: Previous screen
- Next: "Generate My Plan"

### Screen 3: Auto-Generate + Success

**File:** `apps/native/app/onboarding/generating.tsx`

- Loading state with animation
- Progress text: "Analyzing your goals...", "Creating balanced plan...", "Optimizing schedule..."
- Success state: "Your first plan is ready!"
- CTA: "Start Using Monthly Zen" (user clicks to continue)
- Navigate to Home on click

### Onboarding State Sync Strategy

**Pattern: Local-first + Background sync**

```typescript
// apps/native/stores/auth-store.ts

interface AuthState {
  // ...existing fields
  hasCompletedOnboarding: boolean;
  onboardingSyncedToServer: boolean; // NEW: tracks if synced

  completeOnboarding: () => Promise<void>; // Changed from void to Promise
}

// Implementation
completeOnboarding: async () => {
  // Step 1: Update local state immediately (fast)
  set({ hasCompletedOnboarding: true });

  // Step 2: Sync to server in background
  try {
    await fetch('/api/user/complete-onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    set({ onboardingSyncedToServer: true });
  } catch (error) {
    // Retry later on app foreground
    set({ onboardingSyncedToServer: false });
  }
},
```

**Server-side endpoint:**

```typescript
// packages/api/src/routers/user.ts

completeOnboarding: protectedProcedure.handler(async ({ context }) => {
  const userId = context.session.user.id;

  // Update in database
  await db.updateUser(userId, { hasCompletedOnboarding: true });

  // Sync onboarding goals as user preferences
  // (Goals were already saved during plan generation)

  return { success: true };
});
```

**Sync on app start:**

```typescript
// In app/_layout.tsx or useEffect hook

useEffect(() => {
  const syncOnboarding = async () => {
    const localOnboarded = authStore.hasCompletedOnboarding;
    const serverOnboarded = await fetchUserOnboardingStatus();

    if (localOnboarded && !serverOnboarded) {
      // Retry sync
      await authStore.completeOnboarding();
    } else if (serverOnboarded && !localOnboarded) {
      // Update local from server (device reinstall case)
      authStore.setOnboardingComplete(true);
    }
  };

  syncOnboarding();
}, []);
```

### Route Updates

**File:** `apps/native/app/_layout.tsx`

```typescript
// Check onboarding status
const { hasCompletedOnboarding, _hasHydrated } = useAuthStore();

if (!_hasHydrated) {
  return <LoadingScreen />;
}

if (!hasCompletedOnboarding) {
  return <OnboardingStack />;
}

return <ProtectedRoutes />;
```

### Continue Onboarding Option (for skipped users)

**File:** `apps/native/app/(tabs)/profile/index.tsx`

```typescript
// Show "Complete Setup" button if user skipped onboarding
{!hasCompletedOnboarding && (
  <Button onPress={() => router.push('/onboarding/welcome')}>
    Complete Setup
  </Button>
)}
```

---

## PHASE 2: Life Area Expansion

### Step 1: Define Life Areas

**File:** `packages/db/src/constants/life-areas.ts` (NEW FILE)

```typescript
export const LIFE_AREAS = [
  { key: "productivity", label: "Productivity", icon: "rocket" },
  { key: "wellness", label: "Wellness", icon: "heart" },
  { key: "finance", label: "Finance", icon: "cash" },
  { key: "learning", label: "Learning", icon: "book" },
  { key: "creativity", label: "Creativity", icon: "brush" },
  { key: "relationships", label: "Relationships", icon: "people" },
  { key: "spirituality", label: "Spirituality", icon: "star" },
  { key: "home_management", label: "Home Management", icon: "home" },
] as const;

export type LifeArea = typeof LIFE_AREAS[number]['key'];
```

### Step 2: Update Templates

**File:** `apps/native/components/planner/templates.tsx`

- Add new areas to CATEGORIES array
- Create 2-3 example templates for each new area:
  - Relationships: "Weekly family time", "Date night scheduler"
  - Spirituality: "Daily meditation challenge", "Journaling practice"
  - Home Management: "Meal planning routine", "Decluttering schedule"

### Step 3: Update Planner UI

**File:** `apps/native/app/(tabs)/planner/create.tsx`

- Add focus area selector with chips (allow multiple selection)
- Use LIFE_AREAS constant for display
- Submit as comma-separated string (current format)

### Step 4: Life Balance Coaching

**File:** `packages/api/src/services/insight-generator.ts`

**FIXED: Handle new users and edge cases**

```typescript
async function checkLifeBalance(userId: string): Promise<{
  isBalanced: boolean;
  dominantArea?: string;
  neglectedArea?: string;
  areaDistribution: Record<string, number>;
  isNewUser: boolean; // NEW: flag for users with insufficient data
}> {
  // Get tasks from last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);
  const tasks = await db.getTasksSinceDate(userId, thirtyDaysAgo);

  // NEW USERS: Check if user has enough data
  if (tasks.length < 5) {
    return {
      isBalanced: true,
      areaDistribution: {},
      isNewUser: true,
    };
  }

  if (tasks.length === 0) {
    return {
      isBalanced: true,
      areaDistribution: {},
      isNewUser: false,
    };
  }

  // Group by focus area
  const areaCounts: Record<string, number> = {};
  for (const task of tasks) {
    const area = task.focusArea?.toLowerCase() || 'uncategorized';
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  }

  const total = tasks.length;
  const areaDistribution: Record<string, number> = {};

  for (const [area, count] of Object.entries(areaCounts)) {
    areaDistribution[area] = Math.round((count / total) * 100);
  }

  // Find dominant (>50%) and neglected (<10%) areas
  const dominant = Object.entries(areaDistribution).find(([, pct]) => pct > 50);
  const neglected = Object.entries(areaDistribution).find(([, pct]) => pct < 10 && pct > 0);

  return {
    isBalanced: !dominant,
    dominantArea: dominant?.[0],
    neglectedArea: neglected?.[0],
    areaDistribution,
    isNewUser: false,
  };
}
```

**Integrate into insight generation:**

```typescript
const balanceCheck = await checkLifeBalance(userId);

// Skip balance insights for new users
if (!balanceCheck.isNewUser && balanceCheck.dominantArea) {
  insights.push({
    type: "LifeBalance", // NEW type in enum
    title: `Work-Life Imbalance Detected`,
    description: `${balanceCheck.dominantArea} occupies ${balanceCheck.areaDistribution[balanceCheck.dominantArea]}% of your tasks. Consider diversifying.`,
    category: "balance",
    priority: "medium",
    suggestedAction: `Schedule tasks in ${balanceCheck.neglectedArea || 'other areas'} this week`,
    confidence: 75,
  });
}
```

### Update Schema Enum

**File:** `packages/db/src/schema/enums.ts`

```typescript
export const insightTypeEnum = pgEnum("insight_type", [
  "PeakEnergy",
  "CompletionRate",
  "SessionDuration",
  "Challenges",
  "LifeBalance", // NEW
]);
```

---

## PHASE 3: Monthly Challenges (Replace Explore Tab)

### Step 1: Database Schema

**File:** `packages/db/src/schema/challenges.ts` (NEW FILE)

```typescript
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }),
  difficulty: varchar("difficulty", { length: 20 }),

  // Challenge duration
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  durationDays: integer("duration_days").notNull(),

  // Progress tracking
  currentDay: integer("current_day").default(1),
  lastCompletedDay: integer("last_completed_day").nullable(), // NEW: track streak
  isCompleted: boolean("is_completed").default(false),
  completionPercent: integer("completion_percent").default(0),

  // Daily checkpoints
  dailyCheckpoints: jsonb("daily_checkpoints").$type<{
    day: number;
    task: string;
    isCompleted: boolean;
    completedAt?: timestamp("completed_at");
  }[]>().notNull().default([]),

  // AI metadata
  aiGenerated: boolean("ai_generated").default(true),
  reasoning: text("reasoning"),

  // Skip tracking
  skippedAt: timestamp("skipped_at"), // NEW
  skipReason: text("skip_reason"), // NEW

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### Step 2: API Router

**File:** `packages/api/src/routers/challenges.ts` (NEW FILE)

```typescript
export const challengesRouter = {
  // Generate monthly challenge based on patterns
  generateChallenge: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    // Check quota first
    const quota = await db.getUserQuota(userId);
    if (quota.monthlyChallengesUsed >= quota.maxMonthlyChallenges) {
      throw new Error("Monthly challenge limit reached");
    }

    // Get patterns (handle null for new users)
    const patterns = await db.getLatestPatterns(userId);

    // NEW USERS: Use default challenge if no patterns
    const challenge = patterns
      ? await generateChallengeAI(userId, patterns)
      : await generateDefaultChallenge(userId);

    return { success: true, data: challenge };
  }),

  // Get active challenges
  getActive: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    const challenges = await db.getActiveChallenges(userId);
    return { success: true, data: challenges };
  }),

  // Update daily progress
  updateProgress: protectedProcedure
    .input(z.object({ challengeId: z.number(), day: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Verify ownership
      const challenge = await db.getChallengeById(input.challengeId);
      if (!challenge || challenge.userId !== userId) {
        throw new Error("Challenge not found");
      }

      // Calculate streak
      const lastCompleted = challenge.lastCompletedDay;
      const expectedPrev = input.day - 1;
      const isStreakBroken = lastCompleted !== expectedPrev;

      await db.updateChallengeProgress({
        challengeId: input.challengeId,
        day: input.day,
        isStreakBroken,
      });

      return {
        success: true,
        data: {
          isStreakBroken,
          streakMessage: isStreakBroken ? "Streak reset! Keep going!" : "Keep up the streak!",
        },
      };
    }),

  // Complete challenge
  completeChallenge: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      await db.completeChallenge(input.challengeId, userId);

      // Award badge/achievement (future)

      return { success: true };
    }),

  // Skip/dismiss challenge
  skipChallenge: protectedProcedure
    .input(z.object({ challengeId: z.number(), reason: z.string().optional() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      await db.skipChallenge(input.challengeId, userId, input.reason);
      return { success: true };
    }),
};
```

### Step 3: Challenge AI Service

**File:** `packages/api/src/services/challenge-generator.ts` (NEW FILE)

```typescript
export interface GeneratedChallenge {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  durationDays: number;
  dailyCheckpoints: { day: number; task: string }[];
  reasoning: string;
}

export async function generateChallengeAI(
  userId: string,
  patterns: UserPattern
): Promise<GeneratedChallenge> {
  const prompt = buildChallengePrompt(userId, patterns);
  const aiResponse = await openRouter.generateChallenge(prompt);

  return parseChallengeResponse(aiResponse);
}

// NEW: Default challenge for new users
export async function generateDefaultChallenge(userId: string): Promise<GeneratedChallenge> {
  return {
    title: "Monthly Zen Starter Challenge",
    description: "Build consistency with small daily habits",
    category: "productivity",
    difficulty: "easy",
    durationDays: 7,
    dailyCheckpoints: [
      { day: 1, task: "Set up your first monthly plan" },
      { day: 2, task: "Add one habit you want to build" },
      { day: 3, task: "Complete all tasks scheduled for today" },
      { day: 4, task: "Review your progress in Coaching" },
      { day: 5, task: "Add 3 tasks for tomorrow" },
      { day: 6, task: "Complete morning intentions" },
      { day: 7, task: "Reflect on your first week" },
    ],
    reasoning: "New user - starting with foundational habits",
  };
}
```

### Step 4: Challenges Tab

**File:** `apps/native/app/(tabs)/challenges/index.tsx` (NEW)

**Features:**

- Active challenge card with progress bar
- Daily checklist with checkbox
- Streak/consistency badge
- "Generate New Challenge" button (monthly limit: 1)
- Challenge history (past challenges, completed vs skipped)
- "Continue Setup" button if user skipped onboarding (NEW)

**Replace Explore Tab:**

- Update `apps/native/app/(tabs)/_layout.tsx`
- Change name from "explore" to "challenges"
- Remove old explore reference

**Update Tabs Icon:**

- Change icon from search to trophy or flag

### Step 5: Database Queries

**File:** `packages/db/src/queries/challenges.ts` (NEW FILE)

```typescript
export async function getActiveChallenges(userId: string) { ... }
export async function getChallengeHistory(userId: string) { ... }
export async function updateChallengeProgress(params: {
  challengeId: number;
  day: number;
  isStreakBroken: boolean;
}) { ... }
export async function completeChallenge(challengeId: number, userId: string) { ... }
export async function skipChallenge(
  challengeId: number,
  userId: string,
  reason?: string
) { ... }
export async function getUserQuota(userId: string) { ... }
```

---

## PHASE 4: Documentation for Technical Users

### 1. CONTRIBUTING.md

**File:** Root level (NEW)

```markdown
# Contributing to Monthly Zen

Thank you for contributing! This guide is for technical users who want to understand, extend, or contribute to the codebase.

## Prerequisites

- Bun runtime
- PostgreSQL
- OpenRouter API key (for AI features)

## Development Setup

- Complete setup instructions
- Database migration guide
- Testing instructions

## Architecture Overview

- Monorepo structure
- oRPC flow
- AI integration patterns

## Adding New Features

- How to add oRPC endpoints
- How to add database tables
- How to create new tabs/routes
- How to update coaching insights

## Code Style

- Oxlint + Oxfmt
- Husky pre-commit hooks
- TypeScript conventions

## Common Tasks

- Adding new insight types
- Creating new templates
- Updating life areas
- Extending challenge system
```

### 2. API Documentation

**File:** `packages/api/README.md` (NEW)

```markdown
# Monthly Zen API

This package contains all oRPC routers and business logic.

## Routers

### `plan` - Plan Generation

- `generate(input)`: Create AI-generated monthly plan
- `confirm(input)`: Save draft as confirmed plan
- `getCurrent()`: Get user's current active plan
- `getPlans()`: Get all historical plans

### `coaching` - AI Coaching Insights

- `getInsights()`: Get active insights for user
- `generateInsights()`: Generate new insights using AI
- `getPatterns()`: Get user's productivity patterns
- `createGoal()`: Create coaching goal
- `updateGoalProgress()`: Update goal progress

### `challenges` - Monthly Challenges (NEW)

- `generateChallenge()`: AI generates personalized monthly challenge
- `getActive()`: Get active challenges
- `updateProgress()`: Update daily challenge progress
- `completeChallenge()`: Mark challenge as completed
- `skipChallenge()`: Skip challenge with reason
```

### 3. Native App Architecture

**File:** `apps/native/ARCHITECTURE.md` (NEW)

```markdown
# Native App Architecture

## Navigation

- Expo Router file-based routing
- Protected routes using auth store
- Onboarding flow integration

## State Management

- Zustand for auth (persisted with SecureStore)
- TanStack Query for API data
- Context providers for theme

## Component Structure

- `/components/home`: Home page components
- `/components/planner`: Plan creation and views
- `/components/coaching`: Insights and goals
- `/components/ui`: Shared UI components
- `/hooks`: Custom React hooks (useTasks, useHabits, useCoaching)

## Adding New Tabs

1. Create route file in `app/(tabs)/`
2. Add to `app/(tabs)/_layout.tsx`
3. Update tab icon and title
```

### 4. Coaching Insight Development

**File:** `docs/coaching-insights-guide.md` (NEW)

````markdown
# Adding New Coaching Insight Types

This guide explains how to add new insight types to the AI coaching system.

## 1. Update Database Schema

Edit `packages/db/src/schema/enums.ts`:

```typescript
export const insightTypeEnum = pgEnum("insight_type", [
  // ...existing types
  "YourNewType",
]);
```

Run `bun run db:push` to update database.

## 2. Add Generation Logic

Edit `packages/api/src/services/insight-generator.ts`:

```typescript
if (yourCondition) {
  insights.push({
    type: "YourNewType",
    title: "Your Insight Title",
    description: "Explanation",
    reasoning: "Why this triggers",
    suggestedAction: "What user should do",
    confidence: "80%",
    priority: "medium",
    category: "your-category",
    triggerData: { patternData },
  });
}
```

## 3. Add Query to Get Relevant Data

Edit `packages/db/src/queries/coaching.ts`:

```typescript
export async function getYourPatternData(userId: string) {
  // Your analysis logic
  return analyzedData;
}
```

## 4. Test

1. Generate insights via API
2. Verify insight appears in coaching dashboard
3. Check dismiss/apply actions work

````

---

## FIXED LOOP HOLDS SUMMARY

| #   | Issue                                  | Fix Applied                                   |
| --- | -------------------------------------- | --------------------------------------------- |
| 1   | Onboarding state only in local storage | Local-first + background sync to DB           |
| 2   | Life balance fails for new users       | Added `isNewUser` flag, handle <5 tasks       |
| 3   | Auto-redirect too fast (2s)            | User clicks CTA to continue                   |
| 4   | No way to return after skip            | "Complete Setup" in Profile                   |
| 5   | Focus areas type mismatch              | Validation layer added                        |
| 6   | Challenge streak handling              | Added `lastCompletedDay`, streak broken logic |
| 7   | AI generation failures                 | Default challenge for new users, quota checks |

---

## IMPLEMENTATION ORDER

| Phase                     | Task                            | Notes                  |
| ------------------------- | ------------------------------- | ---------------------- |
| **Week 1: Onboarding**    |                                 |                        |
|                           | Create onboarding screens       | Simplified (3 screens) |
|                           | Update auth store with sync     | Local-first pattern    |
|                           | Modify layout to show flow      | Check flag + hydration |
|                           | Add continue option in Profile  | For skipped users      |
|                           | Test signup → onboarding → home | Full flow              |
| **Week 2: Life Areas**    |                                 |                        |
|                           | Create LIFE_AREAS constant      |                        |
|                           | Update templates                | 8 areas total          |
|                           | Update planner UI selector      |                        |
| **Week 3: Life Balance**  |                                 |                        |
|                           | Implement checkLifeBalance()    | Handle new users       |
|                           | Add new insight type            |                        |
| **Week 4-5: Challenges**  |                                 |                        |
|                           | Challenge schema + queries      | Streak tracking        |
|                           | Challenge API router            | Quota + defaults       |
|                           | Challenges tab UI               |                        |
| **Week 6: Documentation** |                                 |                        |
|                           | CONTRIBUTING.md                 |                        |
|                           | API docs + architecture         |                        |

---

## Ready to Implement

Once approved, I'll execute the plan in phases. Each phase will be tested independently.

**Key patterns used:**

- Local-first state with background sync
- Graceful degradation for new users
- Streak tracking with reset logic
- All database changes use Drizzle migrations (rollbackable)
