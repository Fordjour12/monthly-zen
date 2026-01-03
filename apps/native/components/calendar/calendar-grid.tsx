import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
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
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  FireIcon,
  Menu01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";

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

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

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
    Haptics.selectionAsync();
    onDateSelect(day);
  };

  const handleMonthChange = (newMonth: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMonthChange(newMonth);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Render week view
  const renderWeekView = () => {
    const today = new Date();
    const startOfWeekDate = startOfWeek(selectedDate || today);

    const weekDaysList = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeekDate);
      date.setDate(startOfWeekDate.getDate() + i);
      return date;
    });

    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} className="flex-col gap-4">
        <Text className="text-sm font-semibold text-muted-foreground/70 uppercase tracking-widest px-1">
          Week of {format(startOfWeekDate, "MMM d")}
        </Text>
        <View className="flex-row justify-between mb-2">
          {weekDaysList.map((day, index) => {
            const dayTasks = tasksByDate[day.toDateString()] || [];
            const isToday = isSameDay(day, today);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const hasTasks = dayTasks.length > 0;
            const allCompleted = hasTasks && dayTasks.every((t) => t.isCompleted);

            return (
              <Animated.View
                key={day.toISOString()}
                entering={FadeIn.delay(index * 50)}
                layout={LinearTransition}
              >
                <TouchableOpacity
                  onPress={() => onDateSelect(day)}
                  activeOpacity={0.7}
                  className={`w-[44px] py-3 items-center justify-center rounded-[20px] gap-1 ${
                    isSelected
                      ? "bg-primary shadow-md shadow-primary/30"
                      : isToday
                        ? "bg-surface border border-primary/20"
                        : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-medium uppercase tracking-wide ${
                      isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
                    }`}
                  >
                    {format(day, "EEE")}
                  </Text>

                  <Text
                    className={`text-lg font-bold ${
                      isSelected ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </Text>

                  {/* Dot Indicator */}
                  <View className="h-1.5 justify-center">
                    {hasTasks && (
                      <View
                        className={`w-1 h-1 rounded-full ${
                          isSelected ? "bg-white" : allCompleted ? "bg-green-500" : "bg-primary"
                        }`}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  return (
    <View className="bg-surface rounded-[32px] p-5 shadow-sm border border-border/60">
      {/* Header */}
      <View className="flex-col gap-5 mb-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-foreground tracking-tight">
              {format(currentMonth, "MMMM")}
            </Text>
            <Text className="text-sm font-medium text-muted-foreground opacity-80">
              {format(currentMonth, "yyyy")}
            </Text>
          </View>
          <View className="flex-row gap-1 bg-muted/20 p-1 rounded-full">
            <TouchableOpacity
              onPress={() => setViewMode("normal")}
              className={`p-2 rounded-full ${viewMode === "normal" ? "bg-background shadow-sm" : ""}`}
            >
              <HugeiconsIcon
                icon={Menu01Icon}
                size={18}
                color={viewMode === "normal" ? foreground : "#9ca3af"}
                strokeWidth={2}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode("week")}
              className={`p-2 rounded-full ${viewMode === "week" ? "bg-background shadow-sm" : ""}`}
            >
              <HugeiconsIcon
                icon={Calendar01Icon}
                size={18}
                color={viewMode === "week" ? foreground : "#9ca3af"}
                strokeWidth={2}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode("heatmap")}
              className={`p-2 rounded-full ${viewMode === "heatmap" ? "bg-background shadow-sm" : ""}`}
            >
              <HugeiconsIcon
                icon={FireIcon}
                size={18}
                color={viewMode === "heatmap" ? foreground : "#9ca3af"}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>
        </View>

        {viewMode !== "week" && (
          <View className="flex-row justify-between items-center px-1">
            <TouchableOpacity
              onPress={() => handleMonthChange(subMonths(currentMonth, 1))}
              className="p-2 rounded-full hover:bg-muted/20 active:bg-muted/30"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={foreground} />
            </TouchableOpacity>

            <View className="flex-row justify-between flex-1 px-4">
              {weekDays.map((day) => (
                <View key={day} className="w-8 items-center">
                  <Text className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest text-[10px]">
                    {day.substring(0, 1)}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => handleMonthChange(addMonths(currentMonth, 1))}
              className="p-2 rounded-full hover:bg-muted/20 active:bg-muted/30"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={foreground} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Week View Content */}
      {viewMode === "week" ? (
        renderWeekView()
      ) : (
        /* Grid Content */
        <Animated.View layout={LinearTransition} className="flex-row flex-wrap gap-y-2">
          {/* Grid Spacer for alignment if needed, or justify-between */}
          {/* We'll use a fixed width calculation or flex percentage */}
          <View className="flex-row flex-wrap w-full">
            {days.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const dateKey = day.toDateString();
              const dayTasks = tasksByDate[dateKey] || [];
              const hasTasks = dayTasks.length > 0;
              const completedCount = dayTasks.filter((t) => t.isCompleted).length;
              const hasMilestones = dayTasks.some(
                (t) => t.difficultyLevel === "Ambitious" || t.difficultyLevel === "Hard",
              );

              return (
                <View key={day.toISOString()} className="w-[14.28%] items-center justify-center">
                  <AnimatedTouchableOpacity
                    entering={FadeIn}
                    onPress={() => handleDateSelect(day)}
                    activeOpacity={0.7}
                    className={`w-10 h-10 items-center justify-center rounded-full relative ${
                      !isCurrentMonth ? "opacity-30" : ""
                    } ${isSelected ? "bg-primary shadow-md shadow-primary/30" : ""} ${
                      isToday && !isSelected ? "bg-muted/30 border border-primary/30" : ""
                    }`}
                  >
                    {/* Heatmap Background Layer */}
                    {viewMode === "heatmap" && hasTasks && !isSelected && (
                      <View
                        className="absolute inset-0 rounded-full opacity-30"
                        style={{ backgroundColor: getHeatmapColor(day) }}
                      />
                    )}

                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "text-primary-foreground font-bold" : "text-foreground"
                      }`}
                    >
                      {format(day, "d")}
                    </Text>

                    {/* Indicators */}
                    {viewMode === "normal" && hasTasks && !isSelected && (
                      <View className="absolute -bottom-1 flex-row gap-0.5">
                        <View
                          className={`w-1 h-1 rounded-full ${dayTasks.every((t) => t.isCompleted) ? "bg-green-500" : "bg-primary"}`}
                        />
                      </View>
                    )}

                    {hasMilestones && !isSelected && (
                      <View className="absolute -top-1 -right-1">
                        <HugeiconsIcon icon={StarIcon} size={8} color="#f59e0b" fill="#f59e0b" />
                      </View>
                    )}
                  </AnimatedTouchableOpacity>
                </View>
              );
            })}
          </View>
        </Animated.View>
      )}
    </View>
  );
}
