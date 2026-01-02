import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Container } from "@/components/ui/container";
import { useAppTheme } from "@/contexts/app-theme-context";

export default function TermsScreen() {
  const router = useRouter();
  const { isLight } = useAppTheme();

  return (
    <Container>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Legal",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
              <Ionicons name="chevron-back" size={28} color={isLight ? "#000" : "#fff"} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 p-4" contentContainerClassName="pb-10">
        <Text className="text-2xl font-bold text-foreground mb-4">Terms of Service</Text>
        <Text className="text-muted-foreground leading-6 mb-8">
          Welcome to Monthly Zen. By using our application, you agree to our terms. We provide
          AI-assisted planning tools to help you manage your monthly goals. Please use our services
          responsibly. We reserve the right to modify these terms at any time.
        </Text>

        <Text className="text-2xl font-bold text-foreground mb-4">Privacy Policy</Text>
        <Text className="text-muted-foreground leading-6">
          Your privacy is important to us. Monthly Zen collects minimal data required to personalize
          your experience. We never sell your personal information to third parties. All AI
          interactions are processed securely to ensure your planning data remains private.
        </Text>

        <View className="mt-12 pt-8 border-t border-border items-center">
          <Text className="text-sm text-muted-foreground">Last Updated: January 2026</Text>
        </View>
      </ScrollView>
    </Container>
  );
}
