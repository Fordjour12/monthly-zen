"use client";

import * as React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CalendarTask {
  id: number;
  taskDescription: string;
  focusArea: string;
  startTime: Date;
  endTime: Date;
  difficultyLevel: "simple" | "moderate" | "advanced";
  isCompleted: boolean;
}

interface TaskCalendarGridProps {
  tasks: CalendarTask[];
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
  onDateSelect: (date: Date) => void;
}

export function TaskCalendarGrid({
  tasks,
  selectedMonth,
  onMonthChange,
  onDateSelect,
}: TaskCalendarGridProps) {
  const tasksByDate = React.useMemo(() => {
    const grouped: Record<string, CalendarTask[]> = {};
    tasks.forEach((task) => {
      const dateKey = format(task.startTime, "yyyy-MM-dd");
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(task);
    });
    return grouped;
  }, [tasks]);

  const getTasksOnDay = (date: Date): CalendarTask[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return tasksByDate[dateKey] || [];
  };

  const getDayColor = (dayTasks: CalendarTask[]): string => {
    if (dayTasks.length === 0) return "";
    if (dayTasks.every((t) => t.isCompleted)) return "bg-green-500";
    if (dayTasks.some((t) => t.isCompleted)) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const daysInMonth = React.useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const startingDayOfWeek = firstDay.getDay();

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [selectedMonth]);

  const monthName = format(selectedMonth, "MMMM yyyy");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const newMonth = new Date(selectedMonth);
            newMonth.setMonth(newMonth.getMonth() - 1);
            onMonthChange(newMonth);
          }}
          className="p-2 hover:bg-muted rounded"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">{monthName}</h2>
        <button
          onClick={() => {
            const newMonth = new Date(selectedMonth);
            newMonth.setMonth(newMonth.getMonth() + 1);
            onMonthChange(newMonth);
          }}
          className="p-2 hover:bg-muted rounded"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {daysInMonth.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const dayTasks = getTasksOnDay(date);
          const isToday = new Date().toDateString() === date.toDateString();
          const dayColor = getDayColor(dayTasks);

          return (
            <div
              key={format(date, "yyyy-MM-dd")}
              onClick={() => onDateSelect(date)}
              className={cn(
                "aspect-square p-1 border rounded hover:bg-muted/50 cursor-pointer transition-colors",
                isToday && "border-primary ring-1 ring-primary",
              )}
            >
              <div className="flex items-start justify-between mb-1">
                <span className={cn("text-sm", isToday && "font-bold")}>{date.getDate()}</span>
                {dayTasks.length > 0 && (
                  <Badge variant="outline" className={cn("h-5 min-w-5 px-1 text-xs", dayColor)}>
                    {dayTasks.length}
                  </Badge>
                )}
              </div>

              {dayTasks.length > 0 && (
                <div className="space-y-0.5 overflow-hidden">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "truncate text-xs px-1 rounded",
                        task.isCompleted
                          ? "bg-green-100 text-green-700 line-through"
                          : "bg-blue-100 text-blue-700",
                      )}
                      title={task.taskDescription}
                    >
                      {task.taskDescription}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayTasks.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
