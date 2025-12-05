import { useState } from "react";
import {
   View,
   Text,
   TextInput,
   Pressable,
   ScrollView,
   ActivityIndicator,
} from "react-native";
import { Container } from "@/components/container";
import { Card, useThemeColor } from "heroui-native";
import { orpc } from "@/utils/orpc";

interface StreamProgress {
   type: "progress" | "complete" | "error";
   stage?: string;
   message: string;
   context?: any;
   suggestionId?: string;
   content?: string;
   isRecent?: boolean;
}

export default function Three() {
   const [userGoals, setUserGoals] = useState(
      "I want to learn React Native development, exercise 3 times per week, read 2 technical books, and improve my TypeScript skills. I also want to build a mobile app portfolio project and maintain a healthy work-life balance."
   );
   const [workHours, setWorkHours] = useState("9 AM - 5 PM, Monday to Friday");
   const [energyPatterns, setEnergyPatterns] = useState("High energy in morning (9-12), moderate after lunch (2-4), low energy in evening");
   const [preferredTimes, setPreferredTimes] = useState("Deep work in morning, exercise at 6 PM, reading before bed");
   const [isLoading, setIsLoading] = useState(false);
   const [streamData, setStreamData] = useState<StreamProgress[]>([]);
   const [finalPlan, setFinalPlan] = useState<string | null>(null);
   const [error, setError] = useState<string | null>(null);

   const mutedColor = useThemeColor("muted");
   const foregroundColor = useThemeColor("foreground");

   const handleGeneratePlan = async () => {
      console.log("🚀 Starting plan generation");
      console.log("Input data:", {
         userGoals: userGoals.trim(),
         workHours: workHours.trim() || undefined,
         energyPatterns: energyPatterns.trim() || undefined,
         preferredTimes: preferredTimes.trim() || undefined,
      });

      if (!userGoals.trim() || userGoals.length < 10) {
         console.log("❌ Validation failed: goals too short");
         setError("Please provide more detailed goals (at least 10 characters)");
         return;
      }

      setIsLoading(true);
      setError(null);
      setStreamData([]);
      setFinalPlan(null);

      try {
         console.log("📡 Calling generatePlanStream API...");
         const stream = await orpc.AI.generatePlanStream.call({
            userGoals: userGoals.trim(),
            workHours: workHours.trim() || undefined,
            energyPatterns: energyPatterns.trim() || undefined,
            preferredTimes: preferredTimes.trim() || undefined,
         });

         console.log("📡 Stream created, starting to process chunks...");
         let chunkCount = 0;

         for await (const chunk of stream) {
            chunkCount++;
            console.log(`📦 Chunk ${chunkCount}:`, chunk);

            setStreamData((prev) => {
               const newData = [...prev, chunk as StreamProgress];
               console.log(`📊 Stream data length: ${newData.length}`);
               return newData;
            });

            if (chunk.type === "complete") {
               console.log("✅ Stream completed successfully");
               console.log("Final plan content:", (chunk as any).content);
               setFinalPlan((chunk as any).content || null);
            } else if (chunk.type === "error") {
               console.log("❌ Stream error:", chunk.message);
               setError(chunk.message);
            }
         }

         console.log(`🏁 Finished processing ${chunkCount} chunks`);
      } catch (err) {
         console.error("💥 Error in generatePlan:", err);
         setError(err instanceof Error ? err.message : "Failed to generate plan");
      } finally {
         console.log("🔚 Generation process finished");
         setIsLoading(false);
      }
   };

   const getStageIcon = (stage?: string) => {
      switch (stage) {
         case "validation":
            return "🔍";
         case "checking":
            return "📋";
         case "context":
            return "📊";
         case "generating":
            return "🤖";
         case "saving":
            return "💾";
         default:
            return "⏳";
      }
   };

   return (
      <Container className="p-6">
         <ScrollView showsVerticalScrollIndicator={false}>
            <Card variant="secondary" className="mb-6 p-4">
               <Card.Title className="mb-4 text-2xl">AI Monthly Plan Generator</Card.Title>
               <Text className="text-foreground mb-4">
                  Get a personalized monthly plan based on your goals and current commitments
               </Text>

               {error && (
                  <View className="mb-4 p-3 bg-danger/10 rounded-lg">
                     <Text className="text-danger text-sm">{error}</Text>
                  </View>
               )}

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
                  onPress={handleGeneratePlan}
                  disabled={isLoading || !userGoals.trim()}
                  className="bg-accent p-4 rounded-lg flex-row justify-center items-center active:opacity-70 disabled:opacity-50"
               >
                  {isLoading ? (
                     <ActivityIndicator size="small" color={foregroundColor} />
                  ) : (
                     <Text className="text-foreground font-medium text-center">
                        Generate Monthly Plan
                     </Text>
                  )}
               </Pressable>
            </Card>

            {(streamData.length > 0 || finalPlan) && (
               <Card variant="secondary" className="p-4">
                  <Card.Title className="mb-4">Generation Progress</Card.Title>

                  {streamData.map((chunk, index) => (
                     <View key={index} className="mb-3 p-3 bg-surface/50 rounded-lg">
                        <View className="flex-row items-center mb-1">
                           <Text className="text-lg mr-2">{getStageIcon(chunk.stage)}</Text>
                           <Text className="text-foreground font-medium capitalize">
                              {chunk.stage || "Processing"}
                           </Text>
                        </View>
                        <Text className="text-muted-foreground text-sm">{chunk.message}</Text>
                        {chunk.context && (
                           <View className="mt-2 p-2 bg-surface rounded">
                              <Text className="text-xs text-muted-foreground">
                                 Context: {JSON.stringify(chunk.context, null, 2)}
                              </Text>
                           </View>
                        )}
                     </View>
                  ))}

                  {finalPlan && (
                     <View className="mt-4 p-4 bg-accent/10 rounded-lg">
                        <Text className="text-foreground font-medium mb-2">📋 Your Monthly Plan</Text>
                        <Text className="text-foreground whitespace-pre-wrap">{finalPlan}</Text>
                     </View>
                  )}
               </Card>
            )}
         </ScrollView>
      </Container>
   );
}
