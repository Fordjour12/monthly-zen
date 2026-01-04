import React from "react";
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  CheckmarkCircle01Icon,
  Delete02Icon,
  CleanIcon,
  SparklesIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

interface FloatingActionBarProps {
  isVisible: boolean;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
}

export function FloatingActionBar({
  isVisible,
  onSave,
  onDiscard,
  isSaving,
}: FloatingActionBarProps) {
  if (!isVisible) return null;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15)}
      exiting={FadeOutDown.springify()}
      className="absolute bottom-10 left-6 right-6 flex-row gap-x-4 z-50"
    >
      <TouchableOpacity
        onPress={onDiscard}
        activeOpacity={0.9}
        className="flex-1 h-14 rounded-[22px] bg-danger/10 border border-danger/20 backdrop-blur-xl flex-row items-center justify-center gap-x-2"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={20} color="var(--danger)" />
        <Text className="text-danger font-sans-bold uppercase tracking-widest text-[10px]">
          Discard
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSave}
        disabled={isSaving}
        activeOpacity={0.9}
        className="flex-[2] h-14 rounded-[22px] bg-foreground shadow-xl shadow-black/20 flex-row items-center justify-center gap-x-3"
      >
        {isSaving ? (
          <ActivityIndicator color="var(--background)" size="small" />
        ) : (
          <>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} color="var(--background)" />
            <Text className="text-background font-sans-bold text-base">Confirm Blueprint</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
