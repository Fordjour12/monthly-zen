import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Shield01Icon,
  DocumentTextIcon,
  CircleIcon,
  LicenseIcon,
  FingerprintIcon,
  SecurityIcon,
} from "@hugeicons/core-free-icons";
import { Container } from "@/components/ui/container";
import { useSemanticColors } from "@/utils/theme";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

export default function TermsScreen() {
  const router = useRouter();
  const colors = useSemanticColors();

  return (
    <Container className="bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTitle: "",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                router.back();
              }}
              className="ml-4 w-10 h-10 rounded-full bg-surface border border-border/50 items-center justify-center"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="var(--foreground)" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <Animated.View entering={FadeInUp.duration(600)} className="px-6 mb-10 mt-4">
          <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-[3px] mb-1">
            Regulatory Framework
          </Text>
          <Text className="text-3xl font-sans-bold text-foreground">Terms & Privacy</Text>
        </Animated.View>

        <View className="px-6 gap-y-12">
          {/* Terms Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <View className="flex-row items-center gap-x-3 mb-6">
              <View className="w-10 h-10 rounded-2xl bg-muted/5 items-center justify-center border border-border/30">
                <HugeiconsIcon icon={LicenseIcon} size={20} color="var(--foreground)" />
              </View>
              <Text className="text-2xl font-sans-bold text-foreground">Usage Protocol</Text>
            </View>
            <View className="bg-surface/50 p-6 rounded-[32px] border border-border/30">
              <Text className="text-base font-sans text-muted-foreground leading-7 opacity-80 mb-6">
                By entering the Monthly Zen neural environment, you authorize the use of AI
                algorithms to process your monthly objectives. Our tools are designed for personal
                optimization and baseline management.
              </Text>
              <Text className="text-base font-sans text-muted-foreground leading-7 opacity-80">
                Protocols may be updated as system intelligence evolves. Users will be notified of
                major architectural changes through standard telemetry.
              </Text>
            </View>
          </Animated.View>

          {/* Privacy Section */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <View className="flex-row items-center gap-x-3 mb-6">
              <View className="w-10 h-10 rounded-2xl bg-muted/5 items-center justify-center border border-border/30">
                <HugeiconsIcon icon={Shield01Icon} size={20} color="var(--foreground)" />
              </View>
              <Text className="text-2xl font-sans-bold text-foreground">Neural Security</Text>
            </View>
            <View className="bg-surface/50 p-6 rounded-[32px] border border-border/30">
              <Text className="text-base font-sans text-muted-foreground leading-7 opacity-80 mb-6">
                Your data is cryptographically protected within our neural cloud. We maintain a
                zero-leak policy: your objectives, rituals, and AI interactions are never
                transmitted to unauthorized third-party nodes.
              </Text>
              <View className="flex-row items-start gap-x-3 p-4 bg-muted/5 rounded-2xl border border-border/10">
                <HugeiconsIcon icon={FingerprintIcon} size={16} color="var(--muted-foreground)" />
                <Text className="flex-1 text-xs font-sans text-muted-foreground/60 italic leading-4">
                  End-to-end encryption active. Local processing preferred where architecturally
                  possible.
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(600).duration(600)}
            className="items-center py-10"
          >
            <View className="bg-surface px-4 py-2 rounded-xl border border-border/50">
              <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest leading-4">
                Updated: January 2026 • Node 0.1
              </Text>
            </View>
            <Text className="text-[9px] font-sans-bold text-muted-foreground/40 mt-3 uppercase tracking-widest">
              Digital Signature Required for Continued Access
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </Container>
  );
}
