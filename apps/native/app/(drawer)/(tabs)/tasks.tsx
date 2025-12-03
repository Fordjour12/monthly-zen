import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Container } from "@/components/container";
import { TaskStatusToggle, TaskStatusBadge } from "@/components/task-status-toggle";
import { Card, useThemeColor } from "heroui-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Mock data - replace with actual API calls
interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "completed" | "skipped";
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  goalId?: string;
  isRecurring: boolean;
}

export default function TasksScreen() {
  const [filter, setFilter] = useState<"all" | "today" | "overdue" | "completed">("today");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  
  const queryClient = useQueryClient();
  const foregroundColor = useThemeColor("foreground");

  // Mock query - replace with actual API call
  const {
    data: tasks = [],
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["tasks", filter, priorityFilter, searchQuery],
    queryFn: async () => {
      // Mock data - replace with actual API call
      const mockTasks: Task[] = [
        {
          id: "1",
          title: "Complete project proposal",
          description: "Finish the Q4 project proposal and send to team",
          status: "pending",
          priority: "high",
          dueDate: new Date(),
          isRecurring: false,
        },
        {
          id: "2",
          title: "Review code changes",
          description: "Review pull requests from the team",
          status: "completed",
          priority: "medium",
          dueDate: new Date(),
          isRecurring: true,
        },
        {
          id: "3",
          title: "Team standup meeting",
          description: "Daily sync with the development team",
          status: "pending",
          priority: "medium",
          dueDate: new Date(),
          isRecurring: true,
        },
        {
          id: "4",
          title: "Update documentation",
          description: "Update API documentation with latest changes",
          status: "skipped",
          priority: "low",
          dueDate: new Date(Date.now() - 86400000), // Yesterday
          isRecurring: false,
        },
      ];

      // Apply filters
      let filteredTasks = mockTasks;

      if (searchQuery) {
        filteredTasks = filteredTasks.filter(task =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (priorityFilter !== "all") {
        filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
      }

      if (filter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filteredTasks = filteredTasks.filter(task => 
          task.dueDate && task.dueDate >= today && task.dueDate < tomorrow
        );
      } else if (filter === "overdue") {
        const now = new Date();
        filteredTasks = filteredTasks.filter(task => 
          task.dueDate && task.dueDate < now && task.status === "pending"
        );
      } else if (filter === "completed") {
        filteredTasks = filteredTasks.filter(task => task.status === "completed");
      }

      return filteredTasks;
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status, reason }: { taskId: string; status: string; reason?: string }) => {
      // Mock API call - replace with actual API call
      console.log("Updating task:", { taskId, status, reason });
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      Alert.alert("Error", `Failed to update task: ${error.message}`);
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      // Mock API call - replace with actual API call
      console.log("Adding task:", title);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, id: Date.now().toString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTaskTitle("");
      setShowAddTask(false);
      Alert.alert("Success", "Task added successfully!");
    },
    onError: (error) => {
      Alert.alert("Error", `Failed to add task: ${error.message}`);
    },
  });

  const handleStatusChange = (taskId: string, newStatus: string, reason?: string) => {
    updateTaskMutation.mutate({ taskId, status: newStatus, reason });
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTaskMutation.mutate(newTaskTitle.trim());
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (taskDate.getTime() === today.getTime()) {
      return "Today";
    } else if (taskDate.getTime() === today.getTime() + 86400000) {
      return "Tomorrow";
    } else if (taskDate.getTime() === today.getTime() - 86400000) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const skipped = tasks.filter(t => t.status === "skipped").length;
    
    return { total, completed, pending, skipped };
  };

  const stats = getTaskStats();

  return (
    <Container className="p-3">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <Card variant="secondary" className="mb-6 p-4 w-full">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-foreground text-2xl font-black">Tasks</Text>
            <Pressable
              onPress={() => setShowAddTask(true)}
              className="w-10 h-10 rounded-full bg-secondary items-center justify-center"
            >
              <Ionicons name="add" size={24} color={foregroundColor} />
            </Pressable>
          </View>

          {/* Stats */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1 items-center">
              <Text className="text-foreground text-lg font-semibold">{stats.total}</Text>
              <Text className="text-foreground text-xs">Total</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-success text-lg font-semibold">{stats.completed}</Text>
              <Text className="text-foreground text-xs">Done</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-warning text-lg font-semibold">{stats.pending}</Text>
              <Text className="text-foreground text-xs">Pending</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-foreground text-lg font-semibold">{stats.skipped}</Text>
              <Text className="text-foreground text-xs">Skipped</Text>
            </View>
          </View>

          {/* Search */}
          <View className="mb-4">
            <TextInput
              className="py-3 px-4 rounded-lg bg-surface text-foreground border border-divider"
              placeholder="Search tasks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={foregroundColor}
            />
          </View>

          {/* Filters */}
          <View className="mb-4">
            <Text className="text-foreground font-medium mb-2">Status Filter:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {["all", "today", "overdue", "completed"].map((status) => (
                  <Pressable
                    key={status}
                    className={`px-3 py-2 rounded-lg border ${
                      filter === status
                        ? "bg-secondary border-secondary"
                        : "bg-surface border-surface"
                    }`}
                    onPress={() => setFilter(status as any)}
                  >
                    <Text
                      className={`text-sm capitalize ${
                        filter === status ? "text-foreground" : "text-secondary"
                      }`}
                    >
                      {status}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Priority Filter */}
          <View>
            <Text className="text-foreground font-medium mb-2">Priority Filter:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {["all", "high", "medium", "low"].map((priority) => (
                  <Pressable
                    key={priority}
                    className={`px-3 py-2 rounded-lg border ${
                      priorityFilter === priority
                        ? "bg-secondary border-secondary"
                        : "bg-surface border-surface"
                    }`}
                    onPress={() => setPriorityFilter(priority as any)}
                  >
                    <Text
                      className={`text-sm capitalize ${
                        priorityFilter === priority ? "text-foreground" : "text-secondary"
                      }`}
                    >
                      {priority}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </Card>

        {/* Add Task Modal */}
        {showAddTask && (
          <Card variant="secondary" className="mb-4 p-4">
            <Text className="text-foreground text-lg font-semibold mb-3">Add New Task</Text>
            <TextInput
              className="w-full p-3 rounded-lg bg-surface border border-divider text-foreground mb-3"
              placeholder="Task title..."
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
              placeholderTextColor={foregroundColor}
            />
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowAddTask(false)}
                className="flex-1 py-3 rounded-lg bg-surface border border-surface"
              >
                <Text className="text-foreground text-center font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddTask}
                disabled={!newTaskTitle.trim() || addTaskMutation.isPending}
                className="flex-1 py-3 rounded-lg bg-secondary border border-secondary"
              >
                <Text className="text-foreground text-center font-medium">
                  {addTaskMutation.isPending ? "Adding..." : "Add Task"}
                </Text>
              </Pressable>
            </View>
          </Card>
        )}

        {/* Tasks List */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-12">
            <Ionicons name="time" size={48} color={foregroundColor} />
            <Text className="text-foreground mt-4">Loading tasks...</Text>
          </View>
        ) : error ? (
          <Card variant="secondary" className="p-6">
            <View className="items-center py-8">
              <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
              <Text className="text-foreground font-medium text-lg mb-2">
                Error Loading Tasks
              </Text>
              <Text className="text-foreground text-center mb-4">
                {error.message}
              </Text>
              <Pressable
                className="bg-secondary px-4 py-2 rounded-lg"
                onPress={() => refetch()}
              >
                <Text className="text-foreground text-sm font-medium">Retry</Text>
              </Pressable>
            </View>
          </Card>
        ) : tasks.length === 0 ? (
          <Card variant="secondary" className="p-6">
            <View className="items-center py-8">
              <Ionicons name="checkbox-outline" size={48} color={foregroundColor} />
              <Text className="text-foreground font-medium text-lg mb-2">
                No tasks found
              </Text>
              <Text className="text-foreground text-center">
                {searchQuery || filter !== "all" || priorityFilter !== "all"
                  ? "No tasks match your filters."
                  : "Create your first task to get started!"}
              </Text>
            </View>
          </Card>
        ) : (
          <View className="gap-4">
            {tasks.map((task) => (
              <Card key={task.id} variant="secondary" className="p-4">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-foreground font-semibold text-base mb-1">
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text className="text-foreground text-sm mb-2">
                        {task.description}
                      </Text>
                    )}
                    <View className="flex-row items-center gap-3">
                      <TaskStatusBadge status={task.status} size="small" />
                      <Text className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </Text>
                      {task.isRecurring && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="repeat" size={12} color={foregroundColor} />
                          <Text className="text-xs text-foreground">Recurring</Text>
                        </View>
                      )}
                      {task.dueDate && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="calendar" size={12} color={foregroundColor} />
                          <Text className="text-xs text-foreground">
                            {formatDate(task.dueDate)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TaskStatusToggle
                    taskId={task.id}
                    initialStatus={task.status}
                    onStatusChange={handleStatusChange}
                    size="medium"
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </Container>
  );
}