import { useState } from "react";
import {
   View,
   Text,
   TextInput,
   Pressable,
   ScrollView,
   ActivityIndicator,
   Animated,
   Alert,
} from "react-native";
import { Container } from "@/components/container";
import { Card, useThemeColor } from "heroui-native";
import { orpc } from "@/utils/orpc";
import { useMutation } from "@tanstack/react-query";
import { onSuccess } from "@orpc/client";

export default function Plan() {
   const [userGoals, setUserGoals] = useState(
      "I want to learn React Native development, exercise 3 times per week, read 2 technical books, and improve my TypeScript skills. I also want to build a mobile app portfolio project and maintain a healthy work-life balance."
   );
   const [workHours, setWorkHours] = useState("9 AM - 5 PM, Monday to Friday");
   const [energyPatterns, setEnergyPatterns] = useState("High energy in morning (9-12), moderate after lunch (2-4), low energy in evening");
   const [preferredTimes, setPreferredTimes] = useState("Deep work in morning, exercise at 6 PM, reading before bed");

   const mutedColor = useThemeColor("muted");
   const fullContext = `${userGoals.trim()}\n\nWork Hours: ${workHours.trim() || "Not specified"}\nEnergy Patterns: ${energyPatterns.trim() || "Not specified"}\nPreferred Times: ${preferredTimes.trim() || "Not specified"}`;

   const generatePlanMutation = useMutation({
      mutationFn: async () => {
         const result = await orpc.AI.generatePlan.call({
            userGoals:fullContext,
         });
      }
   });

   return (
      <Container className="p-2">
         <ScrollView showsVerticalScrollIndicator={false}>


            <Text className="text-foreground font-medium mb-2">Your Goals *</Text>
            <TextInput
               className="mb-4 py-3 px-4 rounded-lg bg-surface text-foreground border border-divider"
               placeholder="Describe your goals for this month (e.g., Learn React Native, Exercise 3x per week, Read 2 books)"
               value={userGoals}
               onChangeText={setUserGoals}
               placeholderTextColor={mutedColor}
               multiline
               numberOfLines={3}
               textAlignVertical="top"
            />

            <Text className="text-foreground font-medium mb-2">Work Hours (optional)</Text>
            <TextInput
               className="mb-4 py-3 px-4 rounded-lg bg-surface text-foreground border border-divider"
               placeholder="e.g., 9 AM - 5 PM, Monday to Friday"
               value={workHours}
               onChangeText={setWorkHours}
               placeholderTextColor={mutedColor}
            />

            <Text className="text-foreground font-medium mb-2">Energy Patterns (optional)</Text>
            <TextInput
               className="mb-4 py-3 px-4 rounded-lg bg-surface text-foreground border border-divider"
               placeholder="e.g., High energy in morning, low after lunch"
               value={energyPatterns}
               onChangeText={setEnergyPatterns}
               placeholderTextColor={mutedColor}
            />

            <Text className="text-foreground font-medium mb-2">Preferred Times (optional)</Text>
            <TextInput
               className="mb-6 py-3 px-4 rounded-lg bg-surface text-foreground border border-divider"
               placeholder="e.g., Deep work in morning, exercise in evening"
               value={preferredTimes}
               onChangeText={setPreferredTimes}
               placeholderTextColor={mutedColor}
            />

            <Pressable
               onPress={() => { generatePlanMutation.mutate() }}
               className={`p-4 rounded-lg flex-row justify-center items-center active:opacity-70 disabled:opacity-50 `}
            >
               <Text className="text-white font-medium text-center">
                  Generate Month Plan
               </Text>
            </Pressable>

            {generatePlanMutation.isPending && (
               <ActivityIndicator />
            )}
            {generatePlanMutation.data?.content && (
               <Text className="text-foreground font-medium mt-4">
                  {generatePlanMutation.data.content}
               </Text>
            )}
         </ScrollView>
      </Container>
   );
}
