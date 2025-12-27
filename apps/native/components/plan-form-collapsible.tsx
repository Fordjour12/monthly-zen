import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  useDerivedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { PlanForm, PlanFormProps } from "./plan-form";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
import { Card } from "heroui-native";

interface PlanFormCollapsibleProps extends PlanFormProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  hasPlan: boolean;
}

export function PlanFormCollapsible({
  isExpanded,
  onToggleExpand,
  hasPlan,
  ...formProps
}: PlanFormCollapsibleProps) {
  const { primary, muted, foreground } = useSemanticColors();

  // If there is no plan, the form should essentially be always visible or at least very prominent.
  // But we respect isExpanded from parent.

  // Animation value: 0 = collapsed, 1 = expanded
  const expandProgress = useDerivedValue(() => {
    return withTiming(isExpanded ? 1 : 0, { duration: 300 });
  }, [isExpanded]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      // Max height trick or just opacity/transform.
      // Since form is dynamic height, max-height is tricky. we can use overflow hidden + height auto?
      // For now, let's just animate opacity and translation, and render null if strictly 0 to save performance,
      // but to animate height we need a measured height.
      // Simpler approach: toggle visibility of content.
      opacity: expandProgress.value,
      transform: [{ translateY: interpolate(expandProgress.value, [0, 1], [-20, 0]) }],
      display: isExpanded ? "flex" : "none", // Force hide when collapsed to avoid layout issues
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      borderBottomLeftRadius: interpolate(expandProgress.value, [0, 1], [12, 0]),
      borderBottomRightRadius: interpolate(expandProgress.value, [0, 1], [12, 0]),
    };
  });

  return (
    <View className="mx-4 mb-4">
      {/* Header / Summary Card */}
      {!isExpanded && hasPlan ? (
        <TouchableOpacity
          onPress={onToggleExpand}
          className="bg-card p-4 rounded-xl shadow-sm flex-row items-center justify-between border border-border"
        >
          <View className="flex-row items-center gap-3">
            <View className="bg-primary/10 p-2 rounded-full">
              <Ionicons name="options" size={20} color={primary} />
            </View>
            <View>
              <Text className="font-semibold text-foreground">Plan Settings</Text>
              <Text className="text-xs text-muted-foreground">Tap to edit goals or regenerate</Text>
            </View>
          </View>
          <Ionicons name="chevron-down" size={20} color={muted} />
        </TouchableOpacity>
      ) : null}

      {/* Expanded Form */}
      {/* We keep it mounted but hidden if needed, or conditional. Conditional is better for list perf. */}
      {isExpanded && (
        <Animated.View style={containerStyle}>
          <View className="mb-2 flex-row justify-end">
            {hasPlan && (
              <TouchableOpacity onPress={onToggleExpand} className="p-2">
                <Text className="text-sm font-medium text-primary">Hide Settings</Text>
              </TouchableOpacity>
            )}
          </View>
          <PlanForm {...formProps} />
        </Animated.View>
      )}
    </View>
  );
}
