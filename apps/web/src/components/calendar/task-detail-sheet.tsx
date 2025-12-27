"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, CheckCircle } from "lucide-react";
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
  Simple: "bg-green-100 text-green-700 hover:bg-green-100",
  Balanced: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  Ambitious: "bg-orange-100 text-orange-700 hover:bg-orange-100",
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
            tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:shadow-md",
                  task.isCompleted && "bg-muted/30 border-muted-foreground/20",
                )}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />

                <div className="flex items-start gap-4 pl-2">
                  <Checkbox
                    checked={task.isCompleted}
                    onCheckedChange={(checked) => onTaskToggle(task.id, checked === true)}
                    className="mt-1"
                  />

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                          task.isCompleted && "line-through text-muted-foreground",
                        )}
                      >
                        {task.taskDescription}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {task.difficultyLevel && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs font-normal",
                            DIFFICULTY_COLORS[task.difficultyLevel] || "bg-secondary",
                          )}
                        >
                          {task.difficultyLevel}
                        </Badge>
                      )}

                      <Badge variant="outline" className="text-xs font-normal">
                        {task.focusArea}
                      </Badge>

                      <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                        <Clock className="h-3 w-3" />
                        {new Date(task.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {task.schedulingReason && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        "{task.schedulingReason}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
