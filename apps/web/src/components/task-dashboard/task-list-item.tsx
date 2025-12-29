/**
 * Task List Item Component
 *
 * Individual task row with checkbox, badges, and hover actions.
 */

import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

interface TaskListItemProps {
  task: Task;
  onToggle: (taskId: number, isCompleted: boolean) => void;
  isUpdating?: boolean;
}

function getDifficultyColor(level: string) {
  switch (level.toLowerCase()) {
    case "simple":
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    case "moderate":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    case "advanced":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export const TaskListItem = memo(function TaskListItem({
  task,
  onToggle,
  isUpdating,
}: TaskListItemProps) {
  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-4 border-b border-border bg-card transition-colors hover:bg-muted/30",
        task.isCompleted && "opacity-60",
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={task.isCompleted}
        onCheckedChange={(checked) => onToggle(task.id, checked === true)}
        disabled={isUpdating}
        className="mt-0.5"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium leading-tight transition-all",
            task.isCompleted && "line-through text-muted-foreground",
          )}
        >
          {task.taskDescription}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Focus Area Badge */}
          <Badge variant="secondary" className="text-xs">
            {task.focusArea}
          </Badge>

          {/* Difficulty Badge */}
          <Badge
            variant="outline"
            className={cn("text-xs border-0", getDifficultyColor(task.difficultyLevel))}
          >
            {task.difficultyLevel}
          </Badge>

          {/* Day of Week */}
          <span className="text-xs text-muted-foreground">
            Week {task.weekNumber} • {task.dayOfWeek}
          </span>
        </div>

        {/* Scheduling Reason (if available) */}
        {task.schedulingReason && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{task.schedulingReason}</p>
        )}
      </div>
    </div>
  );
});
