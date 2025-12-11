import { executeAIRequest, type AIResponse } from "../core/ai-service-core";
import type { AIServiceConfig } from "../core/ai-service-core";

export interface SuggestionItemClassification {
  title: string;
  type: "task" | "habit" | "recurring-task";
  confidence: number;
  reasoning: string;
  suggested_priority: "low" | "medium" | "high";
  suggested_frequency?: "daily" | "weekly" | "monthly";
  estimated_duration?: string;
  due_date?: string;
  recurrence_rule?: string;

  // Rich scheduling information from AI plans
  start_time?: string; // ISO timestamp or time string (e.g., "9:00 AM")
  end_time?: string; // ISO timestamp or time string (e.g., "12:00 PM")
  day_of_week?: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  week_number?: number; // Week number in the plan (1-4)
  time_block?: "morning" | "afternoon" | "evening" | "night";
  plan_context?: {
    week_focus?: string; // e.g., "React Native Setup and TypeScript Fundamentals"
    goal?: string; // e.g., "Set up React Native development environment"
    original_task_string?: string; // Original task string from AI
  };

  habit_potential?: {
    is_habit: boolean;
    frequency?: "daily" | "weekly" | "monthly";
    target_value?: number;
    streak_suggestion?: number;
    best_time?: "morning" | "afternoon" | "evening";
    trigger_activity?: string;
  };
  dependencies?: string[];
  quick_win?: boolean;
  long_term_build?: boolean;
}

export interface SuggestionApplicationStrategy {
  classifications: SuggestionItemClassification[];
  application_strategy: {
    recommended_order: string[];
    dependencies: string[];
    quick_wins: string[];
    long_term_builds: string[];
    total_estimated_time: string;
    balance_score: number;
  };
  warnings: string[];
  success_metrics: string[];
}

/**
 * Classify suggestion items for application as tasks, habits, or recurring tasks
 */
export async function classifySuggestionItems(
  suggestionContent: any,
  userContext?: {
    current_tasks?: any[];
    current_habits?: any[];
    user_preferences?: any;
    completion_history?: any;
  },
  config?: AIServiceConfig
): Promise<AIResponse<SuggestionApplicationStrategy>> {
  const prompt = `You are an intelligent task and habit classifier. Analyze plan suggestions and classify them for optimal application as tasks, habits, or recurring tasks.

**Input Suggestion:**
${JSON.stringify(suggestionContent)}

**User Context:**
- Existing tasks: ${JSON.stringify(userContext?.current_tasks || [])}
- Existing habits: ${JSON.stringify(userContext?.current_habits || [])}
- User preferences: ${JSON.stringify(userContext?.user_preferences || {})}
- Completion patterns: ${JSON.stringify(userContext?.completion_history || {})}

**Classification Rules:**
1. **Tasks**: One-time activities with specific outcomes and deadlines
2. **Habits**: Recurring activities that build skills/behaviors over time
3. **Recurring Tasks**: Regular responsibilities that need completion but aren't habit-forming

**Task Identification Criteria:**
- Has specific deadline or due date
- One-time completion required
- Clear deliverable or outcome
- Project-based activities
- Learning milestones

**Habit Identification Criteria:**
- Daily/weekly recurring activities
- Skill-building exercises
- Health and wellness activities
- Personal development practices
- Activities that benefit from consistency

**Recurring Task Identification Criteria:**
- Regular maintenance activities
- Review and reporting tasks
- Administrative responsibilities
- Meetings and check-ins
- Cleanup and organization

**Output Format (JSON):**
{
  "classifications": [
    {
      "title": "Item title",
      "type": "task|habit|recurring-task",
      "confidence": 0.95,
      "reasoning": "Why this classification makes sense",
      "suggested_priority": "low|medium|high",
      "suggested_frequency": "daily|weekly|monthly",
      "estimated_duration": "30 min",
      "due_date": "ISO date if applicable",
      "recurrence_rule": "RRULE or custom pattern for recurring tasks",
      "habit_potential": {
        "is_habit": true,
        "frequency": "daily",
        "target_value": 1,
        "streak_suggestion": 21,
        "best_time": "morning|afternoon|evening",
        "trigger_activity": "existing habit to stack with"
      },
      "dependencies": ["Items that should be completed first"],
      "quick_win": true/false,
      "long_term_build": true/false
    }
  ],
  "application_strategy": {
    "recommended_order": ["Suggested order of application"],
    "dependencies": ["Items that depend on others"],
    "quick_wins": ["Items for immediate success"],
    "long_term_builds": ["Items that develop over time"],
    "total_estimated_time": "Total time commitment per week",
    "balance_score": "How well this balances different life areas"
  },
  "warnings": [
    "Potential conflicts or overload warnings",
    "Items that might be too ambitious",
    "Timing considerations"
  ],
  "success_metrics": [
    "How to measure successful application",
    "Key performance indicators for each item type"
  ]
}

**Confidence Scoring Guidelines:**
- **0.9-1.0**: Very clear classification, strong pattern match
- **0.7-0.89**: Good classification with reasonable confidence
- **0.5-0.69**: Moderate confidence, multiple interpretations possible
- **0.3-0.49**: Low confidence, user input recommended
- **0.0-0.29**: Very uncertain, manual classification needed

**Recurrence Rule Examples:**
- Daily: "FREQ=DAILY"
- Weekly: "FREQ=WEEKLY;BYDAY=MO,WE,FR"
- Monthly: "FREQ=MONTHLY;BYMONTHDAY=1"
- Workdays: "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR"`;

  const systemPrompt = "You are an intelligent task and habit classifier. Analyze plan suggestions and provide detailed classifications with confidence scores and application strategies. Focus on realistic categorization and practical implementation guidance.";

  return await executeAIRequest<any, SuggestionApplicationStrategy>({
    type: "analysis",
    input: { suggestionContent, userContext },
    prompt,
    systemPrompt,
    config,
  });
}

/**
 * Extract items from suggestion content for application as tasks, habits, or recurring tasks
 */
export function extractItemsFromSuggestion(
  suggestion: any,
  applyAs: "task" | "habit" | "recurring-task"
): SuggestionItemClassification[] {
  const items: SuggestionItemClassification[] = [];

  if (!suggestion || typeof suggestion !== 'object') {
    return items;
  }

  // Extract from plan suggestions
  if (suggestion.weekly_breakdown && Array.isArray(suggestion.weekly_breakdown)) {
    suggestion.weekly_breakdown.forEach((week: any, weekIndex: number) => {
      // Extract from goals
      if (week.goals && Array.isArray(week.goals)) {
        week.goals.forEach((goal: any) => {
          if (goal.tasks && Array.isArray(goal.tasks)) {
            goal.tasks.forEach((task: any) => {
              const classification: SuggestionItemClassification = {
                title: task.title,
                type: applyAs,
                confidence: calculateConfidence(task.title, applyAs),
                reasoning: generateReasoning(task.title, applyAs),
                suggested_priority: task.priority || inferPriority(task.title),
                estimated_duration: task.duration || "30 min",
                due_date: task.dueDate,
                quick_win: isQuickWin(task.title),
                long_term_build: isLongTermBuild(task.title),
              };

              if (applyAs === "recurring-task") {
                classification.recurrence_rule = generateRecurrenceRule(task.title);
              } else if (applyAs === "habit") {
                classification.habit_potential = analyzeHabitPotential(task.title);
                classification.suggested_frequency = classification.habit_potential.frequency;
              }

              items.push(classification);
            });
          }
        });
      }

      // Extract from daily tasks
      if (week.daily_tasks && typeof week.daily_tasks === 'object') {
        Object.entries(week.daily_tasks).forEach(([day, tasks]: [string, any]) => {
          if (Array.isArray(tasks)) {
            tasks.forEach((taskTitle: string) => {
              // Parse time information from task string
              // Format: "9:00 AM - 12:00 PM: Task description" or "6:00 PM: Exercise (30 minutes)"
              const timeInfo = parseTaskTimeInfo(taskTitle);

              const classification: SuggestionItemClassification = {
                title: timeInfo.cleanTitle,
                type: applyAs,
                confidence: calculateConfidence(timeInfo.cleanTitle, applyAs),
                reasoning: generateReasoning(timeInfo.cleanTitle, applyAs),
                suggested_priority: inferPriority(timeInfo.cleanTitle),
                estimated_duration: timeInfo.duration || "30 min",
                due_date: calculateDueDate(weekIndex, day),

                // Rich scheduling information
                start_time: timeInfo.startTime,
                end_time: timeInfo.endTime,
                day_of_week: day as any,
                week_number: weekIndex + 1,
                time_block: timeInfo.timeBlock,
                plan_context: {
                  week_focus: week.focus,
                  goal: week.goals?.[0], // First goal as primary context
                  original_task_string: taskTitle,
                },

                quick_win: isQuickWin(timeInfo.cleanTitle),
                long_term_build: isLongTermBuild(timeInfo.cleanTitle),
              };

              if (applyAs === "recurring-task") {
                classification.recurrence_rule = generateRecurrenceRule(timeInfo.cleanTitle);
              } else if (applyAs === "habit") {
                classification.habit_potential = analyzeHabitPotential(timeInfo.cleanTitle);
                classification.suggested_frequency = classification.habit_potential.frequency;
              }

              items.push(classification);
            });
          }
        });
      }
    });
  }

  return items;
}

/**
 * Calculate confidence score for item classification
 */
function calculateConfidence(title: string, type: "task" | "habit" | "recurring-task"): number {
  const lowerTitle = title.toLowerCase();

  if (type === "task") {
    const taskKeywords = ["complete", "finish", "submit", "deliver", "create", "build", "develop"];
    const matches = taskKeywords.filter(keyword => lowerTitle.includes(keyword)).length;
    return Math.min(0.9, 0.5 + (matches * 0.1));
  }

  if (type === "habit") {
    const habitKeywords = ["exercise", "meditate", "read", "write", "practice", "study", "daily", "every"];
    const matches = habitKeywords.filter(keyword => lowerTitle.includes(keyword)).length;
    return Math.min(0.95, 0.6 + (matches * 0.1));
  }

  if (type === "recurring-task") {
    const recurringKeywords = ["review", "meeting", "report", "check", "update", "weekly", "monthly"];
    const matches = recurringKeywords.filter(keyword => lowerTitle.includes(keyword)).length;
    return Math.min(0.9, 0.5 + (matches * 0.1));
  }

  return 0.5;
}

/**
 * Generate reasoning for classification
 */
function generateReasoning(title: string, type: "task" | "habit" | "recurring-task"): string {
  const lowerTitle = title.toLowerCase();

  if (type === "task") {
    if (lowerTitle.includes("complete") || lowerTitle.includes("finish")) {
      return "Contains completion-oriented language indicating a one-time task";
    }
    return "Appears to be a specific activity with clear deliverable";
  }

  if (type === "habit") {
    if (lowerTitle.includes("daily") || lowerTitle.includes("every")) {
      return "Contains frequency indicators suggesting a recurring habit";
    }
    return "Represents an activity that benefits from consistent practice";
  }

  if (type === "recurring-task") {
    if (lowerTitle.includes("review") || lowerTitle.includes("meeting")) {
      return "Contains maintenance or coordination language typical of recurring tasks";
    }
    return "Represents a regular responsibility that needs periodic completion";
  }

  return "Classification based on pattern analysis";
}

/**
 * Generate recurrence rule for recurring tasks
 */
function generateRecurrenceRule(title: string): string {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("daily")) return "FREQ=DAILY";
  if (lowerTitle.includes("weekly")) return "FREQ=WEEKLY";
  if (lowerTitle.includes("monthly")) return "FREQ=MONTHLY";
  if (lowerTitle.includes("workday") || lowerTitle.includes("weekday")) {
    return "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR";
  }

  // Default to weekly for recurring tasks
  return "FREQ=WEEKLY";
}

/**
 * Analyze habit potential of an item
 */
function analyzeHabitPotential(title: string) {
  const lowerTitle = title.toLowerCase();

  const dailyHabits = ["exercise", "meditate", "read", "write", "practice", "study"];
  const weeklyHabits = ["review", "plan", "organize", "clean", "shop"];

  let frequency: "daily" | "weekly" | "monthly" = "daily";
  let targetValue = 1;

  if (dailyHabits.some(habit => lowerTitle.includes(habit))) {
    frequency = "daily";
    targetValue = 1;
  } else if (weeklyHabits.some(habit => lowerTitle.includes(habit))) {
    frequency = "weekly";
    targetValue = 7;
  } else {
    frequency = "monthly";
    targetValue = 30;
  }

  return {
    is_habit: true,
    frequency,
    target_value: targetValue,
    streak_suggestion: 21,
    best_time: inferBestTime(lowerTitle),
    trigger_activity: inferTriggerActivity(lowerTitle),
  };
}

/**
 * Infer best time for habit
 */
function inferBestTime(title: string): "morning" | "afternoon" | "evening" {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("morning") || lowerTitle.includes("breakfast")) return "morning";
  if (lowerTitle.includes("evening") || lowerTitle.includes("night")) return "evening";
  if (lowerTitle.includes("afternoon") || lowerTitle.includes("lunch")) return "afternoon";

  // Default based on activity type
  if (lowerTitle.includes("exercise") || lowerTitle.includes("meditate")) return "morning";
  if (lowerTitle.includes("read") || lowerTitle.includes("study")) return "evening";

  return "morning";
}

/**
 * Infer trigger activity for habit stacking
 */
function inferTriggerActivity(title: string): string {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("exercise")) return "after waking up";
  if (lowerTitle.includes("meditate")) return "after waking up";
  if (lowerTitle.includes("read")) return "before bed";
  if (lowerTitle.includes("write")) return "after morning coffee";
  if (lowerTitle.includes("study")) return "after dinner";

  return "daily";
}

/**
 * Parse time information from task string
 * Formats supported:
 * - "9:00 AM - 12:00 PM: Task description"
 * - "6:00 PM: Exercise (30 minutes)"
 * - "Task description" (no time info)
 */
function parseTaskTimeInfo(taskString: string): {
  cleanTitle: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  timeBlock?: "morning" | "afternoon" | "evening" | "night";
} {
  // Regex to match time ranges: "9:00 AM - 12:00 PM: Description"
  const timeRangeRegex = /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)):\s*(.+)/;
  const timeRangeMatch = taskString.match(timeRangeRegex);

  if (timeRangeMatch) {
    const startTime = timeRangeMatch[1]!.trim();
    const endTime = timeRangeMatch[2]!.trim();
    const cleanTitle = timeRangeMatch[3]!.trim();

    // Calculate duration
    const duration = calculateDurationFromTimes(startTime, endTime);
    const timeBlock = getTimeBlock(startTime);

    return {
      cleanTitle,
      startTime,
      endTime,
      duration,
      timeBlock,
    };
  }

  // Regex to match single time: "6:00 PM: Description"
  const singleTimeRegex = /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)):\s*(.+)/;
  const singleTimeMatch = taskString.match(singleTimeRegex);

  if (singleTimeMatch) {
    const startTime = singleTimeMatch[1]!.trim();
    let cleanTitle = singleTimeMatch[2]!.trim();

    // Try to extract duration from parentheses: "Exercise (30 minutes)"
    const durationRegex = /(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i;
    const durationMatch = cleanTitle.match(durationRegex);
    let duration: string | undefined;

    if (durationMatch) {
      const value = durationMatch[1]!;
      const unit = durationMatch[0]!.toLowerCase();
      duration = unit.includes('hour') || unit.includes('hr') ? `${value} hours` : `${value} min`;
      // Remove duration from title
      cleanTitle = cleanTitle.replace(/\s*\(\s*\d+\s*(?:minutes?|mins?|hours?|hrs?)\s*\)/i, '').trim();
    }

    const timeBlock = getTimeBlock(startTime);

    return {
      cleanTitle,
      startTime,
      duration,
      timeBlock,
    };
  }

  // No time information found, return as is
  return {
    cleanTitle: taskString,
  };
}

/**
 * Calculate duration between two time strings
 */
function calculateDurationFromTimes(startTime: string, endTime: string): string {
  try {
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    if (!start || !end) return "30 min";

    let diffMinutes = (end.hours * 60 + end.minutes) - (start.hours * 60 + start.minutes);

    // Handle overnight times
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }

    if (diffMinutes >= 60) {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return mins > 0 ? `${hours} hours ${mins} min` : `${hours} hours`;
    }

    return `${diffMinutes} min`;
  } catch (error) {
    return "30 min";
  }
}

/**
 * Parse time string to hours and minutes
 */
function parseTime(timeString: string): { hours: number; minutes: number } | null {
  const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/;
  const match = timeString.match(timeRegex);

  if (!match) return null;

  let hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const period = match[3]!.toUpperCase();

  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

/**
 * Determine time block from time string
 */
function getTimeBlock(timeString: string): "morning" | "afternoon" | "evening" | "night" {
  const time = parseTime(timeString);

  if (!time) return "morning";

  const hour = time.hours;

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/**
 * Check if item is a quick win
 */
function isQuickWin(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  const quickWinKeywords = ["quick", "simple", "easy", "short", "brief", "review", "check"];
  return quickWinKeywords.some(keyword => lowerTitle.includes(keyword));
}

/**
 * Check if item is a long term build
 */
function isLongTermBuild(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  const longTermKeywords = ["learn", "develop", "build", "create", "master", "practice", "study"];
  return longTermKeywords.some(keyword => lowerTitle.includes(keyword));
}

/**
 * Calculate due date from week and day
 */
function calculateDueDate(weekIndex: number, day: string): string {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const weekStart = new Date(startOfMonth.getTime() + (weekIndex * 7 * 24 * 60 * 60 * 1000));

  const dayMap: { [key: string]: number } = {
    'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
    'friday': 5, 'saturday': 6, 'sunday': 0
  };

  const dayOffset = dayMap[day.toLowerCase()] || 0;
  const dueDate = new Date(weekStart.getTime() + (dayOffset * 24 * 60 * 60 * 1000));

  return dueDate.toISOString().split('T')[0] ?? "";
}

/**
 * Helper method to infer task priority
 */
function inferPriority(taskTitle: string): "low" | "medium" | "high" {
  const title = taskTitle.toLowerCase();
  if (title.includes('urgent') || title.includes('critical') || title.includes('important')) {
    return 'high';
  }
  if (title.includes('review') || title.includes('meeting') || title.includes('call')) {
    return 'medium';
  }
  return 'low';
}

/**
 * Categorize a task from text input
 */
export async function categorizeTask(
  taskText: string,
  config?: AIServiceConfig
): Promise<AIResponse<{ title: string; category: string; dueDate?: string; priority: string }>> {
  const prompt = `Analyze this task input: "${taskText}"

    Return a JSON object with:
    - title: Cleaned task title
    - category: Suggested category (e.g., Work, Health, Personal, Learning)
    - dueDate: ISO date string if mentioned (assume current year), null otherwise
    - priority: inferred priority (low, medium, high)`;

  return await executeAIRequest<string, { title: string; category: string; dueDate?: string; priority: string }>({
    type: "categorization",
    input: taskText,
    prompt,
    config
  });
}