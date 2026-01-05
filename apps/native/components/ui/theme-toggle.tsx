import { HugeiconsIcon } from "@hugeicons/react-native";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import * as Haptics from "expo-haptics";
import { Platform, Pressable } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";
import { useAppTheme } from "@/contexts/app-theme-context";
import { useSemanticColors } from "@/utils/theme";

export function ThemeToggle() {
  const { toggleTheme, isLight } = useAppTheme();
  const colors = useSemanticColors();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleTheme();
      }}
      className="p-2 w-10 h-10 rounded-xl bg-surface border border-border/50 items-center justify-center"
    >
      {isLight ? (
        <Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
          <HugeiconsIcon icon={Moon02Icon} size={20} color="var(--foreground)" />
        </Animated.View>
      ) : (
        <Animated.View key="sun" entering={ZoomIn} exiting={FadeOut}>
          <HugeiconsIcon icon={Sun03Icon} size={20} color="var(--foreground)" />
        </Animated.View>
      )}
    </Pressable>
  );
}
