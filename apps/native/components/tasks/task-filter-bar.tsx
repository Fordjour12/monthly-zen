/**
 * Task Filter Bar Component (Native)
 *
 * Horizontal scrollable filter controls for the task dashboard.
 */

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
import type { TaskFilters, TaskStatus, DifficultyLevel } from "@/hooks/useTasks";

interface TaskFilterBarProps {
  filters: TaskFilters;
  focusAreas: string[];
  onUpdateFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  onResetFilters: () => void;
  onToggleSort: () => void;
  onAddTask?: () => void;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Done" },
];

const difficultyOptions: { value: DifficultyLevel | "all"; label: string }[] = [
  { value: "all", label: "All Levels" },
  { value: "simple", label: "Simple" },
  { value: "moderate", label: "Moderate" },
  { value: "advanced", label: "Advanced" },
];

export function TaskFilterBar({
  filters,
  onUpdateFilter,
  onToggleSort,
  onAddTask,
}: TaskFilterBarProps) {
  const { muted, foreground, primary } = useSemanticColors();

  return (
    <View className="bg-card border-b border-border">
      {/* Search Bar */}
      <View className="px-4 py-2">
        <View className="flex-row items-center bg-surface rounded-lg px-3 py-2">
          <Ionicons name="search" size={16} color={muted} />
          <TextInput
            placeholder="Search tasks..."
            placeholderTextColor={muted}
            value={filters.search || ""}
            onChangeText={(text) => onUpdateFilter("search", text || undefined)}
            className="flex-1 ml-2 text-foreground text-sm"
            style={{ color: foreground }}
          />
          {filters.search && (
            <TouchableOpacity onPress={() => onUpdateFilter("search", undefined)}>
              <Ionicons name="close-circle" size={18} color={muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
      >
        {statusOptions.map((option) => {
          const isActive = filters.status === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onUpdateFilter("status", option.value)}
              className={`px-4 py-1.5 mr-2 rounded-full ${isActive ? "bg-accent" : "bg-surface"}`}
            >
              <Text
                className={`text-sm font-medium ${
                  isActive ? "text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Separator */}
        <View className="w-px bg-border mx-2 my-1" />

        {/* Difficulty Chips */}
        {difficultyOptions.map((option) => {
          const isActive =
            option.value === "all"
              ? !filters.difficultyLevel
              : filters.difficultyLevel === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() =>
                onUpdateFilter("difficultyLevel", option.value === "all" ? undefined : option.value)
              }
              className={`px-3 py-1.5 mr-2 rounded-full border ${
                isActive ? "border-accent bg-accent/10" : "border-border bg-surface"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  isActive ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Sort Toggle */}
        <TouchableOpacity
          onPress={onToggleSort}
          className="flex-row items-center px-3 py-1.5 rounded-full bg-surface border border-border"
        >
          <Ionicons name="swap-vertical" size={14} color={muted} />
          <Text className="text-xs text-muted-foreground ml-1">
            {filters.sortOrder === "asc" ? "Asc" : "Desc"}
          </Text>
        </TouchableOpacity>

        {/* Add Task Button */}
        {onAddTask && (
          <TouchableOpacity
            onPress={onAddTask}
            className="flex-row items-center px-3 py-1.5 rounded-full bg-primary"
          >
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-xs text-white font-medium ml-1">Add</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
