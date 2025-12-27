/**
 * Task Stats Component (Native)
 *
 * Displays summary statistics for tasks in a horizontal card layout.
 */

import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";

interface TaskStatsProps {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  isLoading?: boolean;
}

export function TaskStats({
  total,
  completed,
  pending,
  completionRate,
  isLoading,
}: TaskStatsProps) {
  const { primary, muted } = useSemanticColors();

  const stats = [
    {
      label: "Total",
      value: total,
      icon: "list" as const,
      color: "text-foreground",
    },
    {
      label: "Done",
      value: completed,
      icon: "checkmark-circle" as const,
      color: "text-accent",
    },
    {
      label: "Left",
      value: pending,
      icon: "ellipse-outline" as const,
      color: "text-muted-foreground",
    },
    {
      label: "Rate",
      value: `${completionRate}%`,
      icon: "trending-up" as const,
      color:
        completionRate >= 70
          ? "text-green-500"
          : completionRate >= 40
            ? "text-yellow-500"
            : "text-muted-foreground",
    },
  ];

  return (
    <View className="flex-row gap-2 px-4 py-2">
      {stats.map((stat) => (
        <View key={stat.label} className="flex-1 bg-surface p-3 rounded-lg items-center">
          <Ionicons
            name={stat.icon}
            size={18}
            color={stat.icon === "checkmark-circle" ? primary : muted}
          />
          <Text className={`text-lg font-bold mt-1 ${stat.color} ${isLoading ? "opacity-50" : ""}`}>
            {isLoading ? "—" : stat.value}
          </Text>
          <Text className="text-xs text-muted-foreground">{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}
