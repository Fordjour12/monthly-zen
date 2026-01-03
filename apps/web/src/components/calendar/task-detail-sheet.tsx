"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar as CalendarIcon, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarTask } from "./task-calendar-grid";

interface TaskDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  tasks: CalendarTask[];
  onTaskToggle: (taskId: number, isCompleted: boolean) => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Simple: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
  Balanced: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
  Ambitious: "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200",
  Hard: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200",
};

const FOCUS_AREA_COLORS: Record<string, string> = {
  Career: "bg-purple-100 text-purple-700 border-purple-200",
  Health: "bg-green-100 text-green-700 border-green-200",
  Learning: "bg-blue-100 text-blue-700 border-blue-200",
  Personal: "bg-pink-100 text-pink-700 border-pink-200",
  Productivity: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Relationships: "bg-rose-100 text-rose-700 border-rose-200",
};

export function TaskDetailSheet({
  isOpen,
  onClose,
  date,
  tasks,
  onTaskToggle,
}: TaskDetailSheetProps) {
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {date.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </SheetTitle>
          <SheetDescription>
            {totalCount === 0
              ? "No tasks scheduled for this day."
              : `${completedCount} of ${totalCount} tasks completed.`}
          </SheetDescription>

          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className="mt-4 space-y-2">
              <Progress value={completionRate} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(completionRate)}%</span>
              </div>
            </div>
          )}
        </SheetHeader>

        <div className="space-y-4">
          {totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted/50 p-4 rounded-full mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Free Day</h3>
              <p className="text-muted-foreground max-w-xs mt-2">
                Enjoy your time off or use the "Generate" page to add more tasks to your plan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md",
                    task.isCompleted && "bg-muted/40 border-muted-foreground/20",
                  )}
                >
                  {/* Left accent bar */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-1.5 transition-colors",
                      task.isCompleted
                        ? "bg-muted-foreground/30"
                        : "bg-primary/60 group-hover:bg-primary",
                    )}
                  />

                  <div className="flex items-start gap-3 pl-4">
                    <Checkbox
                      checked={task.isCompleted}
                      onCheckedChange={(checked) => onTaskToggle(task.id, checked === true)}
                      className="mt-0.5"
                    />

                    <div className="flex-1 space-y-2">
                      <p
                        className={cn(
                          "font-medium leading-relaxed",
                          task.isCompleted && "line-through text-muted-foreground",
                        )}
                      >
                        {task.taskDescription}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Difficulty Badge */}
                        {task.difficultyLevel && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs font-medium border",
                              DIFFICULTY_COLORS[task.difficultyLevel] || "bg-secondary",
                            )}
                          >
                            {task.difficultyLevel}
                          </Badge>
                        )}

                        {/* Focus Area Badge */}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium",
                            FOCUS_AREA_COLORS[task.focusArea] || "bg-secondary",
                          )}
                        >
                          {task.focusArea}
                        </Badge>

                        {/* Time */}
                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                          <Clock className="h-3 w-3" />
                          {new Date(task.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Scheduling Reason */}
                      {task.schedulingReason && (
                        <div className="flex items-start gap-2 mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                          <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <p>"{task.schedulingReason}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
