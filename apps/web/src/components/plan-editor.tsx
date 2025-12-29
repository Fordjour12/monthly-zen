import { useState } from "react";
import { Edit2, Save, X, Plus, Trash2, Calendar, Clock, Target, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type MonthlyPlan, type PlanTask } from "@monthly-zen/response-parser";

interface PlanEditorProps {
  monthlyPlan: MonthlyPlan;
  onSave: (editedPlan: MonthlyPlan) => void;
  onCancel: () => void;
}

export function PlanEditor({ monthlyPlan, onSave, onCancel }: PlanEditorProps) {
  const [editedPlan, setEditedPlan] = useState<MonthlyPlan>(monthlyPlan);
  const [isSaving, setIsSaving] = useState(false);

  const handleTitleChange = (title: string) => {
    setEditedPlan((prev) => ({ ...prev, title }));
  };

  const handleMonthChange = (month: string) => {
    setEditedPlan((prev) => ({ ...prev, month }));
  };

  const handleGoalChange = (index: number, goal: string) => {
    setEditedPlan((prev) => ({
      ...prev,
      goals: prev.goals.map((g, i) => (i === index ? goal : g)),
    }));
  };

  const addGoal = () => {
    setEditedPlan((prev) => ({
      ...prev,
      goals: [...prev.goals, ""],
    }));
  };

  const removeGoal = (index: number) => {
    setEditedPlan((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const handleTaskChange = (index: number, field: keyof PlanTask, value: string | number) => {
    setEditedPlan((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => (i === index ? { ...task, [field]: value } : task)),
    }));
  };

  const addTask = () => {
    const newTask: PlanTask = {
      id: `task-${Date.now()}`,
      title: "",
      description: "",
      dueDate: "",
      priority: "Medium",
      category: "General",
      estimatedHours: 2,
    };
    setEditedPlan((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
      totalTasks: prev.totalTasks + 1,
      estimatedHours: prev.estimatedHours + 2,
    }));
  };

  const removeTask = (index: number) => {
    setEditedPlan((prev) => {
      const taskToRemove = prev.tasks[index];
      return {
        ...prev,
        tasks: prev.tasks.filter((_, i) => i !== index),
        totalTasks: prev.totalTasks - 1,
        estimatedHours: prev.estimatedHours - (taskToRemove.estimatedHours || 0),
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Calculate updated totals
      const totalHours = editedPlan.tasks.reduce(
        (sum, task) => sum + (task.estimatedHours || 0),
        0,
      );
      const updatedPlan = {
        ...editedPlan,
        totalTasks: editedPlan.tasks.length,
        estimatedHours: totalHours,
      };

      await onSave(updatedPlan);
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Edit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold">Edit Your Plan</h3>
            <p className="text-sm text-foreground">Customize your monthly plan details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCancel} variant="outline" size="sm" disabled={isSaving}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} size="sm" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Plan Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Plan Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan-title">Plan Title</Label>
              <Input
                id="plan-title"
                value={editedPlan.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter plan title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-month">Month</Label>
              <Input
                id="plan-month"
                value={editedPlan.month}
                onChange={(e) => handleMonthChange(e.target.value)}
                placeholder="e.g., 2024-01"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goals
            </CardTitle>
            <Button onClick={addGoal} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </div>
          <CardDescription>Define your key objectives for this month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {editedPlan.goals.map((goal, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={goal}
                onChange={(e) => handleGoalChange(index, e.target.value)}
                placeholder="Enter goal description"
                className="flex-1"
              />
              <Button
                onClick={() => removeGoal(index)}
                variant="ghost"
                size="icon"
                disabled={editedPlan.goals.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {editedPlan.goals.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No goals defined. Add at least one goal to create a comprehensive plan.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tasks
            </CardTitle>
            <Button onClick={addTask} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
          <CardDescription>Define specific tasks to achieve your goals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {editedPlan.tasks.map((task, index) => (
            <div key={task.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Task #{index + 1}</h4>
                <Button
                  onClick={() => removeTask(index)}
                  variant="ghost"
                  size="icon"
                  disabled={editedPlan.tasks.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`task-title-${index}`}>Task Title</Label>
                  <Input
                    id={`task-title-${index}`}
                    value={task.title}
                    onChange={(e) => handleTaskChange(index, "title", e.target.value)}
                    placeholder="Enter task title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`task-category-${index}`}>Category</Label>
                  <Input
                    id={`task-category-${index}`}
                    value={task.category}
                    onChange={(e) => handleTaskChange(index, "category", e.target.value)}
                    placeholder="e.g., Work, Personal, Health"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`task-description-${index}`}>Description</Label>
                <Textarea
                  id={`task-description-${index}`}
                  value={task.description || ""}
                  onChange={(e) => handleTaskChange(index, "description", e.target.value)}
                  placeholder="Enter task description (optional)"
                  className="min-h-20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`task-priority-${index}`}>Priority</Label>
                  <Select
                    value={task.priority}
                    onValueChange={(value) => handleTaskChange(index, "priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`task-hours-${index}`}>Estimated Hours</Label>
                  <Input
                    id={`task-hours-${index}`}
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={task.estimatedHours || ""}
                    onChange={(e) =>
                      handleTaskChange(index, "estimatedHours", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`task-due-${index}`}>Due Date</Label>
                  <Input
                    id={`task-due-${index}`}
                    type="date"
                    value={task.dueDate || ""}
                    onChange={(e) => handleTaskChange(index, "dueDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(task.priority)}>{task.priority} Priority</Badge>
                {task.estimatedHours && (
                  <Badge variant="outline">{task.estimatedHours}h estimated</Badge>
                )}
              </div>
            </div>
          ))}

          {editedPlan.tasks.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No tasks defined. Add at least one task to create an actionable plan.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">{editedPlan.goals.length}</div>
              <p className="text-sm text-foreground">Goals</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {editedPlan.tasks.length}
              </div>
              <p className="text-sm text-foreground">Tasks</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {editedPlan.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)}h
              </div>
              <p className="text-sm text-foreground">Total Hours</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {editedPlan.tasks.filter((t) => t.priority === "High").length}
              </div>
              <p className="text-sm text-foreground">High Priority</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
