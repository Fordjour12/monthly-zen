# Homepage Implementation Plan

## Overview

Create a command-center style homepage for Monthly Zen native app with:

- Time-based greeting with user name
- Date display (Day + Date + Year)
- 3-column metrics row
- 2x2 Quick Actions grid
- **Predictive Coaching Section** - AI-powered insights and daily intentions
- Current Plan Progress card
- Today's Tasks card
- Activity Heatmap
- FAB for quick add

---

## Component Structure

```
apps/native/
├── components/
│   └── home/
│       ├── index.ts                    ← Barrel export
│       ├── home-header.tsx             ← Date display, greeting
│       ├── metrics-row.tsx             ← 3 stats (tasks, hours left, progress)
│       ├── quick-actions.tsx           ← 2x2 grid with icons
│       ├── coaching-banner.tsx         ← NEW: Predictive insights banner
│       ├── morning-intentions.tsx      ← NEW: AI-suggested daily focus
│       ├── plan-progress-card.tsx
│       ├── todays-tasks-card.tsx
│       └── home-layout.tsx             ← Orchestrates all components
├── app/(tabs)/
│   └── index.tsx                       ← Entry point (simple wrapper)
```

---

## Predictive Coaching Integration

### 1. Coaching Banner Component

**Purpose**: Display top 1-2 actionable insights from predictive coaching system.

**Location**: `components/home/coaching-banner.tsx`

```typescript
interface CoachingBannerProps {
  onViewAll?: () => void;
}

export function CoachingBanner({ onViewAll }: CoachingBannerProps) {
  const { primary, background } = useSemanticColors();
  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights", "active"],
    queryFn: () => client.insights.getActiveInsights.query(),
  });

  const topInsight = insights?.data?.[0];

  if (isLoading) return <CoachingSkeleton />;
  if (!topInsight) return null;

  return (
    <View className="mx-4 mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="sparkles" size={20} color="#f59e0b" />
          <Text className="font-semibold text-foreground">AI Coaching</Text>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text className="text-sm text-primary">View All</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text className="text-lg font-bold text-foreground mb-1">
        {topInsight.title}
      </Text>

      <Text className="text-sm text-muted-foreground mb-3">
        {topInsight.description}
      </Text>

      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 py-2.5 px-4 rounded-lg bg-primary items-center justify-center flex-row gap-2"
          onPress={() => client.insights.respondToInsight.mutate({
            insightId: topInsight.id,
            response: "Accepted",
          })}
        >
          <Ionicons name="checkmark" size={18} color="white" />
          <Text className="text-white font-medium">Apply Suggestion</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="py-2.5 px-4 rounded-lg border border-border items-center justify-center"
          onPress={() => client.insights.respondToInsight.mutate({
            insightId: topInsight.id,
            response: "Dismissed",
          })}
        >
          <Ionicons name="close" size={18} color={primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

### 2. Morning Intentions Component

**Purpose**: AI-generated personalized daily focus recommendation.

**Location**: `components/home/morning-intentions.tsx`

```typescript
export function MorningIntentions() {
  const { primary, success } = useSemanticColors();
  const queryClient = useQueryClient();

  const { data: intention, isLoading } = useQuery({
    queryKey: ["morning-intention"],
    queryFn: () => generateMorningIntention(),
    staleTime: 24 * 60 * 60 * 1000, // Refresh daily
  });

  const handleApply = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks", "today"] });
  };

  if (isLoading) return <MorningIntentionSkeleton />;
  if (!intention) return null;

  return (
    <View className="mx-4 mb-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
      <View className="flex-row items-center gap-2 mb-3">
        <Ionicons name="sunny" size={20} color={primary} />
        <Text className="font-semibold text-foreground">Today's Focus</Text>
      </View>

      <Text className="text-xl font-bold text-foreground mb-2">
        {intention.title}
      </Text>

      <Text className="text-sm text-muted-foreground mb-3">
        {intention.reason}
      </Text>

      <View className="flex-row items-center gap-2 mb-3">
        <View className="px-2 py-1 bg-success/20 rounded">
          <Text className="text-xs font-medium text-success">
            {intention.confidence}% confident
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground">
          Based on your {intention.patternType} pattern
        </Text>
      </View>

      <TouchableOpacity
        className="py-2.5 px-4 rounded-lg bg-success items-center justify-center flex-row gap-2"
        onPress={handleApply}
      >
        <Ionicons name="add" size={18} color="white" />
        <Text className="text-white font-medium">Add to Today's Tasks</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 3. Updated Page Layout with Coaching

```
┌─────────────────────────────────────┐
│  [HOME-HEADER]                      │
│  ┌─────────────────────────────┐    │
│  │ MON         December 29     │    │
│  │ ●                        2025│    │
│  │                              │    │
│  │ Good morning, Alex! 👋       │    │
│  │ You have 4 tasks today       │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  [COACHING-BANNER]                  │
│  ┌─────────────────────────────┐    │
│  │ 🌟 AI Coaching              │    │
│  │                             │    │
│  │ "Third Week Drop-off        │    │
│  │  Detected"                  │    │
│  │                             │    │
│  │ [Apply]  [Dismiss]          │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  [MORNING-INTENTIONS]               │
│  ┌─────────────────────────────┐    │
│  │ ☀️ Today's Focus            │    │
│  │                             │    │
│  │ "Schedule deep work during  │    │
│  │  your peak energy hours"    │    │
│  │                             │    │
│  │ [Add to Tasks]              │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  [METRICS-ROW]                      │
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │ Tasks │ │ Hours │ │ Month │     │
│  │  4/8  │ │  6h   │ │  85%  │     │
│  └───────┘ └───────┘ └───────┘     │
├─────────────────────────────────────┤
│  [QUICK-ACTIONS]                    │
│  ┌─────────────┐ ┌─────────────┐    │
│  │  📋         │ │  💡         │    │  ← Insights instead of Explore
│  │ Generate    │ │ View        │    │
│  │   Plan      │ │ Insights    │    │
│  └─────────────┘ └─────────────┘    │
│  ┌─────────────┐ ┌─────────────┐    │
│  │  📅         │ │  🔍         │    │
│  │  Calendar   │ │  Explore    │    │
│  └─────────────┘ └─────────────┘    │
├─────────────────────────────────────┤
│  [PLAN-PROGRESS-CARD]               │
│  ┌─────────────────────────────┐    │
│  │ December Plan          60%  │    │
│  │ ████████████░░░░░░░░░░░░    │    │
│  │ 3 weeks left • 12/20 tasks  │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  [TODAYS-TASKS-CARD]                │
│  ┌─────────────────────────────┐    │
│  │ Today's Tasks         2/4   │    │
│  │ ☑ Review plan              │    │
│  │ ☐ Draft weekly goals       │    │
│  │ ☐ Schedule meetings        │    │
│  │ ☐ Update calendar          │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  [HEATMAP-CARD]                     │
│  ┌─────────────────────────────┐    │
│  │ Activity               📊   │    │
│  │ ▓▓▓░░░▓▓░░▓▓▓▓░░          │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
         ┌───────────┐
         │     +     │  ← FAB
         └───────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (No Coaching)

| File                              | Purpose                                     |
| --------------------------------- | ------------------------------------------- |
| `components/home/home-header.tsx` | Greeting, date, user name                   |
| `components/home/metrics-row.tsx` | Tasks remaining, hours left, month progress |
| `components/home/home-layout.tsx` | Container with proper spacing               |

### Phase 2: Quick Actions

| File                                | Purpose                  |
| ----------------------------------- | ------------------------ |
| `components/home/quick-actions.tsx` | 2x2 grid with navigation |

### Phase 3: Predictive Coaching Foundation

| File                                             | Purpose                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| `packages/api/src/routers/insights.ts`           | Existing insights router (from predictive-habit-coaching-plan.md) |
| `packages/api/src/services/morning-intention.ts` | NEW: Generate daily focus suggestion                              |
| `components/home/coaching-banner.tsx`            | Display top insight                                               |
| `components/home/morning-intentions.tsx`         | AI daily focus suggestion                                         |

### Phase 4: Dashboard Cards

| File                                     | Purpose                             |
| ---------------------------------------- | ----------------------------------- |
| `components/home/plan-progress-card.tsx` | Shows active plan with progress bar |
| `components/home/todays-tasks-card.tsx`  | Today's tasks with checkboxes       |

### Phase 5: Integration

| File                   | Purpose                 |
| ---------------------- | ----------------------- |
| `app/(tabs)/index.tsx` | Composes all components |

---

## Morning Intention Generation Service

**File:** `packages/api/src/services/morning-intention.ts`

```typescript
import {
  getDayOfWeekPatterns,
  detectBurnoutRisk,
  getFocusAreaTrends,
} from "@monthly-zen/db";

export interface MorningIntention {
  title: string;
  reason: string;
  confidence: number;
  patternType: "peak-energy" | "burnout-risk" | "focus-area" | "general";
  suggestedAction?: string;
}

export async function generateMorningIntention(
  userId: string
): Promise<MorningIntention | null> {
  const now = new Date();
  const dayOfWeek = now.getDay();

  const [dayPatterns, burnoutRisk, focusTrends] = await Promise.all([
    getDayOfWeekPatterns(userId, 3),
    detectBurnoutRisk(userId, 3),
    getFocusAreaTrends(userId, 3),
  ]);

  const bestDay = dayPatterns.reduce((best, current) =>
    current.completionRate > best.completionRate ? current : best
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

  if (bestDay.dayOfWeek === dayOfWeek) {
    return {
      title: "Schedule Deep Work Now",
      reason: `${getDayName(bestDay.dayOfWeek)} is your most productive day. Save 2-3 hours for challenging tasks.`,
      confidence: Math.round(bestDay.completionRate),
      patternType: "peak-energy",
      suggestedAction: "Block 2 hours for high-priority work",
    };
  }

  const declining = focusTrends.find((t) => t.trend === "declining");
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
}

function getDayName(day: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
}
```

---

## API Endpoints for Coaching

**File:** `packages/api/src/routers/coaching.ts`

```typescript
export const coachingRouter = {
  getMorningIntention: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new Error("Authentication required");

    const intention = await generateMorningIntention(userId);
    return { success: true, data: intention };
  }),

  getInsightsSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new Error("Authentication required");

    const insights = await db.getActiveInsights(userId);
    return {
      success: true,
      data: {
        count: insights.length,
        topInsight: insights[0] || null,
        hasBurnoutRisk: insights.some((i) => i.insightType === "BurnoutRisk"),
      },
    };
  }),
};
```

---

## Files to Create

```
apps/native/components/home/
├── index.ts                    ← Barrel export
├── home-header.tsx
├── metrics-row.tsx
├── quick-actions.tsx
├── coaching-banner.tsx         ← NEW
├── morning-intentions.tsx      ← NEW
├── plan-progress-card.tsx
├── todays-tasks-card.tsx
└── home-layout.tsx

packages/api/src/services/
└── morning-intention.ts        ← NEW

packages/api/src/routers/
└── coaching.ts                 ← NEW
```

## Files to Modify

| File                                   | Change                      |
| -------------------------------------- | --------------------------- |
| `apps/native/components/home/index.ts` | Create barrel export        |
| `apps/native/app/(tabs)/index.tsx`     | Replace with new layout     |
| `packages/api/src/routers/index.ts`    | Register coaching router    |
| `apps/native/utils/orpc.ts`            | Add coaching client methods |

---

## Dependencies

- `@expo/vector-icons` (existing)
- `heroui-native` components (Card, etc.)
- `useTasks` hook (existing)
- `authClient` (existing)
- `Heatmap` component (existing)
- **Insights system** (from `docs/predictive-habit-coaching-plan.md`)

---

## Styling Standards

- **Coaching Banner**: Amber/yellow accent colors (`#f59e0b`)
- **Morning Intentions**: Primary accent colors
- **Cards**: Dark background (`#18181b`), border (`#27272a`), 12px radius
- **Icons**: Ionicons with semantic colors

---

## Design Inspiration

References from existing codebase:

- `apps/native/app/(tabs)/testing-2.tsx` - Styling patterns (StyleSheet, dark theme)
- `apps/native/app/(tabs)/testing.tsx` - Component structure patterns
- `apps/native/components/tasks/task-dashboard.tsx` - FlashList usage, stats display
- `apps/native/components/plans/plan-dashboard.tsx` - Plan progress patterns
- `apps/native/components/ui/heatmap.tsx` - Reusable heatmap component

---

## Open Questions

| Question                      | Options                                    |
| ----------------------------- | ------------------------------------------ |
| **Coaching banner position**  | Before metrics row? After header?          |
| **Morning intention display** | Only show if user has 2+ weeks of data?    |
| **Fallback when no insights** | Show generic motivation card?              |
| **Refresh frequency**         | Daily for intentions? Weekly for insights? |
| **Haptic feedback**           | On accept/dismiss actions?                 |

---

## Integration with Predictive Coaching Plan

This homepage plan integrates with `docs/predictive-habit-coaching-plan.md`:

| Homepage Component       | Uses From Coaching Plan          |
| ------------------------ | -------------------------------- |
| `coaching-banner.tsx`    | `InsightsBanner` (Section 8.2)   |
| `morning-intentions.tsx` | `generateMorningIntention` (new) |
| Quick Actions → Insights | `getActiveInsights` endpoint     |
| Metrics row              | `detectBurnoutRisk` (Section 3)  |

**Prerequisites**: Complete Phase 1-5 of Predictive Coaching plan first for full functionality.
