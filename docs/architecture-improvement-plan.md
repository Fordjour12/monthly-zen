# Improved Task and Habit Architecture Plan

## Executive Summary
This plan redesigns the task and habit system to **simplify and decouple AI from basic operations** while maintaining an **AI-first approach**. The new architecture separates core functionality from AI enhancements, resulting in a more maintainable, scalable, and reliable system.

## Current Issues Identified

1. **Missing Core CRUD Operations** - No dedicated routers for basic task/habit management
2. **Overly Complex Schema** - Tasks table mixes basic properties with AI-specific fields
3. **Inconsistent Data Flow** - All operations routed through AI service unnecessarily
4. **Limited Habit Features** - Incomplete implementation despite good schema design
5. **Performance Concerns** - Heavy AI dependency for simple operations

## Proposed Architecture

### 1. Separation of Concerns Pattern

```
┌─────────────────────────────────────────────────┐
│                    Presentation                 │
│                (React Native Frontend)          │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│                 API Gateway                      │
│         (Unified Router with Orchestration)      │
└─────────────┬───────────────┬───────────────────┘
              │               │
┌─────────────▼───────┐ ┌─────▼───────────────────┐
│   Core Services     │ │     AI Services         │
│                     │ │                         │
│ • TaskService       │ │ • PlanningService       │
│ • HabitService      │ │ • SchedulingService     │
│ • AnalyticsService  │ │ • ClassificationService │
│ • ValidationService │ │ • InsightService        │
└─────────────┬───────┘ └─────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│              Event Bus                           │
│          (Decoupled Communication)               │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│              Data Layer                          │
│         (Refactored Schema & Queries)            │
└─────────────────────────────────────────────────┘
```

### 2. Database Schema Refactoring

#### Current Tasks Table Issues
- Too many AI-specific fields directly in tasks table
- Mixing scheduling metadata with core task properties
- Tight coupling to AI planning features

#### Proposed Solution: Split Tables

**Core Tasks Table** (simplified):
```typescript
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("medium"),
  dueDate: integer("due_date", { mode: "timestamp_ms" }),
  isRecurring: integer("is_recurring", { mode: "boolean" }).default(false),
  recurrenceRule: text("recurrence_rule"),
  source: text("source").default("manual"), // "manual" | "ai" | "import"
  metadata: text("metadata"), // JSON for extensibility
  createdAt: integer("created_at").default(sql`...`),
  updatedAt: integer("updated_at").default(sql`...`).$onUpdate(() => new Date()),
});
```

**Task Schedule Table** (AI-scheduling data):
```typescript
export const taskSchedules = sqliteTable("task_schedules", {
  id: text("id").primaryKey(),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  startTime: integer("start_time", { mode: "timestamp_ms" }),
  endTime: integer("end_time", { mode: "timestamp_ms" }),
  estimatedDuration: integer("estimated_duration"),
  dayOfWeek: text("day_of_week"),
  weekNumber: integer("week_number"),
  timeBlock: text("time_block"),
  planContext: text("plan_context"),
  calendarEventId: text("calendar_event_id"),
  createdById: text("created_by").references(() => aiSuggestions.id),
  createdAt: integer("created_at").default(sql`...`),
});
```

**Enhanced Habits Table** (improved tracking):
```typescript
export const habits = sqliteTable("habits", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull().default("daily"),
  targetValue: integer("target_value").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  bestTime: text("best_time"),
  triggerActivity: text("trigger_activity"),
  reminderTime: text("reminder_time"), // HH:MM format
  milestoneValue: integer("milestone_value"), // Next milestone
  milestoneReward: text("milestone_reward"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  metadata: text("metadata"),
  createdAt: integer("created_at").default(sql`...`),
  updatedAt: integer("updated_at").default(sql`...`).$onUpdate(() => new Date()),
});
```

### 3. API Layer Redesign

#### New Router Structure
```
/packages/api/src/routers/
├── index.ts          # Main router with authentication
├── tasks.ts          # Core task CRUD operations
├── habits.ts         # Enhanced habit management
├── analytics.ts      # Analytics and insights
└── ai/
    ├── index.ts      # AI-enhanced features
    ├── planning.ts   # Monthly planning
    ├── scheduling.ts # Smart scheduling
    └── insights.ts   # AI-powered insights
```

#### Core Task Router (`tasks.ts`)
```typescript
export const taskRouter = router({
  // Basic CRUD
  create: protectedProcedure
    .input(createTaskSchema)
    .mutation(async ({ input, ctx }) => {
      const task = await taskService.create(ctx.user.id, input);

      // Emit event for AI services (async)
      eventBus.emit('task:created', { task, userId: ctx.user.id });

      return task;
    }),

  update: protectedProcedure
    .input(updateTaskSchema)
    .mutation(async ({ input, ctx }) => {
      const task = await taskService.update(ctx.user.id, input);

      eventBus.emit('task:updated', { task, userId: ctx.user.id });

      return task;
    }),

  list: protectedProcedure
    .input(listTasksSchema)
    .query(({ input, ctx }) => taskService.list(ctx.user.id, input)),

  // Bulk operations
  bulkUpdate: protectedProcedure
    .input(bulkUpdateTasksSchema)
    .mutation(({ input, ctx }) => taskService.bulkUpdate(ctx.user.id, input)),
});
```

### 4. Service Layer Architecture

#### Core Task Service (`services/core/task-service.ts`)
```typescript
export class TaskService {
  // Pure business logic - no AI dependencies
  async create(userId: string, data: CreateTaskInput): Promise<Task> {
    // Validation
    await this.validateTask(userId, data);

    // Create without AI interference
    return await db.insert(tasks).values({
      id: generateId(),
      userId,
      ...data,
      source: data.source || 'manual'
    }).returning().then(rows => rows[0]);
  }

  async update(userId: string, data: UpdateTaskInput): Promise<Task> {
    const task = await this.findUserTask(userId, data.id);

    // Only update allowed fields
    const updates = this.sanitizeUpdates(data);

    return await db.update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(tasks.id, data.id), eq(tasks.userId, userId)))
      .returning()
      .then(rows => rows[0]);
  }

  // Recurring task handling
  async createRecurring(userId: string, data: CreateRecurringTaskInput): Promise<Task[]> {
    const baseTask = await this.create(userId, {
      ...data,
      isRecurring: true,
      recurrenceRule: data.recurrenceRule
    });

    // Generate instances based on recurrence
    return await this.generateRecurringInstances(baseTask);
  }
}
```

#### AI Enhancement Service (`services/ai/enhancement-service.ts`)
```typescript
export class AIEnhancementService {
  // Listens to events and provides AI enhancements
  async enhanceTask(task: Task): Promise<TaskEnhancement> {
    const enhancements = await Promise.allSettled([
      this.suggestOptimalTime(task),
      this.estimateDuration(task),
      this.identifyDependencies(task),
      this.generateSubtasks(task)
    ]);

    return {
      optimalSchedule: enhancements[0].status === 'fulfilled' ? enhancements[0].value : null,
      estimatedDuration: enhancements[1].status === 'fulfilled' ? enhancements[1].value : null,
      dependencies: enhancements[2].status === 'fulfilled' ? enhancements[2].value : [],
      subtasks: enhancements[3].status === 'fulfilled' ? enhancements[3].value : []
    };
  }
}
```

### 5. Event-Driven Integration

#### Event Bus (`services/integration/event-bus.ts`)
```typescript
export class EventBus {
  private emitter = new EventEmitter();

  // Core events
  on(event: 'task:created', handler: (data: { task: Task, userId: string }) => void);
  on(event: 'task:completed', handler: (data: { task: Task, userId: string }) => void);
  on(event: 'habit:logged', handler: (data: { log: HabitLog, userId: string }) => void);

  // AI enhancement events
  emit(event: 'task:created', data: any): void {
    this.emitter.emit(event, data);

    // AI enhancements run asynchronously
    this.scheduleAIEnhancements(data);
  }

  private async scheduleAIEnhancements(data: any) {
    // Non-blocking AI enhancements
    setTimeout(async () => {
      try {
        await aiEnhancementService.enhance(data);
      } catch (error) {
        logger.error('AI enhancement failed', error);
      }
    }, 0);
  }
}
```

### 6. Frontend Architecture Updates

#### State Management Separation
```typescript
// Core state (works without AI)
export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// AI enhancements (optional)
export const useTaskEnhancements = (taskId: string) => {
  return useQuery({
    queryKey: ['task-enhancements', taskId],
    queryFn: () => api.ai.getTaskEnhancements(taskId),
    enabled: !!taskId,
    staleTime: 30 * 60 * 1000 // 30 minutes
  });
};
```

#### Component Architecture
```
components/
├── tasks/
│   ├── TaskCard.tsx          # Core task display
│   ├── TaskForm.tsx          # Basic task CRUD
│   ├── TaskList.tsx          # List with filtering
│   └── enhancements/
│       ├── AITimeSuggestion.tsx
│       ├── SmartSubtasks.tsx
│       └── PredictiveDueDate.tsx
├── habits/
│   ├── HabitTracker.tsx      # Core tracking
│   ├── HabitCalendar.tsx     # Visual progress
│   ├── StreakDisplay.tsx     # Streak visualization
│   └── enhancements/
│       ├── SmartReminders.tsx
│       └── MilestoneAlerts.tsx
```

## Migration Strategy

### Phase 1: Database Migration (Week 1-2)
1. Create new tables with simplified schema
2. Migrate existing data
3. Create migration scripts for backward compatibility
4. Update query functions

### Phase 2: Service Layer Refactoring (Week 3-4)
1. Implement core services without AI dependencies
2. Create event bus system
3. Implement AI enhancement services
4. Add comprehensive testing

### Phase 3: API Layer Updates (Week 5-6)
1. Create dedicated task and habit routers
2. Implement all CRUD operations
3. Refactor AI router to focus on enhancements
4. Update API documentation

### Phase 4: Frontend Updates (Week 7-8)
1. Update components to use new API endpoints
2. Implement offline support for core operations
3. Add AI enhancement components
4. Performance optimizations

### Phase 5: Testing & Deployment (Week 9-10)
1. Integration testing
2. Performance testing
3. User acceptance testing
4. Gradual rollout with feature flags

## Benefits of New Architecture

1. **Simplified Core Operations** - Basic CRUD works without AI dependencies
2. **Better Performance** - Reduced latency for common operations
3. **Improved Maintainability** - Clear separation of concerns
4. **Enhanced Reliability** - System works even when AI services are down
5. **Flexible AI Integration** - AI features can be toggled or A/B tested
6. **Easier Testing** - Core logic can be tested independently
7. **Better Scalability** - Services can be scaled independently

## Implementation Order Priority

### Priority 1 (Critical Path)
1. Database schema refactoring
2. Core Task Service implementation
3. Basic Task Router
4. Frontend task management updates

### Priority 2 (Enhancement)
1. Event bus implementation
2. AI enhancement services
3. Habit service improvements
4. Analytics service

### Priority 3 (Polish)
1. Advanced AI features
2. Performance optimizations
3. Additional integrations
4. Monitoring and analytics

This architecture maintains the AI-first vision while creating a robust foundation where AI enhances rather than blocks core functionality.