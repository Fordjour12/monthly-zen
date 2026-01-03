# Calendar Feature Implementation Plan

## Current State Analysis

**Existing Assets:**

- `apps/web/src/components/calendar/` - Basic UI shell with sidebar, date picker, and calendar filters
- `apps/web/src/components/ui/calendar.tsx` - react-day-picker wrapper
- Database schema: `planTasks` table with `startTime`, `endTime`, `focusArea`, `difficultyLevel`, `isCompleted`
- Query functions: `getCurrentMonthlyPlanWithTasks`, `getTasksByPlanId`, `updateTaskStatus`
- Dashboard links to `/calendar` but calendar only shows placeholder grid

**Missing Functionality:**

1. No real task data displayed on calendar
2. No month navigation with data fetching
3. No task detail view when clicking on days
4. Filters are static (not connected to real focus areas)
5. No task completion toggle from calendar view

---

## Design Decisions (Finalized)

| Decision             | Choice                                            | Rationale                                                                                         |
| -------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Task Detail View** | Sheet (side slide-over)                           | Maintains calendar context, follows existing shadcn patterns, industry standard for calendars     |
| **Add Task Feature** | Interim redirect to `/generate`, full modal in V2 | Ships working calendar first, task creation adds significant form complexity                      |
| **Task Drag & Drop** | Skip for MVP                                      | High complexity, conflicts with AI-generated plan logic, "Reschedule" modal is better alternative |
| **Mobile Sidebar**   | Hidden by default, slide-up drawer                | Preserves calendar grid real estate, matches existing responsive patterns                         |

---

## Implementation Plan

### Phase 1: Backend API Extensions

**New Query Functions** (`packages/db/src/queries/calendar.ts`):

```typescript
export async function getTasksByDateRange(userId: string, startDate: Date, endDate: Date) {
  const result = await db
    .select({
      id: planTasks.id,
      taskDescription: planTasks.taskDescription,
      focusArea: planTasks.focusArea,
      startTime: planTasks.startTime,
      endTime: planTasks.endTime,
      difficultyLevel: planTasks.difficultyLevel,
      isCompleted: planTasks.isCompleted,
      completedAt: planTasks.completedAt,
    })
    .from(planTasks)
    .innerJoin(monthlyPlans, eq(planTasks.planId, monthlyPlans.id))
    .where(
      and(
        eq(monthlyPlans.userId, userId),
        gte(planTasks.startTime, startDate),
        lte(planTasks.startTime, endDate)
      )
    )
    .orderBy(planTasks.startTime);
  return result;
}

export async function getTasksByDay(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select()
    .from(planTasks)
    .innerJoin(monthlyPlans, eq(planTasks.planId, monthlyPlans.id))
    .where(
      and(
        eq(monthlyPlans.userId, userId),
        gte(planTasks.startTime, startOfDay),
        lte(planTasks.startTime, endOfDay)
      )
    )
    .orderBy(planTasks.startTime);
  return result;
}

export async function getUniqueFocusAreas(userId: string) {
  const result = await db
    .selectDistinct({
      focusArea: planTasks.focusArea,
    })
    .from(planTasks)
    .innerJoin(monthlyPlans, eq(planTasks.planId, monthlyPlans.id))
    .where(eq(monthlyPlans.userId, userId));

  // Get counts per focus area
  const focusAreas = await Promise.all(
    result.map(async ({ focusArea }) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(planTasks)
        .innerJoin(monthlyPlans, eq(planTasks.planId, monthlyPlans.id))
        .where(
          and(
            eq(monthlyPlans.userId, userId),
            eq(planTasks.focusArea, focusArea)
          )
        );
      return { name: focusArea, count };
    })
  );
  return focusAreas;
}
```

**Update** `packages/db/src/queries/index.ts`:

```typescript
export * from './calendar';
```

**New API Routes** (`packages/api/src/routers/calendar.ts`):

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  getTasksByDateRange,
  getTasksByDay,
  getUniqueFocusAreas,
  updateTaskStatus
} from '@testing-server/db';
import { getCurrentMonthlyPlanWithTasks } from '@testing-server/db';

export const calendarRouter = new Hono();

// GET /api/calendar/tasks?month=2024-12
calendarRouter.get('/tasks', zValidator('query', z.object({
  month: z.string()
})), async (c) => {
  try {
    const { month } = c.req.valid('query');
    const session = c.get('session');

    if (!session?.user?.id) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const userId = session.user.id;
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    const tasks = await getTasksByDateRange(userId, startDate, endDate);

    return c.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching monthly tasks:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch tasks'
    }, 500);
  }
});

// GET /api/calendar/tasks/day?date=2024-12-15
calendarRouter.get('/tasks/day', zValidator('query', z.object({
  date: z.string()
})), async (c) => {
  try {
    const { date } = c.req.valid('query');
    const session = c.get('session');

    if (!session?.user?.id) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const userId = session.user.id;
    const selectedDate = new Date(date);

    const tasks = await getTasksByDay(userId, selectedDate);

    return c.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch tasks'
    }, 500);
  }
});

// GET /api/calendar/focus-areas
calendarRouter.get('/focus-areas', async (c) => {
  try {
    const session = c.get('session');

    if (!session?.user?.id) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const userId = session.user.id;
    const focusAreas = await getUniqueFocusAreas(userId);

    // Assign consistent colors to focus areas
    const colorPalette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const focusAreasWithColors = focusAreas.map((fa, i) => ({
      ...fa,
      color: colorPalette[i % colorPalette.length]
    }));

    return c.json({ success: true, data: focusAreasWithColors });
  } catch (error) {
    console.error('Error fetching focus areas:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch focus areas'
    }, 500);
  }
});

// PATCH /api/calendar/tasks/:taskId/complete
calendarRouter.patch('/tasks/:taskId/complete', zValidator('json', z.object({
  isCompleted: z.boolean()
})), async (c) => {
  try {
    const taskId = parseInt(c.req.param('taskId'));
    const { isCompleted } = c.req.valid('json');

    const updatedTask = await updateTaskStatus(taskId, isCompleted, isCompleted ? new Date() : null);

    return c.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Error updating task status:', error);
    return c.json({
      success: false,
      error: 'Failed to update task status'
    }, 500);
  }
});
```

**Update** `apps/server/src/router/index.ts`:

```typescript
import { calendarRouter } from '@testing-server/api';
// ...
app.route('/api/calendar', calendarRouter);
```

---

### Phase 2: Frontend Server Functions

**New File:** `apps/web/src/functions/calendar-server-fn.ts`

```typescript
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

// Get tasks for a specific month
export const getTasksForMonth = createServerFn({ method: 'GET' })
  .validator(z.object({
    month: z.string()
  }))
  .handler(async ({ data }) => {
    try {
      const response = await fetch('/api/calendar/tasks?' + new URLSearchParams({ month: data.month }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching monthly tasks:', error);
      throw error;
    }
  });

// Get tasks for a specific day
export const getTasksForDay = createServerFn({ method: 'GET' })
  .validator(z.object({
    date: z.string()
  }))
  .handler(async ({ data }) => {
    try {
      const response = await fetch('/api/calendar/tasks/day?' + new URLSearchParams({ date: data.date }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
      throw error;
    }
  });

// Get focus areas for filtering
export const getFocusAreas = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const response = await fetch('/api/calendar/focus-areas');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch focus areas');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching focus areas:', error);
      throw error;
    }
  });

// Update task completion status
export const updateTaskCompletion = createServerFn({ method: 'POST' })
  .validator(z.object({
    taskId: z.number(),
    isCompleted: z.boolean()
  }))
  .handler(async ({ data }) => {
    try {
      const response = await fetch(`/api/calendar/tasks/${data.taskId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: data.isCompleted })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating task completion:', error);
      throw error;
    }
  });
```

---

### Phase 3: Calendar Page Components

**New File:** `apps/web/src/components/calendar/task-calendar-grid.tsx`

```typescript
"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CalendarTask {
  id: number
  taskDescription: string
  focusArea: string
  startTime: Date
  endTime: Date
  difficultyLevel: 'simple' | 'moderate' | 'advanced'
  isCompleted: boolean
}

interface TaskCalendarGridProps {
  tasks: CalendarTask[]
  selectedMonth: Date
  onMonthChange: (month: Date) => void
  onDateSelect: (date: Date) => void
}

export function TaskCalendarGrid({
  tasks,
  selectedMonth,
  onMonthChange,
  onDateSelect
}: TaskCalendarGridProps) {
  // Group tasks by date
  const tasksByDate = React.useMemo(() => {
    const grouped: Record<string, CalendarTask[]> = {}
    tasks.forEach(task => {
      const dateKey = task.startTime.toISOString().split('T')[0]
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(task)
    })
    return grouped
  }, [tasks])

  const hasTasksOnDay = (date: Date): CalendarTask[] | null => {
    const dateKey = date.toISOString().split('T')[0]
    return tasksByDate[dateKey] || null
  }

  const completedCount = (tasks: CalendarTask[]): number => {
    return tasks.filter(t => t.isCompleted).length
  }

  const getTaskColor = (tasks: CalendarTask[]): string => {
    if (tasks.every(t => t.isCompleted)) return 'bg-green-500'
    if (tasks.some(t => t.isCompleted)) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const modifiers = React.useMemo(() => {
    const modifiers: Record<string, boolean | Date[]> = {}
    Object.keys(tasksByDate).forEach(dateKey => {
      modifiers[dateKey] = true
    })
    return modifiers
  }, [tasksByDate])

  return (
    <Calendar
      month={selectedMonth}
      onMonthChange={onMonthChange}
      mode="single"
      selected={selectedMonth}
      onSelect={(date) => date && onDateSelect(date)}
      className="rounded-md border"
      modifiers={modifiers}
      modifiersStyles={{
        hasTasks: {
          position: 'relative'
        }
      }}
      components={{
        Day: ({ date, modifiers, ...props }) => {
          const dayTasks = hasTasksOnDay(date)
          const isToday = new Date().toDateString() === date.toDateString()

          return (
            <div
              {...props}
              className={cn(
                "relative h-24 w-full p-2",
                "hover:bg-accent hover:text-accent-foreground",
                "transition-colors",
                isToday && "bg-muted",
                props.className
              )}
              onClick={() => onDateSelect(date)}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-sm",
                  isToday && "font-bold"
                )}>
                  {date.getDate()}
                </span>
                {dayTasks && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 min-w-5 px-1 text-xs",
                      getTaskColor(dayTasks),
                      dayTasks.every(t => t.isCompleted) && "bg-green-100 text-green-700"
                    )}
                  >
                    {dayTasks.length}
                  </Badge>
                )}
              </div>

              {dayTasks && dayTasks.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "truncate text-xs px-1 rounded",
                        task.isCompleted
                          ? "bg-green-100 text-green-700 line-through"
                          : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {task.taskDescription}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        }
      }}
    />
  )
}
```

**New File:** `apps/web/src/components/calendar/task-detail-sheet.tsx`

```typescript
"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Plus, CheckCircle, Clock } from "lucide-react"
import { updateTaskCompletion } from "@/functions/calendar-server-fn"

interface CalendarTask {
  id: number
  taskDescription: string
  focusArea: string
  startTime: Date
  endTime: Date
  difficultyLevel: 'simple' | 'moderate' | 'advanced'
  isCompleted: boolean
  schedulingReason?: string
}

interface TaskDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  date: Date
  tasks: CalendarTask[]
  onTaskUpdate?: () => void
}

const DIFFICULTY_COLORS = {
  simple: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700'
}

const DIFFICULTY_LABELS = {
  simple: 'Simple',
  moderate: 'Moderate',
  advanced: 'Advanced'
}

export function TaskDetailSheet({
  isOpen,
  onClose,
  date,
  tasks,
  onTaskUpdate
}: TaskDetailSheetProps) {
  const [optimisticTasks, setOptimisticTasks] = React.useState<CalendarTask[]>(tasks)
  const [isUpdating, setIsUpdating] = React.useState<number | null>(null)

  React.useEffect(() => {
    setOptimisticTasks(tasks)
  }, [tasks])

  const handleTaskToggle = async (taskId: number, newStatus: boolean) => {
    setIsUpdating(taskId)

    // Optimistically update UI
    setOptimisticTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, isCompleted: newStatus } : task
      )
    )

    try {
      await updateTaskCompletion({ taskId, isCompleted: newStatus })
      onTaskUpdate?.()
    } catch (error) {
      // Revert on error
      setOptimisticTasks(tasks)
      console.error('Failed to update task:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const completedCount = optimisticTasks.filter(t => t.isCompleted).length
  const totalCount = optimisticTasks.length

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(date, 'MMMM d, yyyy')}
          </SheetTitle>
          <SheetDescription>
            {totalCount === 0
              ? 'No tasks scheduled for this day'
              : `${completedCount} of ${totalCount} tasks completed`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {totalCount === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tasks for this day</p>
              <Button
                variant="outline"
                className="mt-4"
                asChild
              >
                <a href="/generate">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tasks
                </a>
              </Button>
            </div>
          ) : (
            optimisticTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "border rounded-lg p-4 space-y-3 transition-colors",
                  task.isCompleted && "bg-muted/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.isCompleted}
                    disabled={isUpdating === task.id}
                    onCheckedChange={(checked) =>
                      handleTaskToggle(task.id, checked as boolean)
                    }
                    className="mt-1"
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "font-medium",
                        task.isCompleted && "line-through text-muted-foreground"
                      )}>
                        {task.taskDescription}
                      </p>
                      <CheckCircle
                        className={cn(
                          "h-5 w-5 flex-shrink-0",
                          task.isCompleted
                            ? "text-green-500"
                            : "text-muted-foreground"
                        )}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge
                        variant="outline"
                        className={cn(
                          DIFFICULTY_COLORS[task.difficultyLevel]
                        )}
                      >
                        {DIFFICULTY_LABELS[task.difficultyLevel]}
                      </Badge>
                      <Badge variant="secondary">
                        {task.focusArea}
                      </Badge>
                      <span className="text-muted-foreground">
                        {format(task.startTime, 'h:mm a')} - {format(task.endTime, 'h:mm a')}
                      </span>
                    </div>

                    {task.schedulingReason && (
                      <p className="text-sm text-muted-foreground">
                        {task.schedulingReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

**Update:** `apps/web/src/components/calendar/components/app-sidebar.tsx`

```typescript
import * as React from "react"
import { Calendar as CalendarIcon, ChevronRight, Check } from "lucide-react"
import { Calendars } from "./calendars"
import { DatePicker } from "./date-picker"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { getFocusAreas } from "@/functions/calendar-server-fn"

interface FocusArea {
  name: string
  count: number
  color: string
}

export function AppSidebar({
  selectedFocusAreas,
  onToggleFocusArea,
  onTodayClick
}: {
  selectedFocusAreas: string[]
  onToggleFocusArea: (area: string) => void
  onTodayClick: () => void
}) {
  const [focusAreas, setFocusAreas] = React.useState<FocusArea[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const loadFocusAreas = async () => {
      setIsLoading(true)
      try {
        const result = await getFocusAreas()
        if (result.success) {
          setFocusAreas(result.data)
        }
      } catch (error) {
        console.error('Failed to load focus areas:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFocusAreas()
  }, [])

  return (
    <Sidebar>
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <NavUser user={{ name: "User", email: "user@example.com", avatar: "/avatars/default.jpg" }} />
      </SidebarHeader>
      <SidebarContent>
        <div className="px-2 py-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={onTodayClick}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Today
          </Button>
        </div>
        <SidebarSeparator />
        <DatePicker />
        <SidebarSeparator />

        {/* Focus Area Filters */}
        <div className="px-2 py-4">
          <h3 className="text-sm font-medium mb-3 px-2">Focus Areas</h3>
          {isLoading ? (
            <div className="text-sm text-muted-foreground px-2">Loading...</div>
          ) : (
            <SidebarMenu>
              {focusAreas.map((area) => {
                const isSelected = selectedFocusAreas.includes(area.name)
                return (
                  <SidebarMenuItem key={area.name}>
                    <SidebarMenuButton
                      onClick={() => onToggleFocusArea(area.name)}
                      className="w-full justify-between px-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: area.color }}
                        />
                        <span className="flex-1">{area.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {area.count}
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4" />
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          )}
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/generate" className="w-full">
                <span>Create Tasks</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
```

---

### Phase 4: Calendar Page Integration

**Update:** `apps/web/src/components/calendar/page.tsx`

```typescript
"use client"

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { AppSidebar } from './components/app-sidebar'
import { TaskCalendarGrid } from './task-calendar-grid'
import { TaskDetailSheet } from './task-detail-sheet'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useQuery } from '@tanstack/react-query'
import { getTasksForMonth } from "@/functions/calendar-server-fn"

interface CalendarTask {
  id: number
  taskDescription: string
  focusArea: string
  startTime: Date
  endTime: Date
  difficultyLevel: 'simple' | 'moderate' | 'advanced'
  isCompleted: boolean
}

export default function CalendarPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([])

  // Fetch tasks for selected month
  const { data: tasksData, isLoading, error, refetch } = useQuery({
    queryKey: ['calendar-tasks', format(selectedMonth, 'yyyy-MM')],
    queryFn: () => getTasksForMonth({ month: format(selectedMonth, 'yyyy-MM') }),
    enabled: !!selectedMonth
  })

  const tasks: CalendarTask[] = React.useMemo(() => {
    const allTasks = tasksData?.data || []

    // Filter by selected focus areas
    if (selectedFocusAreas.length === 0) return allTasks

    return allTasks.filter(task =>
      selectedFocusAreas.includes(task.focusArea)
    )
  }, [tasksData, selectedFocusAreas])

  const handleMonthChange = (newMonth: Date) => {
    setSelectedMonth(newMonth)
    setSelectedDate(null)
  }

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1))
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1))
    setSelectedDate(null)
  }

  const handleTodayClick = () => {
    setSelectedMonth(new Date())
    setSelectedDate(new Date())
  }

  const handleFocusAreaToggle = (area: string) => {
    setSelectedFocusAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error loading calendar</h2>
          <p className="text-muted-foreground mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar
        selectedFocusAreas={selectedFocusAreas}
        onToggleFocusArea={handleFocusAreaToggle}
        onTodayClick={handleTodayClick}
      />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              disabled={isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Breadcrumb className="flex-1">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {format(selectedMonth, 'MMMM yyyy')}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {isLoading && (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}
        </header>

        <div className="flex flex-1 p-4">
          <TaskCalendarGrid
            tasks={tasks}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
            onDateSelect={setSelectedDate}
          />
        </div>
      </SidebarInset>

      {selectedDate && (
        <TaskDetailSheet
          isOpen={!!selectedDate}
          onClose={() => setSelectedDate(null)}
          date={selectedDate}
          tasks={tasks.filter(task =>
            task.startTime.toDateString() === selectedDate.toDateString()
          )}
          onTaskUpdate={refetch}
        />
      )}
    </SidebarProvider>
  )
}
```

---

### Phase 5: Cross-Page Integration

**Update:** `apps/web/src/routes/dashboard.tsx`

```typescript
// In the "View Calendar" button
<Button variant="outline" size="sm" asChild>
  <Link to="/calendar?month=2024-12">
    <Calendar className="mr-2 h-4 w-4" />
    View Calendar
  </Link>
</Button>
```

**Update:** `apps/web/src/routes/calendar.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import CalendarPage from '@/components/calendar/page'
import { useSearch } from '@tanstack/react-router'

export const Route = createFileRoute('/calendar')({
  component: CalendarComponent,
})

function CalendarComponent() {
  const search = useSearch({ from: '/calendar' })
  const monthParam = search.month as string | undefined

  // Pass month prop to CalendarPage if provided
  return <CalendarPage initialMonth={monthParam} />
}
```

---

## Technical Decisions Summary

### Calendar Display Strategy

| Aspect            | Decision                                | Rationale                                  |
| ----------------- | --------------------------------------- | ------------------------------------------ |
| Visual indicators | Color-coded task previews in grid cells | Shows task density, quick scan             |
| Task count        | Badge with number per day               | Provides at-a-glance info                  |
| Colors            | Green=completed, Blue=pending           | Industry standard, clear                   |
| Detail view       | Sheet from right side                   | Maintains context, follows shadcn patterns |
| Mobile sidebar    | Hidden by default, slide-up drawer      | Preserves grid real estate                 |

### State Management

- React state for UI (`selectedDate`, `selectedMonth`, `focusAreaFilters`)
- TanStack Query for data fetching with automatic caching
- TanStack Router navigation for month changes
- Optimistic updates for task completion toggle

### Data Fetching Pattern

```typescript
const { data: tasks, isLoading, error, refetch } = useQuery({
  queryKey: ['calendar-tasks', format(selectedMonth, 'yyyy-MM')],
  queryFn: () => getTasksForMonth({ month: format(selectedMonth, 'yyyy-MM') })
})
```

---

## Dependencies

### Required Packages

- `@tanstack/react-query` - For data fetching and caching (available via TanStack Start)
- `date-fns` - Date utilities (already in dependencies)
- `lucide-react` - Icons (already in dependencies)

### UI Components Needed

- `Sheet` - For task detail slide-over
- `Checkbox` - For task completion toggle
- `Switch` - For focus area filters
- Existing: `Calendar`, `Card`, `Badge`, `Button`, `Separator`, `Breadcrumb`

---

## API Contract Examples

### GET /api/calendar/tasks?month=2024-12

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "taskDescription": "Complete project proposal",
      "focusArea": "Work",
      "startTime": "2024-12-15T09:00:00Z",
      "endTime": "2024-12-15T11:00:00Z",
      "difficultyLevel": "advanced",
      "isCompleted": false
    }
  ]
}
```

### GET /api/calendar/focus-areas

```json
{
  "success": true,
  "data": [
    { "name": "Work", "count": 12, "color": "#3b82f6" },
    { "name": "Health", "count": 5, "color": "#22c55e" },
    { "name": "Learning", "count": 8, "color": "#f59e0b" }
  ]
}
```

### PATCH /api/calendar/tasks/:taskId/complete

```json
{
  "success": true,
  "data": {
    "id": 1,
    "taskDescription": "Complete project proposal",
    "isCompleted": true,
    "completedAt": "2024-12-15T14:30:00Z"
  }
}
```

---

## File Structure

```
apps/web/src/
├── components/
│   ├── calendar/
│   │   ├── page.tsx (update)
│   │   ├── task-calendar-grid.tsx (new)
│   │   ├── task-detail-sheet.tsx (new)
│   │   └── components/
│   │       └── app-sidebar.tsx (update)
└── functions/
    └── calendar-server-fn.ts (new)

packages/db/src/
└── queries/
    ├── calendar.ts (new)
    └── index.ts (update - export calendar functions)

packages/api/src/routers/
└── calendar.ts (new)
```

---

## Implementation Checklist

- [x] **Phase 1: Backend API Extensions**
  - [x] Create `packages/db/src/queries/calendar.ts`
  - [x] Add exports to `packages/db/src/queries/index.ts`
  - [x] Create `packages/api/src/routers/calendar.ts`
  - [x] Update `apps/server/src/router/index.ts` to mount calendar router
  - [x] Fix type errors in mock.ts and streaming.ts

- [x] **Phase 2: Frontend Server Functions**
  - [x] Create `apps/web/src/functions/calendar-server-fn.ts`

- [x] **Phase 3: Calendar Page Components**
  - [x] Create `apps/web/src/components/calendar/task-calendar-grid.tsx`
  - [x] Create `apps/web/src/components/calendar/task-detail-sheet.tsx`
  - [x] Update `apps/web/src/components/calendar/components/app-sidebar.tsx`

- [x] **Phase 4: Calendar Page Integration**
  - [x] Update `apps/web/src/components/calendar/page.tsx`

- [x] **Phase 5: Cross-Page Integration**
  - [x] Update `apps/web/src/routes/dashboard.tsx` with calendar link

- [x] Type checking passes
- [ ] Manual testing required:
  - [ ] Start dev server: `bun run dev`
  - [ ] Navigate to `/calendar`
  - [ ] Test month navigation
  - [ ] Test clicking on days to see tasks
  - [ ] Test task completion toggle
  - [ ] Test focus area filters
  - [ ] Test "Today" button

---

## Future Enhancements (V2)

- Full task creation modal from calendar (not just redirect)
- Task rescheduling via modal (alternative to drag & drop)
- Weekly view option
- Export calendar to .ics
- Recurring tasks
- Task notes/attachments
- Calendar sharing
- Drag & drop task movement between dates
