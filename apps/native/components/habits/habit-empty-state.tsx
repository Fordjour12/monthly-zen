/**
 * Habit Empty State Component
 *
 * Displays when no habits exist
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";

interface HabitEmptyStateProps {
  onCreateHabit: () => void;
}

export function HabitEmptyState({ onCreateHabit }: HabitEmptyStateProps) {
  const { primary } = useSemanticColors();

  return (
    <View className="flex-1 items-center justify-center py-12 px-6">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: `${primary}15` }}
      >
        <Ionicons name="leaf-outline" size={40} color={primary} />
      </View>
      <Text className="text-xl font-bold text-foreground mb-2">No habits yet</Text>
      <Text className="text-sm text-muted text-center mb-6">
        Start building better habits by creating your first one. Small steps lead to big changes!
      </Text>
      <TouchableOpacity
        onPress={onCreateHabit}
        className="flex-row items-center gap-2 px-6 py-3 rounded-xl bg-primary"
      >
        <Ionicons name="add" size={20} color="white" />
        <Text className="text-base font-semibold text-white">Create Your First Habit</Text>
      </TouchableOpacity>
    </View>
  );
}
