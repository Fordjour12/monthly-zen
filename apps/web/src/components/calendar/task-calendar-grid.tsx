"use client";

import * as React from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { format } from "date-fns";

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

export type ViewMode = "normal" | "heatmap" | "week";

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Get heatmap color for a day based on completion rate
  const getHeatmapColor = (date: Date): string => {
    const dayTasks = tasksByDate[date.toDateString()];
    if (!dayTasks || dayTasks.length === 0) return "transparent";

    const completedCount = dayTasks.filter((t) => t.isCompleted).length;
    const completionRate = completedCount / dayTasks.length;

    // Multi-color gradient based on completion rate
    if (completionRate === 1) return "#22c55e"; // Complete - green
    if (completionRate >= 0.75) return "#4ade80";
    if (completionRate >= 0.5) return "#facc15"; // Halfway - yellow
    if (completionRate >= 0.25) return "#fb923c";
    if (completionRate > 0) return "#f87171"; // Started - red
    return "#f3f4f6"; // No activity - gray
  };

  // Custom DayButton component for the calendar
  const CustomDayButton = ({
    day,
    modifiers,
    ...props
  }: React.ComponentProps<typeof CalendarDayButton>) => {
    const dayTasks = hasTasksOnDay(day.date);
    const milestones = getMilestonesForDay(day.date);
    const isToday = modifiers.today;
    const isOutsideMonth = modifiers.outside;

    return (
      <div
        className={cn(
          "h-full w-full p-2 flex flex-col items-start justify-start gap-1 rounded-md transition-all duration-200",
          !isOutsideMonth && "hover:bg-accent/50",
          viewMode === "heatmap" && "relative overflow-hidden",
        )}
        onClick={() => onDateSelect(day.date)}
      >
        {/* Heatmap background */}
        {viewMode === "heatmap" && dayTasks && dayTasks.length > 0 && (
          <div
            className="absolute inset-0 rounded-md opacity-30"
            style={{ backgroundColor: getHeatmapColor(day.date) }}
          />
        )}

        {/* Day number */}
        <div className="relative z-10 flex items-center gap-1 w-full">
          <span
            className={cn(
              "text-sm font-semibold p-1 rounded-full w-7 h-7 flex items-center justify-center",
              isToday && "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
            )}
          >
            {day.date.getDate()}
          </span>
          {milestones.length > 0 && !isOutsideMonth && (
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
          )}
        </div>

        {/* Task previews */}
        {!isOutsideMonth && viewMode === "normal" && dayTasks && dayTasks.length > 0 && (
          <div className="relative z-10 w-full space-y-0.5 overflow-hidden">
            {dayTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded border truncate transition-all duration-200",
                  task.isCompleted
                    ? "bg-muted/60 text-muted-foreground line-through border-transparent"
                    : "bg-primary/15 text-primary border-primary/30",
                )}
              >
                {task.taskDescription}
              </div>
            ))}
            {dayTasks.length > 3 && (
              <div className="text-[10px] text-muted-foreground pl-1 font-medium">
                +{dayTasks.length - 3} more
              </div>
            )}
          </div>
        )}

        {/* Heatmap completion count */}
        {!isOutsideMonth && viewMode === "heatmap" && dayTasks && dayTasks.length > 0 && (
          <div className="relative z-10 mt-auto text-[10px] text-muted-foreground">
            {dayTasks.filter((t) => t.isCompleted).length}/{dayTasks.length}
          </div>
        )}
      </div>
    );
  };

  // Render week view content
  const renderWeekView = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Week of {format(startOfWeek, "MMMM d, yyyy")}</h3>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date) => {
            const dayTasks = hasTasksOnDay(date) || [];
            const isToday = date.toDateString() === today.toDateString();

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md",
                  isToday ? "border-primary bg-primary/5" : "border-border bg-card",
                )}
                onClick={() => onDateSelect(date)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{format(date, "EEE")}</span>
                  <span
                    className={cn(
                      "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full",
                      isToday && "bg-primary text-primary-foreground",
                    )}
                  >
                    {date.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "text-xs px-2 py-1 rounded truncate transition-all duration-200",
                        task.isCompleted
                          ? "bg-muted/60 text-muted-foreground line-through"
                          : "bg-primary/15 text-primary",
                      )}
                    >
                      {format(new Date(task.startTime), "HH:mm")} {task.taskDescription}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // If in week view mode, render the week view instead
  if (viewMode === "week") {
    return (
      <div className="p-6 bg-card rounded-xl border shadow-sm transition-all duration-300">
        {renderWeekView()}
      </div>
    );
  }

  return (
    <div className="p-6 bg-card rounded-xl border shadow-sm transition-all duration-300">
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
          day: "h-32 w-full p-0 font-normal aria-selected:opacity-100",
          day_today: "bg-accent text-accent-foreground font-bold border-primary/20",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
        components={{
          DayButton: CustomDayButton,
        }}
      />
    </div>
  );
}
