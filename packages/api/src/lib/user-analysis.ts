import type { Task, Habit, Goal, AISuggestion } from "@my-better-t-app/db";
import { userPreferencesQueries, taskQueries, habitQueries, calendarQueries } from "@my-better-t-app/db/queries";


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
export function analyzeTimePatterns(tasks: Task[]): {
   preferredDays: string[];
   peakHours: string[];
   taskDistribution: Record<string, number>;
} {
   if (!tasks || tasks.length === 0) {
      // Return defaults if no tasks
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

   // Analyze task creation and completion patterns
   const dayCount: Record<string, number> = {};
   const hourCount: Record<string, number> = {};
   const timeDistribution: Record<string, number> = {
      morning: 0,    // 6:00 - 12:00
      afternoon: 0,  // 12:00 - 18:00
      evening: 0     // 18:00 - 24:00
   };

   const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

   tasks.forEach(task => {
      // Analyze creation date patterns
      const createdDate = new Date(task.createdAt);
      const dayName = daysOfWeek[createdDate.getDay()];
      const hour = createdDate.getHours();

      // Count days
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;

      // Count hours
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      hourCount[hourKey] = (hourCount[hourKey] || 0) + 1;

      // Categorize by time of day
      if (hour >= 6 && hour < 12) {
         timeDistribution.morning++;
      } else if (hour >= 12 && hour < 18) {
         timeDistribution.afternoon++;
      } else {
         timeDistribution.evening++;
      }
   });

   // Also analyze due dates if available
   tasks.forEach(task => {
      if (task.dueDate) {
         const dueDate = new Date(task.dueDate);
         const dayName = daysOfWeek[dueDate.getDay()];
         const hour = dueDate.getHours();

         // Weight due dates more heavily as they indicate planning
         dayCount[dayName] = (dayCount[dayName] || 0) + 2;

         const hourKey = `${hour.toString().padStart(2, '0')}:00`;
         hourCount[hourKey] = (hourCount[hourKey] || 0) + 2;
      }
   });

   // Find preferred days (top 3)
   const preferredDays = Object.entries(dayCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);

   // Find peak hours (top 3)
   const peakHours = Object.entries(hourCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => hour);

   // Convert counts to percentages
   const totalTasks = Object.values(timeDistribution).reduce((sum, count) => sum + count, 0);
   const taskDistribution = totalTasks > 0 ?
      Object.fromEntries(
         Object.entries(timeDistribution).map(([period, count]) =>
            [period, Math.round((count / totalTasks) * 100)]
         )
      ) : {
         morning: 40,
         afternoon: 35,
         evening: 25
      };

   return {
      preferredDays: preferredDays.length > 0 ? preferredDays : ["Monday", "Tuesday", "Wednesday"],
      peakHours: peakHours.length > 0 ? peakHours : ["09:00", "14:00"],
      taskDistribution
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
export async function checkCalendarConflicts(userId: string, plan: any, context: any): Promise<{
   type: "task" | "habit" | "time";
   description: string;
   severity: "low" | "medium" | "high";
}[]> {
   const conflicts: any[] = [];

   try {
      // Get calendar events for the next 30 days to check for conflicts
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const existingEvents = await calendarQueries.findByDateRange(userId, now, futureDate);

      // Check workload conflicts
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

      // Check for calendar density conflicts
      if (existingEvents.length > 50) {
         conflicts.push({
            type: "time",
            description: "Your calendar is heavily booked - the new plan may overload your schedule",
            severity: "high"
         });
      }

      // Analyze daily calendar load
      const dailyEventCount: Record<string, number> = {};
      existingEvents.forEach(event => {
         const date = new Date(event.startTime).toDateString();
         dailyEventCount[date] = (dailyEventCount[date] || 0) + 1;
      });

      // Find heavily booked days (more than 8 events)
      const heavilyBookedDays = Object.entries(dailyEventCount)
         .filter(([, count]) => count > 8)
         .length;

      if (heavilyBookedDays > 10) {
         conflicts.push({
            type: "time",
            description: `${heavilyBookedDays} days in the next month are heavily scheduled - consider spreading tasks more evenly`,
            severity: "medium"
         });
      }

      // Check for habit conflicts
      const activeHabits = context.existingHabits.filter((habit: Habit) =>
         habit.currentStreak > 0 && habit.frequency === 'daily'
      );

      if (activeHabits.length > 8) {
         conflicts.push({
            type: "habit",
            description: "You have many daily habits - ensure the new plan doesn't conflict with your existing routines",
            severity: "low"
         });
      }

      // Check for upcoming deadlines in the next week
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingTasks = await taskQueries.findByDateRange(userId, now, nextWeek);
      const highPriorityTasks = upcomingTasks.filter(task =>
         task.priority === 'high' || task.priority === 'urgent'
      );

      if (highPriorityTasks.length > 5) {
         conflicts.push({
            type: "task",
            description: `${highPriorityTasks.length} high-priority tasks due this week - consider postponing major plan implementation`,
            severity: "high"
         });
      }

      // Check for overdue tasks
      const overdueTasks = await taskQueries.findOverdue(userId);
      if (overdueTasks.length > 3) {
         conflicts.push({
            type: "task",
            description: `${overdueTasks.length} overdue tasks - complete these before starting new commitments`,
            severity: "medium"
         });
      }

      // Analyze plan-specific conflicts
      if (plan && plan.weekly_breakdown) {
         // Check if plan has too many daily tasks
         const planTaskCount = plan.weekly_breakdown.reduce((total: number, week: any) => {
            return total + Object.values(week.daily_tasks || {})
               .reduce((weekTotal: number, dayTasks: any) =>
                  weekTotal + (Array.isArray(dayTasks) ? dayTasks.length : 0), 0);
         }, 0);

         const avgTasksPerWeek = planTaskCount / 4; // Assuming 4 weeks
         if (avgTasksPerWeek > 20) {
            conflicts.push({
               type: "task",
               description: "The generated plan is quite ambitious with many tasks per week - consider prioritizing key activities",
               severity: "medium"
            });
         }
      }

   } catch (error) {
      console.error('Error checking calendar conflicts:', error);
      // Add a general warning if we can't check conflicts
      conflicts.push({
         type: "time",
         description: "Unable to fully check calendar conflicts - proceed with caution",
         severity: "low"
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
      // Direct access to existing data for backward compatibility
      existingTasks,
      existingHabits,

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
      } : null,

      // Raw preferences for direct access if needed
      preferences
   };
}
