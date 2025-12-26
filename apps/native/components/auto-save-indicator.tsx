import { View, Text } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

interface AutoSaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
  draftKey?: string;
  className?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function AutoSaveIndicator({ status, draftKey }: AutoSaveIndicatorProps) {
  if (status === "idle") return null;

  return (
    <AnimatedView
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 flex-row ${
        status === "saving"
          ? "bg-blue-500/10 border border-blue-500/20"
          : status === "saved"
            ? "bg-green-500/10 border border-green-500/20"
            : "bg-red-500/10 border border-red-500/20"
      }`}
    >
      {status === "saving" && (
        <>
          <Ionicons name="sync" size={16} className="animate-spin" />
          <Text className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Auto-saving draft...
          </Text>
        </>
      )}

      {status === "saved" && (
        <>
          <Ionicons name="checkmark-circle" size={16} className="text-green-600" />
          <Text className="text-sm font-medium text-green-700 dark:text-green-300">
            Auto-saved as draft
          </Text>
          {draftKey && (
            <Text className="text-xs opacity-60 font-mono text-green-700 dark:text-green-300">
              {draftKey.slice(-8)}
            </Text>
          )}
        </>
      )}

      {status === "error" && (
        <>
          <Ionicons name="close-circle" size={16} />
          <Text className="text-sm font-medium text-red-700 dark:text-red-300">
            Failed to save draft
          </Text>
        </>
      )}
    </AnimatedView>
  );
}

export function AutoSaveIndicatorCompact({ status }: Pick<AutoSaveIndicatorProps, "status">) {
  if (status === "idle") return null;

  return (
    <AnimatedView
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      className="inline-flex items-center gap-1.5 flex-row"
    >
      {status === "saving" && (
        <>
          <Ionicons name="sync" size={12} className="animate-spin text-foreground" />
          <Text className="text-xs text-foreground">Saving...</Text>
        </>
      )}
      {status === "saved" && (
        <>
          <Ionicons name="checkmark-circle" size={12} className="text-green-600" />
          <Text className="text-xs text-green-600">Saved</Text>
        </>
      )}
    </AnimatedView>
  );
}
