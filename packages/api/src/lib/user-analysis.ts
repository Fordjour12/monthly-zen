import type { Task, Habit, Goal, AISuggestion } from "@my-better-t-app/db";

/**
 * Get user preferences (could be expanded to fetch from user settings)
 */
export async function getUserPreferences(_userId: string): Promise<any> {
  try {
    // This could be expanded to fetch from a user preferences table
    // For now, return sensible defaults
    return {
      workHours: {
        start: "09:00",
        end: "17:00",
        workdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      },
      energyPatterns: {
        highEnergyTimes: ["morning"],
        lowEnergyTimes: ["evening"],
        weekendPreference: "mixed"
      },
      taskComplexity: "balanced",
      priorityFocus: ["health", "career", "learning"]
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {};
  }
}

/**
 * Calculate productivity metrics from existing tasks and plans
 */
export function calculateProductivityMetrics(tasks: Task[], _plans: AISuggestion[]): {
  averageTasksPerWeek: number;
  completionRate: number;
  productivityTrend: "improving" | "stable" | "declining";
} {
  const avgTasks = tasks.length > 0 ? tasks.length / 4 : 0; // Rough estimate
  const completedTasks = tasks.filter((task: Task) => task.status === "completed").length;
  const completionRate = tasks.length > 0 ? completedTasks / tasks.length : 0.75;

  return {
    averageTasksPerWeek: avgTasks,
    completionRate,
    productivityTrend: "stable"
  };
}

/**
 * Analyze time patterns from existing tasks
 */
export function analyzeTimePatterns(_tasks: Task[]): {
  preferredDays: string[];
  peakHours: string[];
  taskDistribution: Record<string, number>;
} {
  // Placeholder implementation - would analyze actual task data
  return {
    preferredDays: ["Monday", "Tuesday", "Wednesday"],
    peakHours: ["09:00", "14:00"],
    taskDistribution: {
      morning: 40,
      afternoon: 35,
      evening: 25
    }
  };
}

/**
 * Calculate current workload
 */
export function calculateCurrentWorkload(tasks: Task[], habits: Habit[]): {
  tasksCount: number;
  habitsCount: number;
  workloadLevel: "light" | "moderate" | "heavy";
  availableCapacity: number;
} {
  const total = tasks.length + habits.length;
  let workloadLevel: "light" | "moderate" | "heavy" = "light";

  if (total > 15) workloadLevel = "heavy";
  else if (total > 8) workloadLevel = "moderate";

  return {
    tasksCount: tasks.length,
    habitsCount: habits.length,
    workloadLevel,
    availableCapacity: Math.max(0, 20 - total) // Assume 20 is max capacity
  };
}

/**
 * Calculate work hours from user preferences
 */
export function calculateWorkHours(workHours: {
  start?: string;
  end?: string;
  workdays?: string[];
}): number {
  if (!workHours.start || !workHours.end) return 8; // Default 8 hours

  try {
    const start = new Date(`2000-01-01T${workHours.start}`);
    const end = new Date(`2000-01-01T${workHours.end}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Adjust for workdays
    const workdaysCount = workHours.workdays?.length || 5;
    const dailyHours = hours * (workdaysCount / 5); // Normalize to 5-day week

    return Math.max(1, Math.min(16, dailyHours)); // Cap between 1-16 hours
  } catch {
    return 8; // Default on error
  }
}

/**
 * Analyze plan quality and provide recommendations
 */
export function analyzePlanQuality(plan: any, context: any): {
  qualityScore: number;
  complexity: "simple" | "balanced" | "complex";
  feasibility: "high" | "medium" | "low";
  recommendations: string[];
} {
  const recommendations: string[] = [];
  let qualityScore = 50;
  let complexity: "simple" | "balanced" | "complex" = "balanced";
  let feasibility: "high" | "medium" | "low" = "medium";

  // Count total tasks
  const totalTasks = plan.weekly_breakdown?.reduce((acc: number, week: any) => {
    const weekTasks = Object.values(week.daily_tasks || {})
      .reduce((weekAcc: number, dayTasks: any) => weekAcc + (Array.isArray(dayTasks) ? dayTasks.length : 0), 0);
    return acc + weekTasks;
  }, 0) || 0;

  // Quality scoring based on task count
  if (totalTasks > 80) {
    qualityScore -= 20;
    feasibility = "low";
  } else if (totalTasks < 40) {
    qualityScore -= 10;
  } else {
    qualityScore += 10;
    feasibility = "high";
  }

  // Complexity assessment
  if (totalTasks > 70) {
    complexity = "complex";
  } else if (totalTasks < 50) {
    complexity = "simple";
  }

  // Generate recommendations
  if (totalTasks > 80) {
    recommendations.push("Consider reducing the number of tasks for better feasibility");
  } else if (totalTasks < 40) {
    recommendations.push("You could add more detailed tasks to make the plan more comprehensive");
  }

  // Check for weekend balance
  const weekendTasks = plan.weekly_breakdown?.reduce((acc: number, week: any) => {
    const weekendDays = Object.entries(week.daily_tasks || {})
      .filter(([day, _]) => day.toLowerCase().includes('saturday') || day.toLowerCase().includes('sunday'))
      .length;
    return acc + weekendDays;
  }, 0) || 0;

  if (weekendTasks > 20) {
    recommendations.push("Consider adding more rest time on weekends");
  } else if (weekendTasks < 5 && context.preferences?.weekendPreference !== "rest") {
    recommendations.push("You might want to add some productive weekend activities");
  }

  return {
    qualityScore: Math.max(0, Math.min(100, qualityScore)),
    complexity,
    feasibility,
    recommendations
  };
}

/**
 * Check for calendar conflicts with existing commitments
 */
export async function checkCalendarConflicts(_userId: string, _plan: any, context: any): Promise<{
  type: "task" | "habit" | "time";
  description: string;
  severity: "low" | "medium" | "high";
}[]> {
  // Placeholder implementation - would check actual calendar
  const conflicts: any[] = [];

  // Check if new plan tasks overlap with existing tasks
  if (context.existingTasks.length > 15) {
    conflicts.push({
      type: "task",
      description: "High existing workload may make it difficult to complete new plan",
      severity: "medium"
    });
  }

  // Check time allocation
  const workloadLevel = calculateCurrentWorkload(context.existingTasks, context.existingHabits);
  if (workloadLevel.workloadLevel === "heavy") {
    conflicts.push({
      type: "time",
      description: "Current schedule is quite full - consider phased implementation",
      severity: "medium"
    });
  }

  return conflicts;
}

/**
 * Build comprehensive user context for plan generation
 */
export function buildUserContext(
  userGoals: Goal[],
  existingTasks: Task[],
  existingHabits: Habit[],
  recentPlans: AISuggestion[],
  preferences: any
): any {
  return {
    // Active goals and aspirations
    activeGoals: userGoals,

    // Time and availability preferences
    timePreferences: {
      averageDailyHours: preferences?.workHours ?
        calculateWorkHours(preferences.workHours) : 7,
      peakEnergyPeriods: preferences?.energyPatterns?.highEnergyTimes || ["morning"],
      timezone: "UTC" // Could be stored in user profile
    },

    // Work style preferences
    workPreferences: {
      deepWorkPreferred: preferences?.taskComplexity === "ambitious",
      taskBatchingPreferred: true, // Could be user preference
      regularBreaksPreferred: true, // Could be user preference
      preferredSessionDuration: 60 // minutes
    },

    // Personal values and success metrics
    personalValues: preferences?.priorityFocus || ["growth", "health", "relationships"],
    successMetrics: {
      preferredMetrics: ["completion_rate", "consistency", "impact"]
    },

    // Current commitments and constraints
    existingCommitments: {
      timeConstraints: existingTasks.map(task => task.title).slice(0, 5), // Show recent tasks as constraints
      existingWorkload: calculateCurrentWorkload(existingTasks, existingHabits).workloadLevel
    },

    // Productivity and performance metrics
    productivityMetrics: {
      averageCompletionRate: calculateProductivityMetrics(existingTasks, recentPlans).completionRate,
      mostProductiveDay: analyzeTimePatterns(existingTasks).preferredDays[0] || "Monday",
      mostProductiveTime: analyzeTimePatterns(existingTasks).peakHours[0] || "09:00",
      totalTasksCompleted: existingTasks.filter(task => task.status === "completed").length
    },

    // Recent plan insights
    recentPlanInsights: recentPlans.length > 0 ? {
      commonChallenges: ["Time management", "Consistency"], // Would analyze from plan data
      successPatterns: ["Morning routine", "Task batching"], // Would analyze from plan data
      averagePlanCompletion: 0.75 // Would calculate from actual data
    } : null
  };
}