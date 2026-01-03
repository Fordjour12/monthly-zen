import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Container } from "@/components/ui/container";
import { Ionicons } from "@expo/vector-icons";

export default function GoalsScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState({
    goal1: "",
    goal2: "",
    goal3: "",
  });

  const isNextDisabled = !goals.goal1.trim() && !goals.goal2.trim() && !goals.goal3.trim();

  const handleNext = () => {
    // In a real app, we might save these goals to a temporary store or pass them via params
    // For this MVP, we'll just navigate to the generating screen
    router.push("/onboarding/generating");
  };

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-12 pb-10" contentContainerClassName="pb-20">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-8 w-10 h-10 items-center justify-center bg-muted/20 rounded-full"
          >
            <Ionicons name="chevron-back" size={24} color="#525252" />
          </TouchableOpacity>

          <Text className="text-3xl font-bold text-foreground mb-4">
            What are your top 3 goals this month?
          </Text>
          <Text className="text-lg text-muted-foreground mb-8">
            These will help us generate a balanced plan tailored for you.
          </Text>

          <View className="gap-4">
            {[1, 2, 3].map((num) => (
              <View key={num}>
                <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 ml-1">
                  Goal {num}
                </Text>
                <View className="bg-surface rounded-2xl border border-border px-4 py-4 shadow-sm">
                  <TextInput
                    className="text-foreground text-lg"
                    placeholder={`e.g. ${num === 1 ? "Read 2 books" : num === 2 ? "Go to gym 3x/week" : "Finish project X"}`}
                    placeholderTextColor="#a3a3a3"
                    multiline
                    value={goals[`goal${num}` as keyof typeof goals]}
                    onChangeText={(text) => setGoals({ ...goals, [`goal${num}`]: text })}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View className="px-6 pb-10">
          <TouchableOpacity
            onPress={handleNext}
            disabled={isNextDisabled}
            className={`h-16 rounded-2xl items-center justify-center shadow-lg ${
              isNextDisabled ? "bg-muted" : "bg-primary shadow-primary/30"
            }`}
          >
            <Text className="text-white text-xl font-bold">Generate My Plan</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
