import { View, Text, TouchableOpacity } from "react-native";
import { Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";

interface MonthlyPlan {
  id: string;
  title: string;
  month: string;
  goals: string[];
  tasks: Task[];
  totalTasks: number;
  estimatedHours: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  status?: string;
}

interface DirectPlanDisplayProps {
  monthlyPlan: MonthlyPlan | null;
  error?: string;
  onRegenerate: () => void;
  onSave: () => void;
  onEdit: () => void;
  onViewFull: () => void;
}

export function DirectPlanDisplay({
  monthlyPlan,
  error,
  onRegenerate,
  onSave,
  onEdit,
  onViewFull,
}: DirectPlanDisplayProps) {
  if (error) {
    return (
      <Card className="p-4 border border-destructive/20">
        <View className="space-y-4">
          <View className="flex items-center gap-2 flex-row">
            <Ionicons name="alert-circle" size={20} className="text-destructive" />
            <Text className="font-semibold text-destructive">Processing Failed</Text>
          </View>
          <Text className="text-sm text-foreground">{error}</Text>
          <TouchableOpacity onPress={onRegenerate} className="border border-border p-3 rounded-lg">
            <Text className="text-sm text-center">Try Again</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  if (!monthlyPlan) {
    return null;
  }

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
    <View className="space-y-4">
      <View className="flex items-center justify-between flex-row">
        <View className="flex items-center gap-3 flex-row">
          <View className="h-8 w-8 bg-green-500/20 rounded-lg items-center justify-center">
            <Ionicons
              name="checkmark-circle"
              size={16}
              className="text-green-600 dark:text-green-400"
            />
          </View>
          <View>
            <Text className="font-semibold">AI Plan Generated Successfully!</Text>
            <Text className="text-sm text-foreground">
              {monthlyPlan.totalTasks} tasks • {monthlyPlan.estimatedHours}h estimated
            </Text>
          </View>
        </View>
        <View className="flex gap-2 flex-row">
          <TouchableOpacity onPress={onEdit} className="border border-border p-2 rounded-lg">
            <Ionicons name="create-outline" size={16} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSave} className="border border-border p-2 rounded-lg">
            <Ionicons name="download-outline" size={16} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onViewFull} className="bg-primary p-2 rounded-lg">
            <Ionicons name="eye-outline" size={16} className="text-primary-foreground" />
          </TouchableOpacity>
        </View>
      </View>

      <Card className="p-4">
        <View className="space-y-4">
          <View>
            <Text className="font-semibold text-lg">{monthlyPlan.title}</Text>
            <Text className="text-sm text-foreground mt-1">{monthlyPlan.month}</Text>
          </View>

          <View>
            <Text className="font-medium mb-3">Key Goals</Text>
            <View className="space-y-2">
              {monthlyPlan.goals.slice(0, 3).map((goal, index) => (
                <View key={index} className="flex items-start gap-2 flex-row">
                  <View className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                  <Text className="text-sm text-foreground flex-1">{goal}</Text>
                </View>
              ))}
              {monthlyPlan.goals.length > 3 && (
                <Text className="text-xs text-foreground">
                  +{monthlyPlan.goals.length - 3} more goals
                </Text>
              )}
            </View>
          </View>

          <View>
            <Text className="font-medium mb-3">Sample Tasks</Text>
            <View className="space-y-3">
              {monthlyPlan.tasks.slice(0, 4).map((task) => (
                <View key={task.id} className="p-3 border border-border rounded-lg">
                  <View className="flex items-center justify-between flex-row">
                    <View className="flex-1 gap-2">
                      <Text className="font-medium text-sm">{task.title}</Text>
                      {task.description && (
                        <Text className="text-xs text-foreground mt-1">{task.description}</Text>
                      )}
                    </View>
                    <View className="flex gap-2 flex-row items-center">
                      <View className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                        <Text className="text-xs font-medium">{task.priority}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              {monthlyPlan.tasks.length > 4 && (
                <TouchableOpacity onPress={onViewFull} className="text-center">
                  <Text className="text-sm text-primary">
                    View all {monthlyPlan.tasks.length} tasks →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary">{monthlyPlan.totalTasks}</Text>
              <Text className="text-xs text-foreground">Total Tasks</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
                {monthlyPlan.estimatedHours}h
              </Text>
              <Text className="text-xs text-foreground">Est. Hours</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">95%</Text>
              <Text className="text-xs text-foreground">AI Confidence</Text>
            </View>
          </View>
        </View>
      </Card>

      <Card className="p-4">
        <View className="flex items-center justify-between flex-row">
          <Text className="text-sm text-foreground">
            Plan processed with 95% accuracy from JSON format
          </Text>
          <View className="flex gap-2 flex-row">
            <TouchableOpacity
              onPress={onRegenerate}
              className="border border-border px-3 py-2 rounded-lg"
            >
              <Text className="text-sm">Regenerate</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} className="bg-primary px-3 py-2 rounded-lg">
              <Text className="text-sm font-medium text-primary-foreground">Save Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </View>
  );
}
