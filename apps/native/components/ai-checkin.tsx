import { useState } from "react";
import { Pressable, Text, View, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { Card, useThemeColor } from "heroui-native";
import { Platform } from "react-native";

export type CheckinType = "morning" | "afternoon" | "evening" | "task_reminder";

export type CheckinResponse = "yes" | "no" | "snooze" | "later";

interface AICheckinProps {
  visible: boolean;
  type: CheckinType;
  question: string;
  context?: string;
  onResponse: (response: CheckinResponse, snoozeMinutes?: number) => void;
  onDismiss: () => void;
  taskInfo?: {
    title: string;
    priority: "low" | "medium" | "high";
  };
}

export function AICheckin({
  visible,
  type,
  question,
  context,
  onResponse,
  onDismiss,
  taskInfo,
}: AICheckinProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const warningColor = useThemeColor("warning");

  const handleResponse = (response: CheckinResponse, snoozeMinutes?: number) => {
    if (isAnimating) return;

    if (Platform.OS === "ios") {
      if (response === "yes") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (response === "no") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    setIsAnimating(true);
    onResponse(response, snoozeMinutes);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const getCheckinIcon = () => {
    switch (type) {
      case "morning":
        return "sunny-outline";
      case "afternoon":
        return "time-outline";
      case "evening":
        return "moon-outline";
      case "task_reminder":
        return "notifications-outline";
      default:
        return "help-circle-outline";
    }
  };

  const getCheckinTitle = () => {
    switch (type) {
      case "morning":
        return "Morning Check-in";
      case "afternoon":
        return "Afternoon Review";
      case "evening":
        return "Evening Wrap-up";
      case "task_reminder":
        return "Task Reminder";
      default:
        return "AI Check-in";
    }
  };

  const getPriorityColor = () => {
    if (!taskInfo) return "#007AFF";
    switch (taskInfo.priority) {
      case "high":
        return "#FF6B6B";
      case "medium":
        return warningColor;
      case "low":
        return warningColor;
      default:
        return "#007AFF";
    }
  };

  const snoozeOptions = [
    { label: "5 min", minutes: 5 },
    { label: "15 min", minutes: 15 },
    { label: "30 min", minutes: 30 },
    { label: "1 hour", minutes: 60 },
    { label: "2 hours", minutes: 120 },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <Animated.View entering={SlideInDown} className="w-full max-w-sm">
          <Card variant="secondary" className="p-6">
            {/* Header */}
            <View className="items-center mb-4">
              <Animated.View entering={FadeIn} className="mb-3">
                <Ionicons
                  name={getCheckinIcon() as any}
                  size={48}
                  color={getPriorityColor()}
                />
              </Animated.View>
              <Text className="text-foreground text-lg font-semibold mb-1">
                {getCheckinTitle()}
              </Text>
              {taskInfo && (
                <View className="flex-row items-center gap-2 mb-2">
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getPriorityColor() }}
                  />
                  <Text className="text-foreground text-sm font-medium">
                    {taskInfo.title}
                  </Text>
                </View>
              )}
            </View>

            {/* Question */}
            <Text className="text-foreground text-center text-base mb-4 leading-relaxed">
              {question}
            </Text>

            {/* Context */}
            {context && (
              <Card variant="tertiary" className="p-3 mb-4">
                <Text className="text-foreground text-sm">{context}</Text>
              </Card>
            )}

            {/* Response Buttons */}
            <View className="space-y-3">
              {/* Primary Actions */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => handleResponse("yes")}
                  disabled={isAnimating}
                  className="flex-1 py-3 rounded-lg bg-success border border-success"
                >
                  <Text className="text-white text-center font-medium">Yes</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleResponse("no")}
                  disabled={isAnimating}
                  className="flex-1 py-3 rounded-lg bg-warning border border-warning"
                >
                  <Text className="text-white text-center font-medium">No</Text>
                </Pressable>
              </View>

              {/* Snooze Options */}
              <View className="space-y-2">
                <Text className="text-foreground text-sm font-medium text-center">
                  Remind me later:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2 px-4">
                    {snoozeOptions.map((option) => (
                      <Pressable
                        key={option.minutes}
                        onPress={() => handleResponse("snooze", option.minutes)}
                        disabled={isAnimating}
                        className="px-4 py-2 rounded-lg bg-surface border border-surface"
                      >
                        <Text className="text-foreground text-sm font-medium">
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Dismiss */}
              <Pressable
                onPress={() => handleResponse("later")}
                disabled={isAnimating}
                className="py-2 rounded-lg"
              >
                <Text className="text-foreground text-center text-sm">
                  Dismiss for now
                </Text>
              </Pressable>
            </View>
          </Card>
        </Animated.View>
      </View>
    </Modal>
  );
}

interface CheckinNotificationProps {
  type: CheckinType;
  message: string;
  onPress: () => void;
  onDismiss: () => void;
}

export function CheckinNotification({
  type,
  message,
  onPress,
  onDismiss,
}: CheckinNotificationProps) {
  const primaryColor = useThemeColor("foreground");

  const getNotificationIcon = () => {
    switch (type) {
      case "morning":
        return "sunny";
      case "afternoon":
        return "time";
      case "evening":
        return "moon";
      case "task_reminder":
        return "notifications";
      default:
        return "help-circle";
    }
  };

  return (
    <Animated.View entering={SlideInDown}>
      <Card variant="secondary" className="m-4 p-4">
        <View className="flex-row items-start gap-3">
          <Ionicons
            name={getNotificationIcon() as any}
            size={20}
            color={primaryColor}
            className="mt-1"
          />
          <View className="flex-1">
            <Text className="text-foreground text-sm font-medium mb-1">
              AI Check-in
            </Text>
            <Text className="text-foreground text-sm mb-3">
              {message}
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={onPress}
                className="px-3 py-1.5 rounded-lg bg-secondary border border-secondary"
              >
                <Text className="text-white text-xs font-medium">View</Text>
              </Pressable>
              <Pressable
                onPress={onDismiss}
                className="px-3 py-1.5 rounded-lg bg-surface border border-surface"
              >
                <Text className="text-foreground text-xs font-medium">Dismiss</Text>
              </Pressable>
            </View>
          </View>
          <Pressable onPress={onDismiss} className="p-1">
            <Ionicons name="close" size={16} color={primaryColor} />
          </Pressable>
        </View>
      </Card>
    </Animated.View>
  );
}

interface CheckinHistoryProps {
  checkins: Array<{
    id: string;
    type: CheckinType;
    question: string;
    response: CheckinResponse;
    timestamp: Date;
    taskTitle?: string;
  }>;
}

export function CheckinHistory({ checkins }: CheckinHistoryProps) {
  const successColor = useThemeColor("success");
  const warningColor = useThemeColor("warning");

  const getCheckinIcon = (type: CheckinType) => {
    switch (type) {
      case "morning":
        return "sunny-outline";
      case "afternoon":
        return "time-outline";
      case "evening":
        return "moon-outline";
      case "task_reminder":
        return "notifications-outline";
      default:
        return "help-circle-outline";
    }
  };

  const getResponseIcon = (response: CheckinResponse) => {
    switch (response) {
      case "yes":
        return "checkmark-circle";
      case "no":
        return "close-circle";
      case "snooze":
        return "time";
      case "later":
        return "forward";
      default:
        return "help-circle";
    }
  };

  const getResponseColor = (response: CheckinResponse) => {
    switch (response) {
      case "yes":
        return successColor;
      case "no":
        return warningColor;
      case "snooze":
        return warningColor;
      case "later":
        return warningColor;
      default:
        return warningColor;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card variant="secondary" className="p-4">
      <Text className="text-foreground text-lg font-semibold mb-4">
        Recent Check-ins
      </Text>
      
      {checkins.length === 0 ? (
        <View className="items-center py-8">
          <Ionicons name="chatbubble-outline" size={48} color={warningColor} />
          <Text className="text-foreground text-center mt-3">
            No check-ins yet. AI will start checking in with you soon!
          </Text>
        </View>
      ) : (
        <ScrollView className="max-h-64" showsVerticalScrollIndicator={false}>
          <View className="space-y-3">
            {checkins.map((checkin) => (
              <Card key={checkin.id} variant="tertiary" className="p-3">
                <View className="flex-row items-start gap-3">
                  <Ionicons
                    name={getCheckinIcon(checkin.type) as any}
                    size={16}
                    color={warningColor}
                    className="mt-1"
                  />
                  <View className="flex-1">
                    <Text className="text-foreground text-sm font-medium mb-1">
                      {checkin.question}
                    </Text>
                    {checkin.taskTitle && (
                      <Text className="text-muted-foreground text-xs mb-2">
                        Task: {checkin.taskTitle}
                      </Text>
                    )}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1">
                        <Ionicons
                          name={getResponseIcon(checkin.response) as any}
                          size={14}
                          color={getResponseColor(checkin.response)}
                        />
                        <Text 
                          className="text-xs font-medium capitalize"
                          style={{ color: getResponseColor(checkin.response) }}
                        >
                          {checkin.response}
                        </Text>
                      </View>
                      <Text className="text-foreground text-xs">
                        {formatDate(checkin.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </ScrollView>
      )}
    </Card>
  );
}