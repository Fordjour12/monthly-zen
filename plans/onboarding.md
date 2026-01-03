# IMPLEMENTATION PLAN: Onboarding + Life Areas + Challenges

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

## PHASE 1: Onboarding (MVP - Option A)

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

### Screen 3: Auto-Generate

**File:** `apps/native/app/onboarding/generating.tsx`

- Loading state with animation
- Progress text: "Analyzing your goals...", "Creating balanced plan...", "Optimizing schedule..."
- Success state: "Your first plan is ready!"
- Auto-redirect to Home after 2 seconds

### Screen 4: Success/Handoff (Optional - could be merged with screen 3)

- Title: "You're all set!"
- Brief intro to key features (2 sentences max):
  - "Check your Calendar for daily tasks"
  - "Visit Coaching for personalized insights"
- CTA: "Start Using Monthly Zen"
- Navigate to Home

### Route Updates

**File:** `apps/native/app/_layout.tsx`

- Add onboarding route before protected routes
- Check onboarding flag in auth store
- If not completed → show onboarding flow
- If completed → show protected routes (tabs, etc.)

### Auth Store Updates

**File:** `apps/native/stores/auth-store.ts`

```typescript
interface AuthState {
  // ...existing fields
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
}
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

Add new function:

```typescript
async function checkLifeBalance(userId: string): Promise<{
  isBalanced: boolean;
  dominantArea?: string;
  neglectedArea?: string;
  areaDistribution: Record<string, number>;
}>
```

**Logic:**

1. Get all tasks from last 30 days grouped by focus area
2. Calculate percentage per area
3. Check if any area > 50% (dominant) or < 10% (neglected)
4. Return analysis

Integrate into `generateInsight()`:

```typescript
// Add to existing analysis
const balanceCheck = await checkLifeBalance(userId);
if (balanceCheck.dominantArea) {
  insights.push({
    type: "CompletionRate",
    title: `Work-Life Imbalance Detected`,
    description: `${balanceCheck.dominantArea} occupies ${percentage}% of your tasks. Consider diversifying.`,
    category: "balance",
    priority: "medium",
    suggestedAction: "Schedule tasks in ${balanceCheck.neglectedArea} this week",
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
  "LifeBalance",
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
  isCompleted: boolean("is_completed").default(false),
  completionPercent: integer("completion_percent").default(0),

  // Daily checkpoints
  dailyCheckpoints: jsonb("daily_checkpoints").$type<{
    day: number;
    task: string;
    isCompleted: boolean;
  }[]>(),

  // AI metadata
  aiGenerated: boolean("ai_generated").default(true),
  reasoning: text("reasoning"),

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
    const patterns = await db.getLatestPatterns(userId);
    const challenge = await generateChallengeAI(userId, patterns);
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
    .input(z.object({ challengeId: z.number(), currentDay: z.number() }))
    .handler(async ({ input, context }) => {
      await db.updateChallengeProgress(input.challengeId, input.currentDay);
      return { success: true };
    }),

  // Complete challenge
  completeChallenge: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .handler(async ({ input }) => {
      await db.completeChallenge(input.challengeId);
      return { success: true };
    }),

  // Skip/dismiss challenge
  skipChallenge: protectedProcedure
    .input(z.object({ challengeId: z.number(), reason: z.string() }))
    .handler(async ({ input }) => {
      await db.skipChallenge(input.challengeId, input.reason);
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
  patterns: UserPattern | null
): Promise<GeneratedChallenge> {
  // Analyze patterns to determine:
  // 1. Which area needs attention (lowest completion rate)
  // 2. User's typical difficulty level
  // 3. Time availability

  const prompt = buildChallengePrompt(userId, patterns);
  const aiResponse = await openRouter.generateChallenge(prompt);

  return parseChallengeResponse(aiResponse);
}
```

**Example prompts:**

```
Based on user patterns:
- Peak day: Monday (85% completion)
- Struggling area: Relationships (40% completion)
- Typical tasks per day: 3-4

Generate a 7-day "Relationship Building Challenge" with:
1. Clear theme and objective
2. Daily actionable tasks
3. Reasonable time commitments (15-30 mins/day)
4. Difficulty: Medium
```

### Step 4: Challenges Tab

**File:** `apps/native/app/(tabs)/challenges/index.tsx` (NEW)

**Features:**

- Active challenge card with progress bar
- Daily checklist with checkbox
- Streak/consistency badge
- "Generate New Challenge" button (monthly limit: 1)
- Challenge history (past challenges, completed vs skipped)

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
export async function updateChallengeProgress(challengeId: number, currentDay: number) { ... }
export async function completeChallenge(challengeId: number) { ... }
export async function skipChallenge(challengeId: number, reason: string) { ... }
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
````

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

```

---

## IMPLEMENTATION ORDER & ESTIMATES

| Phase | Task | Estimated Time |
|-------|------|----------------|
| **Week 1: Onboarding** | | **8-10 hours** |
| | Create onboarding screens | 3-4 hours |
| | Update auth store with onboarding flag | 1 hour |
| | Modify layout to show onboarding flow | 2 hours |
| | Test signup → onboarding → home flow | 1 hour |
| | Add skip functionality for technical users | 1 hour |
| **Week 2: Life Areas** | | **6-8 hours** |
| | Create LIFE_AREAS constant | 30 min |
| | Update templates with new areas | 2 hours |
| | Add templates for new areas | 2 hours |
| | Update planner UI selector | 1 hour |
| | Test focus area selection | 30 min |
| **Week 3: Life Balance Coaching** | | **8-10 hours** |
| | Implement `checkLifeBalance()` function | 3 hours |
| | Integrate balance check into insight generator | 2 hours |
| | Update schema enum | 30 min |
| | Test with imbalanced data | 2 hours |
| | Test with balanced data | 1 hour |
| | Add UI for balance insights | 1 hour |
| **Week 4-5: Challenges** | | **15-20 hours** |
| | Design challenge schema | 1 hour |
| | Create challenge table & migrations | 1 hour |
| | Implement AI challenge generator | 4 hours |
| | Build API router | 3 hours |
| | Create challenges tab UI | 5 hours |
| | Add progress tracking | 2 hours |
| | Test full challenge lifecycle | 3 hours |
| **Week 6: Documentation** | | **8-12 hours** |
| | Write CONTRIBUTING.md | 3 hours |
| | Document API endpoints | 3 hours |
| | Create native architecture guide | 2 hours |
| | Write coaching insights guide | 1 hour |
| | Update main README with links | 30 min |

**Total estimated: 45-60 hours (~2-3 weeks full-time, 6-8 weeks part-time)**

---

## Design Decisions

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Onboarding | Forced vs Skippable | Skippable - "I know what I'm doing" button |
| First plan | Auto-generate vs Show full form | Auto-generate with balanced defaults |
| Challenge limits | One at a time vs Multiple | One at a time - keeps focus |
| Challenge generation | Manual button vs Automatic | Manual button - user control |
| Life balance thresholds | Flexible vs Fixed | Start with >50%/<10%, make configurable |

---

## Decision Checklist

Before implementation, please confirm:

| # | Question | Your Answer |
|---|----------|-------------|
| 1 | Onboarding skippable? (Yes/No) | |
| 2 | First plan generation: Auto-generate with defaults OR show full form? | |
| 3 | Challenge limits: One at a time OR multiple concurrent? | |
| 4 | Challenge generation: Manual (button) OR automatic (monthly)? | |
| 5 | Life balance thresholds: Use my >50%/<10% recommendation or different? | |
| 6 | Template examples: Realistic templates OR basic placeholders? | |
| 7 | Documentation depth: Technical deep-dive OR high-level overview? | |
| 8 | Implementation order: Onboarding → Areas → Balance → Challenges OR highest value first? | |

---

## Ready to Implement

Once you answer the questions above, I'll execute the plan in phases. Each phase will be tested independently before moving to the next.

**Technical note:** All database changes will use Drizzle migrations, so you can rollback if needed. All new components will follow your existing HeroUI Native patterns for consistency.
```
