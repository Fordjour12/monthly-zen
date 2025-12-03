import { useState } from "react";
import { Pressable, Text, View, Modal, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Card, useThemeColor } from "heroui-native";
import { Platform } from "react-native";

export type TaskStatus = "pending" | "completed" | "skipped";

interface TaskStatusToggleProps {
  taskId: string;
  initialStatus: TaskStatus;
  onStatusChange: (taskId: string, newStatus: TaskStatus, reason?: string) => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

export function TaskStatusToggle({
  taskId,
  initialStatus,
  onStatusChange,
  disabled = false,
  size = "medium",
}: TaskStatusToggleProps) {
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  const successColor = useThemeColor("success");
  const warningColor = useThemeColor("warning");

  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-8 h-8",
    large: "w-10 h-10",
  };

  const iconSizes = {
    small: 14,
    medium: 18,
    large: 22,
  };

  const handleComplete = () => {
    if (disabled || isAnimating) return;

    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsAnimating(true);
    const newStatus: TaskStatus = "completed";
    setStatus(newStatus);
    onStatusChange(taskId, newStatus);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleSkip = () => {
    if (disabled || isAnimating) return;
    setShowSkipModal(true);
  };

  const confirmSkip = () => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    setIsAnimating(true);
    const newStatus: TaskStatus = "skipped";
    setStatus(newStatus);
    onStatusChange(taskId, newStatus, skipReason);
    setShowSkipModal(false);
    setSkipReason("");

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleUndo = () => {
    if (disabled || isAnimating) return;

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsAnimating(true);
    const newStatus: TaskStatus = "pending";
    setStatus(newStatus);
    onStatusChange(taskId, newStatus);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Ionicons
              name="checkmark-circle"
              size={iconSizes[size]}
              color={successColor}
            />
          </Animated.View>
        );
      case "skipped":
        return (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Ionicons
              name="close-circle"
              size={iconSizes[size]}
              color={warningColor}
            />
          </Animated.View>
        );
      default:
        return (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Ionicons
              name="ellipse-outline"
              size={iconSizes[size]}
              color={warningColor}
            />
          </Animated.View>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "border-success bg-success/10";
      case "skipped":
        return "border-warning bg-warning/10";
      default:
        return "border-surface bg-surface/10";
    }
  };

  return (
    <>
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={status === "pending" ? handleComplete : handleUndo}
          onLongPress={status === "pending" ? handleSkip : undefined}
          disabled={disabled}
          className={`rounded-full border-2 ${sizeClasses[size]} ${getStatusColor()} items-center justify-center ${
            disabled ? "opacity-50" : ""
          }`}
        >
          {getStatusIcon()}
        </Pressable>

        {status === "pending" && !disabled && (
          <Pressable
            onPress={handleSkip}
            className="px-2 py-1 rounded-lg bg-warning/10 border border-warning"
          >
            <Text className="text-xs text-warning font-medium">Skip</Text>
          </Pressable>
        )}

        {status !== "pending" && !disabled && (
          <Pressable
            onPress={handleUndo}
            className="px-2 py-1 rounded-lg bg-surface/10 border border-surface"
          >
            <Text className="text-xs text-foreground font-medium">Undo</Text>
          </Pressable>
        )}
      </View>

      <Modal
        visible={showSkipModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSkipModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <Card variant="secondary" className="w-full max-w-sm p-6">
            <View className="items-center mb-4">
              <Ionicons
                name="help-circle"
                size={48}
                color={warningColor}
                className="mb-3"
              />
              <Text className="text-foreground text-lg font-semibold mb-2">
                Skip Task?
              </Text>
              <Text className="text-foreground text-center text-sm">
                Why are you skipping this task? This helps improve future planning.
              </Text>
            </View>

            <TextInput
              className="w-full p-3 rounded-lg bg-surface border border-divider text-foreground mb-4"
              placeholder="Reason (optional)..."
              value={skipReason}
              onChangeText={setSkipReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowSkipModal(false)}
                className="flex-1 py-3 rounded-lg bg-surface border border-surface"
              >
                <Text className="text-foreground text-center font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmSkip}
                className="flex-1 py-3 rounded-lg bg-warning border border-warning"
              >
                <Text className="text-white text-center font-medium">Skip</Text>
              </Pressable>
            </View>
          </Card>
        </View>
      </Modal>
    </>
  );
}

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: "small" | "medium";
}

export function TaskStatusBadge({ status, size = "medium" }: TaskStatusBadgeProps) {
  const warningColor = useThemeColor("warning");
  const successColor = useThemeColor("success");


  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return {
          icon: "checkmark-circle",
          color: successColor,
          bgColor: "bg-success/10",
          borderColor: "border-success",
          text: "Completed",
        };
      case "skipped":
        return {
          icon: "close-circle",
          color: warningColor,
          bgColor: "bg-warning/10",
          borderColor: "border-warning",
          text: "Skipped",
        };
      default:
        return {
          icon: "time",
          color: warningColor,
          bgColor: "bg-surface/10",
          borderColor: "border-surface",
          text: "Pending",
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = size === "small" ? "px-2 py-1" : "px-3 py-1.5";
  const textSizeClass = size === "small" ? "text-xs" : "text-sm";

  return (
    <View className={`flex-row items-center gap-1.5 rounded-full border ${config.bgColor} ${config.borderColor} ${sizeClasses}`}>
      <Ionicons name={config.icon as any} size={size === "small" ? 12 : 14} color={config.color} />
      <Text className={`${textSizeClass} font-medium`} style={{ color: config.color }}>
        {config.text}
      </Text>
    </View>
  );
}