import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Dimensions, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Container } from "@/components/ui/container";
import { useAuthStore } from "@/stores/auth-store";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  MagicWand01Icon,
  Calendar01Icon,
  ArrowRight01Icon,
  ChartLineData01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "heroui-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useSemanticColors } from "@/utils/theme";

const { width, height } = Dimensions.get("window");

const AnimatedView = Animated.View;

/**
 * Premium onboarding welcome screen for Monthly Zen.
 * Uses Tailwind CSS via uniwind and semantic tokens from global.css.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useSemanticColors();
  const { completeOnboarding } = useAuthStore();

  // Animation values
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);

  // Background blob animations
  const blob1TranslateX = useSharedValue(0);
  const blob1TranslateY = useSharedValue(0);
  const blob2TranslateX = useSharedValue(0);
  const blob2TranslateY = useSharedValue(0);

  useEffect(() => {
    // Logo animation
    logoScale.value = withSpring(1, { damping: 12 });
    logoOpacity.value = withTiming(1, { duration: 800 });

    // Content animation
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    contentTranslateY.value = withDelay(400, withSpring(0, { damping: 15 }));

    // Continuous background movement
    blob1TranslateX.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    blob1TranslateY.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    blob2TranslateX.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    blob2TranslateY.value = withRepeat(
      withSequence(
        withTiming(40, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);

  const handleSkip = () => {
    completeOnboarding();
    router.replace("/(tabs)");
  };

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const blob1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: blob1TranslateX.value }, { translateY: blob1TranslateY.value }],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: blob2TranslateX.value }, { translateY: blob2TranslateY.value }],
  }));

  return (
    <Container className="bg-background">
      {/* Background Decorative Elements */}
      <View className="absolute inset-0 overflow-hidden pointer-events-none">
        <AnimatedView
          style={[blob1Style]}
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/10"
        />
        <AnimatedView
          style={[blob2Style]}
          className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-accent/5"
        />
      </View>

      <View className="flex-1 px-8 pt-16 pb-12 justify-between min-h-screen">
        <View>
          {/* Logo Section */}
          <AnimatedView style={logoAnimatedStyle} className="items-center mb-10">
            <View className="size-24 rounded-3xl bg-accent items-center justify-center shadow-2xl shadow-accent/40 rotate-12">
              <View className="-rotate-12">
                <Image
                  source={require("../../../assets/images/android-icon-foreground.png")}
                  className="size-24"
                />
              </View>
            </View>
          </AnimatedView>

          {/* Heading Section */}
          <AnimatedView style={contentAnimatedStyle} className="mb-12">
            <Text className="text-5xl font-sans-bold text-foreground mb-4 tracking-tight">
              Monthly Zen
            </Text>
            <Text className="text-xl font-sans text-muted-foreground leading-8">
              AI-powered planning designed for clarity, peace of mind, and meaningful progress.
            </Text>
          </AnimatedView>

          {/* Features Grid */}
          <AnimatedView style={contentAnimatedStyle} className="gap-y-6">
            <FeatureItem
              icon={MagicWand01Icon}
              title="AI Intelligence"
              description="Smart task extraction and prioritization."
            />
            <FeatureItem
              icon={Calendar01Icon}
              title="Deep Focus"
              description="Organize your life around what matters most."
            />
            <FeatureItem
              icon={ChartLineData01Icon}
              title="Progress Tracking"
              description="Visualize your growth over time."
            />
          </AnimatedView>
        </View>

        {/* Action Button Section */}
        <AnimatedView style={contentAnimatedStyle} className="gap-y-4">
          <Button
            size="lg"
            className="h-16 rounded-2xl"
            onPress={() => router.push("/onboarding/goals")}
          >
            <View className="flex-row items-center justify-center gap-x-2">
              <Text className="text-lg font-sans-semibold text-primary-foreground">
                Get Started
              </Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={colors.background} />
            </View>
          </Button>

          <Pressable onPress={handleSkip} className="py-2 items-center">
            <Text className="text-muted-foreground font-sans-medium">I know what I'm doing</Text>
          </Pressable>
        </AnimatedView>
      </View>
    </Container>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  const colors = useSemanticColors();

  return (
    <View className="flex-row items-center gap-x-4">
      <View className="size-12 rounded-2xl bg-surface items-center justify-center border border-border/50">
        <HugeiconsIcon icon={icon} size={24} color={colors.accent} strokeWidth={1.5} />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-sans-semibold text-foreground">{title}</Text>
        <Text className="text-sm font-sans text-muted-foreground">{description}</Text>
      </View>
    </View>
  );
}
