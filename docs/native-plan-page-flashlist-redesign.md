# Plan: Reinvent Native Plan Page with FlashList

## Overview

Transform the native app's plan.tsx from a complex multi-screen navigation experience into a sleek, single-screen dashboard with FlashList-powered performance. Reduce code complexity by ~60% while improving UX through collapsible sections, pull-to-refresh, and 60fps scrolling.

**User Vision:**

- Single-screen dashboard (all functionality in one place)
- Performance-focused with FlashList for all lists
- UI overhaul with modern design
- Simplified core features (generate → view → save)
- Week sections with days as expandable lists
- Pull-to-refresh for regeneration

---

## Architecture

### Single-Screen Layout

```
┌─────────────────────────────┐
│ [Header + Pull-to-Refresh]  │ ← Pull down to regenerate
├─────────────────────────────┤
│ [Collapsible Form Card]     │ ← Collapsed when plan exists
├─────────────────────────────┤
│ [FlashList Container]       │ ← Main content
│  Week 1 Section (expandable)│
│  Week 2 Section (expandable)│
│  ...                        │
├─────────────────────────────┤
│ [Floating Action Bar]       │ ← Save/Discard actions
└─────────────────────────────┘
```

### Data Flow

```
API Response (PlanData)
    ↓
usePlanData Hook (transforms to FlashList format)
    ↓
FlashList-Ready Sectioned Data
    ↓
Optimized Rendering (60fps)
```

---

## Files to Create

### 1. `apps/native/hooks/usePlanData.ts` (~180 lines)

Data transformation hook that converts API responses to FlashList sectioned format.

```typescript
// Transforms PlanData → FlashList sections
interface WeekSectionData {
  weekNumber: number;
  goals: string[];
  dailyTasks: DayTasks[];
  isExpanded: boolean;
}

interface DayTasks {
  day: string;
  tasks: TaskItem[];
}

interface TaskItem {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  focusArea: string;
  isCompleted: boolean;
}
```

### 2. `apps/native/components/plan-dashboard.tsx` (~300 lines)

Main orchestrator component replacing plan.tsx logic. Manages:

- Collapsible form state
- Pull-to-refresh
- FlashList coordination
- Floating action bar

### 3. `apps/native/components/plan-form-collapsible.tsx` (~200 lines)

Collapsible wrapper around existing PlanForm with animated expand/collapse using Reanimated.

### 4. `apps/native/components/week-section.tsx` (~150 lines)

FlashList section component for weeks. Expandable to show daily tasks. Memoized for performance.

### 5. `apps/native/components/day-tasks.tsx` (~120 lines)

Daily task list within a week. Optimized with React.memo.

### 6. `apps/native/components/task-item.tsx` (~100 lines)

Individual task display with priority badges and quick actions.

### 7. `apps/native/components/floating-action-bar.tsx` (~80 lines)

Sticky save/discard buttons with animated appearance.

---

## Files to Modify

### 1. `apps/native/app/(tabs)/plan.tsx`

**Change:** 370 → 80 lines (reduce 78%)

- Replace all logic with PlanDashboard import
- Keep header + nav structure only

### 2. `apps/native/components/plan-form.tsx`

**Change:** 335 → 200 lines (reduce 40%)

- Extract form state to `usePlanFormState` hook
- Simplify props

### 3. `apps/native/hooks/usePlanGeneration.ts`

**Change:** 197 → 210 lines (minor additions)

- Keep as-is (already good)
- Add draft refresh method if needed

---

## Files to Delete

1. `apps/native/components/direct-plan-display.tsx` (199 lines)
2. `apps/native/components/draft-recovery-banner.tsx` (82 lines)
3. `apps/native/components/plan-editor.tsx` (318 lines)

**Total removed:** 599 lines of obsolete code

---

## Implementation Steps

### Phase 1: Foundation

1. **Install FlashList**

   ```bash
   cd apps/native
   bunx expo install @shopify/flash-list
   ```

2. **Create usePlanData hook**
   - Extract transformation logic from plan.tsx
   - Convert to FlashList sectioned format
   - Add memoization with useMemo

3. **Create TaskItem component**
   - Simple, memoized component
   - Priority badges
   - Checkbox for completion

### Phase 2: List Components

1. **Create DayTasks component**
   - Shows tasks for a single day
   - Expandable/collapsible
   - Task completion indicators

2. **Create WeekSection component**
   - Week header with goals
   - Expandable to show days
   - Memoized with React.memo

3. **Create FloatingActionBar component**
   - Save/discard buttons
   - Animated appearance
   - Sticky positioning

### Phase 3: Main Dashboard

1. **Create collapsible form wrapper**
   - Wraps existing PlanForm
   - Animated expand/collapse
   - Shows summary when collapsed

2. **Create PlanDashboard component**
   - Main orchestrator
   - Implements pull-to-refresh
   - Manages all UI state
   - Coordinates FlashList

3. **Update plan.tsx**
   - Replace all logic with PlanDashboard import
   - Keep only header + nav structure

### Phase 4: Refactoring & Cleanup

1. **Refactor PlanForm**
   - Extract form state to hook
   - Simplify props

2. **Remove obsolete components**
   - Delete direct-plan-display.tsx
   - Delete draft-recovery-banner.tsx
   - Delete plan-editor.tsx

3. **Add pull-to-refresh**
   - Implement handleRefresh in PlanDashboard
   - Call generate() with stored form values
   - Show loading indicator

4. **Simplify draft recovery**
   - Replace banner with inline notification
   - Add "Resume Draft" button in header

### Phase 5: Polish & Testing

1. **Performance optimization**
   - Add React.memo to all list items
   - Optimize re-render patterns
   - Test with 100+ tasks

2. **UI refinement**
   - Add animations for expand/collapse
   - Improve visual hierarchy
   - Add empty states
   - Polish loading states

3. **Testing**
   - Test pull-to-refresh
   - Test collapse/expand performance
   - Test form validation
   - Test save/discard actions

---

## FlashList Configuration

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={transformedData}           // Sectioned data
  renderItem={renderWeekSection}    // Week section component
  keyExtractor={(item) => `week-${item.weekNumber}`}
  estimatedItemSize={200}          // Avg week section height
  ListHeaderComponent={Header}
  ListFooterComponent={Footer}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
    />
  }
  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={5}
/>
```

---

## State Management Simplification

### Current (Multiple redundant states)

```typescript
const [hasGenerated, setHasGenerated] = useState(false);
const [isEditing, setIsEditing] = useState(false);
const [editedPlan, setEditedPlan] = useState(undefined);
const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
// Plus hook state
```

### New (Single source of truth)

```typescript
// Only 3 state variables
const [isFormExpanded, setIsFormExpanded] = useState(false);
const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
const [refreshing, setRefreshing] = useState(false);

// Everything else from hook
const { planData, isGenerating, hasDraft, generate, save, discard }
```

---

## Performance Optimizations

1. **Memoization**: React.memo on all list items
2. **Callback optimization**: useCallback for all handlers
3. **FlashList optimizations**:
   - `removeClippedSubviews={true}`
   - `maxToRenderPerBatch={10}`
   - `windowSize={5}`
   - `initialNumToRender={5}`
4. **Layout animations**: Use Reanimated (native driver)
5. **State updates**: Batch with setState

---

## Success Metrics

- **Scroll FPS**: Maintain 60fps with 100+ tasks
- **Initial Render**: <500ms to first paint
- **Complexity**: Reduced by 60%
- **Navigation**: 3 screens → 1 screen
- **Code**: Net +531 lines, but -599 obsolete lines

---

## Risk Mitigation

1. **FlashList compatibility**: Test early with real data
2. **Animation performance**: Use Reanimated native driver
3. **State complexity**: Use Map for O(1) lookups
4. **Data transformation overhead**: Memoize properly

---

## Implementation Checklist

- [ ] Install @shopify/flash-list
- [ ] Create usePlanData hook
- [ ] Create TaskItem component
- [ ] Create DayTasks component
- [ ] Create WeekSection component
- [ ] Create FloatingActionBar component
- [ ] Create PlanFormCollapsible component
- [ ] Create PlanDashboard component
- [ ] Update plan.tsx
- [ ] Refactor PlanForm
- [ ] Remove direct-plan-display.tsx
- [ ] Remove draft-recovery-banner.tsx
- [ ] Remove plan-editor.tsx
- [ ] Add pull-to-refresh
- [ ] Add inline draft recovery
- [ ] Performance optimization
- [ ] UI polish
- [ ] Testing

---

## Critical Files

1. `apps/native/hooks/usePlanData.ts` - Data transformation
2. `apps/native/components/plan-dashboard.tsx` - Main orchestrator
3. `apps/native/components/week-section.tsx` - FlashList render item
4. `apps/native/app/(tabs)/plan.tsx` - Entry point (simplify)
5. `apps/native/components/plan-form-collapsible.tsx` - UX enabler
