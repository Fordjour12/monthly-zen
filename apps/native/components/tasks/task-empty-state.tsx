/**
 * Task Empty State Component (Native)
 *
 * Displayed when no tasks match the current filters.
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
import { router } from "expo-router";

interface TaskEmptyStateProps {
  hasFilters: boolean;
  onResetFilters: () => void;
}

export function TaskEmptyState({ hasFilters, onResetFilters }: TaskEmptyStateProps) {
  const { primary } = useSemanticColors();

  return (
    <View className="flex-1 items-center justify-center p-8">
      <View className="w-16 h-16 bg-accent/10 rounded-2xl items-center justify-center mb-6">
        <Ionicons name="list" size={32} color={primary} />
      </View>

      {hasFilters ? (
        <>
          <Text className="text-lg font-semibold text-foreground mb-2">No tasks found</Text>
          <Text className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
            No tasks match your current filters. Try adjusting your search criteria or clearing the
            filters.
          </Text>
          <TouchableOpacity
            onPress={onResetFilters}
            className="flex-row items-center px-4 py-2 bg-surface border border-border rounded-lg"
          >
            <Ionicons name="refresh" size={16} color={primary} />
            <Text className="text-sm text-foreground ml-2">Reset Filters</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text className="text-lg font-semibold text-foreground mb-2">No tasks yet</Text>
          <Text className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
            Generate your first AI-powered monthly plan to start tracking your tasks and goals.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/plan")}
            className="flex-row items-center px-4 py-2 bg-accent rounded-lg"
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text className="text-sm text-accent-foreground ml-2">Create Your First Plan</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
