/**
 * Task Index Page (Native)
 *
 * Main task management page with dashboard, create/edit form, and filtering.
 */

import React, { useRef, useCallback, useState } from "react";
import { View, Alert } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { TaskDashboard } from "@/components/tasks/task-dashboard";
import { TaskFormSheet } from "@/components/tasks/task-form-sheet";
import { useTasks, type Task, type CreateTaskInput, type UpdateTaskInput } from "@/hooks/useTasks";
import * as Haptics from "expo-haptics";

export default function TaskIndexPage() {
  const formSheetRef = useRef<BottomSheet>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const {
    focusAreas,
    createTask,
    updateTask,
    deleteTask,
    isCreating: isCreatePending,
    isUpdating,
  } = useTasks();

  const handleCreateTask = useCallback(() => {
    setEditingTask(null);
    setIsCreating(true);
    formSheetRef.current?.expand();
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsCreating(false);
    formSheetRef.current?.expand();
  }, []);

  const handleSubmitTask = useCallback(
    async (data: CreateTaskInput | UpdateTaskInput) => {
      try {
        if (isCreating) {
          await createTask(data as CreateTaskInput);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          const updateData = data as UpdateTaskInput;
          if (updateData.taskId) {
            await updateTask(updateData.taskId, updateData);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
        formSheetRef.current?.close();
        setEditingTask(null);
      } catch (error) {
        Alert.alert("Error", isCreating ? "Failed to create task" : "Failed to update task");
      }
    },
    [isCreating, createTask, updateTask],
  );

  const handleDeleteTask = useCallback(
    async (taskId: number) => {
      Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(taskId);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert("Error", "Failed to delete task");
            }
          },
        },
      ]);
    },
    [deleteTask],
  );

  return (
    <View className="flex-1 bg-background">
      <TaskDashboard onCreateTask={handleCreateTask} onEditTask={handleEditTask} />

      {/* Task Form Sheet */}
      <TaskFormSheet
        sheetRef={formSheetRef}
        task={editingTask}
        onSubmit={handleSubmitTask}
        focusAreas={focusAreas}
        isSubmitting={isCreatePending || isUpdating}
      />
    </View>
  );
}
