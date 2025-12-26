"use client";

import * as React from "react";
import { format } from "date-fns";
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
import { Calendar as CalendarIcon, Plus, CheckCircle, Clock } from "lucide-react";
import { updateTaskCompletion } from "@/functions/calendar-server-fn";
import { cn } from "@/lib/utils";

interface CalendarTask {
  id: number;
  taskDescription: string;
  focusArea: string;
  startTime: Date;
  endTime: Date;
  difficultyLevel: "simple" | "moderate" | "advanced";
  isCompleted: boolean;
  schedulingReason?: string;
}

interface TaskDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  tasks: CalendarTask[];
  onTaskUpdate?: () => void;
}

const DIFFICULTY_COLORS = {
  simple: "bg-green-100 text-green-700",
  moderate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

const DIFFICULTY_LABELS = {
  simple: "Simple",
  moderate: "Moderate",
  advanced: "Advanced",
};

export function TaskDetailSheet({
  isOpen,
  onClose,
  date,
  tasks,
  onTaskUpdate,
}: TaskDetailSheetProps) {
  const [optimisticTasks, setOptimisticTasks] = React.useState<CalendarTask[]>(tasks);
  const [isUpdating, setIsUpdating] = React.useState<number | null>(null);

  React.useEffect(() => {
    setOptimisticTasks(tasks);
  }, [tasks]);

  const handleTaskToggle = async (taskId: number, newStatus: boolean) => {
    setIsUpdating(taskId);

    setOptimisticTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, isCompleted: newStatus } : task)),
    );

    try {
      await updateTaskCompletion({ data: { taskId, isCompleted: newStatus } });
      onTaskUpdate?.();
    } catch (error) {
      setOptimisticTasks(tasks);
      console.error("Failed to update task:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const completedCount = optimisticTasks.filter((t) => t.isCompleted).length;
  const totalCount = optimisticTasks.length;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(date, "MMMM d, yyyy")}
          </SheetTitle>
          <SheetDescription>
            {totalCount === 0
              ? "No tasks scheduled for this day"
              : `${completedCount} of ${totalCount} tasks completed`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {totalCount === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-foreground mx-auto mb-4" />
              <p className="text-foreground">No tasks for this day</p>
              <Button variant="outline" className="mt-4" asChild>
                <a href="/plan">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tasks
                </a>
              </Button>
            </div>
          ) : (
            optimisticTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "border rounded-lg p-4 space-y-3 transition-colors",
                  task.isCompleted && "bg-muted/50",
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.isCompleted}
                    disabled={isUpdating === task.id}
                    onCheckedChange={(checked) => handleTaskToggle(task.id, checked as boolean)}
                    className="mt-1"
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "font-medium",
                          task.isCompleted && "line-through text-foreground",
                        )}
                      >
                        {task.taskDescription}
                      </p>
                      <CheckCircle
                        className={cn(
                          "h-5 w-5 flex-shrink-0",
                          task.isCompleted ? "text-green-500" : "text-foreground",
                        )}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge
                        variant="outline"
                        className={cn(DIFFICULTY_COLORS[task.difficultyLevel])}
                      >
                        {DIFFICULTY_LABELS[task.difficultyLevel]}
                      </Badge>
                      <Badge variant="secondary">{task.focusArea}</Badge>
                      <span className="text-foreground">
                        {format(task.startTime, "h:mm a")} - {format(task.endTime, "h:mm a")}
                      </span>
                    </div>

                    {task.schedulingReason && (
                      <p className="text-sm text-foreground">{task.schedulingReason}</p>
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
