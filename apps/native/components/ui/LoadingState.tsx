import React from "react";
import { View, Text } from "react-native";
import { Container } from "./container";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { AiMagicIcon } from "@hugeicons/core-free-icons";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  useEffect,
  FadeIn,
} from "react-native-reanimated";

interface LoadingStateProps {
  message?: string;
  subtitle?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Syncing Neural Data",
  subtitle = "Optimizing your monthly vision...",
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0.5, { duration: 1500 })),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 1.5 }],
    opacity: (1 - (scale.value - 1) * 5) * 0.2,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 2 }],
    opacity: (1 - (scale.value - 1) * 3) * 0.1,
  }));

  return (
    <Container withScroll={false} className="bg-background items-center justify-center">
      <Animated.View entering={FadeIn.duration(800)} className="items-center">
        <View className="relative items-center justify-center w-32 h-32 mb-12">
          <Animated.View
            className="absolute w-32 h-32 rounded-[48px] border-2 border-accent"
            style={ring2Style}
          />
          <Animated.View
            className="absolute w-24 h-24 rounded-[36px] border-2 border-accent"
            style={ring1Style}
          />
          <Animated.View
            className="w-20 h-20 rounded-[32px] bg-foreground items-center justify-center shadow-2xl shadow-black/20"
            style={animatedStyle}
          >
            <HugeiconsIcon icon={AiMagicIcon} size={32} color="var(--background)" />
          </Animated.View>
        </View>

        <Text className="text-sm font-sans-bold text-foreground uppercase tracking-[4px] mb-3">
          {message}
        </Text>
        <Text className="text-sm font-sans text-muted-foreground opacity-60">{subtitle}</Text>
      </Animated.View>
    </Container>
  );
};
