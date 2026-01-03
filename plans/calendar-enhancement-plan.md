# Calendar Enhancement Plan - Complete

This plan combines the comprehensive original plan with focused improvements for a complete calendar section overhaul.

## Overview

### Goals

1. **Visual Excellence** - Modern, clean design with excellent UX
2. **Feature-Rich** - Week view, statistics, task actions, filtering
3. **Cross-Platform** - Consistent experience on web and native
4. **Performance** - Smooth animations, efficient data handling

---

## Current State Analysis

### Web Calendar

- **Location**: `apps/web/src/components/calendar/`
- **Tech Stack**: React + react-day-picker + TanStack Query
- **Current Features**:
  - Month navigation with prev/next buttons
  - Normal and heatmap views
  - Focus area filtering in sidebar
  - Task detail sheet for day view
  - Task status updates
- **Issues**:
  - Cramped cells (h-32)
  - Small task text (text-[10px])
  - Basic heatmap only green colors
  - No week view

### Native Calendar

- **Location**: `apps/native/app/(tabs)/calendar/`
- **Tech Stack**: React Native + date-fns + TanStack Query
- **Current Features**:
  - Custom grid with date-fns
  - Simple task list below calendar
  - Normal and heatmap views
  - Basic difficulty indicators
- **Issues**:
  - Small touch targets
  - No focus area filtering
  - Basic styling
  - No gestures

---

## Implementation Phases

### Phase 1: Visual Foundation (Both Platforms)

#### 1.1 Web Calendar Visual Overhaul

- [ ] Enlarge calendar cells (h-32 → h-48 or larger)
- [ ] Design larger task cards with focus area colors
- [ ] Implement multi-color heatmap gradient (green→yellow→orange→red)
- [ ] Add smooth CSS transitions and animations
- [ ] Improve sidebar with visual focus area indicators
- [ ] Create prominent today highlight with glow effect
- [ ] Add loading states and skeletons
- [ ] Implement dark mode optimization

#### 1.2 Native Calendar Visual Overhaul

- [ ] Increase touch target sizes (min 44dp)
- [ ] Implement semantic color scheme
- [ ] Add card-based design with proper shadows
- [ ] Improve heatmap with gradient colors
- [ ] Add haptic feedback on date selection
- [ ] Implement skeleton loading states
- [ ] Optimize for dark mode

---

### Phase 2: Core Features

#### 2.1 Week View (Both Platforms)

- [ ] Create week view toggle component
- [ ] Implement 7-day timeline layout
- [ ] Show tasks in time blocks
- [ ] Add hour-by-hour view option
- [ ] Connect to existing task data API
- [ ] Implement week navigation (prev/next week)

#### 2.2 Task Quick Actions (Web)

- [ ] Add hover-based quick complete/uncomplete
- [ ] Implement task detail popover on click
- [ ] Add task edit functionality
- [ ] Integrate drag-and-drop (using dnd-kit)
- [ ] Add swipe actions for tablet/mobile

#### 2.3 Enhanced Focus Area Filtering (Both Platforms)

- [ ] Implement multi-select filtering
- [ ] Add color-coded task indicators
- [ ] Create focus area legend component
- [ ] Persist filter preferences to localStorage
- [ ] Add quick filter chips for common areas

---

### Phase 3: Advanced Features

#### 3.1 Calendar Statistics Panel (Web)

- [ ] Calculate monthly completion rate
- [ ] Create focus area breakdown chart
- [ ] Implement streak tracking (consecutive days)
- [ ] Add upcoming tasks preview
- [ ] Display weekly trends graph

#### 3.2 Native Bottom Sheet Integration

- [ ] Replace simple task list with bottom sheet
- [ ] Implement swipeable day views
- [ ] Add task detail slide-over
- [ ] Connect to existing task data

#### 3.3 Gesture Navigation (Native)

- [ ] Implement swipe left/right month navigation
- [ ] Add pull-to-refresh functionality
- [ ] Create today quick-jump gesture
- [ ] Implement double-tap for today

#### 3.4 Enhanced Task List (Native)

- [ ] Section tasks by time blocks (morning/afternoon/evening)
- [ ] Add priority indicators with icons
- [ ] Display task duration
- [ ] Add completion with animation
- [ ] Implement swipe-to-complete

---

### Phase 4: API Enhancements

#### 4.1 New Calendar Endpoints

- [ ] `getTaskStats` - Monthly statistics
  - Completion rate
  - Focus area breakdown
  - Streak data
- [ ] `getStreaks` - Completion streaks
- [ ] `rescheduleTask` - Move task to different date
- [ ] `bulkCompleteTasks` - Complete multiple tasks

---

## File Changes Summary

### Web Calendar Files to Modify

| File                                                          | Changes                                  |
| ------------------------------------------------------------- | ---------------------------------------- |
| `apps/web/src/components/calendar/page.tsx`                   | Main layout, view toggle, statistics     |
| `apps/web/src/components/calendar/task-calendar-grid.tsx`     | Week view, enhanced heatmap, animations  |
| `apps/web/src/components/calendar/task-detail-sheet.tsx`      | Quick actions, better styling, edit mode |
| `apps/web/src/components/calendar/components/app-sidebar.tsx` | Enhanced filtering, legend               |

### Native Calendar Files to Modify

| File                                                | Changes                                |
| --------------------------------------------------- | -------------------------------------- |
| `apps/native/app/(tabs)/calendar/index.tsx`         | Bottom sheet, gestures, improved list  |
| `apps/native/components/calendar/calendar-grid.tsx` | Larger cells, better styling, gestures |

### New Files to Create

| File                                                   | Purpose                     |
| ------------------------------------------------------ | --------------------------- |
| `apps/web/src/components/calendar/week-view.tsx`       | Week timeline view (web)    |
| `apps/web/src/components/calendar/calendar-stats.tsx`  | Statistics panel (web)      |
| `apps/web/src/components/calendar/task-popover.tsx`    | Quick task actions popover  |
| `apps/native/components/calendar/week-view.tsx`        | Week timeline view (native) |
| `apps/native/components/calendar/day-bottom-sheet.tsx` | Task bottom sheet (native)  |

### API Files to Modify

| File                                   | Changes                                      |
| -------------------------------------- | -------------------------------------------- |
| `packages/api/src/routers/calendar.ts` | New endpoints for stats, streaks, reschedule |

---

## Dependencies to Add (if needed)

- `@dnd-kit/core` - Drag and drop (web)
- `@dnd-kit/sortable` - Sortable lists (web)
- `react-beautiful-dnd` - Alternative drag-drop (web)

---

## Design System

### Color Palette

- **Primary**: Accent color from theme
- **Success**: Green (completed tasks)
- **Warning**: Yellow (partial completion)
- **Danger**: Red (missed tasks)
- **Focus Areas**: Configurable colors per area

### Typography

- **Day number**: Bold, larger size
- **Task text**: Readable size with truncation
- **Statistics**: Large numbers, clear labels

### Spacing

- **Cell padding**: Generous spacing
- **Task margins**: Clear separation
- **Section gaps**: Visual hierarchy

---

## Execution Order

### Step 1: Web Calendar Grid (Priority)

1. Enlarge calendar cells
2. Improve heatmap colors
3. Add week view toggle
4. Implement task cards

### Step 2: Web Task Experience

1. Task detail sheet improvements
2. Quick actions (hover complete)
3. Focus area filtering enhancement
4. Statistics panel

### Step 3: Native Calendar Grid

1. Increase touch targets
2. Improve visual design
3. Add week view
4. Implement gestures

### Step 4: Native Task Experience

1. Bottom sheet integration
2. Enhanced task list
3. Section by time blocks
4. Swipe actions

### Step 5: API Enhancements

1. Statistics endpoints
2. Streak tracking
3. Task rescheduling
4. Bulk operations

---

## Success Criteria

### Visual

- [ ] Clean, modern design
- [ ] Consistent with app theme
- [ ] Smooth animations
- [ ] Excellent readability

### Functional

- [ ] Week view works smoothly
- [ ] Task actions are intuitive
- [ ] Filtering is powerful but simple
- [ ] Statistics provide insights

### Performance

- [ ] Fast page load
- [ ] Smooth animations (60fps)
- [ ] Efficient re-renders
- [ ] No layout shifts

### Cross-Platform

- [ ] Consistent experience
- [ ] Web and native feel related
- [ ] Shared design language
- [ ] Platform-appropriate patterns
