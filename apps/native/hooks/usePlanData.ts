import { useMemo, useState, useCallback } from "react";
import { PlanData } from "./usePlanGeneration";

// Transforms PlanData → FlashList sections
export interface WeekSectionData {
  weekNumber: number;
  goals: string[];
  dailyTasks: DayTasksItem[];
  isExpanded: boolean;
}

export interface DayTasksItem {
  day: string;
  tasks: TaskItem[];
}

export interface TaskItem {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  focusArea: string;
  isCompleted: boolean;
}

export function usePlanData(planData: PlanData | null) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));

  const transformedData = useMemo(() => {
    if (!planData || !planData.weekly_breakdown) return [];

    return planData.weekly_breakdown.map((week, index) => {
      const weekNum = week.week_number || index + 1;

      // Transform daily tasks
      const dailyTasks: DayTasksItem[] = [];
      if (week.daily_tasks) {
        Object.entries(week.daily_tasks).forEach(([day, tasks]) => {
          const taskItems: TaskItem[] = tasks.map((task, tIndex) => ({
            id: `week-${weekNum}-${day}-${tIndex}`,
            title: task.task_description,
            priority: (task.difficulty_level === "advanced"
              ? "High"
              : task.difficulty_level === "moderate"
                ? "Medium"
                : "Low") as "High" | "Medium" | "Low",
            focusArea: task.focus_area,
            isCompleted: false, // Default to false
          }));

          dailyTasks.push({
            day,
            tasks: taskItems,
          });
        });
      }

      // Sort days if needed (assuming standard week order or API provides it)
      // For now, we trust the object keys order or handle it in UI
      // Ideally we should sort standard days: Mon, Tue, etc.
      const dayOrder = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      dailyTasks.sort((a, b) => {
        const indexA = dayOrder.indexOf(a.day);
        const indexB = dayOrder.indexOf(b.day);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        return 0; // fallback
      });

      return {
        weekNumber: weekNum,
        goals: week.goals || [],
        dailyTasks,
        isExpanded: expandedWeeks.has(weekNum),
      } as WeekSectionData;
    });
  }, [planData, expandedWeeks]);

  const toggleWeek = useCallback((weekNumber: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekNumber)) {
        next.delete(weekNumber);
      } else {
        next.add(weekNumber);
      }
      return next;
    });
  }, []);

  return {
    data: transformedData,
    toggleWeek,
  };
}
