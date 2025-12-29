import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";

interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  dueDate?: string;
  estimatedHours?: number;
}

interface MonthlyPlan {
  id: string;
  title: string;
  month: string;
  goals: string[];
  tasks: Task[];
  totalTasks: number;
  estimatedHours: number;
}

interface PlanEditorProps {
  monthlyPlan: MonthlyPlan;
  onSave: (editedPlan: MonthlyPlan) => void;
  onCancel: () => void;
}

export function PlanEditor({ monthlyPlan, onSave, onCancel }: PlanEditorProps) {
  const [editedPlan, setEditedPlan] = useState<MonthlyPlan>(monthlyPlan);

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

  const handleTaskChange = (index: number, field: keyof Task, value: string | number) => {
    setEditedPlan((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => (i === index ? { ...task, [field]: value } : task)),
    }));
  };

  const addTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: "",
      description: "",
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

  const handleSave = () => {
    const totalHours = editedPlan.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const updatedPlan = {
      ...editedPlan,
      totalTasks: editedPlan.tasks.length,
      estimatedHours: totalHours,
    };

    onSave(updatedPlan);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      case "Medium":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      case "Low":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400";
    }
  };

  return (
    <ScrollView className="space-y-6">
      <View className="flex items-center justify-between flex-row">
        <View className="flex items-center gap-3 flex-row">
          <View className="h-8 w-8 bg-blue-500/20 rounded-lg items-center justify-center">
            <Ionicons name="create" size={16} className="text-blue-600 dark:text-blue-400" />
          </View>
          <View>
            <Text className="font-semibold">Edit Your Plan</Text>
            <Text className="text-sm text-foreground">Customize your monthly plan details</Text>
          </View>
        </View>
        <View className="flex gap-2 flex-row">
          <TouchableOpacity
            onPress={onCancel}
            className="border border-border px-3 py-2 rounded-lg"
          >
            <Ionicons name="close" size={16} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} className="bg-primary px-3 py-2 rounded-lg">
            <Ionicons name="save" size={16} className="text-primary-foreground" />
          </TouchableOpacity>
        </View>
      </View>

      <Card className="p-4">
        <Text className="font-semibold mb-4">Plan Information</Text>
        <View className="space-y-4">
          <View>
            <Text className="text-sm text-foreground mb-2">Plan Title</Text>
            <TextInput
              value={editedPlan.title}
              onChangeText={handleTitleChange}
              placeholder="Enter plan title"
              className="border border-border rounded-lg p-3"
            />
          </View>
          <View>
            <Text className="text-sm text-foreground mb-2">Month</Text>
            <TextInput
              value={editedPlan.month}
              onChangeText={handleMonthChange}
              placeholder="e.g., 2024-01"
              className="border border-border rounded-lg p-3"
            />
          </View>
        </View>
      </Card>

      <Card className="p-4">
        <View className="flex items-center justify-between flex-row mb-4">
          <Text className="font-semibold">Goals</Text>
          <TouchableOpacity onPress={addGoal} className="border border-border px-3 py-2 rounded-lg">
            <Ionicons name="add" size={16} />
          </TouchableOpacity>
        </View>
        <Text className="text-sm text-foreground mb-4">
          Define your key objectives for this month
        </Text>
        <View className="space-y-3">
          {editedPlan.goals.map((goal, index) => (
            <View key={index} className="flex items-center gap-2 flex-row">
              <TextInput
                value={goal}
                onChangeText={(text) => handleGoalChange(index, text)}
                placeholder="Enter goal description"
                className="border border-border rounded-lg p-3 flex-1"
              />
              <TouchableOpacity
                onPress={() => removeGoal(index)}
                disabled={editedPlan.goals.length <= 1}
              >
                <Ionicons
                  name="trash"
                  size={20}
                  className={
                    editedPlan.goals.length <= 1 ? "text-foreground/50" : "text-destructive"
                  }
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </Card>

      <Card className="p-4">
        <View className="flex items-center justify-between flex-row mb-4">
          <Text className="font-semibold">Tasks</Text>
          <TouchableOpacity onPress={addTask} className="border border-border px-3 py-2 rounded-lg">
            <Ionicons name="add" size={16} />
          </TouchableOpacity>
        </View>
        <Text className="text-sm text-foreground mb-4">
          Define specific tasks to achieve your goals
        </Text>
        <View className="space-y-4">
          {editedPlan.tasks.map((task, index) => (
            <View key={task.id} className="p-4 border border-border rounded-lg space-y-4">
              <View className="flex items-center justify-between flex-row">
                <Text className="font-medium text-sm">Task #{index + 1}</Text>
                <TouchableOpacity
                  onPress={() => removeTask(index)}
                  disabled={editedPlan.tasks.length <= 1}
                >
                  <Ionicons
                    name="trash"
                    size={20}
                    className={
                      editedPlan.tasks.length <= 1 ? "text-foreground/50" : "text-destructive"
                    }
                  />
                </TouchableOpacity>
              </View>

              <View>
                <Text className="text-sm text-foreground mb-2">Task Title</Text>
                <TextInput
                  value={task.title}
                  onChangeText={(text) => handleTaskChange(index, "title", text)}
                  placeholder="Enter task title"
                  className="border border-border rounded-lg p-3"
                />
              </View>

              <View>
                <Text className="text-sm text-foreground mb-2">Description</Text>
                <TextInput
                  value={task.description || ""}
                  onChangeText={(text) => handleTaskChange(index, "description", text)}
                  placeholder="Enter task description (optional)"
                  className="border border-border rounded-lg p-3 min-h-[80px]"
                  multiline
                />
              </View>

              <View className="flex gap-2 flex-row">
                <View className="flex-1">
                  <Text className="text-sm text-foreground mb-2">Category</Text>
                  <TextInput
                    value={task.category}
                    onChangeText={(text) => handleTaskChange(index, "category", text)}
                    placeholder="e.g., Work, Personal"
                    className="border border-border rounded-lg p-3"
                  />
                </View>
                <View className="w-24">
                  <Text className="text-sm text-foreground mb-2">Priority</Text>
                  <TextInput
                    value={task.priority}
                    onChangeText={(text) => handleTaskChange(index, "priority", text)}
                    className="border border-border rounded-lg p-3"
                  />
                </View>
              </View>

              <View
                className={`px-3 py-1 rounded-full self-start ${getPriorityColor(task.priority)}`}
              >
                <Text className="text-xs font-medium">{task.priority} Priority</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card className="p-4">
        <Text className="font-semibold mb-4">Plan Summary</Text>
        <View className="grid grid-cols-4 gap-4">
          <View className="items-center p-4 bg-muted/30 rounded-lg">
            <Text className="text-2xl font-bold text-primary">{editedPlan.goals.length}</Text>
            <Text className="text-sm text-foreground">Goals</Text>
          </View>
          <View className="items-center p-4 bg-muted/30 rounded-lg">
            <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
              {editedPlan.tasks.length}
            </Text>
            <Text className="text-sm text-foreground">Tasks</Text>
          </View>
          <View className="items-center p-4 bg-muted/30 rounded-lg">
            <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {editedPlan.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)}h
            </Text>
            <Text className="text-sm text-foreground">Total Hours</Text>
          </View>
          <View className="items-center p-4 bg-muted/30 rounded-lg">
            <Text className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {editedPlan.tasks.filter((t) => t.priority === "High").length}
            </Text>
            <Text className="text-sm text-foreground">High Priority</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}
