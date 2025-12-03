import { Container } from "@/components/container";
import { Text, View, TextInput, ScrollView, Alert, Pressable } from "react-native";
import { Card } from "heroui-native";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { useState } from "react";

const AVAILABLE_MODELS = [
   { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
   { id: "openai/gpt-oss-120b", name: "GPT OSS 120" },
   { id: "openai/gpt-oss-20b", name: "GPT OSS Mini" },
   { id: "google/gemma-3n-e2b-it:free", name: "Gemini Gemaa" },
   { id: "meta-llama/llama-3.1-405b-instruct", name: "Llama 3.1 405B" },
   { id: "deepseek/deepseek-v3.2", name: "Claude 3.5 Sonnet" },

];


export default function TabTwo() {
   const [userGoals, setUserGoals] = useState("I want to learn React Native and build a mobile app in the next month. I also want to exercise 3 times a week and read 2 books.");
   const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[1].id);

   const generatePlanMutation = useMutation({
      mutationFn: async ({ goals, model }: { goals: string; model: string }) => {
         const result = await orpc.AI.generatePlan.call({
            userGoals: goals,
            model: model,
            workHours: "9-5 weekdays",
            energyPatterns: "High energy in mornings",
            preferredTimes: "Mornings and evenings",
         });
         return result;
      },
      onSuccess: (data) => {
         Alert.alert(
            "Plan Generated Successfully!",
            `Suggestion ID: ${data.suggestionId}\n${data.message}`,
            [{ text: "OK" }]
         );
         console.log("Generated plan:", data.content);
      },
      onError: (error) => {
         Alert.alert("Error", `Failed to generate plan: ${error.message}`);
      },
   });

    return (
       <Container className="p-6 flex-1">
          <ScrollView 
             className="flex-1" 
             contentContainerStyle={{ paddingBottom: 20 }}
             showsVerticalScrollIndicator={true}
          >
             <Card variant="secondary" className="p-6 mb-6">
                <Card.Title className="text-2xl mb-4">AI Plan Generator Test</Card.Title>

                <View className="mb-4">
                   <Text className="text-foreground font-medium mb-2">Your Goals:</Text>
                   <TextInput
                      className="border border-muted rounded-lg p-3 text-foreground min-h-[100px] text-base"
                      placeholder="Describe your goals for the month..."
                      value={userGoals}
                      onChangeText={setUserGoals}
                      multiline
                      textAlignVertical="top"
                   />
                </View>

                <View className="mb-4">
                   <Text className="text-foreground font-medium mb-2">AI Model:</Text>
                   <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row gap-2">
                         {AVAILABLE_MODELS.map((model) => (
                            <Pressable
                               key={model.id}
                               className={`px-3 py-2 rounded-lg border ${selectedModel === model.id
                                  ? "bg-secondary border-segment"
                                  : "bg-muted border-muted"
                                  }`}
                               onPress={() => setSelectedModel(model.id)}
                            >
                               <Text className={`text-sm ${selectedModel === model.id
                                  ? "text-foreground"
                                  : "text-secondarry"
                                  }`}>
                                  {model.name}
                               </Text>
                            </Pressable>
                         ))}
                      </View>
                   </ScrollView>
                </View>

                <Pressable
                   className={`py-3 px-4 rounded-lg self-start active:opacity-70 ${generatePlanMutation.isPending
                      ? "bg-muted"
                      : "bg-primary"
                      }`}
                   onPress={() => generatePlanMutation.mutate({ goals: userGoals, model: selectedModel })}
                   disabled={generatePlanMutation.isPending}
                >
                   <Text className="text-foreground font-medium">
                      {generatePlanMutation.isPending
                         ? "Generating..."
                         : "Generate AI Plan"
                      }
                   </Text>
                </Pressable>

                {generatePlanMutation.data && (
                   <View className="mt-6">
                      {/* Header */}
                      <View className="items-center mb-6">
                         <Text className="text-foreground font-bold text-xl mb-2">Your Generated Plan</Text>
                         <View className="flex-row items-center gap-2">
                            <View className="px-3 py-1 bg-primary/10 rounded-full">
                               <Text className="text-primary text-xs font-semibold">
                                  {generatePlanMutation.data.content?.goals?.length || 0} Goals
                               </Text>
                            </View>
                            <View className="px-3 py-1 bg-secondary/10 rounded-full">
                               <Text className="text-secondary text-xs font-semibold">
                                  {generatePlanMutation.data.content?.goals?.reduce((total: number, goal: any) => total + (goal.tasks?.length || 0), 0)} Tasks
                               </Text>
                            </View>
                         </View>
                      </View>

                      {/* Goals List */}
                      <View className="gap-4">
                        {generatePlanMutation.data.content?.goals?.map((goal: any, goalIndex: number) => (
                           <View key={goalIndex} className="bg-background border border-border rounded-2xl p-5 shadow-sm">
                              {/* Goal Header */}
                              <View className="mb-4">
                                 <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-foreground font-bold text-lg flex-1 mr-3">
                                       {goal.title}
                                    </Text>
                                    <View className={`px-3 py-1.5 rounded-full ${
                                       goal.category === 'learning' ? 'bg-blue-500' :
                                       goal.category === 'health' ? 'bg-green-500' :
                                       goal.category === 'personal' ? 'bg-purple-500' : 'bg-gray-500'
                                    }`}>
                                       <Text className="text-white text-xs font-bold uppercase">
                                          {goal.category}
                                       </Text>
                                    </View>
                                 </View>
                                 <Text className="text-muted-foreground text-sm leading-relaxed">
                                    {goal.description}
                                 </Text>
                              </View>

                              {/* Tasks Section */}
                              {goal.tasks && goal.tasks.length > 0 && (
                                 <View className="bg-muted/30 rounded-xl p-4">
                                    <View className="flex-row items-center mb-3">
                                       <Text className="text-foreground font-semibold text-base">📋 Tasks</Text>
                                       <View className="ml-auto px-2 py-1 bg-background rounded-lg">
                                          <Text className="text-muted-foreground text-xs font-medium">
                                             {goal.tasks.length}
                                          </Text>
                                       </View>
                                    </View>
                                    
                                    <View className="gap-3">
                                       {goal.tasks.map((task: any, taskIndex: number) => (
                                          <View key={taskIndex} className="bg-background rounded-lg p-3 flex-row items-start">
                                             <View className={`w-2 h-2 rounded-full mt-1.5 mr-3 ${
                                                task.priority === 'high' ? 'bg-red-500' :
                                                task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                             }`} />
                                             <View className="flex-1">
                                                <Text className="text-foreground font-medium text-sm mb-2 leading-tight">
                                                   {task.title}
                                                </Text>
                                                <View className="flex-row items-center justify-between">
                                                   <View className={`px-2 py-1 rounded-md ${
                                                      task.priority === 'high' ? 'bg-red-100' :
                                                      task.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                                                   }`}>
                                                      <Text className={`text-xs font-semibold ${
                                                         task.priority === 'high' ? 'text-red-700' :
                                                         task.priority === 'medium' ? 'text-yellow-700' : 'text-green-700'
                                                      }`}>
                                                         {task.priority.toUpperCase()}
                                                      </Text>
                                                   </View>
                                                   <Text className="text-muted-foreground text-xs">
                                                      {task.dueDate}
                                                   </Text>
                                                </View>
                                             </View>
                                          </View>
                                       ))}
                                    </View>
                                 </View>
                              )}
                           </View>
                        ))}
                      </View>
                   </View>
                )}
             </Card>

             <Card variant="secondary" className="p-6">
                <Card.Title className="text-lg mb-3">Test Results</Card.Title>
                <Text className="text-muted text-sm">
                   Status: {generatePlanMutation.isPending ? "Loading..." :
                      generatePlanMutation.isSuccess ? "Success" :
                         generatePlanMutation.isError ? "Error" : "Idle"}
                </Text>
                {generatePlanMutation.data && (
                   <>
                      <Text className="text-muted text-sm mt-1">
                         Suggestion ID: {generatePlanMutation.data.suggestionId}
                      </Text>
                      <Text className="text-muted text-sm mt-1">
                         Is Recent: {generatePlanMutation.data.isRecent ? "Yes" : "No"}
                      </Text>
                      <Text className="text-muted text-sm mt-1">
                         Message: {generatePlanMutation.data.message}
                      </Text>
                   </>
                )}
             </Card>
          </ScrollView>
       </Container>
    );
}
