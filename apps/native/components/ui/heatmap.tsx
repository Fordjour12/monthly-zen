/**
 * Heatmap Component
 *
 * A calendar-style heatmap visualization showing task completion patterns
 * similar to GitHub's contribution graph.
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSemanticColors } from "@/utils/theme";

interface DayData {
  date: Date;
  completed: number;
  total: number;
  label?: string;
}

interface HeatmapProps {
  data: DayData[];
  weeksToShow?: number;
  onDayPress?: (day: DayData) => void;
  showLabels?: boolean;
  title?: string;
}

type HeatmapColor = "gray" | "green" | "blue" | "yellow" | "red";

export function Heatmap({
  data,
  weeksToShow = 4,
  onDayPress,
  showLabels = true,
  title = "Activity Heatmap",
}: HeatmapProps) {
  const colors = useSemanticColors();

  // Get color based on completion rate
  const getColor = (completed: number, total: number): HeatmapColor => {
    if (total === 0) return "gray";
    const rate = completed / total;
    if (rate === 0) return "gray";
    if (rate <= 0.25) return "red";
    if (rate <= 0.5) return "yellow";
    if (rate <= 0.75) return "blue";
    return "green";
  };

  // Get background color for a cell
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

  // Generate week labels
  const weekLabels = ["S", "M", "T", "W", "T", "F", "S"];

  // Generate last N weeks of data
  const { gridData, startDate } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - weeksToShow * 7 + 1);

    const days: DayData[] = [];
    for (let i = 0; i < weeksToShow * 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      // Find matching data or create empty day
      const matchingData = data.find(
        (d) => d.date.getDate() === date.getDate() && d.date.getMonth() === date.getMonth(),
      );

      days.push(matchingData || { date, completed: 0, total: 0 });
    }

    return { gridData: days, startDate: start };
  }, [data, weeksToShow]);

  // Group by weeks
  const weeks = useMemo(() => {
    const result: DayData[][] = [];
    for (let i = 0; i < gridData.length; i += 7) {
      result.push(gridData.slice(i, i + 7));
    }
    return result;
  }, [gridData]);

  // Calculate cell size
  const cellSize = 28;
  const cellGap = 4;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.foreground,
    },
    legend: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    legendLabel: {
      fontSize: 10,
      color: colors.muted,
      marginRight: 8,
    },
    legendCell: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },
    gridContainer: {
      flexDirection: "row",
      gap: cellGap,
    },
    weekColumn: {
      gap: cellGap,
    },
    dayCell: {
      width: cellSize,
      height: cellSize,
      borderRadius: 4,
      justifyContent: "center",
      alignItems: "center",
    },
    dayLabel: {
      fontSize: 10,
      color: colors.muted,
      textAlign: "center",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 12,
      gap: 16,
    },
    footerLabel: {
      fontSize: 10,
      color: colors.muted,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>Less</Text>
          <View
            style={[styles.legendCell, { backgroundColor: getBackgroundColor("gray") + "40" }]}
          />
          <View style={[styles.legendCell, { backgroundColor: getBackgroundColor("red") }]} />
          <View style={[styles.legendCell, { backgroundColor: getBackgroundColor("yellow") }]} />
          <View style={[styles.legendCell, { backgroundColor: getBackgroundColor("blue") }]} />
          <View style={[styles.legendCell, { backgroundColor: getBackgroundColor("green") }]} />
          <Text style={styles.legendLabel}>More</Text>
        </View>
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        {/* Day labels */}
        {showLabels && (
          <View style={{ marginRight: 4 }}>
            {weekLabels.map((label, index) => (
              <View key={index} style={{ height: cellSize + cellGap }}>
                <Text style={styles.dayLabel}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Weeks */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekColumn}>
            {week.map((day, dayIndex) => {
              const color = getColor(day.completed, day.total);
              const bgColor = getBackgroundColor(color);

              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: day.total === 0 ? `${colors.muted}30` : bgColor + "40",
                      borderWidth: day.total > 0 ? 0 : 1,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => onDayPress?.(day)}
                  activeOpacity={0.7}
                >
                  {day.total > 0 && (
                    <Text
                      style={{
                        fontSize: 8,
                        color: colors.foreground,
                        fontWeight: "600",
                      }}
                    >
                      {day.completed}/{day.total}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>
          {startDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}{" "}
          -{" "}
          {new Date(startDate.getTime() + weeksToShow * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
            },
          )}
        </Text>
      </View>
    </View>
  );
}

/**
 * Generate mock heatmap data for demonstration
 */
export function generateMockHeatmapData(days: number = 28): DayData[] {
  const data: DayData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // Generate realistic completion patterns
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseCompletion = isWeekend ? 0.3 : 0.7;
    const randomFactor = Math.random() * 0.4 - 0.2;
    const rate = Math.max(0, Math.min(1, baseCompletion + randomFactor));

    // Random total tasks between 3-10
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

export default Heatmap;
