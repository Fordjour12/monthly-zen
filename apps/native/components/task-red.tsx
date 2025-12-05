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
import { TaskDetailsModal } from "@/components/task-details-modal";
import { TaskSuggestionsModal } from "@/components/task-suggestions-modal";
import { MiniSuggestionBadge } from "@/components/suggestion-badge";
import { Card, useThemeColor } from "heroui-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

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

export default function TasksRedesignScreen() {
    const [filter, setFilter] = useState<"all" | "today" | "overdue" | "completed">("today");
    const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showTaskDetails, setShowTaskDetails] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedTaskForSuggestions, setSelectedTaskForSuggestions] = useState<Task | null>(null);
    const [aiSuggestions, setAiSuggestions] = useState<any>(null);
    const [isAnalyzingTask, setIsAnalyzingTask] = useState(false);

    const queryClient = useQueryClient();
    const foregroundColor = useThemeColor("foreground");
    const successColor = useThemeColor("success");
    const warningColor = useThemeColor("warning");

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

    const handleTaskDetails = (task: Task) => {
        setSelectedTask(task);
        setShowTaskDetails(true);
    };

    const handleCloseTaskDetails = () => {
        setShowTaskDetails(false);
        setSelectedTask(null);
    };

    const handleEditTask = (task: Task) => {
        Alert.alert("Edit Task", "Edit functionality coming soon!");
        handleCloseTaskDetails();
    };

    const handleDeleteTask = (taskId: string) => {
        Alert.alert("Delete Task", "Delete functionality coming soon!");
        handleCloseTaskDetails();
    };

    const handleTaskSuggestions = (task: Task) => {
        setSelectedTaskForSuggestions(task);
        setShowSuggestions(true);
    };

    const handleCloseSuggestions = () => {
        setShowSuggestions(false);
        setSelectedTaskForSuggestions(null);
    };

    const handleApplySuggestion = (suggestion: any) => {
        Alert.alert("Suggestion Applied", "Suggestion functionality coming soon!");
        handleCloseSuggestions();
    };

    const categorizeTaskMutation = useMutation({
        mutationFn: async (text: string) => {
            setIsAnalyzingTask(true);
            try {
                const result = await orpc.AI.categorizeTask.call({ text });
                return result;
            } catch (error) {
                console.error('AI categorization error:', error);
                return null;
            } finally {
                setIsAnalyzingTask(false);
            }
        },
        onSuccess: (result) => {
            if (result) {
                setAiSuggestions(result);
                if (result.title && result.title !== newTaskTitle) {
                    Alert.alert(
                        "AI Suggestion",
                        `AI suggests: "${result.title}"\nPriority: ${result.priority}\nCategory: ${result.category}`,
                        [
                            {
                                text: "Use Suggestion",
                                onPress: () => {
                                    setNewTaskTitle(result.title);
                                },
                            },
                            {
                                text: "Keep Original",
                                style: "cancel",
                            },
                        ]
                    );
                }
            }
        },
        onError: (error: any) => {
            console.error('Task categorization failed:', error);
        },
    });

    const handleTaskTitleChange = (text: string) => {
        setNewTaskTitle(text);
        setAiSuggestions(null);
        if (text.trim().length > 5) {
            const timeoutId = setTimeout(() => {
                categorizeTaskMutation.mutate(text);
            }, 1000);
            return () => clearTimeout(timeoutId);
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
        <Container className="flex-1 bg-background">
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
                contentContainerStyle={{ paddingBottom: 24 }}
            >
                <View className="p-4">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-foreground text-3xl font-bold">Tasks</Text>
                        <Pressable
                            onPress={() => setShowAddTask(true)}
                            className="w-8 h-8 items-center justify-center"
                        >
                            <Ionicons name="add" size={28} color={foregroundColor} />
                        </Pressable>
                    </View>

                    {/* Stats */}
                    <View className="flex-row justify-between mb-6 px-2">
                        <View className="items-center">
                            <Text className="text-foreground text-xl font-bold">{stats.total}</Text>
                            <Text className="text-gray-500 text-xs mt-1">Total</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-success text-xl font-bold">{stats.completed}</Text>
                            <Text className="text-gray-500 text-xs mt-1">Done</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-warning text-xl font-bold">{stats.pending}</Text>
                            <Text className="text-gray-500 text-xs mt-1">Pending</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-gray-400 text-xl font-bold">{stats.skipped}</Text>
                            <Text className="text-gray-500 text-xs mt-1">Skipped</Text>
                        </View>
                    </View>

                    {/* Search */}
                    <View className="mb-6">
                        <TextInput
                            className="py-3 px-4 rounded-xl bg-secondary/30 text-foreground border border-white/10"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#666"
                        />
                    </View>

                    {/* Filters */}
                    <View className="mb-6">
                        <Text className="text-gray-400 text-sm mb-3 ml-1">Status Filter:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                            <View className="flex-row gap-2">
                                {["all", "today", "overdue", "completed"].map((status) => (
                                    <Pressable
                                        key={status}
                                        className={`px-4 py-2 rounded-lg border ${filter === status
                                                ? "bg-secondary/50 border-secondary"
                                                : "bg-secondary/20 border-transparent"
                                            }`}
                                        onPress={() => setFilter(status as any)}
                                    >
                                        <Text
                                            className={`text-sm capitalize ${filter === status ? "text-foreground font-medium" : "text-gray-400"
                                                }`}
                                        >
                                            {status}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>

                        <Text className="text-gray-400 text-sm mb-3 ml-1">Priority Filter:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row gap-2">
                                {["all", "high", "medium", "low"].map((priority) => (
                                    <Pressable
                                        key={priority}
                                        className={`px-4 py-2 rounded-lg border ${priorityFilter === priority
                                                ? "bg-secondary/50 border-secondary"
                                                : "bg-secondary/20 border-transparent"
                                            }`}
                                        onPress={() => setPriorityFilter(priority as any)}
                                    >
                                        <Text
                                            className={`text-sm capitalize ${priorityFilter === priority ? "text-foreground font-medium" : "text-gray-400"
                                                }`}
                                        >
                                            {priority}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Add Task Form (Inline) */}
                    {showAddTask && (
                        <View className="mb-6 p-4 rounded-2xl bg-secondary/30 border border-white/10">
                            <Text className="text-foreground text-lg font-semibold mb-3">Add New Task</Text>
                            <View className="relative">
                                <TextInput
                                    className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-foreground mb-3"
                                    placeholder="Task title..."
                                    value={newTaskTitle}
                                    onChangeText={handleTaskTitleChange}
                                    autoFocus
                                    placeholderTextColor="#666"
                                />
                                {isAnalyzingTask && (
                                    <View className="absolute right-3 top-3">
                                        <Ionicons name="time" size={16} color={foregroundColor} />
                                    </View>
                                )}
                                {aiSuggestions && (
                                    <Pressable
                                        onPress={() => {
                                            setNewTaskTitle(aiSuggestions.title);
                                            setAiSuggestions(null);
                                        }}
                                        className="absolute right-3 top-3"
                                    >
                                        <Ionicons name="sparkles" size={16} color="#FF6B6B" />
                                    </Pressable>
                                )}
                            </View>
                            <View className="flex-row gap-2">
                                <Pressable
                                    onPress={() => setShowAddTask(false)}
                                    className="flex-1 py-3 rounded-lg bg-black/20"
                                >
                                    <Text className="text-gray-400 text-center font-medium">Cancel</Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleAddTask}
                                    disabled={!newTaskTitle.trim() || addTaskMutation.isPending}
                                    className="flex-1 py-3 rounded-lg bg-primary"
                                >
                                    <Text className="text-white text-center font-medium">
                                        {addTaskMutation.isPending ? "Adding..." : "Add Task"}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    )}

                    {/* Tasks List */}
                    {isLoading ? (
                        <View className="items-center py-12">
                            <Ionicons name="time" size={48} color={foregroundColor} />
                            <Text className="text-gray-400 mt-4">Loading tasks...</Text>
                        </View>
                    ) : error ? (
                        <View className="p-6 rounded-2xl bg-red-500/10 items-center">
                            <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
                            <Text className="text-foreground font-medium text-lg mb-2 mt-4">
                                Error Loading Tasks
                            </Text>
                            <Text className="text-gray-400 text-center mb-4">
                                {error.message}
                            </Text>
                            <Pressable
                                className="bg-secondary px-6 py-2 rounded-lg"
                                onPress={() => refetch()}
                            >
                                <Text className="text-foreground font-medium">Retry</Text>
                            </Pressable>
                        </View>
                    ) : tasks.length === 0 ? (
                        <View className="p-6 rounded-2xl bg-secondary/20 items-center py-12">
                            <Ionicons name="checkbox-outline" size={48} color={foregroundColor} />
                            <Text className="text-foreground font-medium text-lg mb-2 mt-4">
                                No tasks found
                            </Text>
                            <Text className="text-gray-400 text-center">
                                {searchQuery || filter !== "all" || priorityFilter !== "all"
                                    ? "No tasks match your filters."
                                    : "Create your first task to get started!"}
                            </Text>
                        </View>
                    ) : (
                        <View className="gap-4">
                            {tasks.map((task) => (
                                <Pressable
                                    key={task.id}
                                    onPress={() => handleTaskDetails(task)}
                                    className="p-4 rounded-2xl bg-secondary/20 border border-white/5"
                                >
                                    <View className="flex-row items-start justify-between mb-2">
                                        <View className="flex-1 mr-3">
                                            <Text className="text-foreground font-semibold text-lg leading-6">
                                                {task.title}
                                            </Text>
                                            {task.description && (
                                                <Text className="text-gray-400 text-sm mt-1" numberOfLines={2}>
                                                    {task.description}
                                                </Text>
                                            )}
                                        </View>
                                        <TaskStatusToggle
                                            taskId={task.id}
                                            initialStatus={task.status}
                                            onStatusChange={handleStatusChange}
                                            size="medium"
                                        />
                                    </View>

                                    <View className="flex-row items-center gap-3 mt-3">
                                        <TaskStatusBadge status={task.status} size="small" />

                                        <Text className={`text-xs font-bold ${getPriorityColor(task.priority)}`}>
                                            {task.priority.toUpperCase()}
                                        </Text>

                                        {task.isRecurring && (
                                            <View className="flex-row items-center gap-1">
                                                <Ionicons name="repeat" size={12} color="#999" />
                                                <Text className="text-xs text-gray-400">Recurring</Text>
                                            </View>
                                        )}

                                        {task.dueDate && (
                                            <View className="flex-row items-center gap-1">
                                                <Ionicons name="calendar-outline" size={12} color="#999" />
                                                <Text className="text-xs text-gray-400">
                                                    {formatDate(task.dueDate)}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>

                {/* Task Details Modal */}
                <TaskDetailsModal
                    visible={showTaskDetails}
                    task={selectedTask}
                    onClose={handleCloseTaskDetails}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                />

                {/* Task Suggestions Modal */}
                <TaskSuggestionsModal
                    visible={showSuggestions}
                    task={selectedTaskForSuggestions}
                    onClose={handleCloseSuggestions}
                    onApplySuggestion={handleApplySuggestion}
                />
            </ScrollView>
        </Container>
    );
}
