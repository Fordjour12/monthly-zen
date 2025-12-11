/**
 * Main service index file - centralized exports for all services
 *
 * This file provides a clean, organized way to import all services
 * and their related types from a single location.
 */

// Core AI Service
export {
  executeAIRequest,
  fetchPlanData,
  type AIRequest,
  type AIResponse,
  type AIServiceConfig
} from './core/ai-service-core';

// Plan Service
export {
  generatePlan,
  regeneratePlan,
  modifyPlan,
  parsePlanForTasks,
  parsePlanForHabits,
  generateWeeklySummary,
  type PlanTask,
  type PlanHabit
} from './plan/plan-service';

// Task Classification Service
export {
  classifySuggestionItems,
  extractItemsFromSuggestion,
  categorizeTask,
  type SuggestionItemClassification,
  type SuggestionApplicationStrategy
} from './classification/task-classification-service';

// Calendar Integration Service
export {
  populateCalendar,
  modifyCalendarSchedule,
  resolveCalendarConflicts
} from './calendar/calendar-integration-service';

// Analytics Service
export {
  trackPlanExecution,
  type PlanEffectivenessMetrics
} from './analytics/analytics-service';

// Note: briefing and ai-service-mod services have been removed
// Their functionality is now available in the modular service structure above

// Type re-exports for convenience
export type {
  BriefingSuggestionContent,
  PlanSuggestionContent,
  RescheduleSuggestionContent,
  TaskPriority
} from "@my-better-t-app/db";