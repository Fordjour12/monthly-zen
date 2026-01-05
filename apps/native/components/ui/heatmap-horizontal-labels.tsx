/**
 * Heatmap Component with Horizontal Day Labels
 *
 * A calendar-style heatmap visualization showing task completion patterns
 * with M T W T F S S labels on top and columns for each week.
 */

import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSemanticColors } from "@/utils/theme";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

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

export function HeatmapHorizontalLabels({
  data,
  weeksToShow = 4,
  onDayPress,
  showLabels = true,
}: HeatmapHorizontalLabelsProps) {
  const colors = useSemanticColors();

  const getCellStyles = (completed: number, total: number) => {
    if (total === 0) return { bg: "var(--muted)/10", border: "border-border/10" };
    const rate = completed / total;
    if (rate === 0) return { bg: "var(--muted)/20", border: "border-border/20" };
    if (rate <= 0.3) return { bg: "rgba(34, 197, 94, 0.2)", border: "border-success/20" };
    if (rate <= 0.6) return { bg: "rgba(34, 197, 94, 0.5)", border: "border-success/30" };
    if (rate <= 0.8) return { bg: "rgba(34, 197, 94, 0.8)", border: "border-success/50" };
    return { bg: "var(--success)", border: "border-success/80" };
  };

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  const weeks = useMemo(() => {
    const today = new Date();
    // Start from the most recent Sunday
    const currentDay = today.getDay();
    const endOfGrid = new Date(today);
    endOfGrid.setDate(today.getDate() + (6 - currentDay));

    const totalDays = weeksToShow * 7;
    const gridDays: DayData[] = [];

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(endOfGrid);
      date.setDate(endOfGrid.getDate() - i);

      const matchingData = data.find((d) => d.date.toDateString() === date.toDateString());

      gridDays.push(matchingData || { date, completed: 0, total: 0 });
    }

    const result: DayData[][] = [];
    for (let i = 0; i < gridDays.length; i += 7) {
      result.push(gridDays.slice(i, i + 7));
    }
    return result;
  }, [data, weeksToShow]);

  const cellSize = 22;
  const cellGap = 4;

  return (
    <View className="w-full">
      {showLabels && (
        <View className="flex-row mb-3 px-1">
          {dayLabels.map((label, i) => (
            <View key={i} style={{ width: cellSize, marginRight: cellGap }}>
              <Text className="text-[9px] font-sans-bold text-muted-foreground text-center uppercase tracking-widest">
                {label}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="gap-y-[4px]">
        {weeks.map((week, weekIdx) => (
          <Animated.View
            key={weekIdx}
            entering={FadeIn.delay(weekIdx * 50)}
            layout={LinearTransition}
            className="flex-row items-center"
          >
            {week.map((day, dayIdx) => {
              const { bg, border } = getCellStyles(day.completed, day.total);
              const isToday = day.date.toDateString() === new Date().toDateString();

              return (
                <TouchableOpacity
                  key={dayIdx}
                  activeOpacity={0.7}
                  onPress={() => onDayPress?.(day)}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    marginRight: cellGap,
                    backgroundColor: bg,
                  }}
                  className={`rounded-[6px] border ${border} ${isToday ? "border-accent border-2 shadow-sm shadow-accent/20" : ""}`}
                >
                  {isToday && (
                    <View className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent border border-background" />
                  )}
                </TouchableOpacity>
              );
            })}
            <Text className="text-[8px] font-sans-bold text-muted-foreground uppercase tracking-widest ml-1 opacity-40">
              W{weekIdx + 1}
            </Text>
          </Animated.View>
        ))}
      </View>
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
