import * as db from "@monthly-zen/db";
import {
  getDayOfWeekPatterns,
  getFocusAreaPatterns,
  detectBurnoutRisk,
  type DayOfWeekPattern,
} from "@monthly-zen/db";

export interface GeneratedInsight {
  type: "PeakEnergy" | "CompletionRate" | "SessionDuration" | "Challenges";
  title: string;
  description: string;
  reasoning?: string;
  suggestedAction?: string;
  confidence: string;
  priority: "high" | "medium" | "low";
  category: string;
  triggerData: Record<string, unknown>;
}

export async function generateInsight(userId: string): Promise<GeneratedInsight | null> {
  try {
    const [dayPatterns, focusPatterns, burnoutRisk] = await Promise.all([
      getDayOfWeekPatterns(userId),
      getFocusAreaPatterns(userId),
      detectBurnoutRisk(userId),
    ]);

    const defaultPattern: DayOfWeekPattern = {
      dayOfWeek: 0,
      dayName: "Sunday",
      completionRate: 0,
      totalTasks: 0,
      avgTasksPerWeek: 0,
      trend: "stable",
    };

    const bestDay = dayPatterns.reduce(
      (best, current) => (current.completionRate > best.completionRate ? current : best),
      dayPatterns[0] ?? defaultPattern,
    );

    const worstDay = dayPatterns.reduce(
      (worst, current) => (current.completionRate < worst.completionRate ? current : worst),
      dayPatterns[0] ?? { ...defaultPattern, completionRate: 1 },
    );

    const strugglingFocusArea = focusPatterns.find(
      (fa) => fa.completionRate < 0.5 && fa.totalTasks >= 3,
    );

    const insights: GeneratedInsight[] = [];

    if (burnoutRisk.level === "high") {
      insights.push({
        type: "Challenges",
        title: "High Burnout Risk Detected",
        description: `Your productivity has dropped to ${burnoutRisk.score}%. Consider taking breaks and reducing workload.`,
        reasoning: burnoutRisk.indicators.join(", "),
        suggestedAction: "Reduce tasks by 30% and add recovery breaks",
        confidence: "90%",
        priority: "high",
        category: "burnout",
        triggerData: { burnoutRisk },
      });
    } else if (burnoutRisk.level === "medium" && burnoutRisk.isDeclining) {
      insights.push({
        type: "CompletionRate",
        title: "Productivity Declining",
        description:
          "Your completion rate is trending downward. Small adjustments now can prevent larger issues.",
        reasoning: burnoutRisk.indicators.join(", "),
        suggestedAction: "Review task list and prioritize essential items",
        confidence: "75%",
        priority: "medium",
        category: "productivity",
        triggerData: { burnoutRisk },
      });
    }

    if (bestDay.completionRate > 0.7 && bestDay.totalTasks >= 5) {
      insights.push({
        type: "PeakEnergy",
        title: `${bestDay.dayName} is Your Peak Day`,
        description: `You complete ${Math.round(bestDay.completionRate * 100)}% of tasks on ${bestDay.dayName}s. Schedule important work then.`,
        suggestedAction: `Block 2-3 hours for deep work next ${bestDay.dayName}`,
        confidence: `${Math.round(bestDay.completionRate * 100)}%`,
        priority: "medium",
        category: "scheduling",
        triggerData: { bestDay },
      });
    }

    if (worstDay.completionRate < 0.5 && worstDay.totalTasks >= 3) {
      insights.push({
        type: "Challenges",
        title: `${worstDay.dayName} Productivity Gap`,
        description: `Only ${Math.round(worstDay.completionRate * 100)}% completion on ${worstDay.dayName}s. Consider lighter tasks or different scheduling.`,
        suggestedAction: "Schedule administrative or low-effort tasks on this day",
        confidence: `${Math.round(worstDay.completionRate * 100)}%`,
        priority: "low",
        category: "scheduling",
        triggerData: { worstDay },
      });
    }

    if (strugglingFocusArea) {
      insights.push({
        type: "CompletionRate",
        title: `"${strugglingFocusArea.focusArea}" Needs Attention`,
        description: `Only ${Math.round(strugglingFocusArea.completionRate * 100)}% completion rate. Break into smaller tasks.`,
        suggestedAction: "Complete one small task in this area today",
        confidence: "70%",
        priority: "medium",
        category: "alignment",
        triggerData: { focusArea: strugglingFocusArea },
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: "CompletionRate",
        title: "You're on Track!",
        description: "Your productivity patterns look healthy. Keep maintaining your momentum!",
        confidence: "80%",
        priority: "low",
        category: "general",
        triggerData: { dayPatterns, focusPatterns },
      });
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 } as const;
    const sortedInsights = [...insights].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );
    const bestInsight = sortedInsights[0];

    if (!bestInsight) {
      return null;
    }

    const storedInsight = await db.createInsight({
      userId,
      type: bestInsight.type,
      title: bestInsight.title,
      description: bestInsight.description,
      reasoning: bestInsight.reasoning,
      suggestedAction: bestInsight.suggestedAction,
      confidence: bestInsight.confidence,
      priority: bestInsight.priority,
      category: bestInsight.category,
      triggerData: bestInsight.triggerData,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      ...bestInsight,
      triggerData: { ...bestInsight.triggerData, storedId: storedInsight?.id },
    };
  } catch (error) {
    console.error("Error generating insight:", error);
    return null;
  }
}
