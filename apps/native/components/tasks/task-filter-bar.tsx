import React from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Search01Icon, Cancel01Icon, Sorting01Icon, FilterIcon } from "@hugeicons/core-free-icons";
import type { TaskFilters, TaskStatus, DifficultyLevel } from "@/hooks/useTasks";
import Animated, { FadeInUp } from "react-native-reanimated";

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
  { value: "pending", label: "Open" },
  { value: "completed", label: "Fixed" },
];

export function TaskFilterBar({ filters, onUpdateFilter, onToggleSort }: TaskFilterBarProps) {
  return (
    <View className="gap-y-4">
      {/* Search Input */}
      <View className="flex-row items-center bg-surface border border-border/50 rounded-2xl px-4 py-1">
        <HugeiconsIcon icon={Search01Icon} size={20} color="var(--muted-foreground)" />
        <TextInput
          placeholder="Filter system feed..."
          placeholderTextColor="var(--muted-foreground)"
          value={filters.search || ""}
          onChangeText={(text) => onUpdateFilter("search", text || undefined)}
          className="flex-1 p-3 font-sans text-foreground"
        />
        {filters.search && (
          <TouchableOpacity onPress={() => onUpdateFilter("search", undefined)}>
            <HugeiconsIcon icon={Cancel01Icon} size={18} color="var(--muted-foreground)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Controls */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
        <View className="flex-row gap-x-2">
          {/* Status Selectors */}
          {statusOptions.map((opt) => {
            const active = filters.status === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onUpdateFilter("status", opt.value)}
                className={`px-6 py-3 rounded-2xl border ${
                  active ? "bg-foreground border-foreground" : "bg-surface border-border/50"
                }`}
              >
                <Text
                  className={`text-[10px] font-sans-bold uppercase tracking-widest ${
                    active ? "text-background" : "text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View className="w-[1px] h-6 bg-border/30 self-center mx-1" />

          {/* Sort Switch */}
          <TouchableOpacity
            onPress={onToggleSort}
            className="px-4 py-3 rounded-2xl bg-surface border border-border/50 flex-row items-center gap-x-2"
          >
            <HugeiconsIcon
              icon={Sorting01Icon}
              size={14}
              color="var(--muted-foreground)"
              style={{ transform: [{ scaleY: filters.sortOrder === "desc" ? -1 : 1 }] }}
            />
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
              {filters.sortOrder === "asc" ? "Asc" : "Desc"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
