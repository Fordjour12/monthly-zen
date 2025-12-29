/**
 * Task Stats Component
 *
 * Displays summary statistics for tasks in a horizontal card layout.
 */

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, ListTodo, TrendingUp } from "lucide-react";

interface TaskStatsProps {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  isLoading?: boolean;
}

export function TaskStats({
  total,
  completed,
  pending,
  completionRate,
  isLoading,
}: TaskStatsProps) {
  const stats = [
    {
      label: "Total Tasks",
      value: total,
      icon: ListTodo,
      color: "text-foreground",
      bgColor: "bg-muted/50",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Pending",
      value: pending,
      icon: Circle,
      color: "text-muted-foreground",
      bgColor: "bg-muted/30",
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      icon: TrendingUp,
      color:
        completionRate >= 70
          ? "text-green-500"
          : completionRate >= 40
            ? "text-yellow-500"
            : "text-muted-foreground",
      bgColor:
        completionRate >= 70
          ? "bg-green-500/10"
          : completionRate >= 40
            ? "bg-yellow-500/10"
            : "bg-muted/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} size="sm" className={`${stat.bgColor} border-0`}>
          <CardContent className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${stat.color} ${isLoading ? "animate-pulse" : ""}`}>
                {isLoading ? "—" : stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
