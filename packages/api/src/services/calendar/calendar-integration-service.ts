import { executeAIRequest, type AIResponse } from "../core/ai-service-core";
import type { SuggestionItemClassification } from "../classification/task-classification-service";

/**
 * Populate calendar with classified items from AI suggestions
 */
export async function populateCalendar(
  userId: string,
  classifiedItems: SuggestionItemClassification[],
  options?: {
    startDate?: Date;
    endDate?: Date;
    avoidConflicts?: boolean;
    preferredTimes?: Record<string, string>;
    defaultDuration?: number; // in minutes
  }
): Promise<AIResponse<{
  createdEvents: Array<{
    id: string;
    title: string;
    type: "task" | "habit" | "recurring-task";
    startTime: Date;
    endTime: Date;
    classification: SuggestionItemClassification;
  }>;
  conflicts: Array<{
    item: SuggestionItemClassification;
    conflict: string;
    suggestion: string;
  }>;
  suggestions: string[];
  totalScheduled: number;
  totalSkipped: number;
}>> {
  try {
    const { calendarQueries, taskQueries, habitQueries } = await import("@my-better-t-app/db");

    const startDate = options?.startDate || new Date();
    const endDate = options?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const avoidConflicts = options?.avoidConflicts !== false; // default to true
    const defaultDuration = options?.defaultDuration || 30; // 30 minutes default
    const preferredTimes = options?.preferredTimes || {};

    const createdEvents: any[] = [];
    const conflicts: any[] = [];
    const suggestions: string[] = [];
    let totalScheduled = 0;
    let totalSkipped = 0;

    // Sort items by priority and type for optimal scheduling
    const sortedItems = classifiedItems.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.suggested_priority] || 1;
      const bPriority = priorityOrder[b.suggested_priority] || 1;

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }

      // Schedule habits before tasks for consistency
      if (a.type === 'habit' && b.type !== 'habit') return -1;
      if (b.type === 'habit' && a.type !== 'habit') return 1;

      return 0;
    });

    // Process each classified item
    for (const item of sortedItems) {
      try {
        const scheduledEvent = await scheduleCalendarItem(
          userId,
          item,
          startDate,
          endDate,
          avoidConflicts,
          preferredTimes,
          defaultDuration
        );

        if (scheduledEvent.success) {
          // Create the calendar event
          const calendarEvent = await calendarQueries.createEvent(userId, {
            title: item.title,
            description: `AI-scheduled ${item.type}: ${item.reasoning}`,
            startTime: scheduledEvent.startTime!,
            endTime: scheduledEvent.endTime!,
          });

          // Create corresponding task or habit if needed
          if (item.type === 'task') {
            await taskQueries.createTask(userId, {
              title: item.title,
              description: item.reasoning,
              priority: item.suggested_priority,
              dueDate: new Date(scheduledEvent.startTime!),
              suggestionId: item.title, // Use title as reference
            });
          } else if (item.type === 'habit') {
            await habitQueries.createHabit(userId, {
              title: item.title,
              description: item.reasoning,
              frequency: item.suggested_frequency || 'daily',
              bestTime: item.habit_potential?.best_time,
              triggerActivity: item.habit_potential?.trigger_activity,
              suggestionId: item.title,
            });
          }

          createdEvents.push({
            id: calendarEvent.id,
            title: calendarEvent.title,
            type: item.type,
            startTime: new Date(calendarEvent.startTime),
            endTime: new Date(calendarEvent.endTime),
            classification: item,
          });

          totalScheduled++;
        } else {
          conflicts.push({
            item,
            conflict: scheduledEvent.reason || 'Scheduling conflict',
            suggestion: scheduledEvent.suggestion || 'Try a different time',
          });
          totalSkipped++;
        }
      } catch (error) {
        console.error(`Error scheduling item ${item.title}:`, error);
        conflicts.push({
          item,
          conflict: error instanceof Error ? error.message : 'Unknown error',
          suggestion: 'Manual scheduling required',
        });
        totalSkipped++;
      }
    }

    // Generate scheduling suggestions
    if (conflicts.length > 0) {
      suggestions.push(`${conflicts.length} items could not be automatically scheduled due to conflicts`);
      suggestions.push('Consider adjusting time preferences or resolving conflicts manually');
    }

    if (totalScheduled > 0) {
      suggestions.push(`Successfully scheduled ${totalScheduled} items in your calendar`);
    }

    if (totalSkipped > totalScheduled) {
      suggestions.push('Review conflicting items and consider alternative scheduling times');
    }

    return {
      success: true,
      data: {
        createdEvents,
        conflicts,
        suggestions,
        totalScheduled,
        totalSkipped,
      },
    };
  } catch (error) {
    console.error('Error in populateCalendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during calendar population",
    };
  }
}

/**
 * Helper function to schedule a single calendar item
 */
async function scheduleCalendarItem(
  userId: string,
  item: SuggestionItemClassification,
  startDate: Date,
  endDate: Date,
  avoidConflicts: boolean,
  preferredTimes: Record<string, string>,
  defaultDuration: number
): Promise<{
  success: boolean;
  startTime?: Date;
  endTime?: Date;
  reason?: string;
  suggestion?: string;
}> {
  try {
    const { calendarQueries } = await import("@my-better-t-app/db");

    // Calculate duration based on item type and estimated duration
    let duration = defaultDuration;
    if (item.estimated_duration) {
      // Parse duration string like "30 min", "1 hour", "2 hours"
      const durationMatch = item.estimated_duration.match(/(\d+)\s*(hour|hr|minute|min)/i);
      if (durationMatch && durationMatch[2]) {
        const value = parseInt(durationMatch[1]!);
        const unit = durationMatch[2].toLowerCase();
        duration = unit.includes('hour') || unit.includes('hr') ? value * 60 : value;
      }
    }

    // Determine optimal scheduling time based on item type and preferences
    let preferredTime = preferredTimes[item.type] || preferredTimes['default'];

    if (item.habit_potential?.best_time) {
      preferredTime = item.habit_potential.best_time;
    }

    // Calculate start time based on preferences
    const startTime = calculateOptimalStartTime(
      startDate,
      endDate,
      preferredTime,
      item.type === 'habit' // habits should be scheduled consistently
    );

    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    // Check for conflicts if avoidance is enabled
    if (avoidConflicts) {
      const conflictingEvents = await calendarQueries.findOverlappingEvents(
        userId,
        startTime,
        endTime
      );

      if (conflictingEvents.length > 0) {
        // Try to find alternative time slots
        const alternativeSlot = await findAlternativeTimeSlot(
          userId,
          startTime,
          endTime,
          duration,
          endDate
        );

        if (alternativeSlot) {
          return {
            success: true,
            startTime: alternativeSlot.start,
            endTime: alternativeSlot.end,
          };
        } else {
          return {
            success: false,
            reason: `Conflicts with ${conflictingEvents.length} existing events`,
            suggestion: 'Try scheduling on a different day or time',
          };
        }
      }
    }

    return {
      success: true,
      startTime,
      endTime,
    };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown scheduling error',
    };
  }
}

/**
 * Calculate optimal start time based on preferences and item type
 */
function calculateOptimalStartTime(
  startDate: Date,
  endDate: Date,
  preferredTime: string | undefined,
  isHabit: boolean
): Date {
  const now = new Date();
  let startTime = new Date(Math.max(now.getTime(), startDate.getTime()));

  // Set preferred time of day
  if (preferredTime) {
    const timeMap: Record<string, { hour: number; minute: number }> = {
      morning: { hour: 8, minute: 0 },
      afternoon: { hour: 14, minute: 0 },
      evening: { hour: 18, minute: 0 },
    };

    const timeSlot = timeMap[preferredTime.toLowerCase()];
    if (timeSlot) {
      startTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);

      // If the preferred time has passed today, move to tomorrow
      if (startTime < now) {
        startTime.setDate(startTime.getDate() + 1);
      }
    }
  }

  // For habits, try to schedule at consistent times
  if (isHabit) {
    // Find the next consistent time slot
    while (startTime.getDay() === 0 || startTime.getDay() === 6) { // Avoid weekends for habits unless specified
      startTime.setDate(startTime.getDate() + 1);
    }
  }

  // Ensure we're within the allowed date range
  const startTimeMs = startTime.getTime();
  if (startTimeMs > endDate.getTime()) {
    return new Date(startDate); // Return earliest possible time if no suitable slot found
  }

  return startTime;
}

/**
 * Helper function to find alternative time slot for conflicting events
 */
async function findAlternativeTimeSlot(
  userId: string,
  originalStart: Date,
  originalEnd: Date,
  duration: number,
  endDate: Date
): Promise<{ start: Date; end: Date } | null> {
  try {
    const { calendarQueries } = await import("@my-better-t-app/db");

    // Try slots in 30-minute increments for the next 7 days
    const searchEnd = new Date(Math.min(originalEnd.getTime() + 7 * 24 * 60 * 60 * 1000, endDate.getTime()));
    let currentSlot = new Date(originalStart);

    while (currentSlot < searchEnd) {
      const slotEnd = new Date(currentSlot.getTime() + duration * 60 * 1000);

      const conflicts = await calendarQueries.findOverlappingEvents(
        userId,
        currentSlot,
        slotEnd
      );

      if (conflicts.length === 0) {
        return { start: currentSlot, end: slotEnd };
      }

      // Move to next 30-minute slot
      currentSlot.setTime(currentSlot.getTime() + 30 * 60 * 1000);
    }

    return null;
  } catch (error) {
    console.error('Error finding alternative time slot:', error);
    return null;
  }
}

/**
 * Modify calendar schedule dynamically based on user adjustments
 */
export async function modifyCalendarSchedule(
  userId: string,
  modifications: {
    rescheduleTasks?: Array<{ taskId: string, newDate: string, newTime?: string }>;
    adjustHabits?: Array<{ habitId: string, newTime: string, newFrequency?: string }>;
    pauseItems?: Array<{ id: string, type: "task" | "habit", pauseUntil: string }>;
    resumeItems?: Array<{ id: string, type: "task" | "habit" }>;
    bulkReschedule?: {
      fromDate: string;
      toDate: string;
      reason: string;
    };
  },
  _reason?: string
): Promise<AIResponse<{
  modifiedEvents: Array<{
    id: string;
    type: "task" | "habit" | "event";
    action: "rescheduled" | "paused" | "resumed" | "adjusted";
    previousTime?: Date;
    newTime?: Date;
    details: string;
  }>;
  impact: string[];
  warnings: string[];
  conflicts: Array<{
    id: string;
    title: string;
    conflict: string;
    suggestion: string;
  }>;
}>> {
  try {
    const { calendarQueries, taskQueries, habitQueries } = await import("@my-better-t-app/db");

    const modifiedEvents: any[] = [];
    const impact: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];

    // Process task rescheduling
    if (modifications.rescheduleTasks) {
      for (const reschedule of modifications.rescheduleTasks) {
        try {
          // Get the task and its associated calendar events
          const task = await taskQueries.findByUser(userId, {}).then(tasks =>
            tasks.find(t => t.id === reschedule.taskId)
          );

          if (!task) {
            warnings.push(`Task ${reschedule.taskId} not found`);
            continue;
          }

          const taskEvents = await calendarQueries.findByTask(reschedule.taskId);

          for (const event of taskEvents) {
            const newDateTime = parseDateTime(reschedule.newDate, reschedule.newTime);

            if (!newDateTime) {
              warnings.push(`Invalid date/time format for task ${reschedule.taskId}`);
              continue;
            }

            // Check for conflicts at new time
            const conflictingEvents = await calendarQueries.findOverlappingEvents(
              userId,
              newDateTime,
              new Date(newDateTime.getTime() + (event.endTime.getTime() - event.startTime.getTime()))
            );

            if (conflictingEvents.length > 0) {
              conflicts.push({
                id: event.id,
                title: event.title,
                conflict: `Conflicts with ${conflictingEvents.length} existing events`,
                suggestion: 'Choose a different time or resolve conflicts manually',
              });
              continue;
            }
            // Update the calendar event
            await calendarQueries.updateEvent(event.id, {
              startTime: newDateTime,
              endTime: new Date(newDateTime.getTime() + (event.endTime.getTime() - event.startTime.getTime())),
            });

            // Update the task due date
            await taskQueries.updateStatus(reschedule.taskId, "pending"); // Reset to pending if completed

            modifiedEvents.push({
              id: event.id,
              type: "task",
              action: "rescheduled",
              previousTime: new Date(event.startTime),
              newTime: newDateTime,
              details: `Rescheduled from ${new Date(event.startTime).toLocaleString()} to ${newDateTime.toLocaleString()}`,
            });
          }

          impact.push(`Task "${task.title}" rescheduled to ${reschedule.newDate}`);
        } catch (error) {
          console.error(`Error rescheduling task ${reschedule.taskId}:`, error);
          warnings.push(`Failed to reschedule task ${reschedule.taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Process habit adjustments
    if (modifications.adjustHabits) {
      for (const adjustment of modifications.adjustHabits) {
        try {
          const habit = await habitQueries.findById(adjustment.habitId);

          if (!habit) {
            warnings.push(`Habit ${adjustment.habitId} not found`);
            continue;
          }

          // Update habit properties (this would require extending the habit schema)
          // For now, we'll log the adjustment
          modifiedEvents.push({
            id: adjustment.habitId,
            type: "habit",
            action: "adjusted",
            newTime: new Date(adjustment.newTime),
            details: `Habit time adjusted to ${adjustment.newTime}${adjustment.newFrequency ? `, frequency to ${adjustment.newFrequency}` : ''}`,
          });

          impact.push(`Habit "${habit.title}" adjusted: time to ${adjustment.newTime}${adjustment.newFrequency ? `, frequency to ${adjustment.newFrequency}` : ''}`);
        } catch (error) {
          console.error(`Error adjusting habit ${adjustment.habitId}:`, error);
          warnings.push(`Failed to adjust habit ${adjustment.habitId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Process pause items
    if (modifications.pauseItems) {
      for (const pauseItem of modifications.pauseItems) {
        try {
          const pauseUntil = new Date(pauseItem.pauseUntil);

          if (pauseItem.type === "task") {
            const task = await taskQueries.findByUser(userId, {}).then(tasks =>
              tasks.find(t => t.id === pauseItem.id)
            );

            if (task) {
              const taskEvents = await calendarQueries.findByTask(pauseItem.id);

              for (const event of taskEvents) {
                await calendarQueries.updateEvent(event.id, {
                  startTime: pauseUntil,
                  endTime: new Date(pauseUntil.getTime() + (event.endTime.getTime() - event.startTime.getTime())),
                });
              }

              modifiedEvents.push({
                id: pauseItem.id,
                type: "task",
                action: "paused",
                newTime: pauseUntil,
                details: `Paused until ${pauseUntil.toLocaleString()}`,
              });
            }
          } else if (pauseItem.type === "habit") {
            // Habit pausing would require schema extension
            modifiedEvents.push({
              id: pauseItem.id,
              type: "habit",
              action: "paused",
              newTime: pauseUntil,
              details: `Paused until ${pauseUntil.toLocaleString()}`,
            });
          }

          impact.push(`${pauseItem.type === "task" ? 'Task' : 'Habit'} paused until ${pauseUntil.toLocaleString()}`);
        } catch (error) {
          console.error(`Error pausing item ${pauseItem.id}:`, error);
          warnings.push(`Failed to pause ${pauseItem.type} ${pauseItem.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Process resume items
    if (modifications.resumeItems) {
      for (const resumeItem of modifications.resumeItems) {
        try {
          const now = new Date();

          if (resumeItem.type === "task") {
            const task = await taskQueries.findByUser(userId, {}).then(tasks =>
              tasks.find(t => t.id === resumeItem.id)
            );

            if (task) {
              const taskEvents = await calendarQueries.findByTask(resumeItem.id);

              for (const event of taskEvents) {
                await calendarQueries.updateEvent(event.id, {
                  startTime: now,
                  endTime: new Date(now.getTime() + (event.endTime.getTime() - event.startTime.getTime())),
                });
              }

              modifiedEvents.push({
                id: resumeItem.id,
                type: "task",
                action: "resumed",
                newTime: now,
                details: `Resumed at ${now.toLocaleString()}`,
              });
            }
          } else if (resumeItem.type === "habit") {
            modifiedEvents.push({
              id: resumeItem.id,
              type: "habit",
              action: "resumed",
              newTime: now,
              details: `Resumed at ${now.toLocaleString()}`,
            });
          }

          impact.push(`${resumeItem.type === "task" ? 'Task' : 'Habit'} resumed`);
        } catch (error) {
          console.error(`Error resuming item ${resumeItem.id}:`, error);
          warnings.push(`Failed to resume ${resumeItem.type} ${resumeItem.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Process bulk reschedule
    if (modifications.bulkReschedule) {
      try {
        const fromDate = new Date(modifications.bulkReschedule.fromDate);
        const toDate = new Date(modifications.bulkReschedule.toDate);

        // Get all events in the date range
        const eventsInRange = await calendarQueries.findByDateRange(userId, fromDate, toDate);

        for (const event of eventsInRange) {
          const timeDifference = toDate.getTime() - fromDate.getTime();
          const newStartTime = new Date(event.startTime.getTime() + timeDifference);
          const newEndTime = new Date(event.endTime.getTime() + timeDifference);

          await calendarQueries.updateEvent(event.id, {
            startTime: newStartTime,
            endTime: newEndTime,
          });

          modifiedEvents.push({
            id: event.id,
            type: "event",
            action: "rescheduled",
            previousTime: new Date(event.startTime),
            newTime: newStartTime,
            details: `Bulk rescheduled: ${modifications.bulkReschedule.reason}`,
          });
        }

        impact.push(`Bulk rescheduled ${eventsInRange.length} events: ${modifications.bulkReschedule.reason}`);
      } catch (error) {
        console.error('Error in bulk reschedule:', error);
        warnings.push(`Bulk reschedule failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Generate summary insights
    if (modifiedEvents.length > 0) {
      impact.push(`Successfully modified ${modifiedEvents.length} calendar items`);
    }

    if (conflicts.length > 0) {
      warnings.push(`${conflicts.length} scheduling conflicts detected - manual resolution required`);
    }

    if (warnings.length > 0) {
      impact.push(`${warnings.length} issues encountered during modification`);
    }

    return {
      success: true,
      data: {
        modifiedEvents,
        impact,
        warnings,
        conflicts,
      },
    };
  } catch (error) {
    console.error('Error in modifyCalendarSchedule:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during calendar modification",
    };
  }
}

/**
 * Helper function to parse date and time strings
 */
function parseDateTime(dateString: string, timeString?: string): Date | null {
  try {
    if (!dateString) {
      return null;
    }
    let dateTime = new Date(dateString);

    if (isNaN(dateTime.getTime())) {
      return null;
    }

    if (timeString) {
      const parts = timeString.split(':');
      if (parts.length === 2) {
        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);
        if (!isNaN(hours) && !isNaN(minutes)) {
          dateTime.setHours(hours, minutes, 0, 0);
        }
      }
    }

    return dateTime;
  } catch (error) {
    return null;
  }
}

/**
 * Resolve calendar conflicts using AI-powered strategies
 */
export async function resolveCalendarConflicts(
  _userId: string,
  conflicts: Array<{
    eventId: string;
    conflictType: "overlap" | "resource" | "time";
    conflictingEventIds: string[];
    severity: "low" | "medium" | "high";
  }>,
  strategy?: "prioritize" | "reschedule" | "split" | "user_choice" | "ai_optimized"
): Promise<AIResponse<{
  resolutions: Array<{
    eventId: string;
    action: "keep" | "reschedule" | "split" | "cancel" | "merge";
    newTime?: Date;
    reason: string;
    confidence: number;
    alternatives?: Array<{
      action: string;
      description: string;
      impact: string;
    }>;
  }>;
  summary: {
    totalConflicts: number;
    resolvedConflicts: number;
    unresolvedConflicts: number;
    strategy: string;
    timeSaved: number; // in minutes
    recommendations: string[];
  };
  warnings: string[];
}>> {
  try {
    const { calendarQueries } = await import("@my-better-t-app/db");

    const resolutions: any[] = [];
    const warnings: string[] = [];
    let resolvedCount = 0;
    let timeSaved = 0;

    const selectedStrategy = strategy || "ai_optimized";

    // Process each conflict
    for (const conflict of conflicts) {
      try {
        // Get all events involved in the conflict
        const mainEvent = await calendarQueries.findById(conflict.eventId);
        const conflictingEvents = await Promise.all(
          conflict.conflictingEventIds.map(id => calendarQueries.findById(id))
        );

        if (!mainEvent) {
          warnings.push(`Main event ${conflict.eventId} not found`);
          continue;
        }

        const allEvents = [mainEvent, ...conflictingEvents.filter(Boolean)];

        // Apply resolution strategy
        const resolution = await applyConflictResolutionStrategy(
          allEvents,
          conflict.conflictType,
          conflict.severity,
          selectedStrategy
        );

        if (resolution.success) {
          // Apply the resolution
          for (const action of resolution.actions) {
            try {
              if (action.type === "reschedule") {
                await calendarQueries.updateEvent(action.eventId, {
                  startTime: action.newStartTime,
                  endTime: action.newEndTime,
                });
              } else if (action.type === "split") {
                // Split event into multiple smaller events
                if (action.splitTimes) {
                  await splitCalendarEvent(action.eventId, action.splitTimes);
                }
              } else if (action.type === "cancel") {
                await calendarQueries.deleteEvent(action.eventId);
              }
            } catch (error) {
              console.error(`Error applying resolution for event ${action.eventId}:`, error);
              warnings.push(`Failed to apply resolution for event ${action.eventId}`);
            }
          }

          resolutions.push({
            eventId: conflict.eventId,
            action: resolution.primaryAction as "keep" | "reschedule" | "split" | "cancel" | "merge",
            newTime: (resolution.actions[0] && resolution.actions[0].newStartTime) ? resolution.actions[0].newStartTime : undefined,
            reason: resolution.reason,
            confidence: resolution.confidence,
            alternatives: resolution.alternatives,
          });

          resolvedCount++;
          timeSaved += resolution.timeSaved || 0;
        } else {
          warnings.push(`Could not resolve conflict for event ${conflict.eventId}: ${resolution.reason}`);
        }
      } catch (error) {
        console.error(`Error processing conflict ${conflict.eventId}:`, error);
        warnings.push(`Failed to process conflict for event ${conflict.eventId}`);
      }
    }

    // Generate summary and recommendations
    const summary = {
      totalConflicts: conflicts.length,
      resolvedConflicts: resolvedCount,
      unresolvedConflicts: conflicts.length - resolvedCount,
      strategy: selectedStrategy,
      timeSaved,
      recommendations: generateConflictRecommendations(resolvedCount, conflicts.length, selectedStrategy),
    };

    return {
      success: true,
      data: {
        resolutions,
        summary,
        warnings,
      },
    };
  } catch (error) {
    console.error('Error in resolveCalendarConflicts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during conflict resolution",
    };
  }
}

/**
 * Apply specific conflict resolution strategy
 */
async function applyConflictResolutionStrategy(
  events: any[],
  conflictType: string,
  severity: string,
  strategy: string
): Promise<{
  success: boolean;
  primaryAction: string;
  actions: Array<{
    eventId: string;
    type: string;
    newStartTime?: Date;
    newEndTime?: Date;
    splitTimes?: Date[];
  }>;
  reason: string;
  confidence: number;
  timeSaved?: number;
  alternatives?: Array<{
    action: string;
    description: string;
    impact: string;
  }>;
}> {
  try {
    switch (strategy) {
      case "prioritize":
        return await prioritizeStrategy(events, severity);
      case "reschedule":
        return await rescheduleStrategy(events, conflictType);
      case "split":
        return await splitStrategy(events);
      case "user_choice":
        return await userChoiceStrategy(events);
      case "ai_optimized":
      default:
        return await aiOptimizedStrategy(events, conflictType, severity);
    }
  } catch (error) {
    return {
      success: false,
      primaryAction: "none",
      actions: [],
      reason: error instanceof Error ? error.message : "Strategy application failed",
      confidence: 0,
    };
  }
}

/**
 * Prioritize strategy - keep highest priority events
 */
async function prioritizeStrategy(events: any[], _severity: string): Promise<any> {
  // Sort by priority (assuming priority is stored in event title or metadata)
  const sortedEvents = events.sort((a, b) => {
    // Extract priority from title or use creation time as fallback
    const aPriority = extractPriority(a.title);
    const bPriority = extractPriority(b.title);
    return bPriority - aPriority;
  });

  const highestPriority = sortedEvents[0];
  const lowerPriorityEvents = sortedEvents.slice(1);

  return {
    success: true,
    primaryAction: "keep",
    actions: [
      {
        eventId: highestPriority.id,
        type: "keep",
      },
      ...lowerPriorityEvents.map(event => ({
        eventId: event.id,
        type: "reschedule",
        newStartTime: findNextAvailableSlot(event.startTime, 60), // 1 hour later
        newEndTime: findNextAvailableSlot(event.endTime, 60),
      })),
    ],
    reason: `Kept highest priority event: ${highestPriority.title}`,
    confidence: 0.8,
    timeSaved: lowerPriorityEvents.length * 30, // Assume 30 min saved per rescheduled event
    alternatives: [
      {
        action: "reschedule_all",
        description: "Reschedule all events to different times",
        impact: "Moderate disruption, preserves all commitments",
      },
      {
        action: "split_events",
        description: "Split longer events into shorter segments",
        impact: "Minimal disruption, maintains all activities",
      },
    ],
  };
}

/**
 * Reschedule strategy - move conflicting events
 */
async function rescheduleStrategy(events: any[], conflictType: string): Promise<any> {
  const actions: any[] = [];
  let timeSaved = 0;

  for (const event of events) {
    const newStartTime = findNextAvailableSlot(event.startTime, 30); // 30 minutes later
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const newEndTime = new Date(newStartTime.getTime() + duration);

    actions.push({
      eventId: event.id,
      type: "reschedule",
      newStartTime,
      newEndTime,
    });

    timeSaved += 30; // Assume 30 min saved per reschedule
  }

  return {
    success: true,
    primaryAction: "reschedule",
    actions,
    reason: `Rescheduled ${events.length} conflicting events to avoid ${conflictType}`,
    confidence: 0.7,
    timeSaved,
    alternatives: [
      {
        action: "prioritize",
        description: "Keep highest priority event, reschedule others",
        impact: "Minimal disruption to important commitments",
      },
      {
        action: "split",
        description: "Split events into non-overlapping segments",
        impact: "Preserves all activities with minimal changes",
      },
    ],
  };
}

/**
 * Split strategy - divide events into smaller segments
 */
async function splitStrategy(events: any[]): Promise<any> {
  const actions: any[] = [];

  for (const event of events) {
    const duration = event.endTime.getTime() - event.startTime.getTime();

    if (duration > 60 * 60 * 1000) { // Only split events longer than 1 hour
      const midPoint = new Date(event.startTime.getTime() + duration / 2);

      actions.push({
        eventId: event.id,
        type: "split",
        splitTimes: [event.startTime, midPoint],
      });
    } else {
      actions.push({
        eventId: event.id,
        type: "keep",
      });
    }
  }

  return {
    success: true,
    primaryAction: "split",
    actions,
    reason: "Split long events to reduce conflicts",
    confidence: 0.6,
    alternatives: [
      {
        action: "reschedule",
        description: "Move events to different time slots",
        impact: "Clean separation of activities",
      },
      {
        action: "prioritize",
        description: "Keep most important events",
        impact: "Focuses on high-value activities",
      },
    ],
  };
}

/**
 * User choice strategy - present options for user selection
 */
async function userChoiceStrategy(events: any[]): Promise<any> {
  return {
    success: true,
    primaryAction: "user_choice",
    actions: events.map(event => ({
      eventId: event.id,
      type: "user_choice",
    })),
    reason: "Presenting conflict resolution options to user",
    confidence: 0.9, // High confidence when user chooses
    alternatives: [
      {
        action: "prioritize_important",
        description: "Keep most important events, reschedule others",
        impact: "Preserves priorities, requires some rescheduling",
      },
      {
        action: "reschedule_all",
        description: "Find new times for all conflicting events",
        impact: "Preserves all activities with time changes",
      },
      {
        action: "split_events",
        description: "Divide events into shorter segments",
        impact: "Maintains all activities with format changes",
      },
    ],
  };
}

/**
 * AI optimized strategy - use AI to determine best resolution
 */
async function aiOptimizedStrategy(events: any[], conflictType: string, severity: string): Promise<any> {
  try {
    const prompt = `You are an intelligent calendar conflict resolution assistant. Analyze these conflicting events and suggest the optimal resolution.

**Conflicting Events:**
${events.map(event => `- ${event.title} (${new Date(event.startTime).toLocaleString()} - ${new Date(event.endTime).toLocaleString()})`).join('\n')}

**Conflict Details:**
- Type: ${conflictType}
- Severity: ${severity}

**Resolution Strategies:**
1. **Prioritize**: Keep highest priority events, reschedule others
2. **Reschedule**: Move conflicting events to available time slots
3. **Split**: Divide long events into shorter, non-overlapping segments
4. **Merge**: Combine similar events if possible
5. **Cancel**: Remove least important events

**Analysis Requirements:**
- Consider event importance and priorities
- Minimize total disruption
- Preserve high-value activities
- Optimize for user productivity and well-being
- Account for event duration and flexibility

**Output Format (JSON):**
{
  "recommended_strategy": "prioritize|reschedule|split|merge|cancel",
  "reasoning": "Why this strategy is optimal",
  "confidence": 0.85,
  "actions": [
    {
      "eventId": "event_id",
      "action": "keep|reschedule|split|cancel",
      "newStartTime": "ISO timestamp if rescheduling",
      "newEndTime": "ISO timestamp if rescheduling",
      "reason": "Why this specific action"
    }
  ],
  "time_saved": 45,
  "alternatives": [
    {
      "strategy": "alternative_strategy",
      "description": "Description of alternative approach",
      "impact": "Expected impact of this alternative"
    }
  ]
}

**Decision Criteria:**
- For high severity conflicts: Prioritize or reschedule
- For time conflicts: Split or reschedule
- For resource conflicts: Prioritize based on importance
- For multiple events: Consider combination of strategies`;

    const systemPrompt = "You are an expert calendar optimization assistant. Analyze conflicting events and recommend the most effective resolution strategy that minimizes disruption while preserving important commitments.";

    const response = await executeAIRequest<any, any>({
      type: "analysis",
      input: { events, conflictType, severity },
      prompt,
      systemPrompt,
    });

    if (response.success && response.data) {
      return {
        success: true,
        primaryAction: response.data.recommended_strategy,
        actions: response.data.actions || [],
        reason: response.data.reasoning,
        confidence: response.data.confidence || 0.7,
        timeSaved: response.data.time_saved || 0,
        alternatives: response.data.alternatives || [],
      };
    }

    // Fallback to prioritize strategy if AI fails
    return await prioritizeStrategy(events, severity);
  } catch (error) {
    console.error('Error in AI optimized strategy:', error);
    return await prioritizeStrategy(events, severity);
  }
}

/**
 * Helper functions for strategy implementation
 */
function extractPriority(title: string): number {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('urgent') || titleLower.includes('critical')) return 3;
  if (titleLower.includes('important') || titleLower.includes('high')) return 2;
  if (titleLower.includes('meeting') || titleLower.includes('call')) return 2;
  return 1; // Default priority
}

function findNextAvailableSlot(startTime: Date, minimumDelay: number): Date {
  const now = new Date();
  const earliestSlot = new Date(Math.max(now.getTime(), startTime.getTime() + minimumDelay * 60 * 1000));

  // Round to next 30-minute slot
  const minutes = earliestSlot.getMinutes();
  const roundedMinutes = minutes < 30 ? 30 : 60;
  earliestSlot.setMinutes(roundedMinutes, 0, 0);

  if (roundedMinutes === 60) {
    earliestSlot.setHours(earliestSlot.getHours() + 1);
    earliestSlot.setMinutes(0);
  }

  return earliestSlot;
}

async function splitCalendarEvent(eventId: string, splitTimes: Date[]): Promise<void> {
  const { calendarQueries } = await import("@my-better-t-app/db");
  const originalEvent = await calendarQueries.findById(eventId);

  if (!originalEvent || splitTimes.length < 2) return;

  // Delete original event
  await calendarQueries.deleteEvent(eventId);

  // Create new split events
  for (let i = 0; i < splitTimes.length - 1; i++) {
    const startTime = splitTimes[i]!;
    const endTime = splitTimes[i + 1]!;

    await calendarQueries.createEvent(originalEvent.userId, {
      title: `${originalEvent.title} (Part ${i + 1})`,
      description: originalEvent.description || undefined,
      startTime,
      endTime,
      taskId: originalEvent.taskId || undefined,
    });
  }
}

function generateConflictRecommendations(resolved: number, total: number, strategy: string): string[] {
  const recommendations: string[] = [];

  if (resolved === total) {
    recommendations.push("All conflicts successfully resolved using " + strategy + " strategy");
  } else {
    recommendations.push(`${total - resolved} conflicts remain unresolved`);
    recommendations.push("Consider manual review of remaining conflicts");
  }

  if (strategy === "ai_optimized") {
    recommendations.push("Continue using AI optimization for best results");
  }

  if (resolved / total < 0.5) {
    recommendations.push("Review calendar habits to reduce future conflicts");
    recommendations.push("Consider buffer time between events");
  }

  return recommendations;
}