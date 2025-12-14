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
import { useGeneratePlan, useRegeneratePlan } from "@/hooks/use-local-cache";
import { PlanSummaryCard, WeeklyBreakdownViewer, PlanActionButtons } from "@/components/plan";
import { checkPlanGenerationLimit, consumePlanGeneration, getTimeUntilReset } from "@/lib/rate-limiter";
import { useRouter } from "expo-router";
import { orpc } from "@/utils/orpc";

// Type for plan data
interface PlanData {
   monthly_summary?: string;
   weekly_breakdown?: Array<{
      week: number;
      focus: string;
      goals: string[];
      daily_tasks: Record<string, string[]>;
   }>;
   success_metrics?: string[];
   potential_conflicts?: string[];
}

export default function Plan() {
   // Form state
   const [userGoals, setUserGoals] = useState(
      "I want to learn React Native development by building 3 mobile app projects, exercise 4 times per week (strength training Mon/Wed/Fri, cardio Tue/Thu), read 2 technical books about AI/ML, improve my TypeScript skills through online courses, and maintain a healthy work-life balance with 8 hours of sleep. I work 9 AM - 5 PM, Monday to Friday, have high energy in mornings for deep work, prefer exercising at 6 PM, and enjoy reading before bed. I want to focus on health, career development, and learning new technologies."
   );
   
   // Additional preferences for better personalization
   const [taskComplexity, setTaskComplexity] = useState<"simple" | "balanced" | "ambitious">("balanced");
   const [priorityFocus, setPriorityFocus] = useState<string[]>(["health", "career", "learning"]);
   const [weekendPreference, setWeekendPreference] = useState<"work" | "rest" | "mixed">("mixed");

   // Plan state
   const [finalPlan, setFinalPlan] = useState<PlanData | null>(null);
   const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
   const [error, setError] = useState<string | null>(null);
   const [currentStage, setCurrentStage] = useState<{ stage?: string; message: string } | null>(null);
   const [isGenerating, setIsGenerating] = useState(false);
   const [isApplying, setIsApplying] = useState(false);
   const [isRegenerating, setIsRegenerating] = useState(false);
   const [planApplied, setPlanApplied] = useState(false);

   // Rate limit state
   const [rateLimitStatus, setRateLimitStatus] = useState(checkPlanGenerationLimit());

   // Hooks
   const router = useRouter();
   const fadeAnim = useRef(new Animated.Value(0)).current;
   const generatePlanMutation = useGeneratePlan();
   const regeneratePlanMutation = useRegeneratePlan();
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
      setPlanApplied(false);

      // Build structured preferences according to backend schema
      const preferences = {
         taskComplexity,
         priorityFocus,
      };

      generatePlanMutation.mutate(
         {
            userGoals: userGoals.trim(),
            preferences,
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
               setIsGenerating(false);

               if (result && result.suggestionId && result.content) {
                  try {
                     // Backend returns structured response with content field
                     const parsedData = typeof result.content === 'string' ? JSON.parse(result.content) : result.content;
                     setFinalPlan(parsedData);
                     setCurrentPlanId(result.suggestionId);
                     setCurrentStage({ stage: "complete", message: "Plan generated successfully!" });

                     // Log insights for debugging
                     if (result.insights) {
                        console.log("Plan generation insights:", result.insights);
                     }
                  } catch (error) {
                     // Fallback if content is not JSON
                     setFinalPlan({
                        monthly_summary: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
                     });
                     setCurrentPlanId(result.suggestionId);
                     setCurrentStage({ stage: "complete", message: "Plan generated successfully!" });
                  }
               } else {
                  setError(result?.error || "Failed to generate plan");
                  setCurrentStage({ stage: "error", message: "Failed to generate plan" });
               }
            },
            onError: (error: any) => {
               setIsGenerating(false);
               setError(error.message || "Failed to generate plan");
               setCurrentStage({ stage: "error", message: "Failed to generate plan" });
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

         setPlanApplied(true);

         Alert.alert(
            "Success",
            `Plan applied successfully! Created ${result.createdCount} items.`,
            [
               {
                  text: "View Suggestions",
                  onPress: () => router.push("/suggestion"),
               },
               {
                  text: "Stay Here",
                  style: "cancel",
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

   const handleRegeneratePlan = async (feedback: string) => {
      if (!currentPlanId) {
         Alert.alert("Error", "No plan ID available to regenerate.");
         return;
      }

      setIsRegenerating(true);
      setCurrentStage(null);

      regeneratePlanMutation.mutate(
         {
            originalPlanId: currentPlanId,
            regenerationReason: feedback,
            onProgress: (stage: string, message: string) => {
               setCurrentStage({ stage, message });
            }
         },
         {
            onSuccess: (result: any) => {
               setIsRegenerating(false);

               if (result && result.planId && result.content) {
                  try {
                     const parsedData = typeof result.content === 'string' ? JSON.parse(result.content) : result.content;
                     setFinalPlan(parsedData);
                     setCurrentPlanId(result.planId);
                     setCurrentStage({ stage: "complete", message: "Plan regenerated with your feedback!" });
                     setPlanApplied(false);

                     // Log improvements if available
                     if (result.improvements) {
                        console.log("Plan regeneration improvements:", result.improvements);
                     }
                  } catch (error) {
                     setFinalPlan({
                        monthly_summary: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
                     });
                     setCurrentPlanId(result.planId);
                     setCurrentStage({ stage: "complete", message: "Plan regenerated!" });
                     setPlanApplied(false);
                  }
               } else {
                  Alert.alert("Error", result?.error || "Failed to regenerate plan");
                  setCurrentStage({ stage: "error", message: "Regeneration failed" });
               }
            },
            onError: (error: any) => {
               Alert.alert("Error", error.message || "Failed to regenerate plan");
               setCurrentStage({ stage: "error", message: "Regeneration failed" });
               setIsRegenerating(false);
            }
         }
      );
   };

   const resetPlanState = () => {
      setIsGenerating(false);
      setFinalPlan(null);
      setCurrentPlanId(null);
      setCurrentStage(null);
      setPlanApplied(false);
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
         analyzing: "🔍",
         reviewing: "📖",
         regenerating: "🔄",
         finalizing: "✨",
      };
      return icons[stage || ""] || "⏳";
   };

   const getStageProgress = (stage?: string) => {
      const stages = ["validation", "checking", "context", "generating", "saving", "complete"];
      const regenerateStages = ["analyzing", "reviewing", "regenerating", "finalizing", "complete"];

      const stageList = isRegenerating ? regenerateStages : stages;
      const currentIndex = stageList.indexOf(stage || "");
      return currentIndex >= 0 ? ((currentIndex + 1) / stageList.length) * 100 : 0;
   };

   const formatDateRange = () => {
      const today = new Date();
      return today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
   };

   
   return (
      <Container className="pt-9 ">
         <ScrollView showsVerticalScrollIndicator={false}>
            {/* Input Form - Section 1A from creation.md */}
            {!isGenerating && !finalPlan && (
               <Card variant="secondary" className="mb-6 p-4">
                  <Card.Title className="mb-4 text-2xl font-sans-bold">AI Monthly Plan</Card.Title>
                  <Text className="text-foreground font-sans mb-2">{formatDateRange()}</Text>
                  <Text className="text-foreground font-sans mb-4">
                     Get a personalized monthly plan based on your goals and current commitments
                  </Text>

                  {/* Error Message */}
                  {error && (
                     <View className="mb-4 p-3 bg-danger/10 rounded-lg">
                        <Text className="text-danger text-sm font-sans">{error}</Text>
                     </View>
                  )}

                  {/* Rate Limit Status */}
                  <View className="mb-4 p-3 bg-surface/50 rounded-lg">
                     <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-orange-300 text-sm font-sans-medium">Generations Remaining</Text>
                        <Text className="text-orange-300 text-sm font-sans">
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
                        <Text className="text-red-500 text-xs text-center font-sans">
                           Rate limited. Resets in {getTimeUntilReset()}
                        </Text>
                     )}
                  </View>

                  {/* Goals Input */}
                  <Text className="text-foreground font-sans-medium mb-2">Your Goals *</Text>
                  <TextInput
                     className="mb-4 py-3 px-4 rounded-lg bg-surface text-foreground border border-divider font-sans"
                     placeholder="Describe your goals for this month in detail. Include specific work hours, energy patterns, preferred times for activities, and what you want to achieve. Example: 'I want to learn React Native development by building 3 mobile app projects, exercise 4 times per week (strength training Mon/Wed/Fri, cardio Tue/Thu), read 2 technical books about AI/ML, improve my TypeScript skills through online courses, and maintain a healthy work-life balance with 8 hours of sleep. I work 9 AM - 5 PM, Monday to Friday, have high energy in mornings for deep work, prefer exercising at 6 PM, and enjoy reading before bed.'"
                     value={userGoals}
                     onChangeText={setUserGoals}
                     placeholderTextColor={mutedColor}
                     multiline
                     numberOfLines={6}
                     textAlignVertical="top"
                  />

                  {/* Task Complexity */}
                  <Text className="text-foreground font-sans-medium mb-2">Task Complexity</Text>
                  <View className="mb-4 flex-row gap-2">
                     {(['simple', 'balanced', 'ambitious'] as const).map((complexity) => (
                        <Pressable
                           key={complexity}
                           onPress={() => setTaskComplexity(complexity)}
                           className={`flex-1 py-2 px-3 rounded-lg border ${
                              taskComplexity === complexity
                                 ? 'bg-orange-500 border-orange-500'
                                 : 'bg-surface border-divider'
                           }`}
                        >
                           <Text className={`text-center capitalize font-sans ${
                              taskComplexity === complexity ? 'text-white' : 'text-foreground'
                           }`}>
                              {complexity}
                           </Text>
                        </Pressable>
                     ))}
                  </View>

                  {/* Priority Focus */}
                  <Text className="text-foreground font-sans-medium mb-2">Priority Focus Areas</Text>
                  <View className="mb-4 flex-row flex-wrap gap-2">
                     {(['health', 'career', 'learning', 'relationships', 'finance', 'personal']).map((focus) => (
                        <Pressable
                           key={focus}
                           onPress={() => {
                              if (priorityFocus.includes(focus)) {
                                 setPriorityFocus(priorityFocus.filter(f => f !== focus));
                              } else {
                                 setPriorityFocus([...priorityFocus, focus]);
                              }
                           }}
                           className={`px-3 py-1 rounded-full border ${
                              priorityFocus.includes(focus)
                                 ? 'bg-orange-500 border-orange-500'
                                 : 'bg-surface border-divider'
                           }`}
                        >
                           <Text className={`text-sm capitalize font-sans ${
                              priorityFocus.includes(focus) ? 'text-white' : 'text-foreground'
                           }`}>
                              {focus}
                           </Text>
                        </Pressable>
                     ))}
                  </View>

                  {/* Weekend Preference */}
                  <Text className="text-foreground font-sans-medium mb-2">Weekend Preference</Text>
                  <View className="mb-6 flex-row gap-2">
                     {(['work', 'rest', 'mixed'] as const).map((preference) => (
                        <Pressable
                           key={preference}
                           onPress={() => setWeekendPreference(preference)}
                           className={`flex-1 py-2 px-3 rounded-lg border ${
                              weekendPreference === preference
                                 ? 'bg-orange-500 border-orange-500'
                                 : 'bg-surface border-divider'
                           }`}
                        >
                           <Text className={`text-center capitalize font-sans ${
                              weekendPreference === preference ? 'text-white' : 'text-foreground'
                           }`}>
                              {preference}
                           </Text>
                        </Pressable>
                     ))}
                  </View>

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
                        <Text className="text-red-600 font-sans-medium text-center">
                           Rate Limited ({getTimeUntilReset()})
                        </Text>
                     ) : (
                        <Text className="text-white font-sans-medium text-center">
                           Generate Monthly Plan ({rateLimitStatus.remaining} left)
                        </Text>
                     )}
                  </Pressable>
               </Card>
            )}

            {/* Plan Generation Progress - Section 1B from creation.md */}
            {(isGenerating || isRegenerating) && currentStage && !finalPlan && (
               <Card className="p-4 mb-6">
                  <Card.Title className="mb-4 font-sans-bold">
                     {isRegenerating ? "Regenerating Your Plan..." : "Generating Your Plan..."}
                  </Card.Title>

                  <Animated.View
                     className="p-4 bg-surface/50 rounded-lg"
                     style={{ opacity: fadeAnim }}
                  >
                     {/* Progress Bar */}
                     <View className="mb-3">
                        <View className="flex-row justify-between items-center mb-2">
                           <Text className="text-xs text-orange-600 font-sans">Progress</Text>
                           <Text className="text-xs text-orange-600 font-sans">
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
                        <Text className="text-2xl mr-3 font-sans">{getStageIcon(currentStage.stage)}</Text>
                        <View className="flex-1">
                           <Text className="text-orange-600 font-sans-medium text-lg capitalize">
                              {currentStage.stage || "Processing"}
                           </Text>
                           <Text className="text-orange-500 text-sm mt-1 font-sans">
                              {currentStage.message}
                           </Text>
                        </View>
                        <ActivityIndicator size="small" color="#ea580c" />
                     </View>
                  </Animated.View>
               </Card>
            )}

            {/* Generated Plan Display - Section 2 from creation.md */}
            {finalPlan && (
               <>
                  {/* Section 2A: Summary & Metrics Card */}
                  <PlanSummaryCard
                     monthlySummary={finalPlan.monthly_summary || "Your personalized monthly plan"}
                     successMetrics={finalPlan.success_metrics}
                     potentialConflicts={finalPlan.potential_conflicts}
                     currentMonth={formatDateRange()}
                  />

                  {/* Section 2B: Weekly Breakdown Viewer */}
                  {finalPlan.weekly_breakdown && finalPlan.weekly_breakdown.length > 0 && (
                     <Card className="p-4 mb-6">
                        <WeeklyBreakdownViewer weeklyBreakdown={finalPlan.weekly_breakdown} />
                     </Card>
                  )}

                  {/* Progress indicator during regeneration */}
                  {isRegenerating && currentStage && (
                     <View className="p-4 bg-orange-500/20 rounded-xl mb-4">
                        <View className="flex-row items-center justify-center">
                           <ActivityIndicator size="small" color="#f97316" />
                           <Text className="text-orange-400 ml-2 font-sans">{currentStage.message}</Text>
                        </View>
                     </View>
                  )}

                  {/* Section 2C: Action Buttons */}
                  <PlanActionButtons
                     onApplyPlan={handleApplyPlan}
                     onRegeneratePlan={handleRegeneratePlan}
                     onViewAllPlans={() => router.push("/suggestion")}
                     onGenerateNewPlan={resetPlanState}
                     isApplying={isApplying}
                     isRegenerating={isRegenerating}
                     planApplied={planApplied}
                  />

                  {/* Spacer for scroll */}
                  <View className="h-8" />
               </>
            )}
         </ScrollView>
      </Container>
   );
}
