import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Vibration } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { useSemanticColors } from "@/utils/theme";
import * as Haptics from "expo-haptics";

type ViewMode = "normal" | "heatmap" | "week";

interface CalendarTask {
  id: number;
  startTime: Date;
  isCompleted: boolean;
  focusArea: string;
  difficultyLevel?: string | null;
  taskDescription?: string;
}

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  tasks: CalendarTask[];
  onDateSelect: (date: Date) => void;
  onMonthChange: (month: Date) => void;
}

export function CalendarGrid({
  currentMonth,
  selectedDate,
  tasks,
  onDateSelect,
  onMonthChange,
}: CalendarGridProps) {
  const { muted: _muted, border: _border, foreground, primary } = useSemanticColors();
  const [viewMode, setViewMode] = useState<ViewMode>("normal");

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, CalendarTask[]> = {};
    tasks.forEach((task) => {
      const dateKey = new Date(task.startTime).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(task);
    });
    return grouped;
  }, [tasks]);

  // Get multi-color heatmap color for a day based on completion rate
  const getHeatmapColor = (day: Date): string => {
    const dayTasks = tasksByDate[day.toDateString()];
    if (!dayTasks || dayTasks.length === 0) return "transparent";

    const completedCount = dayTasks.filter((t) => t.isCompleted).length;
    const completionRate = completedCount / dayTasks.length;

    // Multi-color gradient based on completion rate
    if (completionRate === 1) return "#22c55e"; // Complete - green
    if (completionRate >= 0.75) return "#4ade80";
    if (completionRate >= 0.5) return "#facc15"; // Halfway - yellow
    if (completionRate >= 0.25) return "#fb923c";
    if (completionRate > 0) return "#f87171"; // Started - red
    return "#f3f4f6"; // No activity - gray
  };

  const handleDateSelect = (day: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDateSelect(day);
  };

  const handleMonthChange = (newMonth: Date, direction: "prev" | "next") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMonthChange(newMonth);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Render week view
  const renderWeekView = () => {
    const today = new Date();
    const startOfWeekDate = startOfWeek(today);

    const weekDaysList = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeekDate);
      date.setDate(startOfWeekDate.getDate() + i);
      return date;
    });

    return (
      <View className="mt-4">
        <Text className="text-lg font-bold text-foreground mb-4 text-center">
          Week of {format(startOfWeekDate, "MMM d")}
        </Text>
        <View className="gap-2">
          {weekDaysList.map((day) => {
            const dayTasks = tasksByDate[day.toDateString()] || [];
            const isToday = isSameDay(day, today);

            return (
              <TouchableOpacity
                key={day.toISOString()}
                onPress={() => onDateSelect(day)}
                activeOpacity={0.7}
                className={`p-3 rounded-xl border flex-row items-center gap-3 ${
                  isToday ? "border-primary bg-primary/5" : "border-border bg-surface"
                }`}
              >
                <View className="items-center w-12">
                  <Text className="text-xs text-muted-foreground">{format(day, "EEE")}</Text>
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center mt-1 ${
                      isToday ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${isToday ? "text-primary-foreground" : "text-foreground"}`}
                    >
                      {format(day, "d")}
                    </Text>
                  </View>
                </View>

                <View className="flex-1 gap-1">
                  {dayTasks.slice(0, 2).map((task) => (
                    <View
                      key={task.id}
                      className={`px-2 py-1 rounded-md ${
                        task.isCompleted ? "bg-muted/50" : "bg-primary/15"
                      }`}
                    >
                      <Text
                        className={`text-xs ${task.isCompleted ? "text-muted-foreground line-through" : "text-primary"}`}
                        numberOfLines={1}
                      >
                        {format(new Date(task.startTime), "HH:mm")} {task.taskDescription}
                      </Text>
                    </View>
                  ))}
                  {dayTasks.length > 2 && (
                    <Text className="text-xs text-muted-foreground">
                      +{dayTasks.length - 2} more
                    </Text>
                  )}
                </View>

                {dayTasks.length > 0 && (
                  <View className="items-center">
                    <Text className="text-xs text-muted-foreground">
                      {dayTasks.filter((t) => t.isCompleted).length}/{dayTasks.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // If in week view mode, render week view
  if (viewMode === "week") {
    return (
      <View className="bg-surface rounded-3xl p-4 shadow-sm border border-border">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity
            onPress={() => handleMonthChange(subMonths(currentMonth, 1), "prev")}
            className="p-2 rounded-full bg-muted"
          >
            <Ionicons name="chevron-back" size={20} color={foreground} />
          </TouchableOpacity>

          <Text className="text-lg font-bold text-foreground">Week View</Text>

          <TouchableOpacity
            onPress={() => setViewMode("normal")}
            className="p-2 rounded-full bg-muted"
          >
            <Ionicons name="calendar-outline" size={20} color={foreground} />
          </TouchableOpacity>
        </View>

        {renderWeekView()}
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-3xl p-4 shadow-sm border border-border">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity
          onPress={() => handleMonthChange(subMonths(currentMonth, 1), "prev")}
          className="p-3 rounded-full bg-muted"
        >
          <Ionicons name="chevron-back" size={24} color={foreground} />
        </TouchableOpacity>

        <Text className="text-xl font-bold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </Text>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setViewMode("normal")}
            className={`p-3 rounded-full ${viewMode === "normal" ? "bg-primary" : "bg-muted"}`}
          >
            <Ionicons
              name="list-outline"
              size={20}
              color={viewMode === "normal" ? "#fff" : foreground}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode("week")}
            className={`p-3 rounded-full ${viewMode === "week" ? "bg-primary" : "bg-muted"}`}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={viewMode === "week" ? "#fff" : foreground}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode("heatmap")}
            className={`p-3 rounded-full ${viewMode === "heatmap" ? "bg-primary" : "bg-muted"}`}
          >
            <Ionicons
              name="flame-outline"
              size={20}
              color={viewMode === "heatmap" ? "#fff" : foreground}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleMonthChange(addMonths(currentMonth, 1), "next")}
            className="p-3 rounded-full bg-muted"
          >
            <Ionicons name="chevron-forward" size={24} color={foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Week Days */}
      <View className="flex-row justify-between mb-3">
        {weekDays.map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text className="text-sm text-muted-foreground font-medium">{day}</Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View className="flex-row flex-wrap">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const dateKey = day.toDateString();
          const dayTasks = tasksByDate[dateKey] || [];
          const hasTasks = dayTasks.length > 0;
          const allCompleted = hasTasks && dayTasks.every((t) => t.isCompleted);
          const hasMilestones = dayTasks.some(
            (t) => t.difficultyLevel === "Ambitious" || t.difficultyLevel === "Hard",
          );
          const completedCount = dayTasks.filter((t) => t.isCompleted).length;

          return (
            <TouchableOpacity
              key={day.toISOString()}
              onPress={() => handleDateSelect(day)}
              activeOpacity={0.7}
              className={`w-[14.28%] aspect-square items-center justify-center p-1 relative ${
                viewMode === "heatmap" && "overflow-hidden"
              }`}
            >
              {/* Heatmap background */}
              {viewMode === "heatmap" && (
                <View
                  style={[
                    { position: "absolute", top: 4, left: 4, right: 4, bottom: 4, borderRadius: 8 },
                    hasTasks && { backgroundColor: getHeatmapColor(day), opacity: 0.4 },
                  ]}
                />
              )}

              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  isSelected ? "bg-primary shadow-lg" : isToday ? "bg-muted" : ""
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    isSelected
                      ? "text-primary-foreground"
                      : isToday
                        ? "text-foreground"
                        : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground opacity-30"
                  }`}
                >
                  {format(day, "d")}
                </Text>

                {/* Milestone Indicator */}
                {hasMilestones && !isSelected && (
                  <View className="absolute -top-1 -right-1">
                    <Ionicons name="star" size={12} color="#f59e0b" fill="#f59e0b" />
                  </View>
                )}

                {/* Normal Mode: Task Indicator Dots */}
                {viewMode === "normal" && hasTasks && !isSelected && (
                  <View className="absolute bottom-0 flex-row gap-0.5">
                    <View
                      className={`w-1.5 h-1.5 rounded-full ${
                        allCompleted ? "bg-success" : "bg-primary"
                      }`}
                    />
                  </View>
                )}

                {/* Heatmap Mode: Completion Count */}
                {viewMode === "heatmap" && hasTasks && !isSelected && (
                  <View className="absolute bottom-0">
                    <Text className="text-[10px] text-muted-foreground">
                      {completedCount}/{dayTasks.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
