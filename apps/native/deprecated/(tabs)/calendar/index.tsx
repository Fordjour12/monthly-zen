import React, { useState } from "react";
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { format } from "date-fns";
import { useSemanticColors } from "@/utils/theme";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Analytics01Icon,
  CheckmarkCircle01Icon,
  CircleIcon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Container } from "@/components/ui/container";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { orpc } from "@/utils/orpc";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function CalendarScreen() {
  const router = useRouter();
  const colors = useSemanticColors();
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
    <Container className="bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInUp.duration(600)}
          className="flex-row items-center justify-between mb-8"
        >
          <View>
            <Text className="text-sm font-sans-bold text-muted-foreground uppercase tracking-[3px] mb-1">
              Timeline
            </Text>
            <Text className="text-3xl font-sans-bold text-foreground">Your Schedule</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/calendar/heatmap")}
            className="w-12 h-12 rounded-2xl bg-surface border border-border/50 items-center justify-center flex-row"
          >
            <HugeiconsIcon icon={Analytics01Icon} size={22} color="var(--accent)" />
          </TouchableOpacity>
        </Animated.View>

        {/* Featured Monthly Progress Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mb-8">
          <View className="bg-accent rounded-[32px] p-6 shadow-xl shadow-accent/20">
            <View className="flex-row justify-between items-start mb-6">
              <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center">
                <HugeiconsIcon icon={Calendar01Icon} size={22} color="white" />
              </View>
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-[10px] font-sans-bold text-white uppercase tracking-widest">
                  {format(currentMonth, "MMMM yyyy")}
                </Text>
              </View>
            </View>
            <Text className="text-2xl font-sans-bold text-white mb-2">Build Your Streak</Text>
            <Text className="text-white/80 font-sans text-sm leading-5">
              Consistent planning leads to consistent results. Keep your monthly flow alive.
            </Text>
          </View>
        </Animated.View>

        {/* Calendar Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mb-10">
          <CalendarGrid
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            tasks={enrichedTasks}
            onDateSelect={setSelectedDate}
            onMonthChange={setCurrentMonth}
          />
        </Animated.View>

        {/* Selected Day Agenda */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <View className="flex-row items-center justify-between mb-6 px-1">
            <Text className="text-xl font-sans-bold text-foreground">
              {selectedDate ? format(selectedDate, "EEEE, MMMM do") : "Agenda"}
            </Text>
            {selectedDayTasks.length > 0 && (
              <View className="bg-success/10 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-sans-bold text-success uppercase">
                  {selectedDayTasks.filter((t) => t.isCompleted).length} / {selectedDayTasks.length}
                </Text>
              </View>
            )}
          </View>

          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator color="var(--accent)" />
            </View>
          ) : selectedDayTasks.length === 0 ? (
            <View className="items-center py-12 bg-surface/50 rounded-[28px] border border-dashed border-border/50">
              <View className="w-16 h-16 rounded-full bg-muted/5 items-center justify-center mb-4">
                <HugeiconsIcon icon={Calendar01Icon} size={32} color="var(--muted)" />
              </View>
              <Text className="text-muted-foreground font-sans-medium">
                No tasks recorded for this day
              </Text>
            </View>
          ) : (
            <View className="gap-y-4">
              {selectedDayTasks.map((task, idx) => (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => handleTaskToggle(task.id, !task.isCompleted)}
                  activeOpacity={0.8}
                  className={`p-5 rounded-[24px] border flex-row items-center gap-x-4 ${
                    task.isCompleted
                      ? "bg-surface/30 border-border/30 opacity-60"
                      : "bg-surface border-border/60 shadow-sm"
                  }`}
                >
                  <View className="items-center justify-center">
                    {task.isCompleted ? (
                      <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        size={24}
                        color="var(--success)"
                      />
                    ) : (
                      <HugeiconsIcon icon={CircleIcon} size={24} color="var(--border)" />
                    )}
                  </View>

                  <View className="flex-1">
                    <Text
                      className={`text-base font-sans-semibold ${
                        task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                      numberOfLines={1}
                    >
                      {task.taskDescription}
                    </Text>
                    <View className="flex-row items-center gap-x-3 mt-1.5">
                      <View className="flex-row items-center gap-x-1">
                        <View className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <Text className="text-[10px] font-sans-bold text-accent uppercase tracking-wider">
                          {task.focusArea}
                        </Text>
                      </View>
                      <Text className="text-[10px] font-sans-medium text-muted-foreground uppercase">
                        {format(task.startTime, "h:mm a")}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-muted/10 p-2 rounded-xl">
                    <HugeiconsIcon
                      icon={
                        task.difficultyLevel === "Hard" || task.difficultyLevel === "Ambitious"
                          ? "StarIcon"
                          : "ArrowRight01Icon"
                      }
                      size={14}
                      color="var(--muted-foreground)"
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </Container>
  );
}
