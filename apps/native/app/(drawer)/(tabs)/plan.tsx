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
    const [finalPlan, setFinalPlan] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentStage, setCurrentStage] = useState<{ stage?: string; message: string } | null>(null);
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const generatePlanMutation = useGeneratePlan();

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

      if (!userGoals.trim() || userGoals.length < 10) {
         console.log("❌ Validation failed: goals too short");
         setError("Please provide more detailed goals (at least 10 characters)");
         return;
      }

       setError(null);
       setFinalPlan(null);
       setCurrentStage(null);

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
                   const planContent = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
                   setFinalPlan(planContent);
                   setCurrentStage({ stage: "complete", message: "Plan generated successfully!" });
                } else {
                   setError(result.error || "Failed to generate plan");
                   setCurrentStage({ stage: "error", message: "Failed to generate plan" });
                }
             },
             onError: (error: any) => {
                console.error("💥 Error in generatePlan:", error);
                setError(error.message || "Failed to generate plan");
                setCurrentStage({ stage: "error", message: "Failed to generate plan" });
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

    const formatPlanContent = (content: string) => {
       // Enhanced formatting for better readability
       return content
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
          .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
          .replace(/#{1,6}\s/g, '') // Remove markdown headers
          .replace(/-\s/g, '• ') // Convert dashes to bullets
          .replace(/\d+\.\s/g, '• ') // Convert numbered lists to bullets
          .replace(/\n\n+/g, '\n\n') // Normalize multiple newlines
          .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
          .trim();
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
                  disabled={generatePlanMutation.isPending || !userGoals.trim()}
                  className="bg-accent p-4 rounded-lg flex-row justify-center items-center active:opacity-70 disabled:opacity-50"
               >
                  {generatePlanMutation.isPending ? (
                     <ActivityIndicator size="small" color={foregroundColor} />
                  ) : (
                     <Text className="text-foreground font-medium text-center">
                        Generate Monthly Plan
                     </Text>
                  )}
               </Pressable>
             </Card>

             {(currentStage || finalPlan || generatePlanMutation.isPending) && (
                <Card variant="secondary" className="p-4">
                   <Card.Title className="mb-4">
                      {generatePlanMutation.isPending ? "Generating Your Plan..." : 
                       finalPlan ? "Plan Generated!" : "Generation Progress"}
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
                               <Text className="text-xs text-muted-foreground">Progress</Text>
                               <Text className="text-xs text-muted-foreground">
                                  {Math.round(getStageProgress(currentStage.stage))}%
                               </Text>
                            </View>
                            <View className="h-2 bg-surface rounded-full overflow-hidden">
                               <Animated.View 
                                  className="h-full bg-accent rounded-full"
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
                               <Text className="text-foreground font-medium text-lg capitalize">
                                  {currentStage.stage || "Processing"}
                               </Text>
                               <Text className="text-muted-foreground text-sm mt-1">
                                  {currentStage.message}
                               </Text>
                            </View>
                            {generatePlanMutation.isPending && (
                               <ActivityIndicator size="small" color={foregroundColor} />
                            )}
                         </View>
                      </Animated.View>
                   )}

                   {finalPlan && (
                      <View className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
                         <View className="flex-row items-center mb-3">
                            <Text className="text-foreground font-medium text-lg mr-2">📋</Text>
                            <Text className="text-foreground font-medium text-lg">Your Monthly Plan</Text>
                            <View className="ml-auto">
                               <Text className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">
                                  Ready
                               </Text>
                            </View>
                         </View>
                         <View className="bg-surface/30 rounded-lg p-4">
                            <Text className="text-foreground leading-relaxed whitespace-pre-wrap">
                               {formatPlanContent(finalPlan)}
                            </Text>
                         </View>
                         {generatePlanMutation.data?.suggestionId && (
                            <View className="mt-3 flex-row items-center">
                               <Text className="text-xs text-muted-foreground mr-2">Plan ID:</Text>
                               <Text className="text-xs text-muted-foreground font-mono">
                                  {generatePlanMutation.data.suggestionId}
                               </Text>
                            </View>
                         )}
                      </View>
                   )}
                </Card>
             )}

          </ScrollView>
       </Container>
    );
}
