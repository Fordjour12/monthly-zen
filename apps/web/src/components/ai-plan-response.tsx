import {
  CheckCircle,
  Clock,
  Calendar,
  Target,
  AlertCircle,
  RefreshCw,
  Download,
  Edit,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface PlanTask {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  category: string;
  estimatedHours?: number;
}

interface MonthlyPlan {
  id: string;
  title: string;
  month: string;
  goals: string[];
  tasks: PlanTask[];
  totalTasks: number;
  estimatedHours: number;
  successRate?: number;
}

interface AIPlanResponseProps {
  isLoading: boolean;
  error?: string;
  plan?: MonthlyPlan;
  onRegenerate: () => void;
  onSave: () => void;
  onViewFull: () => void;
}

export function AIPlanResponse({
  isLoading,
  error,
  plan,
  onRegenerate,
  onSave,
  onViewFull,
}: AIPlanResponseProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold">Generating Your Plan</h3>
            <p className="text-sm text-muted-foreground">
              AI is creating your personalized monthly plan...
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Separator />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Generation Failed
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={onRegenerate} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      {/* Plan Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold">Plan Generated Successfully!</h3>
            <p className="text-sm text-muted-foreground">
              {plan.totalTasks} tasks • {plan.estimatedHours}h estimated
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSave} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button onClick={onViewFull} size="sm">
            <Eye className="mr-2 h-4 w-4" />
            View Full Plan
          </Button>
        </div>
      </div>

      {/* Main Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{plan.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {plan.month}
                <Separator orientation="vertical" className="h-4" />
                <Target className="h-4 w-4" />
                {plan.goals.length} goals
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
            >
              Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Goals Summary */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Key Goals
            </h4>
            <div className="space-y-2">
              {plan.goals.slice(0, 3).map((goal, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{goal}</p>
                </div>
              ))}
              {plan.goals.length > 3 && (
                <p className="text-xs text-muted-foreground">+{plan.goals.length - 3} more goals</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Tasks Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Sample Tasks
              </h4>
              <Badge variant="outline">{plan.tasks.length} total</Badge>
            </div>
            <div className="space-y-3">
              {plan.tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {task.category}
                    </Badge>
                    <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
              {plan.tasks.length > 4 && (
                <div className="text-center">
                  <Button variant="ghost" size="sm" onClick={onViewFull}>
                    View all {plan.tasks.length} tasks →
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{plan.totalTasks}</div>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {plan.estimatedHours}h
              </div>
              <p className="text-xs text-muted-foreground">Est. Hours</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {plan.goals.length}
              </div>
              <p className="text-xs text-muted-foreground">Goals</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Need adjustments? You can edit this plan or generate a new one.
            </div>
            <div className="flex gap-2">
              <Button onClick={onRegenerate} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
              <Button onClick={onSave} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Save Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
