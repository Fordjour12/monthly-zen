import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  iconColor?: string;
  actionLabel: string;
  actionIcon?: string;
  onAction: () => void;
  iconBackgroundColor?: string;
}

export function EmptyState({
  title,
  description,
  icon = "document-text-outline",
  iconColor = "#6b7280",
  actionLabel,
  actionIcon = "sparkles",
  onAction,
  iconBackgroundColor = "bg-muted",
}: EmptyStateProps) {
  return (
    <View className="flex-1 justify-center items-center p-6">
      <View
        className={`w-16 h-16 ${iconBackgroundColor} rounded-full items-center justify-center mb-4`}
      >
        <Ionicons name={icon as any} size={32} color={iconColor} />
      </View>
      <Text className="text-xl font-semibold mb-2 text-foreground text-center">{title}</Text>
      <Text className="text-muted-foreground text-center mb-6">{description}</Text>
      <Button onPress={onAction} variant="primary" className="rounded-none">
        {actionIcon && <Ionicons name={actionIcon as any} size={20} color="white" />}
        <Text className="text-white font-bold ml-2">{actionLabel}</Text>
      </Button>
    </View>
  );
}
