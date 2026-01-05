import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  SparklesIcon,
  Target01Icon,
  Search01Icon,
  Note01Icon,
  CloudIcon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: any;
  actionLabel?: string;
  actionIcon?: any;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = Note01Icon,
  actionLabel,
  actionIcon = SparklesIcon,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={`flex-1 justify-center items-center p-8 ${className}`}>
      <Animated.View
        entering={FadeInUp.duration(800)}
        className="w-24 h-24 rounded-[40px] bg-muted/5 items-center justify-center mb-8 border border-border/10"
      >
        <View className="w-16 h-16 rounded-[28px] bg-muted/10 items-center justify-center border border-border/20">
          <HugeiconsIcon icon={icon} size={32} color="var(--muted-foreground)" />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(600)} className="items-center">
        <Text className="text-xl font-sans-bold text-foreground text-center mb-2 tracking-tight">
          {title}
        </Text>
        <Text className="text-base font-sans text-muted-foreground text-center leading-7 opacity-70 mb-10 max-w-[280px]">
          {description}
        </Text>
      </Animated.View>

      {actionLabel && (
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          className="w-full max-w-[240px]"
        >
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAction?.();
            }}
            className="bg-foreground h-16 rounded-[24px] flex-row items-center justify-center gap-x-3 shadow-xl shadow-black/20"
          >
            <HugeiconsIcon icon={actionIcon} size={20} color="var(--background)" />
            <Text className="text-sm font-sans-bold text-background uppercase tracking-widest">
              {actionLabel}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}
