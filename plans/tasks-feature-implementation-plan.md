# Tasks Feature Implementation Plan for Native App

## Overview

Implement the Tasks feature in the native app (`apps/native/app/(tabs)/task/`) to provide users with task management capabilities including viewing, creating, editing, and deleting tasks with filtering and sorting options.

## Current State Analysis

| Component        | Status         | Notes                                            |
| ---------------- | -------------- | ------------------------------------------------ |
| `TaskDashboard`  | ✅ Complete    | Fully implemented with FlashList, filters, stats |
| `TaskFilterBar`  | ✅ Complete    | Search, status, difficulty, sort                 |
| `TaskListItem`   | ✅ Complete    | Checkbox, badges, haptic feedback                |
| `TaskStats`      | ✅ Complete    | Total, completed, pending, completion rate       |
| `TaskEmptyState` | ✅ Complete    | Reset filters CTA                                |
| `useTasks` hook  | ✅ Complete    | Full CRUD + reminders + mutations                |
| `tasks` router   | ✅ Complete    | Full API endpoints                               |
| `task/index.tsx` | ❌ Placeholder | Uses boilerplate UI, not TaskDashboard           |
| `TaskFormSheet`  | ❌ Missing     | No create/edit task form                         |

## Requirements

1. **Tasks page** at `apps/native/app/(tabs)/task/index.tsx`
2. **Focus area selection** from user's existing focus areas (dropdown)
3. **Task form** as bottom sheet modal

## Implementation Steps

### Step 1: Add Tasks Tab to Navigation

**File:** `apps/native/app/(tabs)/_layout.tsx`

Add Tasks tab to the tab bar navigation.

### Step 2: Rewrite `task/index.tsx`

Replace placeholder UI with TaskDashboard and TaskFormSheet integration.

### Step 3: Create TaskFormSheet Component

**File:** `apps/native/components/tasks/task-form-sheet.tsx`

Bottom sheet modal with:

- Task description (TextInput, required)
- Focus area (Select dropdown from user's focusAreas)
- Difficulty level (Simple/Moderate/Advanced chips)
- Start time (DatePicker)
- End time (DatePicker)
- Scheduling reason (TextInput, optional)

### Step 4: Update TaskDashboard with Create FAB

**File:** `apps/native/components/tasks/task-dashboard.tsx`

Add:

- Props: `onCreateTask?: () => void`, `onEditTask?: (task: Task) => void`
- Floating Action Button for creating new tasks

### Step 5: Export TaskFormSheet

**File:** `apps/native/components/tasks/index.ts`

Add export for TaskFormSheet.

## Files to Modify/Create

| File                                               | Action                                      |
| -------------------------------------------------- | ------------------------------------------- |
| `apps/native/app/(tabs)/_layout.tsx`               | Modify - Add Tasks tab                      |
| `apps/native/app/(tabs)/task/index.tsx`            | Rewrite - Use TaskDashboard + TaskFormSheet |
| `apps/native/components/tasks/task-form-sheet.tsx` | Create - New component                      |
| `apps/native/components/tasks/task-dashboard.tsx`  | Modify - Add FAB + callback props           |
| `apps/native/components/tasks/index.ts`            | Modify - Export TaskFormSheet               |

## Testing Checklist

- [ ] Tasks tab appears in bottom navigation
- [ ] Tapping Tasks shows TaskDashboard with stats and filters
- [ ] Pull-to-refresh works
- [ ] FAB opens TaskFormSheet
- [ ] Creating a task shows in list
- [ ] Toggling task completion works with haptic feedback
- [ ] Filters (status, difficulty, search) work
- [ ] Empty state shows when no tasks
- [ ] Editing a task opens form with pre-filled values
- [ ] Deleting a task removes from list
- [ ] Focus area dropdown shows user's existing focus areas

## Dependencies

- `expo-haptics` - Already used for haptic feedback
- `@gorhom/bottom-sheet` - Already used in the app
- `heroui-native` Select component - Already used
- `@/components/ui/DateTimePicker` - Already exists
- `useTasks` hook - Already implemented
- `focusAreas` from `useTasks` - Available for focus area dropdown
