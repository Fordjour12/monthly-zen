import React, { useState } from "react";
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";
import { format } from "date-fns";
import { useSemanticColors } from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Container } from "@/components/ui/container";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { orpc } from "@/utils/orpc";

export default function CalendarScreen() {
  const { primary, muted } = useSemanticColors();
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Fetch tasks for the current month
  const { data: tasksResult, isLoading } = useQuery(
    orpc.calendar.getTasks.queryOptions({
      input: { month: format(currentMonth, "yyyy-MM") },
    }),
  );

  // Update task status
  const updateTaskMutation = useMutation(
    orpc.calendar.updateTaskStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["calendar", "getTasks"] });
      },
      onError: (err) => {
        Alert.alert("Error", err.message || "Failed to update task");
      },
    }),
  );

  const tasks = tasksResult?.success ? tasksResult.data : [];

  // Enriched tasks with Date objects
  const enrichedTasks = tasks.map((t) => ({
    ...t,
    startTime: new Date(t.startTime),
    endTime: new Date(t.endTime),
    difficultyLevel: t.difficultyLevel || null,
  }));

  const selectedDayTasks = enrichedTasks.filter(
    (t) => selectedDate && new Date(t.startTime).toDateString() === selectedDate.toDateString(),
  );

  const handleTaskToggle = (taskId: number, isCompleted: boolean) => {
    updateTaskMutation.mutate({ taskId, isCompleted });
  };

  return (
    <Container>
      <Stack.Screen options={{ title: "Calendar", headerShown: false }} />

      <ScrollView className="flex-1 p-4" contentContainerClassName="pb-20">
        <View className="mb-6 mt-4">
          <Text className="text-3xl font-bold text-foreground">Calendar</Text>
          <Text className="text-muted-foreground mt-1">
            Track your progress and upcoming tasks.
          </Text>
        </View>

        {/* Calendar Grid */}
        <CalendarGrid
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          tasks={enrichedTasks}
          onDateSelect={setSelectedDate}
          onMonthChange={setCurrentMonth}
        />

        {/* Selected Day Tasks */}
        <View className="mt-6">
          <Text className="text-xl font-bold text-foreground mb-4">
            {selectedDate ? format(selectedDate, "EEEE, MMMM do") : "Select a date"}
          </Text>

          {isLoading ? (
            <ActivityIndicator size="small" color={primary} />
          ) : selectedDayTasks.length === 0 ? (
            <View className="items-center py-8 bg-surface rounded-2xl border border-border">
              <Ionicons name="calendar-outline" size={48} color={muted} />
              <Text className="text-muted-foreground mt-2">No tasks for this day</Text>
            </View>
          ) : (
            <View className="gap-3">
              {selectedDayTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => handleTaskToggle(task.id, !task.isCompleted)}
                  activeOpacity={0.7}
                  className={`p-4 rounded-2xl border flex-row items-center gap-4 ${
                    task.isCompleted ? "bg-muted/50 border-muted" : "bg-surface border-border"
                  }`}
                >
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      task.isCompleted ? "bg-success border-success" : "border-muted-foreground"
                    }`}
                  >
                    {task.isCompleted && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>

                  <View className="flex-1">
                    <Text
                      className={`font-semibold text-lg ${
                        task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {task.taskDescription}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <Text className="text-xs text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10">
                        {task.focusArea}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {format(task.startTime, "h:mm a")}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
