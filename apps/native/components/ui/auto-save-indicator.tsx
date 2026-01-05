import { View, Text } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  useEffect,
} from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  CloudIcon,
  Tick01Icon,
  AlertCircleIcon,
  RefreshIcon,
  CloudSavingDoneIcon,
} from "@hugeicons/core-free-icons";

interface AutoSaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
  draftKey?: string;
  className?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function AutoSaveIndicator({ status, draftKey, className }: AutoSaveIndicatorProps) {
  if (status === "idle") return null;

  const opacity = useSharedValue(1);

  useEffect(() => {
    if (status === "saving") {
      opacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        true,
      );
    } else {
      opacity.value = withTiming(1);
    }
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const config = {
    saving: {
      bg: "bg-accent/10",
      border: "border-accent/20",
      text: "text-accent",
      icon: RefreshIcon,
      label: "Syncing synaptic draft...",
    },
    saved: {
      bg: "bg-success/10",
      border: "border-success/20",
      text: "text-success",
      icon: CloudSavingDoneIcon,
      label: "Draft uploaded to cloud",
    },
    error: {
      bg: "bg-danger/10",
      border: "border-danger/20",
      text: "text-danger",
      icon: AlertCircleIcon,
      label: "Transmission interrupted",
    },
  }[status];

  if (!config) return null;

  return (
    <AnimatedView
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(400)}
      style={animatedStyle}
      className={`inline-flex items-center gap-x-2.5 rounded-full px-4 py-2 flex-row border ${config.bg} ${config.border} ${className}`}
    >
      <HugeiconsIcon icon={config.icon} size={14} color={`var(--${status})`} />
      <Text className={`text-[10px] font-sans-bold uppercase tracking-widest ${config.text}`}>
        {config.label}
      </Text>
      {status === "saved" && draftKey && (
        <Text className="text-[10px] font-mono text-success/50 ml-1">
          #{draftKey.slice(-6).toUpperCase()}
        </Text>
      )}
    </AnimatedView>
  );
}

export function AutoSaveIndicatorCompact({ status }: Pick<AutoSaveIndicatorProps, "status">) {
  if (status === "idle") return null;

  const config = {
    saving: { icon: RefreshIcon, color: "var(--accent)", label: "Syncing" },
    saved: { icon: Tick01Icon, color: "var(--success)", label: "Saved" },
    error: { icon: AlertCircleIcon, color: "var(--danger)", label: "Error" },
  }[status];

  if (!config) return null;

  return (
    <AnimatedView
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(400)}
      className="flex-row items-center gap-x-1.5"
    >
      <HugeiconsIcon icon={config.icon} size={12} color={config.color} />
      <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
        {config.label}
      </Text>
    </AnimatedView>
  );
}
