import React from "react";
import { View, Text } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  AiMagicIcon,
  Tick01Icon,
  AlertCircleIcon,
  SparklesIcon,
  PulseIcon,
  Search01Icon,
  DatabaseIcon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInUp, FadeInDown, LinearTransition } from "react-native-reanimated";

interface ParsingStatusProps {
  isLoading: boolean;
  error?: string;
  confidence?: number;
  detectedFormat?: string;
}

export function ParsingStatus({
  isLoading,
  error,
  confidence,
  detectedFormat,
}: ParsingStatusProps) {
  if (isLoading) {
    return (
      <Animated.View
        entering={FadeInUp}
        className="bg-surface rounded-3xl border border-border/50 p-6 overflow-hidden"
      >
        <View className="flex-row items-center gap-x-3 mb-6">
          <View className="w-10 h-10 rounded-2xl bg-accent/10 items-center justify-center">
            <HugeiconsIcon icon={PulseIcon} size={20} color="var(--accent)" />
          </View>
          <View>
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-1">
              Neural Engine
            </Text>
            <Text className="text-base font-sans-bold text-foreground tracking-tight">
              Structuring Objectives...
            </Text>
          </View>
        </View>

        <View className="h-2 bg-muted/20 rounded-full overflow-hidden mb-8">
          <Animated.View entering={FadeInDown} className="h-full bg-accent w-[65%]" />
        </View>

        <View className="flex-row flex-wrap gap-4">
          <StatusMetric icon={Search01Icon} label="JSON Scan" active />
          <StatusMetric icon={DatabaseIcon} label="Patterns" active />
          <StatusMetric icon={Tick01Icon} label="Validation" />
        </View>
      </Animated.View>
    );
  }

  if (error) {
    return (
      <Animated.View
        entering={FadeInUp}
        className="bg-danger/5 rounded-3xl border border-danger/20 p-6"
      >
        <View className="flex-row items-center gap-x-3 mb-4">
          <View className="w-10 h-10 rounded-2xl bg-danger/10 items-center justify-center">
            <HugeiconsIcon icon={AlertCircleIcon} size={20} color="var(--danger)" />
          </View>
          <Text className="text-base font-sans-bold text-danger tracking-tight">
            Synaptic Error
          </Text>
        </View>
        <Text className="text-sm font-sans text-muted-foreground leading-6 mb-2">{error}</Text>
        <Text className="text-[10px] font-sans-bold text-danger uppercase tracking-widest opacity-60">
          Try Regeneration Protocol
        </Text>
      </Animated.View>
    );
  }

  if (confidence && detectedFormat) {
    const isHigh = confidence >= 85;
    return (
      <Animated.View
        layout={LinearTransition}
        entering={FadeInUp}
        className="bg-surface rounded-3xl border border-border/50 p-6"
      >
        <View className="flex-row items-center gap-x-3 mb-6">
          <View className="w-10 h-10 rounded-2xl bg-success/10 items-center justify-center">
            <HugeiconsIcon icon={Tick01Icon} size={20} color="var(--success)" />
          </View>
          <View>
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-1">
              Architect Confirmed
            </Text>
            <Text className="text-base font-sans-bold text-foreground tracking-tight">
              Sync Optimized
            </Text>
          </View>
        </View>

        <View className="gap-y-4">
          <ResultRow
            icon={SparklesIcon}
            label="Neural Confidence"
            value={`${confidence}%`}
            color={isHigh ? "success" : "warning"}
          />
          <ResultRow
            icon={AiMagicIcon}
            label="Detected Architecture"
            value={detectedFormat.toUpperCase()}
            color="accent"
          />
        </View>
      </Animated.View>
    );
  }

  return null;
}

function StatusMetric({ icon, label, active }: { icon: any; label: string; active?: boolean }) {
  return (
    <View className="flex-row items-center gap-x-2">
      <View className={`w-2 h-2 rounded-full ${active ? "bg-accent" : "bg-muted/30"}`} />
      <Text
        className={`text-[10px] font-sans-bold uppercase tracking-widest ${active ? "text-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </Text>
    </View>
  );
}

function ResultRow({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-x-3">
        <HugeiconsIcon icon={icon} size={14} color="var(--muted-foreground)" />
        <Text className="text-sm font-sans-medium text-muted-foreground">{label}</Text>
      </View>
      <View className={`px-4 py-1.5 rounded-full bg-${color}/10`}>
        <Text className={`text-[10px] font-sans-bold text-${color} uppercase tracking-widest`}>
          {value}
        </Text>
      </View>
    </View>
  );
}
