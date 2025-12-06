import { useState } from "react";
import {
   View,
   Text,
   TextInput,
   Pressable,
   ScrollView,
   ActivityIndicator,
   Animated,
} from "react-native";
import { useEffect, useRef } from "react";
import { Container } from "@/components/container";
import { Card, useThemeColor } from "heroui-native";
import { useGeneratePlan } from "@/hooks/use-local-cache";
import { MonthlyPlanViewer } from "@/lib/monthly-plan";
import { checkPlanGenerationLimit, consumePlanGeneration, getTimeUntilReset } from "@/lib/rate-limiter";

export default function Plan() {
   const [userGoals, setUserGoals] = useState(
      "I want to learn React Native development, exercise 3 times per week, read 2 technical books, and improve my TypeScript skills. I also want to build a mobile app portfolio project and maintain a healthy work-life balance."
   );
   const [workHours, setWorkHours] = useState("9 AM - 5 PM, Monday to Friday");
   const [energyPatterns, setEnergyPatterns] = useState("High energy in morning (9-12), moderate after lunch (2-4), low energy in evening");
   const [preferredTimes, setPreferredTimes] = useState("Deep work in morning, exercise at 6 PM, reading before bed");
   const [finalPlan, setFinalPlan] = useState<any | null>(null);
   const [error, setError] = useState<string | null>(null);
   const [currentStage, setCurrentStage] = useState<{ stage?: string; message: string } | null>(null);
   const [isGenerating, setIsGenerating] = useState(false);
   const [rateLimitStatus, setRateLimitStatus] = useState(checkPlanGenerationLimit());

   const fadeAnim = useRef(new Animated.Value(0)).current;
   const generatePlanMutation = useGeneratePlan();

   // Update rate limit status periodically
   useEffect(() => {
      const interval = setInterval(() => {
         setRateLimitStatus(checkPlanGenerationLimit());
      }, 1000); // Update every second

      return () => clearInterval(interval);
   }, []);

   // Initial fade-in
   useEffect(() => {
      if (currentStage) {
         Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
         }).start();
      }
   }, [currentStage]);

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

      // Check rate limit first
      const currentRateLimit = checkPlanGenerationLimit();
      if (currentRateLimit.isLimited) {
         setError(`Rate limit reached. Please wait ${getTimeUntilReset()} before generating another plan.`);
         return;
      }

      if (!userGoals.trim() || userGoals.length < 10) {
         console.log("❌ Validation failed: goals too short");
         setError("Please provide more detailed goals (at least 10 characters)");
         return;
      }

      // Consume a generation
      if (!consumePlanGeneration()) {
         setError(`Rate limit reached. Please wait ${getTimeUntilReset()} before generating another plan.`);
         setRateLimitStatus(checkPlanGenerationLimit());
         return;
      }

      // Update rate limit status after consumption
      setRateLimitStatus(checkPlanGenerationLimit());

      setError(null);
      setFinalPlan(null);
      setCurrentStage(null);
      setIsGenerating(true);

      const fullContext = `${userGoals.trim()}\n\nWork Hours: ${workHours.trim() || "Not specified"}\nEnergy Patterns: ${energyPatterns.trim() || "Not specified"}\nPreferred Times: ${preferredTimes.trim() || "Not specified"}`;

      generatePlanMutation.mutate(
         {
            userGoals: fullContext,
            onProgress: (stage: string, message: string) => {
               console.log(`📊 Progress: ${stage} - ${message}`);

               // Fade out, update stage, then fade in
               Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 150,
                  useNativeDriver: true,
               }).start(() => {
                  setCurrentStage({ stage, message });
                  Animated.timing(fadeAnim, {
                     toValue: 1,
                     duration: 300,
                     useNativeDriver: true,
                  }).start();
               });
            }
         },
         {
            onSuccess: (result: any) => {
               console.log("✅ Plan generation successful:", result);
               if (result.success && result.data) {
                  try {
                     // Try to parse as JSON first
                     const parsedData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
                     setFinalPlan(parsedData);
                     setCurrentStage({ stage: "complete", message: "Plan generated successfully!" });
                  } catch (error) {
                     console.log("⚠️ Could not parse as JSON, treating as plain text");
                     // If parsing fails, treat as plain text
                     setFinalPlan({ monthly_summary: result.data });
                     setCurrentStage({ stage: "complete", message: "Plan generated successfully!" });
                  }
               } else {
                  setError(result.error || "Failed to generate plan");
                  setCurrentStage({ stage: "error", message: "Failed to generate plan" });
                  setIsGenerating(false);
               }
            },
            onError: (error: any) => {
               console.error("💥 Error in generatePlan:", error);
               setError(error.message || "Failed to generate plan");
               setCurrentStage({ stage: "error", message: "Failed to generate plan" });
               setIsGenerating(false);
            }
         }
      );
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
         case "complete":
            return "✅";
         case "error":
            return "❌";
         default:
            return "⏳";
      }
   };

   const getStageProgress = (stage?: string) => {
      const stages = ["validation", "checking", "context", "generating", "saving", "complete"];
      const currentIndex = stages.indexOf(stage || "");
      return currentIndex >= 0 ? ((currentIndex + 1) / stages.length) * 100 : 0;
   };

   const formatDateRange = () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
      const monthYear = today.toLocaleDateString('en-US', options);

      return monthYear;
   };

   return (
      <Container className="p-2">
         <ScrollView showsVerticalScrollIndicator={false}>
            {!isGenerating && (
               <Card variant="secondary" className="mb-6 p-4">
                  <Card.Title className="mb-4 text-2xl">AI Monthly Plan Generator</Card.Title>
                  <Text className="text-foreground mb-2">
                     {formatDateRange()}
                  </Text>
                  <Text className="text-foreground mb-4">
                     Get a personalized monthly plan based on your goals and current commitments
                  </Text>

                  {error && (
                     <View className="mb-4 p-3 bg-danger/10 rounded-lg">
                        <Text className="text-danger text-sm">{error}</Text>
                     </View>
                  )}

                  {/* Rate Limit Status */}
                  <View className="mb-4 p-3 bg-surface/50 rounded-lg">
                     <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-orange-300 text-sm font-medium">Generations Remaining</Text>
                        <Text className="text-orange-300 text-sm">
                           {rateLimitStatus.remaining} / {rateLimitStatus.limit}
                        </Text>
                     </View>
                     <View className="h-2 bg-surface rounded-full overflow-hidden mb-2">
                        <View
                           className={`h-full rounded-full ${
                              rateLimitStatus.isLimited ? 'bg-red-500' : 'bg-orange-500'
                           }`}
                           style={{ width: `${(rateLimitStatus.remaining / rateLimitStatus.limit) * 100}%` }}
                        />
                     </View>
                     {rateLimitStatus.isLimited && (
                        <Text className="text-red-500 text-xs text-center">
                           Rate limited. Resets in {getTimeUntilReset()}
                        </Text>
                     )}
                  </View>

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
                     disabled={generatePlanMutation.isPending || !userGoals.trim() || rateLimitStatus.isLimited}
                     className={`p-4 rounded-lg flex-row justify-center items-center active:opacity-70 disabled:opacity-50 ${
                        rateLimitStatus.isLimited ? 'bg-red-500/20' : 'bg-orange-500'
                     }`}
                  >
                     {generatePlanMutation.isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                     ) : rateLimitStatus.isLimited ? (
                        <Text className="text-red-600 font-medium text-center">
                           Rate Limited ({getTimeUntilReset()})
                        </Text>
                     ) : (
                        <Text className="text-white font-medium text-center">
                           Generate Monthly Plan ({rateLimitStatus.remaining} left)
                        </Text>
                     )}
                  </Pressable>
               </Card>
            )}

            {(currentStage || generatePlanMutation.isPending || finalPlan) && (
               <Card className="p-2">
                  <Card.Title className="mb-4">
                     {generatePlanMutation.isPending ? "Generating Your Plan..." :
                        finalPlan ? `${formatDateRange()} Plan` : "Generation Progress"}
                  </Card.Title>

                  {/* Current Stage Display */}
                  {currentStage && (
                     <Animated.View
                        className="mb-4 p-4 bg-surface/50 rounded-lg"
                        style={{ opacity: fadeAnim }}
                     >
{/* Progress Bar */}
                         <View className="mb-3">
                            <View className="flex-row justify-between items-center mb-2">
                               <Text className="text-xs text-orange-600">Progress</Text>
                               <Text className="text-xs text-orange-600">
                                  {Math.round(getStageProgress(currentStage.stage))}%
                               </Text>
                            </View>
                            <View className="h-2 bg-surface rounded-full overflow-hidden">
                               <Animated.View
                                  className="h-full bg-orange-500 rounded-full"
                                  style={{
                                     width: `${getStageProgress(currentStage.stage)}%`,
                                     backgroundColor: currentStage.stage === 'error' ? '#ef4444' : undefined
                                  }}
                               />
                            </View>
                         </View>

<View className="flex-row items-center mb-3">
                            <Text className="text-2xl mr-3">{getStageIcon(currentStage.stage)}</Text>
                            <View className="flex-1">
                               <Text className="text-orange-600 font-medium text-lg capitalize">
                                  {currentStage.stage || "Processing"}
                               </Text>
                               <Text className="text-orange-500 text-sm mt-1">
                                  {currentStage.message}
                               </Text>
                            </View>
                            {generatePlanMutation.isPending && (
                               <ActivityIndicator size="small" color="#ea580c" />
                            )}
                         </View>
                     </Animated.View>
                  )}

                  {/* Display the generated plan */}
                  {finalPlan && (
                     <MonthlyPlanViewer data={finalPlan} />
                  )}

                  {finalPlan && (
                     <View className="mt-4">
                        <Pressable
                           onPress={() => {
                              setIsGenerating(false);
                              setFinalPlan(null);
                              setCurrentStage(null);
                           }}
                           className="bg-surface p-3 rounded-lg flex-row justify-center items-center active:opacity-70"
                        >
                           <Text className="text-foreground font-medium">
                              ← Generate New Plan
                           </Text>
                        </Pressable>
                     </View>
                  )}
               </Card>
            )}

         </ScrollView>
      </Container>
   );
}
