import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import Animated, { FadeIn } from "react-native-reanimated";

interface SuggestionBadgeProps {
  count?: number;
  type?: "ai" | "priority" | "insight";
  size?: "small" | "medium" | "large";
  onPress?: () => void;
  showPulse?: boolean;
}

export function SuggestionBadge({
  count = 0,
  type = "ai",
  size = "small",
  onPress,
  showPulse = false,
}: SuggestionBadgeProps) {
  const warningColor = useThemeColor("warning");

  const getBadgeColors = () => {
    switch (type) {
      case "ai":
        return {
          background: "#FF6B6B",
          text: "#FFFFFF",
          icon: "#FFFFFF",
        };
      case "priority":
        return {
          background: warningColor,
          text: "#FFFFFF",
          icon: "#FFFFFF",
        };
      case "insight":
        return {
          background: "#007AFF",
          text: "#FFFFFF",
          icon: "#FFFFFF",
        };
      default:
        return {
          background: "#FF6B6B",
          text: "#FFFFFF",
          icon: "#FFFFFF",
        };
    }
  };

  const getIconName = () => {
    switch (type) {
      case "ai":
        return "sparkles";
      case "priority":
        return "flag";
      case "insight":
        return "bulb";
      default:
        return "sparkles";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          container: {
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 8,
            minHeight: 20,
          },
          text: {
            fontSize: 10,
            fontWeight: "600" as const,
          },
          icon: {
            size: 10,
          },
        };
      case "medium":
        return {
          container: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 10,
            minHeight: 24,
          },
          text: {
            fontSize: 12,
            fontWeight: "600" as const,
          },
          icon: {
            size: 12,
          },
        };
      case "large":
        return {
          container: {
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 12,
            minHeight: 28,
          },
          text: {
            fontSize: 14,
            fontWeight: "600" as const,
          },
          icon: {
            size: 14,
          },
        };
      default:
        return {
          container: {
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 8,
            minHeight: 20,
          },
          text: {
            fontSize: 10,
            fontWeight: "600" as const,
          },
          icon: {
            size: 10,
          },
        };
    }
  };

  const colors = getBadgeColors();
  const sizeStyles = getSizeStyles();

  const BadgeContent = () => (
    <View
      className="flex-row items-center gap-1"
      style={[
        sizeStyles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <Ionicons
        name={getIconName() as any}
        size={sizeStyles.icon.size}
        color={colors.icon}
      />
      {count > 0 && (
        <Text
          style={[
            sizeStyles.text,
            {
              color: colors.text,
            },
          ]}
        >
          {count > 99 ? "99+" : count}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-80">
        {showPulse ? (
          <Animated.View entering={FadeIn} className="self-start">
            <BadgeContent />
          </Animated.View>
        ) : (
          <BadgeContent />
        )}
      </Pressable>
    );
  }

  if (showPulse) {
    return (
      <Animated.View entering={FadeIn} className="self-start">
        <BadgeContent />
      </Animated.View>
    );
  }

  return <BadgeContent />;
}

// Simplified version for inline use
export function MiniSuggestionBadge({
  hasSuggestion = false,
  onPress,
}: {
  hasSuggestion?: boolean;
  onPress?: () => void;
}) {
  if (!hasSuggestion) return null;

  return (
    <SuggestionBadge
      count={1}
      type="ai"
      size="small"
      onPress={onPress}
      showPulse={true}
    />
  );
}