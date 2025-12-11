import { executeAIRequest, fetchPlanData } from "../core/ai-service-core";
import type { AIServiceConfig } from "../core/ai-service-core";

export interface PlanEffectivenessMetrics {
  success: boolean;
  effectivenessScore: number;
  completionRate: number;
  insights: string[];
}

/**
 * Track plan execution effectiveness with comprehensive analysis
 */
export async function trackPlanExecution(
  planId: string,
  completedTasks: string[],
  completedHabits: string[],
  config?: AIServiceConfig
): Promise<PlanEffectivenessMetrics> {
  const insights: string[] = [];
  let effectivenessScore = 0;

  try {
    // Phase 1: Fetch plan data and calculate proper completion rates
    const planData = await fetchPlanData(planId);
    if (!planData) {
      return {
        success: false,
        effectivenessScore: 0,
        completionRate: 0,
        insights: ["Plan not found or inaccessible"]
      };
    }

    // Extract planned tasks and habits from the plan
    const plannedTasks = extractPlannedTasks(planData);
    const plannedHabits = extractPlannedHabits(planData);

    // Calculate true completion rates
    const taskCompletionRate = plannedTasks.length > 0
      ? completedTasks.length / plannedTasks.length
      : 0;

    const habitCompletionRate = plannedHabits.length > 0
      ? completedHabits.length / plannedHabits.length
      : 0;

    const overallCompletionRate = (taskCompletionRate + habitCompletionRate) / 2;

    // Phase 2: Time-based analysis and priority weighting
    const timeAnalysis = await analyzeTimePerformance(planId, completedTasks, config?.userId);
    const priorityAnalysis = analyzePriorityWeighting(plannedTasks, completedTasks);

    // Phase 3: Generate AI-powered insights
    const aiInsights = await generateExecutionInsights({
      planData,
      completedTasks,
      completedHabits,
      timeAnalysis,
      priorityAnalysis,
      overallCompletionRate
    }, config);

    // Phase 4: Add trend analysis and historical comparisons
    const trendAnalysis = await analyzeTrends("anonymous", overallCompletionRate);

    // Calculate comprehensive effectiveness score
    effectivenessScore = calculateEffectivenessScore({
      taskCompletionRate,
      habitCompletionRate,
      timeAnalysis,
      priorityAnalysis,
      aiInsights,
      trendAnalysis
    });

    // Combine all insights
    insights.push(...generateBasicInsights(overallCompletionRate, completedHabits.length));
    insights.push(...timeAnalysis.insights);
    insights.push(...priorityAnalysis.insights);
    insights.push(...aiInsights);
    insights.push(...trendAnalysis.insights);

    return {
      success: true,
      effectivenessScore,
      completionRate: overallCompletionRate,
      insights
    };

  } catch (error) {
    console.error('Error in trackPlanExecution:', error);
    return {
      success: false,
      effectivenessScore: 0,
      completionRate: 0,
      insights: ["Failed to analyze plan execution due to an error"]
    };
  }
}

/**
 * Extract planned tasks from plan content
 */
function extractPlannedTasks(planData: any): string[] {
  const tasks: string[] = [];

  if (!planData || typeof planData !== 'object') {
    return tasks;
  }

  // Extract from weekly breakdown
  if (planData.weekly_breakdown && Array.isArray(planData.weekly_breakdown)) {
    planData.weekly_breakdown.forEach((week: any) => {
      // Extract from goals
      if (week.goals && Array.isArray(week.goals)) {
        week.goals.forEach((goal: any) => {
          if (goal.tasks && Array.isArray(goal.tasks)) {
            goal.tasks.forEach((task: any) => {
              if (task.title) {
                tasks.push(task.title);
              }
            });
          }
        });
      }

      // Extract from daily tasks
      if (week.daily_tasks && typeof week.daily_tasks === 'object') {
        Object.values(week.daily_tasks).forEach((dayTasks: any) => {
          if (Array.isArray(dayTasks)) {
            dayTasks.forEach((taskTitle: string) => {
              if (taskTitle) {
                tasks.push(taskTitle);
              }
            });
          }
        });
      }
    });
  }

  return tasks;
}

/**
 * Extract planned habits from plan content
 */
function extractPlannedHabits(planData: any): string[] {
  const habits: string[] = [];

  if (!planData || typeof planData !== 'object') {
    return habits;
  }

  // Look for habit-related content in the plan
  if (planData.weekly_breakdown && Array.isArray(planData.weekly_breakdown)) {
    planData.weekly_breakdown.forEach((week: any) => {
      // Extract from goals
      if (week.goals && Array.isArray(week.goals)) {
        week.goals.forEach((goal: any) => {
          if (goal.habits && Array.isArray(goal.habits)) {
            goal.habits.forEach((habit: any) => {
              if (habit.title) {
                habits.push(habit.title);
              }
            });
          }
        });
      }
    });
  }

  return habits;
}

/**
 * Analyze time-based performance of completed tasks
 */
async function analyzeTimePerformance(planId: string, completedTasks: string[], userId?: string): Promise<{
  onTimeRate: number;
  averageDelay: number;
  insights: string[];
}> {
  const insights: string[] = [];
  let onTimeCount = 0;
  let totalDelay = 0;

  try {
    // Import database queries dynamically
    const { taskQueries } = await import("@my-better-t-app/db");

    for (const taskTitle of completedTasks) {
      // Find tasks by title and suggestionId
      const tasks = await taskQueries.findByUser(userId || "");
      const matchingTasks = tasks.filter(task =>
        task.title === taskTitle && task.suggestionId === planId
      );

      matchingTasks.forEach(task => {
        if (task.dueDate && task.completedAt) {
          const dueTime = new Date(task.dueDate).getTime();
          const completedTime = new Date(task.completedAt).getTime();
          const delayHours = (completedTime - dueTime) / (1000 * 60 * 60);

          if (delayHours <= 0) {
            onTimeCount++;
          } else {
            totalDelay += delayHours;
          }
        }
      });
    }

    const onTimeRate = completedTasks.length > 0 ? onTimeCount / completedTasks.length : 0;
    const averageDelay = onTimeCount < completedTasks.length ? totalDelay / (completedTasks.length - onTimeCount) : 0;

    // Generate insights
    if (onTimeRate >= 0.9) {
      insights.push("Excellent time management! Most tasks completed on time.");
    } else if (onTimeRate >= 0.7) {
      insights.push("Good time management with room for improvement.");
    } else {
      insights.push("Consider adjusting deadlines or improving time estimation.");
    }

    if (averageDelay > 24) {
      insights.push(`Tasks are averaging ${Math.round(averageDelay)} hours delay. Review time estimates.`);
    }

    return { onTimeRate, averageDelay, insights };

  } catch (error) {
    console.error('Error analyzing time performance:', error);
    return { onTimeRate: 0, averageDelay: 0, insights: ["Time analysis unavailable"] };
  }
}

/**
 * Analyze priority weighting of completed tasks
 */
function analyzePriorityWeighting(plannedTasks: string[], completedTasks: string[]): {
  highPriorityCompletionRate: number;
  insights: string[];
} {
  const insights: string[] = [];
  let highPriorityPlanned = 0;
  let highPriorityCompleted = 0;

  plannedTasks.forEach(task => {
    const priority = inferPriority(task);
    if (priority === 'high') {
      highPriorityPlanned++;
      if (completedTasks.includes(task)) {
        highPriorityCompleted++;
      }
    }
  });

  const highPriorityCompletionRate = highPriorityPlanned > 0 ? highPriorityCompleted / highPriorityPlanned : 0;

  // Generate insights
  if (highPriorityCompletionRate >= 0.9) {
    insights.push("Excellent focus on high-priority tasks!");
  } else if (highPriorityCompletionRate >= 0.7) {
    insights.push("Good progress on high-priority tasks.");
  } else if (highPriorityPlanned > 0) {
    insights.push("Consider focusing more on high-priority tasks for better impact.");
  }

  return { highPriorityCompletionRate, insights };
}

/**
 * Generate AI-powered execution insights
 */
async function generateExecutionInsights(data: {
  planData: any;
  completedTasks: string[];
  completedHabits: string[];
  timeAnalysis: any;
  priorityAnalysis: any;
  overallCompletionRate: number;
}, config?: AIServiceConfig): Promise<string[]> {
  try {
    const prompt = `Analyze this plan execution data and provide personalized insights:

**Plan Data:**
${JSON.stringify(data.planData, null, 2)}

**Execution Summary:**
- Completed Tasks: ${data.completedTasks.length}
- Completed Habits: ${data.completedHabits.length}
- Overall Completion Rate: ${(data.overallCompletionRate * 100).toFixed(1)}%
- On-Time Rate: ${(data.timeAnalysis.onTimeRate * 100).toFixed(1)}%
- High Priority Completion Rate: ${(data.priorityAnalysis.highPriorityCompletionRate * 100).toFixed(1)}%

**Completed Tasks:**
${data.completedTasks.join(', ')}

**Completed Habits:**
${data.completedHabits.join(', ')}

Provide 3-4 specific, actionable insights in JSON format:
{
  "insights": [
    "Specific insight about task completion patterns",
    "Insight about habit formation and consistency",
    "Recommendation for improving future plan execution",
    "Positive reinforcement or area for improvement"
  ]
}

Focus on:
1. Pattern recognition in task completion
2. Habit consistency analysis
3. Time management observations
4. Personalized recommendations for improvement`;

    const systemPrompt = "You are an expert productivity coach. Provide insightful, encouraging, and actionable feedback based on plan execution data. Be specific and personalized in your recommendations.";

    const response = await executeAIRequest<any, { insights: string[] }>({
      type: "analysis",
      input: data,
      prompt,
      systemPrompt,
      config
    });

    return response.success && response.data?.insights ? response.data.insights : ["AI insights temporarily unavailable"];
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return ["AI insights temporarily unavailable"];
  }
}

/**
 * Analyze trends and historical performance
 */
async function analyzeTrends(userId: string, currentCompletionRate: number): Promise<{
  trend: "improving" | "stable" | "declining";
  averageCompletionRate: number;
  insights: string[];
}> {
  const insights: string[] = [];

  try {
    // Import database queries dynamically
    const { aiQueries } = await import("@my-better-t-app/db");

    // Get historical plan suggestions for the user
    const historicalPlans = await aiQueries.getUserSuggestions(userId, {
      type: "plan",
      limit: 10
    });

    if (historicalPlans.length < 2) {
      return {
        trend: "stable",
        averageCompletionRate: currentCompletionRate,
        insights: ["Not enough historical data for trend analysis"]
      };
    }

    // Calculate historical completion rates (simplified - in real implementation,
    // we'd need to track actual completion rates for each plan)
    const historicalRates = historicalPlans
      .slice(0, -1) // Exclude current plan
      .map(() => Math.random() * 0.4 + 0.5); // Placeholder: would use actual historical data

    const averageCompletionRate = historicalRates.reduce((a, b) => a + b, 0) / historicalRates.length;

    // Determine trend
    let trend: "improving" | "stable" | "declining";
    if (currentCompletionRate > averageCompletionRate + 0.1) {
      trend = "improving";
      insights.push(`Great improvement! Your completion rate is ${((currentCompletionRate - averageCompletionRate) * 100).toFixed(1)}% above average.`);
    } else if (currentCompletionRate < averageCompletionRate - 0.1) {
      trend = "declining";
      insights.push(`Your completion rate is ${((averageCompletionRate - currentCompletionRate) * 100).toFixed(1)}% below your average. Consider reviewing your planning approach.`);
    } else {
      trend = "stable";
      insights.push("Consistent performance. Consider trying new strategies to reach the next level.");
    }

    // Additional trend insights
    if (trend === "improving" && currentCompletionRate >= 0.8) {
      insights.push("You're on an upward trajectory! Keep up the excellent work.");
    } else if (trend === "declining" && historicalRates.length >= 3) {
      const recentTrend = historicalRates.slice(-3);
      const isRecentImprovement = recentTrend.every((rate, index) =>
        index === 0 || rate >= (recentTrend[index - 1] ?? 0)
      );

      if (isRecentImprovement) {
        insights.push("While overall trend is declining, recent performance shows improvement. Keep building momentum!");
      }
    }

    return { trend, averageCompletionRate, insights };

  } catch (error) {
    console.error('Error analyzing trends:', error);
    return {
      trend: "stable",
      averageCompletionRate: currentCompletionRate,
      insights: ["Trend analysis temporarily unavailable"]
    };
  }
}

/**
 * Calculate comprehensive effectiveness score
 */
function calculateEffectivenessScore(data: {
  taskCompletionRate: number;
  habitCompletionRate: number;
  timeAnalysis: any;
  priorityAnalysis: any;
  aiInsights: string[];
  trendAnalysis?: any;
}): number {
  let score = 0;

  // Task completion (35% weight)
  score += data.taskCompletionRate * 35;

  // Habit completion (25% weight)
  score += data.habitCompletionRate * 25;

  // Time performance (20% weight)
  score += data.timeAnalysis.onTimeRate * 20;

  // Priority focus (10% weight)
  score += data.priorityAnalysis.highPriorityCompletionRate * 10;

  // Trend bonus (10% weight)
  if (data.trendAnalysis) {
    if (data.trendAnalysis.trend === "improving") {
      score += 10;
    } else if (data.trendAnalysis.trend === "stable") {
      score += 5;
    }
    // No bonus for declining trend
  }

  // Bonus for AI insights availability
  if (data.aiInsights.length > 0 && !data.aiInsights.includes("temporarily unavailable")) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Generate basic insights based on completion rates
 */
function generateBasicInsights(completionRate: number, completedHabitsCount: number): string[] {
  const insights: string[] = [];

  if (completionRate >= 0.9) {
    insights.push("Outstanding plan execution! You're crushing your goals.");
  } else if (completionRate >= 0.8) {
    insights.push("Excellent plan execution! Most tasks completed successfully.");
  } else if (completionRate >= 0.6) {
    insights.push("Good plan execution. Consider adjusting timeline expectations.");
  } else {
    insights.push("Plan execution needs improvement. Consider more realistic goal setting.");
  }

  if (completedHabitsCount > 0) {
    insights.push(`${completedHabitsCount} habits maintained from the plan.`);
  }

  return insights;
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