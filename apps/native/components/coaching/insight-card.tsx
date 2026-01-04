import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Card } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  AiMagicIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Clock01Icon,
  SparklesIcon,
  AlertCircleIcon,
  Analytics01Icon,
  Compass01Icon,
  WorkErrorIcon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

interface InsightCardProps {
  insight: {
    id: number;
    title: string;
    description: string;
    category: string | null;
    priority: string | null;
    confidence: string | null;
    suggestedAction: string | null;
    reasoning: string | null;
  };
  onDismiss?: (action?: string) => void;
  onApply?: () => void;
  index: number;
}

export function InsightCard({ insight, onDismiss, onApply, index }: InsightCardProps) {
  const getCategoryInfo = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case "burnout":
        return { color: "#ef4444", icon: WorkErrorIcon, label: "Burnout Risk" };
      case "productivity":
        return { color: "#3b82f6", icon: Analytics01Icon, label: "Productivity" };
      case "scheduling":
        return { color: "#8b5cf6", icon: Compass01Icon, label: "Scheduling" };
      case "alignment":
        return { color: "#22c55e", icon: SparklesIcon, label: "Alignment" };
      default:
        return { color: "#6b7280", icon: AiMagicIcon, label: "General" };
    }
  };

  const info = getCategoryInfo(insight.category);

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
      <Card className="mb-6 border-none bg-surface/50 rounded-[32px] overflow-hidden">
        <View className="p-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-x-3">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${info.color}15` }}
              >
                <HugeiconsIcon icon={info.icon} size={20} color={info.color} />
              </View>
              <View>
                <Text className="text-lg font-sans-bold text-foreground">{insight.title}</Text>
                <View className="flex-row items-center gap-x-1.5">
                  <View
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: info.color }}
                  />
                  <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                    {info.label} • {insight.confidence}% MATCH
                  </Text>
                </View>
              </View>
            </View>
            {insight.priority === "high" && (
              <View className="bg-danger/10 px-2 py-0.5 rounded-lg flex-row items-center gap-x-1">
                <HugeiconsIcon icon={AlertCircleIcon} size={10} color="var(--danger)" />
                <Text className="text-[9px] font-sans-bold text-danger uppercase">Priority</Text>
              </View>
            )}
          </View>

          <Text className="text-base font-sans text-muted-foreground leading-6 mb-5">
            {insight.description}
          </Text>

          {insight.suggestedAction && (
            <View className="bg-accent/5 border border-accent/10 rounded-2xl p-4 mb-6">
              <View className="flex-row items-center gap-x-2 mb-2">
                <HugeiconsIcon icon={AiMagicIcon} size={14} color="var(--accent)" />
                <Text className="text-[10px] font-sans-bold text-accent uppercase tracking-widest">
                  AI Strategy
                </Text>
              </View>
              <Text className="text-sm font-sans-semibold text-foreground leading-5">
                {insight.suggestedAction}
              </Text>
            </View>
          )}

          {insight.reasoning && (
            <View className="flex-row items-center gap-x-2 mb-6 opacity-60">
              <HugeiconsIcon icon={Compass01Icon} size={12} color="var(--muted-foreground)" />
              <Text className="text-[11px] font-sans text-muted-foreground italic">
                {insight.reasoning}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View className="flex-row gap-x-3">
            <TouchableOpacity
              onPress={onApply}
              activeOpacity={0.8}
              className="flex-1 h-12 rounded-2xl bg-foreground items-center justify-center flex-row gap-x-2 shadow-lg shadow-black/10"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color="var(--background)" />
              <Text className="text-background font-sans-bold">Apply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDismiss?.("dismissed")}
              activeOpacity={0.7}
              className="w-12 h-12 rounded-2xl bg-surface border border-border/50 items-center justify-center"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} color="var(--muted-foreground)" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDismiss?.("snoozed")}
              activeOpacity={0.7}
              className="w-12 h-12 rounded-2xl bg-surface border border-border/50 items-center justify-center"
            >
              <HugeiconsIcon icon={Clock01Icon} size={18} color="var(--muted-foreground)" />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}
