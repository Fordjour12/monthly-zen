import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSemanticColors } from "@/utils/theme";
import Animated, { FadeIn } from "react-native-reanimated";

interface DayData {
  date: Date;
  completed: number;
  total: number;
}

interface HeatmapProps {
  data: DayData[];
  weeksToShow?: number;
  onDayPress?: (day: DayData) => void;
  showLabels?: boolean;
}

/**
 * Premium Heatmap component for Monthly Zen.
 * Uses a GitHub-style activity graph with oklch semantic colors.
 */
export function Heatmap({ data, weeksToShow = 12, onDayPress, showLabels = true }: HeatmapProps) {
  const colors = useSemanticColors();

  const getCellColor = (completed: number, total: number) => {
    if (total === 0) return "var(--surface)";
    const rate = completed / total;
    if (rate === 0) return "var(--muted)/20";
    if (rate <= 0.3) return "rgba(34, 197, 94, 0.2)"; // Low - Green thin
    if (rate <= 0.6) return "rgba(34, 197, 94, 0.5)"; // Mid - Green mid
    if (rate <= 0.8) return "rgba(34, 197, 94, 0.8)"; // High - Green heavy
    return "var(--success)"; // Full - Success
  };

  const weekDays = ["M", "W", "F"];

  const { weeks } = useMemo(() => {
    const today = new Date();
    const gridData: DayData[] = [];

    // Calculate total days to show (rounded up to full weeks)
    const totalDays = weeksToShow * 7;

    // Start from the most recent Sunday
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(today.getDate() - totalDays + 1);

    // Populate grid with actual data or empty days
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const matchingData = data.find((d) => d.date.toDateString() === date.toDateString());

      gridData.push(matchingData || { date, completed: 0, total: 0 });
    }

    // Group into weeks
    const groupedWeeks: DayData[][] = [];
    for (let i = 0; i < gridData.length; i += 7) {
      groupedWeeks.push(gridData.slice(i, i + 7));
    }

    return { weeks: groupedWeeks };
  }, [data, weeksToShow]);

  return (
    <View className="flex-row items-end gap-x-[3px]">
      {/* Day Labels */}
      {showLabels && (
        <View className="mr-2 pb-1 gap-y-[10px] justify-center">
          {weekDays.map((day, i) => (
            <Text key={i} className="text-[9px] font-sans-bold text-muted-foreground uppercase">
              {day}
            </Text>
          ))}
        </View>
      )}

      {/* Grid */}
      <View className="flex-row gap-x-[3px]">
        {weeks.map((week, weekIdx) => (
          <View key={weekIdx} className="gap-y-[3px]">
            {week.map((day, dayIdx) => (
              <Animated.View key={dayIdx} entering={FadeIn.delay(weekIdx * 20 + dayIdx * 5)}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onDayPress?.(day)}
                  style={{
                    backgroundColor: getCellColor(day.completed, day.total),
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                  }}
                  className={day.total === 0 ? "border border-border/20" : ""}
                />
              </Animated.View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
