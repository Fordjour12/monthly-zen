import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSemanticColors } from "@/utils/theme";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

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
 * Uses a GitHub-style activity graph with semantic colors and high-fidelity indicators.
 */
export function Heatmap({ data, weeksToShow = 12, onDayPress, showLabels = true }: HeatmapProps) {
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

  const weekDayLabels = ["M", "W", "F"];

  const weeks = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday
    const endOfGrid = new Date(today);
    // Align to the end of the current week (Saturday)
    endOfGrid.setDate(today.getDate() + (6 - currentDay));

    const totalDays = weeksToShow * 7;
    const gridData: DayData[] = [];

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(endOfGrid);
      date.setDate(endOfGrid.getDate() - i);

      const matchingData = data.find((d) => d.date.toDateString() === date.toDateString());
      gridData.push(matchingData || { date, completed: 0, total: 0 });
    }

    const groupedWeeks: DayData[][] = [];
    for (let i = 0; i < gridData.length; i += 7) {
      groupedWeeks.push(gridData.slice(i, i + 7));
    }

    return groupedWeeks;
  }, [data, weeksToShow]);

  return (
    <View className="flex-row items-end gap-x-[3px]">
      {/* Day Labels */}
      {showLabels && (
        <View className="mr-3 pb-1 gap-y-[12px] justify-center">
          {weekDayLabels.map((day, i) => (
            <Text
              key={i}
              className="text-[8px] font-sans-bold text-muted-foreground uppercase tracking-widest"
            >
              {day}
            </Text>
          ))}
        </View>
      )}

      {/* Grid */}
      <View className="flex-row gap-x-[4px]">
        {weeks.map((week, weekIdx) => (
          <View key={weekIdx} className="gap-y-[4px]">
            {week.map((day, dayIdx) => {
              const { bg, border } = getCellStyles(day.completed, day.total);
              const isToday = day.date.toDateString() === new Date().toDateString();

              return (
                <Animated.View
                  key={dayIdx}
                  entering={FadeIn.delay(weekIdx * 15 + dayIdx * 5)}
                  layout={LinearTransition}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => onDayPress?.(day)}
                    style={{
                      backgroundColor: bg,
                      width: 14,
                      height: 14,
                    }}
                    className={`rounded-[4px] border ${border} ${isToday ? "border-accent border-2 shadow-sm shadow-accent/20" : ""}`}
                  >
                    {isToday && (
                      <View className="absolute inset-0 items-center justify-center">
                        <View className="w-1 h-1 rounded-full bg-accent" />
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
