# Service Organization Migration Guide

This document explains the reorganization of services from the large `ai-service.ts` file into modular, focused service files.

## Overview

The original `ai-service.ts` file (2951 lines) has been reorganized into the following structure:

```
src/services/
├── core/
│   └── ai-service-core.ts          # Core AI execution infrastructure
├── plan/
│   └── plan-service.ts             # Plan generation and management
├── classification/
│   └── task-classification-service.ts # Task categorization and classification
├── calendar/
│   └── calendar-integration-service.ts # Calendar population and conflict resolution
├── analytics/
│   └── analytics-service.ts        # Plan execution tracking and insights
├── briefing.ts                     # Daily briefing service (existing)
├── ai-service-mod.ts              # Modified AI service (existing)
└── index.ts                       # Main service index with centralized exports
```

## Service Breakdown

### 1. Core AI Service (`core/ai-service-core.ts`)
- **Purpose**: Provides fundamental AI execution infrastructure
- **Key Functions**:
  - `executeAIRequest<TInput, TOutput>()` - Generic AI request handler
  - `fetchPlanData(planId)` - Database plan data retrieval
- **Types**: `AIRequest`, `AIResponse`, `AIServiceConfig`

### 2. Plan Service (`plan/plan-service.ts`)
- **Purpose**: Monthly plan generation, modification, and regeneration
- **Key Functions**:
  - `generatePlan(userGoals)` - Create new monthly plans
  - `regeneratePlan(originalPlanId, reason)` - Improve existing plans
  - `modifyPlan(planId, modifications)` - Apply specific changes
  - `parsePlanForTasks(plan)` - Extract task information
  - `parsePlanForHabits(plan)` - Identify habit patterns
  - `generateWeeklySummary(weekData)` - Create weekly summaries

### 3. Task Classification Service (`classification/task-classification-service.ts`)
- **Purpose**: Categorize and classify tasks, habits, and recurring activities
- **Key Functions**:
  - `classifySuggestionItems(suggestion, userContext)` - AI-powered classification
  - `extractItemsFromSuggestion(suggestion, applyAs)` - Extract plan items
  - `categorizeTask(taskText)` - Simple task categorization
- **Types**: `SuggestionItemClassification`, `SuggestionApplicationStrategy`

### 4. Calendar Integration Service (`calendar/calendar-integration-service.ts`)
- **Purpose**: Calendar population, scheduling, and conflict resolution
- **Key Functions**:
  - `populateCalendar(userId, items, options)` - Schedule classified items
  - `modifyCalendarSchedule(userId, modifications)` - Dynamic schedule changes
  - `resolveCalendarConflicts(userId, conflicts, strategy)` - AI conflict resolution

### 5. Analytics Service (`analytics/analytics-service.ts`)
- **Purpose**: Plan execution tracking, insights, and trend analysis
- **Key Functions**:
  - `trackPlanExecution(planId, completedTasks, completedHabits)` - Comprehensive analysis
- **Types**: `PlanEffectivenessMetrics`

## Migration Instructions

### For Existing Code Using `ai-service.ts`

**Before:**
```typescript
import {
  generatePlan,
  regeneratePlan,
  modifyPlan,
  executeAIRequest,
  classifySuggestionItems,
  populateCalendar,
  trackPlanExecution
} from './services/ai-service';
```

**After (Option 1 - Individual Imports):**
```typescript
import { generatePlan, regeneratePlan, modifyPlan } from './services/plan/plan-service';
import { classifySuggestionItems } from './services/classification/task-classification-service';
import { populateCalendar } from './services/calendar/calendar-integration-service';
import { trackPlanExecution } from './services/analytics/analytics-service';
import { executeAIRequest } from './services/core/ai-service-core';
```

**After (Option 2 - Centralized Import - Recommended):**
```typescript
import {
  generatePlan,
  regeneratePlan,
  modifyPlan,
  executeAIRequest,
  classifySuggestionItems,
  populateCalendar,
  trackPlanExecution
} from './services';
```

### For Type Imports

**Before:**
```typescript
import type {
  PlanSuggestionContent,
  SuggestionItemClassification,
  PlanEffectivenessMetrics,
  AIResponse
} from './services/ai-service';
```

**After:**
```typescript
import type {
  PlanSuggestionContent,
  SuggestionItemClassification,
  PlanEffectivenessMetrics,
  AIResponse
} from './services';
```

## Backward Compatibility

The reorganization maintains backward compatibility through:

1. **Service Index File**: `index.ts` re-exports all functions and types
2. **Legacy Support**: Original `ai-service-mod.ts` continues to work
3. **Gradual Migration**: You can migrate individual imports as needed

## Benefits of Reorganization

1. **Modularity**: Each service has a focused responsibility
2. **Maintainability**: Easier to locate and modify specific functionality
3. **Testing**: Smaller files are easier to unit test
4. **Tree Shaking**: Better bundle optimization through selective imports
5. **Code Organization**: Logical grouping of related functionality
6. **Developer Experience**: Faster navigation and understanding

## File Sizes After Reorganization

- `ai-service.ts`: 2951 lines → **7 service files**
- `core/ai-service-core.ts`: 150 lines (core infrastructure)
- `plan/plan-service.ts`: 400 lines (plan management)
- `classification/task-classification-service.ts`: 650 lines (task classification)
- `calendar/calendar-integration-service.ts`: 1200 lines (calendar operations)
- `analytics/analytics-service.ts`: 400 lines (analytics and insights)
- `briefing.ts`: 55 lines (existing)
- `index.ts`: 50 lines (centralized exports)

## Testing the Migration

1. Update imports in your application files
2. Run your test suite to ensure functionality is preserved
3. Check for any missing imports or type errors
4. Verify AI service functionality works as expected

## ✅ Migration Complete - Old File Removed

The original `ai-service.ts` file has been successfully removed from the codebase. All functionality has been migrated to the new modular service structure.

### Final Structure:
```
src/services/
├── core/
│   └── ai-service-core.ts              # Core AI infrastructure (150 lines)
├── plan/
│   └── plan-service.ts                 # Plan management (400 lines)
├── classification/
│   └── task-classification-service.ts  # Task categorization (650 lines)
├── calendar/
│   └── calendar-integration-service.ts # Calendar operations (1200 lines)
├── analytics/
│   └── analytics-service.ts            # Analytics & insights (400 lines)
├── calendar-service.ts                 # Server-side calendar service (existing)
└── index.ts                           # Centralized exports (50 lines)
```

### ✅ Additional Cleanup Completed

**Removed Duplicate/Unused Files:**
- ❌ `ai-service-mod.ts` - Removed (duplicate functionality now in plan-service.ts)
- ❌ `briefing.ts` - Removed (unused generateBriefing function)
- ✅ `calendar-service.ts` - **KEPT** (active calendar service for API)

**Preserved Native Calendar Service:**
- ✅ `apps/native/lib/calendar-service.ts` - **KEPT** (actively used by React Native calendar component)

### Updated Router:
All imports in `src/routers/ai.ts` have been updated to use the new modular service structure:
```typescript
// Before
import { generatePlan, classifySuggestionItems } from "../services/ai-service";

// After
import { generatePlan, classifySuggestionItems } from "../services";
```

## Future Enhancements

With the modular structure, you can now:

1. Add specialized services (e.g., `notification-service.ts`, `user-preferences-service.ts`)
2. Implement service-specific error handling
3. Add service-level caching and optimization
4. Create service-specific middleware and interceptors
5. Implement service-level monitoring and logging

## Support

If you encounter any issues during migration:

1. Check that all necessary imports are updated
2. Verify type imports are correct
3. Ensure the service index file is properly configured
4. Test individual service functions in isolation

The new modular structure provides a solid foundation for future development and maintenance of the application's service layer.