import {
  CheckCircle,
  Clock,
  Calendar,
  Target,
  AlertCircle,
  Edit,
  Eye,
  Download,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { type MonthlyPlan, type AIResponseWithMetadata } from "@monthly-zen/response-parser";

interface DirectPlanDisplayProps {
  isLoading: boolean;
  aiResponse: AIResponseWithMetadata | null;
  monthlyPlan: MonthlyPlan | null;
  error?: string;
  onRegenerate: () => void;
  onSave: () => void;
  onEdit: () => void;
  onViewFull: () => void;
}

export function DirectPlanDisplay({
  isLoading,
  aiResponse,
  monthlyPlan,
  error,
  onRegenerate,
  onSave,
  onEdit,
  onViewFull,
}: DirectPlanDisplayProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold">Processing AI Response</h3>
            <p className="text-sm text-foreground">
              Parsing and structuring your personalized plan...
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            </div>
            <Separator />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-muted rounded-full animate-pulse" />
                  <div className="h-4 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-6 w-16 bg-muted rounded animate-pulse" />
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
            Processing Failed
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={onRegenerate} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!aiResponse || !monthlyPlan) {
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

  const { metadata, structuredData } = aiResponse;

  return (
    <div className="space-y-4">
      {/* Header with AI Processing Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold">AI Plan Generated Successfully!</h3>
            <p className="text-sm text-foreground">
              {monthlyPlan.totalTasks} tasks • {monthlyPlan.estimatedHours}h estimated •{" "}
              {metadata.confidence}% confidence
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onEdit} variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button onClick={onSave} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button onClick={onViewFull} size="sm">
            <Eye className="mr-2 h-4 w-4" />
            View Full
          </Button>
        </div>
      </div>

      {/* Confidence Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-foreground" />
              <span className="text-sm font-medium">AI Processing Quality</span>
            </div>
            <Badge variant={metadata.confidence >= 80 ? "default" : "secondary"}>
              {metadata.confidence}% Confidence
            </Badge>
          </div>
          <Progress value={metadata.confidence} className="h-2" />
          <p className="text-xs text-foreground mt-2">{metadata.extractionNotes}</p>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      {structuredData.monthly_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Monthly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              {structuredData.monthly_summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Plan Display */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{monthlyPlan.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {monthlyPlan.month}
                <Separator orientation="vertical" className="h-4" />
                <Target className="h-4 w-4" />
                {monthlyPlan.goals.length} goals
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
              >
                {metadata.detectedFormat.toUpperCase()}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              >
                Parsed
              </Badge>
            </div>
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
              {monthlyPlan.goals.slice(0, 3).map((goal, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-foreground">{goal}</p>
                </div>
              ))}
              {monthlyPlan.goals.length > 3 && (
                <p className="text-xs text-foreground">
                  +{monthlyPlan.goals.length - 3} more goals
                </p>
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
              <Badge variant="outline">{monthlyPlan.tasks.length} total</Badge>
            </div>
            <div className="space-y-3">
              {monthlyPlan.tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-foreground mt-1">{task.description}</p>
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
              {monthlyPlan.tasks.length > 4 && (
                <div className="text-center">
                  <Button variant="ghost" size="sm" onClick={onViewFull}>
                    View all {monthlyPlan.tasks.length} tasks →
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{monthlyPlan.totalTasks}</div>
              <p className="text-xs text-foreground">Total Tasks</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {monthlyPlan.estimatedHours}h
              </div>
              <p className="text-xs text-foreground">Est. Hours</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {metadata.confidence}%
              </div>
              <p className="text-xs text-foreground">AI Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional AI Insights */}
      {structuredData.productivity_insights && structuredData.productivity_insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              AI Productivity Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {structuredData.productivity_insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-foreground">{insight}</p>
                </div>
              ))}
              {structuredData.productivity_insights.length > 3 && (
                <p className="text-xs text-foreground text-center">
                  +{structuredData.productivity_insights.length - 3} more insights
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground">
              Plan processed with {metadata.confidence}% accuracy from {metadata.detectedFormat}{" "}
              format
            </div>
            <div className="flex gap-2">
              <Button onClick={onRegenerate} variant="outline" size="sm">
                Regenerate
              </Button>
              <Button onClick={onEdit} variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Plan
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
