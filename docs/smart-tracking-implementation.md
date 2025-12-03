# Smart Tracking Implementation Plan

## Overview

This document outlines the implementation plan for Smart Tracking features in the My Better T app, including status tracking, streaks, and AI check-ins.

## Current State Analysis

### ✅ What's Already Implemented

- **Complete Database Schema**: Tasks, habits, goals with proper status tracking
  - Tasks: `pending`, `completed`, `skipped` status
  - Habits: `completed`, `partial`, `skipped` status
  - Goals: `active`, `completed`, `archived` status
- **Streak Calculation**: Built-in streak tracking for habits with automatic updates
- **Comprehensive Queries**: All database operations for tasks, habits, and goals
- **AI Integration**: Advanced AI service for suggestions and planning
- **Basic UI Foundation**: React Native app with HeroUI components and navigation

### ❌ What's Missing

- Task/Habit CRUD API endpoints
- UI components for task and habit management
- Status tracking interfaces
- AI check-in system

## Implementation Plan

### Phase 1: Backend API Development

#### 1.1 Create Task Management API Routes

**File**: `packages/api/src/routers/tasks.ts`

**Endpoints to implement**:
- `getTasks` - Get user's tasks with filters
- `createTask` - Create new task
- `updateTask` - Update task details
- `deleteTask` - Delete task
- `completeTask` - Mark task as completed
- `skipTask` - Mark task as skipped with reason
- `getTodayTasks` - Get today's tasks
- `getOverdueTasks` - Get overdue tasks

**Features**:
- Status updates (pending → completed/skipped)
- Recurring task handling
- Priority filtering
- Goal association

#### 1.2 Create Habit Management API Routes

**File**: `packages/api/src/routers/habits.ts`

**Endpoints to implement**:
- `getHabits` - Get user's habits
- `createHabit` - Create new habit
- `updateHabit` - Update habit details
- `deleteHabit` - Delete habit
- `logHabit` - Log daily habit completion
- `getHabitLogs` - Get habit history
- `getHabitStreak` - Get current streak

**Features**:
- Daily habit logging
- Automatic streak calculation
- Progress tracking
- Frequency management (daily/weekly/monthly)

#### 1.3 Create Goal Management API Routes

**File**: `packages/api/src/routers/goals.ts`

**Endpoints to implement**:
- `getGoals` - Get user's goals
- `createGoal` - Create new goal
- `updateGoal` - Update goal details
- `deleteGoal` - Delete goal
- `getGoalProgress` - Get goal completion progress
- `updateGoalProgress` - Recalculate goal progress

**Features**:
- Automatic progress calculation based on task completion
- Category management
- Progress tracking (0-100%)

#### 1.4 Update Main Router

**File**: `packages/api/src/routers/index.ts`

Add new routers to the main app router:
```typescript
export const appRouter = {
  // ... existing routes
  tasks: TaskRouter,
  habits: HabitRouter,
  goals: GoalRouter,
};
```

### Phase 2: Smart Status Tracking UI

#### 2.1 Task Status Components

**File**: `apps/native/components/task-status-toggle.tsx`

**Features**:
- Checkbox-style completion (✔️)
- Skip button with reason input (❌)
- Undo functionality
- Optimistic updates
- Haptic feedback

**UI Elements**:
- Circular checkbox for completion
- Skip button with modal for reason
- Swipe gestures for quick actions
- Status badges (pending/completed/skipped)

#### 2.2 Habit Tracking Components

**File**: `apps/native/components/habit-tracker.tsx`

**Features**:
- Daily habit logging interface
- Streak visualization (fire icons, counters)
- Progress indicators
- Calendar view for habit history
- Quick check-in buttons

**UI Elements**:
- Streak counter with fire emoji
- Daily check-in cards
- Progress rings/circles
- Habit completion calendar

#### 2.3 Task Management Screens

**File**: `apps/native/app/(drawer)/(tabs)/tasks.tsx`

**Features**:
- Today's tasks view
- Task creation/editing forms
- Status management interface
- Filtering and sorting
- Search functionality

**UI Sections**:
- Today's tasks header
- Task list with status toggles
- Floating action button for new tasks
- Filter/sort options
- Task detail modal

#### 2.4 Habit Management Screens

**File**: `apps/native/app/(drawer)/(tabs)/habits.tsx`

**Features**:
- Habit list with streaks
- Daily check-in interface
- Habit creation/editing forms
- Progress analytics
- Habit history view

**UI Sections**:
- Habit cards with streak counters
- Today's check-in section
- Add habit button
- Progress overview
- Habit statistics

### Phase 3: AI Check-in System

#### 3.1 AI Check-in Service

**File**: `packages/api/src/services/ai-checkin-service.ts`

**Features**:
- Check-in prompt generation
- Smart timing based on user patterns
- Contextual questions
- Response tracking

**Check-in Types**:
- Morning daily planning
- Afternoon progress check
- Evening completion review
- Task-specific reminders

#### 3.2 Check-in API Endpoints

**File**: `packages/api/src/routers/ai.ts` (extend existing)

**New Endpoints**:
- `generateCheckin` - Generate AI check-in prompt
- `respondToCheckin` - Record user response
- `getCheckinHistory` - Get check-in history
- `scheduleCheckin` - Schedule future check-ins

**Features**:
- Contextual prompt generation
- User response tracking
- Check-in effectiveness metrics
- Personalized timing

#### 3.3 Check-in UI Components

**File**: `apps/native/components/ai-checkin.tsx`

**Features**:
- Modal/popup for check-in prompts
- Quick response buttons (Yes/No/Snooze)
- Progress indicators
- Dismiss options

**UI Elements**:
- Full-screen modal for check-ins
- AI-generated question display
- Response buttons with icons
- Snooze duration selector
- Progress towards daily goals

### Phase 4: Integration & Enhancement

#### 4.1 Navigation Updates

**Files to modify**:
- `apps/native/app/(drawer)/(tabs)/_layout.tsx`
- `apps/native/app/(drawer)/_layout.tsx`

**Changes**:
- Add Tasks and Habits tabs to navigation
- Update drawer navigation menu
- Add deep linking for specific tasks/habits
- Update tab icons and labels

#### 4.2 Dashboard Enhancements

**File**: `apps/native/app/(drawer)/(tabs)/index.tsx` (enhance existing)

**New Features**:
- Today's progress overview
- Streak counters
- Completion rate statistics
- Quick action buttons
- AI check-in prompts

**UI Additions**:
- Progress cards for tasks/habits
- Streak celebration animations
- Daily completion percentage
- Quick add buttons
- Check-in notification area

#### 4.3 Real-time Updates

**Features**:
- Optimistic updates for immediate feedback
- Real-time sync for status changes
- Cache management for offline support
- Conflict resolution

**Implementation**:
- TanStack Query for data fetching
- Local storage for offline caching
- Background sync when online
- Error handling and retry logic

## Technical Implementation Details

### Status Tracking Logic

```typescript
// Task status flow
pending → completed (with timestamp)
pending → skipped (with reason and timestamp)

// Habit status flow
partial → completed (with value and timestamp)
partial → skipped (with reason and timestamp)

// Streak calculation
consecutive completed days → streak increment
missed day → streak reset to 0
```

### AI Check-in Timing

- **Morning Check-ins**: 8-10 AM for daily planning
- **Afternoon Check-ins**: 2-4 PM for progress review
- **Evening Check-ins**: 7-9 PM for completion verification
- **Contextual Prompts**: Based on due dates and task patterns

### Data Flow Architecture

1. **User Interaction**: UI component captures user action
2. **Optimistic Update**: Immediate UI feedback
3. **API Call**: Backend updates database
4. **Trigger Effects**: Streak recalculation, goal progress update
5. **AI Integration**: Generate contextual check-ins
6. **Real-time Sync**: Update all connected clients

### Database Schema Enhancements

The existing schema supports most features, but we may need:

```sql
-- Check-in responses table
CREATE TABLE checkin_responses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  checkin_id TEXT NOT NULL,
  response TEXT NOT NULL,
  response_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task completion history
CREATE TABLE task_completion_history (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## UI/UX Design Considerations

### Visual Design
- **Status Indicators**: Clear visual feedback for completed/skipped items
- **Streak Visualization**: Fire icons, progress rings, celebration animations
- **Check-in Modals**: Non-intrusive but attention-grabbing design
- **Micro-interactions**: Haptic feedback, smooth transitions

### User Experience
- **Quick Actions**: One-tap completion, swipe gestures
- **Undo Functionality**: Easy reversal of accidental actions
- **Progress Motivation**: Visual streaks, achievement celebrations
- **Smart Reminders**: Contextual, non-spammy notifications

## Performance Considerations

### Frontend Optimization
- **Lazy Loading**: Load tasks/habits in chunks
- **Optimistic Updates**: Immediate UI feedback
- **Local Caching**: Offline-first approach
- **Background Sync**: Efficient data synchronization

### Backend Optimization
- **Database Indexing**: Optimize query performance
- **Caching Strategy**: Redis for frequently accessed data
- **Rate Limiting**: Prevent API abuse
- **Batch Operations**: Efficient bulk updates

## Testing Strategy

### Unit Tests
- API endpoint testing
- Database query validation
- Component unit tests
- Business logic verification

### Integration Tests
- End-to-end user flows
- API integration testing
- Database integration
- AI service integration

### User Testing
- Usability testing for new features
- A/B testing for check-in timing
- Performance testing on devices
- Accessibility testing

## Deployment Plan

### Phase 1 (Week 1-2)
- Backend API development
- Database schema updates
- Basic UI components

### Phase 2 (Week 3-4)
- Task management screens
- Habit tracking components
- Status tracking functionality

### Phase 3 (Week 5-6)
- AI check-in system
- Advanced UI features
- Integration testing

### Phase 4 (Week 7-8)
- Dashboard enhancements
- Performance optimization
- User testing and refinement

## Success Metrics

### Engagement Metrics
- Daily active users
- Task completion rates
- Habit streak consistency
- Check-in response rates

### User Satisfaction
- App store ratings
- User feedback scores
- Feature adoption rates
- Retention metrics

### Technical Performance
- API response times
- App crash rates
- Offline functionality
- Battery usage optimization

## Future Enhancements

### Advanced Features
- Machine learning for habit prediction
- Social features for accountability
- Advanced analytics and insights
- Integration with calendar apps

### Platform Expansion
- Web application
- Desktop application
- Wear OS integration
- Smart home integration

---

This implementation plan provides a comprehensive roadmap for adding Smart Tracking features to the My Better T app, building on the existing robust foundation while delivering user-centric functionality for task management, habit tracking, and AI-powered check-ins.