# Task Schema Enhancement Summary

## Problem Identified

You correctly identified that we were **losing critical scheduling information** when converting AI-generated plans to database tasks. 

### What the AI Generates (Rich Data):
```json
{
  "weekly_breakdown": [
    {
      "week": 1,
      "focus": "React Native Setup and TypeScript Fundamentals",
      "daily_tasks": {
        "Monday": [
          "9:00 AM - 12:00 PM: Set up React Native development environment",
          "2:00 PM - 4:00 PM: Review TypeScript data types",
          "6:00 PM: Exercise (30 minutes)"
        ]
      }
    }
  ]
}
```

### What We Were Storing (Limited):
- ✅ `title`: "Set up React Native development environment"
- ✅ `description`: Generic AI reasoning
- ✅ `priority`: low/medium/high
- ❌ **Missing**: Start time (9:00 AM)
- ❌ **Missing**: End time (12:00 PM)
- ❌ **Missing**: Duration (3 hours)
- ❌ **Missing**: Day of week (Monday)
- ❌ **Missing**: Week number (Week 1)
- ❌ **Missing**: Time block (Morning)
- ❌ **Missing**: Context (Week focus, goals)

## Changes Made

### 1. Enhanced Database Schema (`packages/db/src/schema/tasks.ts`)

Added new fields to capture rich scheduling data:

```typescript
// New fields added:
startTime: integer("start_time", { mode: "timestamp_ms" })
endTime: integer("end_time", { mode: "timestamp_ms" })
estimatedDuration: integer("estimated_duration") // in minutes
dayOfWeek: text("day_of_week", {
  enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
})
weekNumber: integer("week_number") // 1-4 typically
timeBlock: text("time_block", {
  enum: ["morning", "afternoon", "evening", "night"],
})
planContext: text("plan_context") // JSON string with week focus, goals, etc.
```

Also added indexes for efficient querying:
- `tasks_startTime_idx`
- `tasks_weekNumber_idx`
- `tasks_dayOfWeek_idx`

### 2. Enhanced AI Service Interface (`packages/api/src/services/ai-service.ts`)

Updated `SuggestionItemClassification` interface to include:

```typescript
export interface SuggestionItemClassification {
  // ... existing fields ...
  
  // Rich scheduling information from AI plans
  start_time?: string; // "9:00 AM" or ISO timestamp
  end_time?: string; // "12:00 PM" or ISO timestamp
  day_of_week?: "Monday" | "Tuesday" | ... ;
  week_number?: number;
  time_block?: "morning" | "afternoon" | "evening" | "night";
  plan_context?: {
    week_focus?: string; // "React Native Setup and TypeScript Fundamentals"
    goal?: string; // Primary goal for context
    original_task_string?: string; // Original AI-generated string
  };
}
```

### 3. Added Time Parsing Logic

Created `parseTaskTimeInfo()` function that intelligently parses:

**Format 1: Time Range**
```
"9:00 AM - 12:00 PM: Set up React Native development environment"
```
Extracts:
- Start: "9:00 AM"
- End: "12:00 PM"
- Duration: "3 hours"
- Time Block: "morning"
- Clean Title: "Set up React Native development environment"

**Format 2: Single Time with Duration**
```
"6:00 PM: Exercise (30 minutes)"
```
Extracts:
- Start: "6:00 PM"
- Duration: "30 min"
- Time Block: "evening"
- Clean Title: "Exercise"

**Format 3: No Time Info**
```
"Review TypeScript basics"
```
Returns as-is with no time data.

### 4. Enhanced Extraction Function

Updated `extractItemsFromSuggestion()` to:
1. Parse time information from task strings
2. Capture week number and day of week
3. Store week focus and goals as context
4. Calculate time blocks automatically

## What Still Needs to Be Done

### 1. Database Migration ⚠️

You need to run a migration to add the new columns to your existing database:

```bash
cd packages/db
npx drizzle-kit generate:sqlite
npx drizzle-kit push:sqlite
```

### 2. Update Task Creation in AI Router

The `applySuggestionAsItems` handler in `packages/api/src/routers/ai.ts` needs to be updated to pass the new scheduling fields when creating tasks:

```typescript
// Current (lines 554-561):
const task = await taskQueries.createTask(userId, {
  title: item.title,
  description: item.description,
  priority: item.priority || "medium",
  dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
  suggestionId: input.suggestionId,
});

// Should be updated to:
const task = await taskQueries.createTask(userId, {
  title: item.title,
  description: item.description,
  priority: item.priority || "medium",
  dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
  suggestionId: input.suggestionId,
  
  // Add new scheduling fields
  startTime: item.start_time ? parseTimeToDate(item.start_time, item.due_date) : undefined,
  endTime: item.end_time ? parseTimeToDate(item.end_time, item.due_date) : undefined,
  estimatedDuration: parseDurationToMinutes(item.estimated_duration),
  dayOfWeek: item.day_of_week,
  weekNumber: item.week_number,
  timeBlock: item.time_block,
  planContext: item.plan_context ? JSON.stringify(item.plan_context) : undefined,
});
```

### 3. Update Task Queries

Check `packages/db/src/queries/tasks.ts` to ensure `createTask` and `createRecurringTask` accept the new fields.

### 4. Update TypeScript Types

Make sure the task types in `packages/db/src/types.ts` (or wherever they're defined) include the new fields.

### 5. Calendar Integration

The calendar population logic should now use the rich scheduling data:
- Use `startTime` and `endTime` for precise calendar events
- Use `dayOfWeek` and `weekNumber` for scheduling
- Use `timeBlock` for conflict resolution

## Benefits of These Changes

1. **Precise Scheduling**: Tasks now have exact start/end times from AI plans
2. **Better Calendar Integration**: Can create calendar events with accurate times
3. **Context Preservation**: Week focus and goals are preserved for better organization
4. **Time Block Awareness**: Can optimize scheduling based on morning/afternoon/evening preferences
5. **Duration Tracking**: Accurate time estimates for better planning
6. **Week-based Organization**: Can filter and organize tasks by week number
7. **Day-specific Tasks**: Can show tasks for specific days of the week

## Example Flow

1. User generates AI plan with detailed schedule
2. AI returns tasks like "9:00 AM - 12:00 PM: Set up React Native"
3. `parseTaskTimeInfo()` extracts all scheduling data
4. Task is created with full scheduling information
5. Calendar can now create precise events at 9:00 AM - 12:00 PM
6. User sees tasks organized by week, day, and time block

## Next Steps

1. Run database migration
2. Update the AI router to pass new fields
3. Test the full flow from AI generation to task creation
4. Verify calendar events are created with correct times
5. Update UI to display the rich scheduling information

---

**Status**: Schema and parsing logic complete ✅  
**Remaining**: Migration, router updates, and testing ⚠️
