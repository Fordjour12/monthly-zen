import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  HelpCircleIcon,
  AiMagicIcon,
  Mail01Icon,
  MessageQuestionIcon,
  Search01Icon,
  CircleIcon,
  FlashIcon,
  Target02Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { Container } from "@/components/ui/container";
import { useSemanticColors } from "@/utils/theme";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const faqs = [
  {
    q: "How to deploy a blueprint?",
    a: "Direct your workspace to the Planner tab and select the 'Generate Blueprint' signal. Our AI will analyze your neural inputs to create a synced monthly architecture.",
    icon: FlashIcon,
  },
  {
    q: "Neural connectivity status?",
    a: "Your blueprint automatically syncs across all nodes. Once confirmed, your system timeline will reflect your active operations and rituals.",
    icon: AiMagicIcon,
  },
  {
    q: "Modifying core directives?",
    a: "Access the Identifier Profile through Settings to update your baseline goals and system preferences at any time.",
    icon: Target02Icon,
  },
];

export default function HelpScreen() {
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
            Support Uplink
          </Text>
          <Text className="text-3xl font-sans-bold text-foreground">Knowledge Base</Text>
        </Animated.View>

        <View className="px-4 gap-y-6">
          {faqs.map((faq, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(200 + i * 100).duration(600)}
              className="bg-surface p-6 rounded-[32px] border border-border/50 shadow-sm"
            >
              <View className="flex-row items-center gap-x-3 mb-4">
                <View className="w-10 h-10 rounded-2xl bg-muted/5 items-center justify-center border border-border/30">
                  <HugeiconsIcon icon={faq.icon} size={20} color="var(--foreground)" />
                </View>
                <Text className="flex-1 text-lg font-sans-bold text-foreground leading-6">
                  {faq.q}
                </Text>
              </View>
              <Text className="text-base font-sans text-muted-foreground leading-7 opacity-80">
                {faq.a}
              </Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View
          entering={FadeInUp.delay(500).duration(600)}
          className="mx-4 mt-12 p-8 bg-foreground rounded-[40px] shadow-xl shadow-black/20 overflow-hidden relative"
        >
          {/* Decorative background */}
          <View className="absolute -right-20 -bottom-20 w-60 h-60 bg-white/5 rounded-full" />
          <View className="absolute -left-10 -top-10 w-24 h-24 bg-white/5 rounded-full" />

          <View className="items-center">
            <View className="w-16 h-16 rounded-[22px] bg-white/10 items-center justify-center border border-white/20 mb-6">
              <HugeiconsIcon icon={Mail01Icon} size={28} color="white" />
            </View>
            <Text className="text-2xl font-sans-bold text-white mb-3">Direct Uplink</Text>
            <Text className="text-sm font-sans text-white/70 text-center mb-8 leading-6 px-4">
              Our neural support specialists are available 24/7 for baseline assistance.
            </Text>
            <TouchableOpacity
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              className="bg-accent h-16 w-full rounded-2xl items-center justify-center flex-row gap-x-3 shadow-lg shadow-accent/20"
            >
              <Text className="text-white font-sans-bold text-lg">Initialize Message</Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View className="mt-12 items-center">
          <View className="bg-surface px-4 py-2 rounded-xl border border-border/50 flex-row items-center gap-x-2">
            <HugeiconsIcon icon={Search01Icon} size={12} color="var(--muted-foreground)" />
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest leading-4">
              Global Search Active
            </Text>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
