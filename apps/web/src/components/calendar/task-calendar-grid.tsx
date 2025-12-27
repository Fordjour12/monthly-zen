"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export interface CalendarTask {
  id: number;
  taskDescription: string;
  focusArea: string;
  startTime: Date;
  endTime: Date;
  difficultyLevel: string | null;
  isCompleted: boolean;
  completedAt: Date | null;
  schedulingReason?: string | null;
}

export type ViewMode = "normal" | "heatmap";

interface TaskCalendarGridProps {
  tasks: CalendarTask[];
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
  onDateSelect: (date: Date) => void;
  filteredFocusAreas?: string[];
  viewMode?: ViewMode;
  habitStats?: Array<{
    focusArea: string;
    completionRate: number;
  }>;
}

export function TaskCalendarGrid({
  tasks,
  selectedMonth,
  onMonthChange,
  onDateSelect,
  filteredFocusAreas = [],
  viewMode = "normal",
  habitStats = [],
}: TaskCalendarGridProps) {
  // Filter tasks based on selected focus areas
  const visibleTasks = React.useMemo(() => {
    if (filteredFocusAreas.length === 0) return tasks;
    return tasks.filter((t) => filteredFocusAreas.includes(t.focusArea));
  }, [tasks, filteredFocusAreas]);

  // Group tasks by date
  const tasksByDate = React.useMemo(() => {
    const grouped: Record<string, CalendarTask[]> = {};
    visibleTasks.forEach((task) => {
      const dateKey = new Date(task.startTime).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(task);
    });
    return grouped;
  }, [visibleTasks]);

  // Get milestone tasks for a date
  const getMilestonesForDay = (date: Date): CalendarTask[] => {
    const dayTasks = tasksByDate[date.toDateString()] || [];
    return dayTasks.filter(
      (task) => task.difficultyLevel === "Ambitious" || task.difficultyLevel === "Hard",
    );
  };

  const hasTasksOnDay = (date: Date): CalendarTask[] | null => {
    const dateKey = date.toDateString();
    return tasksByDate[dateKey] || null;
  };

  const getTaskColor = (tasks: CalendarTask[]): string => {
    if (tasks.every((t) => t.isCompleted)) return "bg-green-100 text-green-700 border-green-200";
    if (tasks.some((t) => t.isCompleted)) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  // Get heatmap color for a day based on completion rate
  const getHeatmapColor = (date: Date): string => {
    const dayTasks = tasksByDate[date.toDateString()];
    if (!dayTasks || dayTasks.length === 0) return "bg-transparent";

    const completedCount = dayTasks.filter((t) => t.isCompleted).length;
    const completionRate = completedCount / dayTasks.length;

    if (completionRate === 1) return "bg-green-500";
    if (completionRate >= 0.75) return "bg-green-400";
    if (completionRate >= 0.5) return "bg-green-300";
    if (completionRate >= 0.25) return "bg-green-200";
    if (completionRate > 0) return "bg-green-100";
    return "bg-gray-100";
  };

  return (
    <div className="p-4 bg-card rounded-lg border shadow-sm">
      <Calendar
        mode="single"
        month={selectedMonth}
        onMonthChange={onMonthChange}
        selected={selectedMonth}
        onSelect={(date) => date && onDateSelect(date)}
        className="rounded-md"
        classNames={{
          months: "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4 w-full",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          row: "flex w-full mt-2",
          cell: "h-32 w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            "h-32 w-full p-2 font-normal aria-selected:opacity-100 hover:bg-accent/50 transition-colors flex flex-col items-start justify-start gap-1 rounded-md border border-transparent hover:border-border",
            viewMode === "heatmap" && "relative overflow-hidden",
          ),
          day_today: "bg-accent text-accent-foreground font-bold border-primary/20",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
        components={{
          DayContent: (props) => {
            const { date } = props;
            const dayTasks = hasTasksOnDay(date);
            const milestones = getMilestonesForDay(date);
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div className="w-full h-full flex flex-col items-start text-left relative">
                {viewMode === "heatmap" && (
                  <div
                    className={cn("absolute inset-0 opacity-30 rounded-md", getHeatmapColor(date))}
                  />
                )}
                <div className="relative z-10 w-full h-full flex flex-col items-start">
                  <div className="flex items-center gap-1 w-full">
                    <span
                      className={cn(
                        "text-sm p-1 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0",
                        isToday && "bg-primary text-primary-foreground",
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {milestones.length > 0 && (
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>

                  {viewMode === "normal" && dayTasks && dayTasks.length > 0 && (
                    <div className="w-full mt-1 space-y-1 overflow-hidden">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded border truncate w-full",
                            task.isCompleted
                              ? "bg-muted text-muted-foreground line-through border-transparent"
                              : "bg-primary/10 text-primary border-primary/20",
                          )}
                        >
                          {task.taskDescription}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-muted-foreground pl-1">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  )}

                  {viewMode === "heatmap" && dayTasks && dayTasks.length > 0 && (
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {dayTasks.filter((t) => t.isCompleted).length}/{dayTasks.length}
                    </div>
                  )}
                </div>
              </div>
            );
          },
        }}
      />
    </div>
  );
}
