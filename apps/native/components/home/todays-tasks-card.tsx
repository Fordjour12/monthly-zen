import { View, Text, Pressable } from "react-native";
import { Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

const tasks: Task[] = [
  { id: "1", title: "Review plan", completed: true },
  { id: "2", title: "Draft weekly goals", completed: false },
  { id: "3", title: "Schedule meetings", completed: false },
  { id: "4", title: "Update calendar", completed: false },
];

export function TodaysTasksCard() {
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <Card className="mx-4 mb-4 p-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="checkbox" size={20} color="currentColor" className="text-success" />
          <Text className="font-semibold text-foreground">Today's Tasks</Text>
        </View>
        <View className="px-2 py-1 bg-success/10 rounded">
          <Text className="text-xs font-medium text-success">
            {completedCount}/{tasks.length}
          </Text>
        </View>
      </View>

      {tasks.map((task) => (
        <Pressable
          key={task.id}
          className="flex-row items-center gap-3 py-2"
          onPress={() => router.push("/tasks")}
        >
          <View
            className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
              task.completed ? "bg-success border-success" : "border-muted-foreground"
            }`}
          >
            {task.completed && <Ionicons name="checkmark" size={14} color="white" />}
          </View>
          <Text
            className={`flex-1 text-sm ${
              task.completed ? "text-muted-foreground line-through" : "text-foreground"
            }`}
          >
            {task.title}
          </Text>
        </Pressable>
      ))}
    </Card>
  );
}
