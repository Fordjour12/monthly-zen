import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Button } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
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
  const { foreground } = useSemanticColors();

  if (!isVisible) return null;

  return (
    <Animated.View
      entering={FadeInUp.springify()}
      exiting={FadeOutDown.springify()}
      className="absolute bottom-6 left-4 right-4 flex-row gap-3 shadow-xl z-50"
      style={styles.container}
    >
      <View className="flex-1">
        <Button
          onPress={onDiscard}
          variant="ghost"
          className="w-full flex-row items-center justify-center h-12 rounded-2xl bg-danger backdrop-blur-md"
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Button.Label className="text-destructive font-semibold">Discard</Button.Label>
        </Button>
      </View>

      <View className="flex-1">
        <Button
          onPress={onSave}
          isDisabled={isSaving}
          className="w-full flex-row items-center justify-center h-12 rounded-2xl shadow-lg bg-accent"
        >
          {isSaving ? (
            <Ionicons name="sync" size={20} color={foreground} className="animate-spin" />
          ) : (
            <>
              <Ionicons
                name="save-outline"
                size={20}
                color={foreground}
                style={{ marginRight: 8 }}
              />
              <Button.Label className="text-foreground font-semibold">Save Plan</Button.Label>
            </>
          )}
        </Button>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
