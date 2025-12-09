import { useState, useEffect, useRef } from "react";
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
import { useGeneratePlan } from "@/hooks/use-local-cache";
import { MonthlyPlanViewer } from "@/lib/monthly-plan";
import { checkPlanGenerationLimit, consumePlanGeneration, getTimeUntilReset } from "@/lib/rate-limiter";
import { useRouter } from "expo-router";
import { orpc } from "@/utils/orpc";

export default function Plan() {
   // Form state
   const [userGoals, setUserGoals] = useState(
      "I want to learn React Native development, exercise 3 times per week, read 2 technical books, and improve my TypeScript skills. I also want to build a mobile app portfolio project and maintain a healthy work-life balance."
   );
   const [workHours, setWorkHours] = useState("9 AM - 5 PM, Monday to Friday");
   const [energyPatterns, setEnergyPatterns] = useState("High energy in morning (9-12), moderate after lunch (2-4), low energy in evening");
   const [preferredTimes, setPreferredTimes] = useState("Deep work in morning, exercise at 6 PM, reading before bed");

   // Plan state
   const [finalPlan, setFinalPlan] = useState<any | null>(null);
   const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
   const [error, setError] = useState<string | null>(null);
   const [currentStage, setCurrentStage] = useState<{ stage?: string; message: string } | null>(null);
   const [isGenerating, setIsGenerating] = useState(false);
   const [isApplying, setIsApplying] = useState(false);

   // Rate limit state
   const [rateLimitStatus, setRateLimitStatus] = useState(checkPlanGenerationLimit());

   // Hooks
   const router = useRouter();
   const fadeAnim = useRef(new Animated.Value(0)).current;
   const generatePlanMutation = useGeneratePlan();
   const mutedColor = useThemeColor("muted");

   // Update rate limit status periodically
   useEffect(() => {
      const interval = setInterval(() => {
         setRateLimitStatus(checkPlanGenerationLimit());
      }, 1000);
      return () => clearInterval(interval);
   }, []);

   // Fade animation for stage updates
   useEffect(() => {
      if (currentStage) {
         Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
         }).start();
      }
   }, [currentStage]);

   const handleGeneratePlan = async () => {
      // Validate input
      if (!userGoals.trim() || userGoals.length < 10) {
         setError("Please provide more detailed goals (at least 10 characters)");
         return;
      }

      // Check rate limit
      const currentRateLimit = checkPlanGenerationLimit();
      if (currentRateLimit.isLimited) {
         setError(`Rate limit reached. Please wait ${getTimeUntilReset()} before generating another plan.`);
         return;
      }

      // Consume a generation
      if (!consumePlanGeneration()) {
         setError(`Rate limit reached. Please wait ${getTimeUntilReset()} before generating another plan.`);
         setRateLimitStatus(checkPlanGenerationLimit());
         return;
      }

      // Update rate limit status
      setRateLimitStatus(checkPlanGenerationLimit());

      // Reset state
      setError(null);
      setFinalPlan(null);
      setCurrentStage(null);
      setIsGenerating(true);

      // Build context
      const fullContext = `${userGoals.trim()}\n\nWork Hours: ${workHours.trim() || "Not specified"}\nEnergy Patterns: ${energyPatterns.trim() || "Not specified"}\nPreferred Times: ${preferredTimes.trim() || "Not specified"}`;

      generatePlanMutation.mutate(
         {
            userGoals: fullContext,
            onProgress: (stage: string, message: string) => {
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
               if (result.success && result.data) {
                  try {
                     const parsedData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
                     setFinalPlan(parsedData);
                     setCurrentPlanId(result.suggestionId || null);
                     setCurrentStage({ stage: "complete", message: "Plan generated successfully!" });
                  } catch (error) {
                     setFinalPlan({ monthly_summary: result.data });
                     setCurrentPlanId(result.suggestionId || null);
                     setCurrentStage({ stage: "complete", message: "Plan generated successfully!" });
                  }
               } else {
                  setError(result.error || "Failed to generate plan");
                  setCurrentStage({ stage: "error", message: "Failed to generate plan" });
                  setIsGenerating(false);
               }
            },
            onError: (error: any) => {
               setError(error.message || "Failed to generate plan");
               setCurrentStage({ stage: "error", message: "Failed to generate plan" });
               setIsGenerating(false);
            }
         }
      );
   };

   const handleApplyPlan = async () => {
      if (!currentPlanId) {
         Alert.alert("Error", "No plan ID available. Please regenerate the plan.");
         return;
      }

      setIsApplying(true);
      try {
         const result = await orpc.AI.applySuggestionAsItems.call({
            suggestionId: currentPlanId,
            applyAs: "auto",
         });

         Alert.alert(
            "Success",
            `Plan applied successfully! Created ${result.createdCount} items.`,
            [
               {
                  text: "View Suggestions",
                  onPress: () => router.push("/suggestion"),
               },
               {
                  text: "Generate New Plan",
                  onPress: resetPlanState,
               },
            ]
         );
      } catch (error) {
         Alert.alert(
            "Error",
            `Failed to apply plan: ${error instanceof Error ? error.message : "Unknown error"}`
         );
      } finally {
         setIsApplying(false);
      }
   };

   const resetPlanState = () => {
      setIsGenerating(false);
      setFinalPlan(null);
      setCurrentPlanId(null);
      setCurrentStage(null);
   };

   const getStageIcon = (stage?: string) => {
      const icons: Record<string, string> = {
         validation: "🔍",
         checking: "📋",
         context: "📊",
         generating: "🤖",
         saving: "💾",
         complete: "✅",
         error: "❌",
      };
      return icons[stage || ""] || "⏳";
   };

   const getStageProgress = (stage?: string) => {
      const stages = ["validation", "checking", "context", "generating", "saving", "complete"];
      const currentIndex = stages.indexOf(stage || "");
      return currentIndex >= 0 ? ((currentIndex + 1) / stages.length) * 100 : 0;
   };

   const formatDateRange = () => {
      const today = new Date();
      return today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
   };

   return (
      <Container className="pt-9 ">
         <ScrollView showsVerticalScrollIndicator={false}>
            {/* Input Form */}
            {!isGenerating && (
               <Card variant="secondary" className="mb-6 p-4">
                  <Card.Title className="mb-4 text-2xl">AI Monthly Plan</Card.Title>
                  <Text className="text-foreground mb-2">{formatDateRange()}</Text>
                  <Text className="text-foreground mb-4">
                     Get a personalized monthly plan based on your goals and current commitments
                  </Text>

                  {/* Error Message */}
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
                           className={`h-full rounded-full ${rateLimitStatus.isLimited ? 'bg-red-500' : 'bg-orange-500'}`}
                           style={{ width: `${(rateLimitStatus.remaining / rateLimitStatus.limit) * 100}%` }}
                        />
                     </View>
                     {rateLimitStatus.isLimited && (
                        <Text className="text-red-500 text-xs text-center">
                           Rate limited. Resets in {getTimeUntilReset()}
                        </Text>
                     )}
                  </View>

                  {/* Goals Input */}
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

                  {/* Work Hours Input */}
                  <Text className="text-foreground font-medium mb-2">Work Hours (optional)</Text>
                  <TextInput
                     className="mb-4 py-3 px-4 rounded-lg bg-surface text-foreground border border-divider"
                     placeholder="e.g., 9 AM - 5 PM, Monday to Friday"
                     value={workHours}
                     onChangeText={setWorkHours}
                     placeholderTextColor={mutedColor}
                  />

                  {/* Energy Patterns Input */}
                  <Text className="text-foreground font-medium mb-2">Energy Patterns (optional)</Text>
                  <TextInput
                     className="mb-4 py-3 px-4 rounded-lg bg-surface text-foreground border border-divider"
                     placeholder="e.g., High energy in morning, low after lunch"
                     value={energyPatterns}
                     onChangeText={setEnergyPatterns}
                     placeholderTextColor={mutedColor}
                  />

                  {/* Preferred Times Input */}
                  <Text className="text-foreground font-medium mb-2">Preferred Times (optional)</Text>
                  <TextInput
                     className="mb-6 py-3 px-4 rounded-lg bg-surface text-foreground border border-divider"
                     placeholder="e.g., Deep work in morning, exercise in evening"
                     value={preferredTimes}
                     onChangeText={setPreferredTimes}
                     placeholderTextColor={mutedColor}
                  />

                  {/* Generate Button */}
                  <Pressable
                     onPress={handleGeneratePlan}
                     disabled={generatePlanMutation.isPending || !userGoals.trim() || rateLimitStatus.isLimited}
                     className={`p-4 rounded-lg flex-row justify-center items-center active:opacity-70 disabled:opacity-50 ${rateLimitStatus.isLimited ? 'bg-red-500/20' : 'bg-orange-500'
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

            {/* Plan Generation Progress & Results */}
            {(currentStage || generatePlanMutation.isPending || finalPlan) && (
               <Card className="p-2">
                  <Card.Title className="mb-4">
                     {generatePlanMutation.isPending ? "Generating Your Plan..." :
                        finalPlan ? `${formatDateRange()} Plan` : "Generation Progress"}
                  </Card.Title>

                  {/* Progress Display */}
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

                        {/* Stage Info */}
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

                  {/* Generated Plan Display */}
                  {finalPlan && (
                     <>
                        <MonthlyPlanViewer data={finalPlan} />

                        {/* Action Buttons */}
                        <View className="mt-4 space-y-3">
                           {/* Apply Plan Button */}
                           <Pressable
                              onPress={handleApplyPlan}
                              disabled={isApplying}
                              className="bg-green-600 mb-4 p-4 rounded-lg flex-row justify-center items-center active:opacity-70 disabled:opacity-50"
                           >
                              {isApplying ? (
                                 <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                 <Text className="text-foreground font-medium text-center">
                                    ✓ Apply This Plan
                                 </Text>
                              )}
                           </Pressable>

                           {/* View All Plans Button */}
                           <Pressable
                              onPress={() => router.push("/suggestion")}
                              className="bg-surface p-4 rounded-lg flex-row justify-center items-center active:opacity-70 border border-divider"
                           >
                              <Text className="text-foreground font-medium text-center">
                                 📋 View All My Plans
                              </Text>
                           </Pressable>

                           {/* Generate New Plan Button */}
                           <Pressable
                              onPress={resetPlanState}
                              className="bg-surface/50 p-3 rounded-lg flex-row justify-center items-center active:opacity-70"
                           >
                              <Text className="text-foreground font-medium">
                                 ← Generate Another Plan
                              </Text>
                           </Pressable>
                        </View>
                     </>
                  )}
               </Card>
            )}
         </ScrollView>
      </Container>
   );
}
