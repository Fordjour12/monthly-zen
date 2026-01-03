/**
 * Heatmap Component with Horizontal Day Labels
 *
 * A calendar-style heatmap visualization showing task completion patterns
 * with M T W T F S S labels on top and columns for each week.
 */

import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSemanticColors } from "@/utils/theme";

interface DayData {
  date: Date;
  completed: number;
  total: number;
  label?: string;
}

export type { DayData };

interface HeatmapHorizontalLabelsProps {
  data: DayData[];
  weeksToShow?: number;
  onDayPress?: (day: DayData) => void;
  showLabels?: boolean;
  _title?: string;
}

type HeatmapColor = "gray" | "green" | "blue" | "yellow" | "red";

export function HeatmapHorizontalLabels({
  data,
  weeksToShow = 4,
  onDayPress,
  showLabels = true,
  _title = "Activity",
}: HeatmapHorizontalLabelsProps) {
  const colors = useSemanticColors();

  const getColor = (completed: number, total: number): HeatmapColor => {
    if (total === 0) return "gray";
    const rate = completed / total;
    if (rate === 0) return "gray";
    if (rate <= 0.25) return "red";
    if (rate <= 0.5) return "yellow";
    if (rate <= 0.75) return "blue";
    return "green";
  };

  const getBackgroundColor = (color: HeatmapColor): string => {
    const colorMap: Record<HeatmapColor, string> = {
      gray: colors.muted || "#6b7280",
      green: "#10b981",
      blue: "#3b82f6",
      yellow: "#f59e0b",
      red: "#ef4444",
    };
    return colorMap[color];
  };

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  const { gridData } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - weeksToShow * 7 + 1);

    const days: DayData[] = [];
    for (let i = 0; i < weeksToShow * 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const matchingData = data.find(
        (d) => d.date.getDate() === date.getDate() && d.date.getMonth() === date.getMonth(),
      );

      days.push(matchingData || { date, completed: 0, total: 0 });
    }

    return { gridData: days };
  }, [data, weeksToShow]);

  const weeks = useMemo(() => {
    const result: DayData[][] = [];
    for (let i = 0; i < gridData.length; i += 7) {
      result.push(gridData.slice(i, i + 7));
    }
    return result;
  }, [gridData]);

  const cellSize = 16;
  const cellGap = 3;

  return (
    <View className="w-full">
      {/* Day labels row - M T W T F S S repeated */}
      {showLabels && (
        <View className="flex-row mb-2">
          {weeks.map((_, weekIndex) => (
            <View key={weekIndex} className="flex-row" style={{ marginRight: cellGap }}>
              {dayLabels.map((label, dayIndex) => (
                <View key={dayIndex} style={{ width: cellSize }}>
                  <Text className="text-[9px] text-muted-foreground text-center">{label}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Grid rows - each row is a day of week */}
      {dayLabels.map((_, dayIndex) => (
        <View key={dayIndex} className="flex-row mb-[3px]">
          {weeks.map((week, weekIndex) => {
            const day = week[dayIndex];
            const color = getColor(day.completed, day.total);
            const bgColor = getBackgroundColor(color);
            const isToday = day.date.toDateString() === new Date().toDateString();

            return (
              <TouchableOpacity
                key={weekIndex}
                style={{
                  width: cellSize,
                  height: cellSize,
                  marginRight: cellGap,
                }}
                onPress={() => onDayPress?.(day)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    {
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 3,
                      backgroundColor: day.total === 0 ? `${colors.muted}30` : bgColor + "40",
                      borderWidth: day.total > 0 ? 0 : 1,
                      borderColor: colors.border,
                    },
                    isToday && {
                      borderWidth: 1,
                      borderColor: colors.primary,
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function generateMockHeatmapData(days: number = 28): DayData[] {
  const data: DayData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseCompletion = isWeekend ? 0.3 : 0.7;
    const randomFactor = Math.random() * 0.4 - 0.2;
    const rate = Math.max(0, Math.min(1, baseCompletion + randomFactor));

    const total = Math.floor(Math.random() * 8) + 3;
    const completed = Math.floor(total * rate);

    data.push({
      date,
      completed,
      total,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
    });
  }

  return data;
}

export default HeatmapHorizontalLabels;
