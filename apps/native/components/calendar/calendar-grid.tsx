import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
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

type ViewMode = "normal" | "heatmap";

interface CalendarTask {
  id: number;
  startTime: Date;
  isCompleted: boolean;
  focusArea: string;
  difficultyLevel?: string | null;
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
  const { muted: _muted, border: _border, foreground } = useSemanticColors();
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

  // Get heatmap color for a day based on completion rate
  const getHeatmapColor = (day: Date): string => {
    const dayTasks = tasksByDate[day.toDateString()];
    if (!dayTasks || dayTasks.length === 0) return "transparent";

    const completedCount = dayTasks.filter((t) => t.isCompleted).length;
    const completionRate = completedCount / dayTasks.length;

    if (completionRate === 1) return "#22c55e"; // green-500
    if (completionRate >= 0.75) return "#4ade80"; // green-400
    if (completionRate >= 0.5) return "#86efac"; // green-300
    if (completionRate >= 0.25) return "#bbf7d0"; // green-200
    if (completionRate > 0) return "#dcfce7"; // green-100
    return "#f3f4f6"; // gray-100
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <View className="bg-surface rounded-3xl p-4 shadow-sm border border-border">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity
          onPress={() => onMonthChange(subMonths(currentMonth, 1))}
          className="p-2 rounded-full bg-muted"
        >
          <Ionicons name="chevron-back" size={20} color={foreground} />
        </TouchableOpacity>

        <Text className="text-lg font-bold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </Text>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setViewMode("normal")}
            className={`p-2 rounded-full ${viewMode === "normal" ? "bg-primary" : "bg-muted"}`}
          >
            <Ionicons
              name="list-outline"
              size={20}
              color={viewMode === "normal" ? "#fff" : foreground}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode("heatmap")}
            className={`p-2 rounded-full ${viewMode === "heatmap" ? "bg-primary" : "bg-muted"}`}
          >
            <Ionicons
              name="flame-outline"
              size={20}
              color={viewMode === "heatmap" ? "#fff" : foreground}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onMonthChange(addMonths(currentMonth, 1))}
            className="p-2 rounded-full bg-muted"
          >
            <Ionicons name="chevron-forward" size={20} color={foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Week Days */}
      <View className="flex-row justify-between mb-2">
        {weekDays.map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text className="text-xs text-muted-foreground font-medium">{day}</Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View className="flex-row flex-wrap">
        {days.map((day, _idx) => {
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
              onPress={() => onDateSelect(day)}
              className={`w-[14.28%] aspect-square items-center justify-center p-1 relative ${
                viewMode === "heatmap" && "overflow-hidden"
              }`}
            >
              {/* Heatmap background */}
              {viewMode === "heatmap" && (
                <View
                  style={[
                    { position: "absolute", top: 2, left: 2, right: 2, bottom: 2, borderRadius: 8 },
                    hasTasks && { backgroundColor: getHeatmapColor(day), opacity: 0.4 },
                  ]}
                />
              )}

              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isSelected ? "bg-primary" : isToday ? "bg-muted" : ""
                }`}
              >
                <Text
                  className={`text-sm ${
                    isSelected
                      ? "text-primary-foreground font-bold"
                      : isToday
                        ? "text-foreground font-bold"
                        : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground opacity-30"
                  }`}
                >
                  {format(day, "d")}
                </Text>

                {/* Milestone Indicator */}
                {hasMilestones && !isSelected && (
                  <View className="absolute top-0 right-0">
                    <Ionicons name="star" size={10} color="#f59e0b" />
                  </View>
                )}

                {/* Normal Mode: Task Indicator Dots */}
                {viewMode === "normal" && hasTasks && !isSelected && (
                  <View className="absolute bottom-1 flex-row gap-0.5">
                    <View
                      className={`w-1 h-1 rounded-full ${
                        allCompleted ? "bg-success" : "bg-primary"
                      }`}
                    />
                  </View>
                )}

                {/* Heatmap Mode: Completion Count */}
                {viewMode === "heatmap" && hasTasks && !isSelected && (
                  <View className="absolute bottom-0.5">
                    <Text className="text-[9px] text-muted-foreground">
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
