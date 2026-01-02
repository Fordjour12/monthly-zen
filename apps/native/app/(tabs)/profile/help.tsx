import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Container } from "@/components/ui/container";
import { useAppTheme } from "@/contexts/app-theme-context";

export default function HelpScreen() {
  const router = useRouter();
  const { isLight } = useAppTheme();

  const faqs = [
    {
      q: "How do I create a new plan?",
      a: "Navigate to the Planner tab and tap the 'Generate Plan' button to start our AI-guided process.",
    },
    {
      q: "Can I sync my calendar?",
      a: "Yes, once you confirm a monthly plan, it automatically syncs to your in-app calendar.",
    },
    {
      q: "How do I change my goals?",
      a: "Go to Profile > Goal Preferences to update what you're focusing on this month.",
    },
  ];

  return (
    <Container>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Help Center",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
              <Ionicons name="chevron-back" size={28} color={isLight ? "#000" : "#fff"} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 p-4" contentContainerClassName="pb-10">
        <Text className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</Text>

        {faqs.map((faq, i) => (
          <View key={i} className="mb-6 bg-surface p-4 rounded-2xl border border-border shadow-sm">
            <Text className="text-lg font-bold text-foreground mb-2">{faq.q}</Text>
            <Text className="text-muted-foreground leading-6">{faq.a}</Text>
          </View>
        ))}

        <View className="mt-8 items-center bg-primary/10 p-6 rounded-3xl border border-primary/20">
          <Ionicons name="mail-unread-outline" size={40} color="#3b82f6" />
          <Text className="text-xl font-bold text-foreground mt-4">Still need help?</Text>
          <Text className="text-muted-foreground text-center mt-2 mb-4">
            Our support team is available 24/7 to assist you.
          </Text>
          <TouchableOpacity className="bg-primary px-8 py-3 rounded-2xl">
            <Text className="text-white font-bold">Message Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Container>
  );
}
