import { useState } from "react";
import { Pressable, Text, View, Modal, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { Card, useThemeColor } from "heroui-native";
import { Platform } from "react-native";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "completed" | "skipped";
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  goalId?: string;
  isRecurring: boolean;
  createdAt?: Date;
  completedAt?: Date;
  updatedAt?: Date;
}

interface TaskDetailsModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
}

export function TaskDetailsModal({
  visible,
  task,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskDetailsModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const foregroundColor = useThemeColor("foreground");
  const successColor = useThemeColor("success");
  const warningColor = useThemeColor("warning");

  const handleStatusChange = (newStatus: string) => {
    if (isAnimating || !task) return;

    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsAnimating(true);
    onStatusChange(task.id, newStatus);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleDelete = () => {
    if (!task) return;

    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (Platform.OS === "ios") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            onDelete(task.id);
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#FF6B6B";
      case "medium":
        return warningColor;
      case "low":
        return successColor;
      default:
        return foregroundColor;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "skipped":
        return "close-circle";
      case "pending":
        return "time";
      default:
        return "help-circle";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return successColor;
      case "skipped":
        return warningColor;
      case "pending":
        return warningColor;
      default:
        return foregroundColor;
    }
  };

  const formatDate = (date: Date) => {
    return format(date, "MMM dd, yyyy 'at' h:mm a");
  };

  const formatRelativeDate = (date: Date) => {
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
      return format(date, "MMM dd");
    }
  };

  if (!task) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <Animated.View entering={SlideInDown} className="w-full max-w-sm">
          <Card variant="secondary" className="p-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Animated.View entering={FadeIn} className="mb-2">
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name={getStatusIcon(task.status) as any}
                      size={24}
                      color={getStatusColor(task.status)}
                    />
                    <Text className="text-foreground text-lg font-semibold flex-1">
                      {task.title}
                    </Text>
                  </View>
                </Animated.View>
                <View className="flex-row items-center gap-2">
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  />
                  <Text 
                    className="text-sm font-medium uppercase"
                    style={{ color: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </Text>
                  {task.isRecurring && (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="repeat" size={14} color={foregroundColor} />
                      <Text className="text-xs text-foreground">Recurring</Text>
                    </View>
                  )}
                </View>
              </View>
              <Pressable onPress={onClose} className="p-2">
                <Ionicons name="close" size={24} color={foregroundColor} />
              </Pressable>
            </View>

            {/* Description */}
            {task.description && (
              <Card variant="tertiary" className="p-3 mb-4">
                <Text className="text-foreground text-sm leading-relaxed">
                  {task.description}
                </Text>
              </Card>
            )}

            {/* Task Details */}
            <ScrollView className="max-h-48 mb-4" showsVerticalScrollIndicator={false}>
              <View className="space-y-3">
                {/* Status */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-foreground text-sm font-medium">Status</Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons
                      name={getStatusIcon(task.status) as any}
                      size={16}
                      color={getStatusColor(task.status)}
                    />
                    <Text 
                      className="text-sm font-medium capitalize"
                      style={{ color: getStatusColor(task.status) }}
                    >
                      {task.status}
                    </Text>
                  </View>
                </View>

                {/* Priority */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-foreground text-sm font-medium">Priority</Text>
                  <Text 
                    className="text-sm font-medium uppercase"
                    style={{ color: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </Text>
                </View>

                {/* Due Date */}
                {task.dueDate && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground text-sm font-medium">Due Date</Text>
                    <Text className="text-sm text-foreground">
                      {formatRelativeDate(task.dueDate)}
                    </Text>
                  </View>
                )}

                {/* Created Date */}
                {task.createdAt && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground text-sm font-medium">Created</Text>
                    <Text className="text-sm text-foreground">
                      {formatDate(task.createdAt)}
                    </Text>
                  </View>
                )}

                {/* Completed Date */}
                {task.completedAt && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground text-sm font-medium">Completed</Text>
                    <Text className="text-sm text-foreground">
                      {formatDate(task.completedAt)}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="space-y-3">
              {/* Status Actions */}
              {task.status === "pending" && (
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => handleStatusChange("completed")}
                    disabled={isAnimating}
                    className="flex-1 py-3 rounded-lg bg-success border border-success"
                  >
                    <Text className="text-white text-center font-medium">Complete</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleStatusChange("skipped")}
                    disabled={isAnimating}
                    className="flex-1 py-3 rounded-lg bg-warning border border-warning"
                  >
                    <Text className="text-white text-center font-medium">Skip</Text>
                  </Pressable>
                </View>
              )}

              {/* Management Actions */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => onEdit(task)}
                  className="flex-1 py-3 rounded-lg bg-secondary border border-secondary"
                >
                  <Text className="text-white text-center font-medium">Edit</Text>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  className="flex-1 py-3 rounded-lg border border-red-500"
                >
                  <Text className="text-red-500 text-center font-medium">Delete</Text>
                </Pressable>
              </View>
            </View>
          </Card>
        </Animated.View>
      </View>
    </Modal>
  );
}