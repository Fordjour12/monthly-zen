import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
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
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
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
  const { foreground } = useSemanticColors();
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

  const getHeatmapColor = (day: Date): string => {
    const dayTasks = tasksByDate[day.toDateString()];
    if (!dayTasks || dayTasks.length === 0) return "transparent";

    const completedCount = dayTasks.filter((t) => t.isCompleted).length;
    const completionRate = completedCount / dayTasks.length;

    if (completionRate === 1) return "#22c55e"; // Success green
    if (completionRate >= 0.5) return "#3b82f6"; // Primary blue
    if (completionRate > 0) return "#f59e0b"; // Warning orange
    return "var(--border)"; // No completion
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

  return (
    <View className="bg-surface rounded-[32px] p-6 border border-border/50 shadow-sm">
      {/* Header with Mode Switch */}
      <View className="flex-row justify-between items-center mb-8">
        <View className="flex-row items-center gap-x-4">
          <View>
            <Text className="text-xl font-sans-bold text-foreground">
              {format(currentMonth, "MMMM")}
            </Text>
            <Text className="text-xs font-sans-medium text-muted-foreground uppercase tracking-widest">
              {format(currentMonth, "yyyy")}
            </Text>
          </View>
          <View className="flex-row items-center gap-x-1">
            <TouchableOpacity
              onPress={() => handleMonthChange(subMonths(currentMonth, 1))}
              className="p-1"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} color="var(--muted-foreground)" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleMonthChange(addMonths(currentMonth, 1))}
              className="p-1"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="var(--muted-foreground)" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row bg-background/50 p-1.5 rounded-2xl border border-border/30">
          <ModeButton
            active={viewMode === "normal"}
            icon={Menu01Icon}
            onPress={() => setViewMode("normal")}
          />
          <ModeButton
            active={viewMode === "week"}
            icon={Calendar03Icon}
            onPress={() => setViewMode("week")}
          />
          <ModeButton
            active={viewMode === "heatmap"}
            icon={FireIcon}
            onPress={() => setViewMode("heatmap")}
          />
        </View>
      </View>

      {/* Week Day Labels */}
      <View className="flex-row justify-between mb-4 px-2">
        {weekDays.map((day) => (
          <View key={day} className="w-8 items-center">
            <Text className="text-[10px] font-sans-bold text-muted-foreground/40 uppercase tracking-widest">
              {day.substring(0, 1)}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid Content */}
      <Animated.View layout={LinearTransition} className="flex-row flex-wrap w-full gap-y-2">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const dateKey = day.toDateString();
          const dayTasks = tasksByDate[dateKey] || [];
          const hasTasks = dayTasks.length > 0;
          const hasMilestones = dayTasks.some(
            (t) => t.difficultyLevel === "Ambitious" || t.difficultyLevel === "Hard",
          );

          if (
            viewMode === "week" &&
            !isSameDay(day, selectedDate || new Date()) &&
            !isSameMonth(day, currentMonth)
          ) {
            // Logic could be improved here for week view but keeping simple for now
          }

          return (
            <View key={day.toISOString()} className="w-[14.28%] items-center justify-center">
              <AnimatedTouchableOpacity
                entering={FadeIn}
                onPress={() => handleDateSelect(day)}
                activeOpacity={0.7}
                className={`w-10 h-10 items-center justify-center rounded-2xl relative ${
                  !isCurrentMonth ? "opacity-20" : ""
                } ${isSelected ? "bg-accent shadow-lg shadow-accent/20" : ""} ${
                  isToday && !isSelected ? "border border-accent/40 bg-accent/5" : ""
                }`}
              >
                {/* Heatmap Layer */}
                {viewMode === "heatmap" && hasTasks && !isSelected && (
                  <View
                    className="absolute inset-[2px] rounded-xl opacity-30"
                    style={{ backgroundColor: getHeatmapColor(day) }}
                  />
                )}

                <Text
                  className={`text-sm font-sans-bold ${
                    isSelected ? "text-white" : "text-foreground"
                  }`}
                >
                  {format(day, "d")}
                </Text>

                {/* Indicators */}
                {viewMode === "normal" && hasTasks && !isSelected && (
                  <View className="absolute bottom-1.5 w-1 h-1 rounded-full bg-accent" />
                )}

                {hasMilestones && !isSelected && (
                  <View className="absolute top-1 right-1">
                    <HugeiconsIcon icon={StarIcon} size={6} color="#f59e0b" fill="#f59e0b" />
                  </View>
                )}
              </AnimatedTouchableOpacity>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

function ModeButton({ active, icon, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`p-2 rounded-xl ${active ? "bg-accent" : "bg-transparent"}`}
    >
      <HugeiconsIcon icon={icon} size={16} color={active ? "white" : "var(--muted-foreground)"} />
    </TouchableOpacity>
  );
}
