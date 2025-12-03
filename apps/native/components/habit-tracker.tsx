import { useState } from "react";
import { Pressable, Text, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { ZoomIn } from "react-native-reanimated";
import { Card, useThemeColor } from "heroui-native";
import { Platform } from "react-native";

export type HabitStatus = "completed" | "partial" | "skipped" | "pending";

interface HabitTrackerProps {
  habitId: string;
  title: string;
  targetValue: number;
  currentStreak: number;
  todayStatus?: HabitStatus;
  todayValue?: number;
  onLogHabit: (habitId: string, value: number, status: HabitStatus) => void;
  disabled?: boolean;
  showHistory?: boolean;
}

export function HabitTracker({
  habitId,
  title,
  targetValue,
  currentStreak,
  todayStatus = "pending",
  todayValue = 0,
  onLogHabit,
  disabled = false,
  showHistory = false,
}: HabitTrackerProps) {
  const [selectedValue, setSelectedValue] = useState(todayValue);
  const [isAnimating, setIsAnimating] = useState(false);

  const successColor = useThemeColor("success");
  const warningColor = useThemeColor("warning");

  const handleLogHabit = (value: number, status: HabitStatus) => {
    if (disabled || isAnimating) return;

    if (Platform.OS === "ios") {
      if (status === "completed") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (status === "skipped") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    setIsAnimating(true);
    setSelectedValue(value);
    onLogHabit(habitId, value, status);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const getStreakIcon = () => {
    if (currentStreak === 0) return "🔥";
    if (currentStreak >= 30) return "💥";
    if (currentStreak >= 14) return "⚡";
    if (currentStreak >= 7) return "🔥";
    return "✨";
  };

  const getStreakColor = () => {
    if (currentStreak === 0) return warningColor;
    if (currentStreak >= 30) return "#FF6B6B";
    if (currentStreak >= 14) return "#4ECDC4";
    if (currentStreak >= 7) return successColor;
    return successColor;
  };

  const getProgressPercentage = () => {
    return Math.min((selectedValue / targetValue) * 100, 100);
  };

  const getStatusIcon = () => {
    switch (todayStatus) {
      case "completed":
        return "checkmark-circle";
      case "partial":
        return "remove-circle";
      case "skipped":
        return "close-circle";
      default:
        return "ellipse-outline";
    }
  };

  const getStatusColor = () => {
    switch (todayStatus) {
      case "completed":
        return successColor;
      case "partial":
        return warningColor;
      case "skipped":
        return warningColor;
      default:
        return warningColor;
    }
  };

  return (
    <Card variant="secondary" className="p-4 mb-4">
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1">
          <Text className="text-foreground text-lg font-semibold mb-1">{title}</Text>
          <Text className="text-foreground text-sm">
            Target: {targetValue} {targetValue === 1 ? "time" : "times"} per day
          </Text>
        </View>
        
        <View className="items-center">
          <Animated.View entering={ZoomIn}>
            <Text className="text-2xl mb-1">{getStreakIcon()}</Text>
          </Animated.View>
          <Text className="text-sm font-medium" style={{ color: getStreakColor() }}>
            {currentStreak} day{currentStreak !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm text-foreground">Today's Progress</Text>
          <Text className="text-sm font-medium">
            {selectedValue}/{targetValue}
          </Text>
        </View>
        <View className="h-2 bg-surface rounded-full overflow-hidden">
          <Animated.View
            className="h-full bg-success rounded-full"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </View>
      </View>

      {/* Status Indicator */}
      <View className="flex-row items-center gap-2 mb-4">
        <Ionicons name={getStatusIcon() as any} size={20} color={getStatusColor()} />
        <Text className="text-sm font-medium" style={{ color: getStatusColor() }}>
          {todayStatus === "pending" && "Not started yet"}
          {todayStatus === "partial" && "In progress"}
          {todayStatus === "completed" && "Completed! 🎉"}
          {todayStatus === "skipped" && "Skipped today"}
        </Text>
      </View>

      {/* Action Buttons */}
      {todayStatus === "pending" || todayStatus === "partial" ? (
        <View className="space-y-2">
          {/* Value Selection */}
          {targetValue > 1 && (
            <View className="flex-row items-center gap-2 mb-3">
              <Text className="text-sm text-foreground">Amount:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {Array.from({ length: Math.min(targetValue, 10) }, (_, i) => i + 1).map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => setSelectedValue(value)}
                      className={`w-8 h-8 rounded-full items-center justify-center border ${
                        selectedValue === value
                          ? "bg-primary border-primary"
                           : "bg-surface border-surface"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selectedValue === value ? "text-white" : "text-foreground"
                        }`}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => handleLogHabit(selectedValue || targetValue, "completed")}
              disabled={disabled}
              className="flex-1 py-3 rounded-lg bg-success border border-success"
            >
              <Text className="text-white text-center font-medium">
                {targetValue === 1 ? "Complete" : `Log ${selectedValue || targetValue}`}
              </Text>
            </Pressable>

            {targetValue > 1 && (
              <Pressable
                onPress={() => handleLogHabit(selectedValue, "partial")}
                disabled={disabled || selectedValue === 0}
                className="flex-1 py-3 rounded-lg bg-warning border border-warning"
              >
                <Text className="text-white text-center font-medium">
                  Partial ({selectedValue})
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => handleLogHabit(0, "skipped")}
              disabled={disabled}
              className="py-3 px-4 rounded-lg bg-surface border border-surface"
            >
              <Text className="text-foreground font-medium">Skip</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => handleLogHabit(0, "pending")}
            disabled={disabled}
            className="flex-1 py-3 rounded-lg bg-surface border border-surface"
          >
            <Text className="text-foreground text-center font-medium">Reset Today</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

interface HabitStreakBadgeProps {
  streak: number;
  size?: "small" | "medium" | "large";
}

export function HabitStreakBadge({ streak, size = "medium" }: HabitStreakBadgeProps) {
  const successColor = useThemeColor("success");
  const warningColor = useThemeColor("warning");

  const getStreakIcon = () => {
    if (streak === 0) return "🔥";
    if (streak >= 30) return "💥";
    if (streak >= 14) return "⚡";
    if (streak >= 7) return "🔥";
    return "✨";
  };

  const getStreakColor = () => {
    if (streak === 0) return warningColor;
    if (streak >= 30) return "#FF6B6B";
    if (streak >= 14) return "#4ECDC4";
    if (streak >= 7) return successColor;
    return successColor;
  };

  const sizeClasses = {
    small: "px-2 py-1",
    medium: "px-3 py-1.5",
    large: "px-4 py-2",
  };

  const iconSizes = {
    small: 14,
    medium: 18,
    large: 22,
  };

  const textSizes = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  };

  return (
    <View className={`flex-row items-center gap-1.5 rounded-full bg-surface/10 border border-surface ${sizeClasses[size]}`}>
              <Text className="text-sm">{getStreakIcon()}</Text>
      <Text className={`${textSizes[size]} font-medium`} style={{ color: getStreakColor() }}>
        {streak} day{streak !== 1 ? "s" : ""}
      </Text>
    </View>
  );
}

interface HabitCalendarProps {
  logs: Array<{ date: Date; status: HabitStatus; value: number }>;
  onDatePress?: (date: Date, log?: any) => void;
}

export function HabitCalendar({ logs, onDatePress }: HabitCalendarProps) {
  const successColor = useThemeColor("success");
  const warningColor = useThemeColor("warning");
  const surfaceColor = useThemeColor("surface");

  const getLogForDate = (date: Date) => {
    return logs.find(log => {
      const logDate = new Date(log.date);
      return logDate.toDateString() === date.toDateString();
    });
  };

  const getDateColor = (date: Date) => {
    const log = getLogForDate(date);
    if (!log) return surfaceColor;
    
    switch (log.status) {
      case "completed":
        return successColor;
      case "partial":
        return warningColor;
      case "skipped":
        return warningColor;
      default:
        return surfaceColor;
    }
  };

  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <Card variant="secondary" className="p-4">
      <Text className="text-foreground text-lg font-semibold mb-3">Last 30 Days</Text>
      <View className="flex-row flex-wrap gap-1">
        {calendarDays.map((date, index) => {
          const log = getLogForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <Pressable
              key={index}
              onPress={() => onDatePress?.(date, log)}
              className={`w-8 h-8 rounded-md items-center justify-center border ${
                isToday ? "border-primary" : "border-transparent"
              }`}
              style={{ backgroundColor: getDateColor(date) }}
            >
              <Text className="text-xs font-medium">
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
      
      <View className="flex-row items-center gap-4 mt-4 pt-3 border-t border-divider">
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full bg-success" />
          <Text className="text-xs text-foreground">Completed</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full bg-warning" />
          <Text className="text-xs text-foreground">Partial</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-full bg-surface" />
          <Text className="text-xs text-foreground">Skipped</Text>
        </View>
      </View>
    </Card>
  );
}