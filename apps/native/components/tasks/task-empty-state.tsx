import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Task01Icon,
  Search01Icon,
  SparklesIcon,
  FilterIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";

interface TaskEmptyStateProps {
  hasFilters: boolean;
  onResetFilters: () => void;
}

export function TaskEmptyState({ hasFilters, onResetFilters }: TaskEmptyStateProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(600)}
      className="flex-1 items-center justify-center p-8 mt-12"
    >
      <View className="w-20 h-20 bg-muted/5 rounded-full items-center justify-center mb-8">
        <HugeiconsIcon
          icon={hasFilters ? Search01Icon : Task01Icon}
          size={40}
          color="var(--muted-foreground)"
        />
      </View>

      <Text className="text-2xl font-sans-bold text-foreground mb-3 text-center">
        {hasFilters ? "No matches found" : "Void of Tasks"}
      </Text>

      <Text className="text-base font-sans text-muted-foreground text-center mb-10 leading-6 max-w-[280px]">
        {hasFilters
          ? "We couldn't find any tasks matching your current system filters."
          : "Your timeline is currently empty. Start by designing your next monthly blueprint."}
      </Text>

      {hasFilters ? (
        <TouchableOpacity
          onPress={onResetFilters}
          activeOpacity={0.8}
          className="flex-row items-center gap-x-3 px-8 py-4 bg-surface border border-border/50 rounded-2xl shadow-sm"
        >
          <HugeiconsIcon icon={RefreshIcon} size={18} color="var(--foreground)" />
          <Text className="text-sm font-sans-bold text-foreground uppercase tracking-widest">
            Reset System
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => router.push("/planners/create")}
          activeOpacity={0.8}
          className="flex-row items-center gap-x-3 px-10 py-4 bg-accent rounded-2xl shadow-lg shadow-accent/20"
        >
          <HugeiconsIcon icon={SparklesIcon} size={18} color="white" />
          <Text className="text-sm font-sans-bold text-white uppercase tracking-widest">
            Generate Blueprint
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
