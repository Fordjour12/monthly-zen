
import { useState } from "react";
import {
   View,
   Text,
   ScrollView,
   RefreshControl,
   Pressable,
   ActivityIndicator,
   Alert,
   TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Container } from "@/components/container";
import { TaskStatusBadge } from "@/components/task-status-toggle";
import { HabitStreakBadge } from "@/components/habit-tracker";
import { AICheckin, CheckinNotification } from "@/components/ai-checkin";
import { Card, useThemeColor } from "heroui-native";
import { orpc } from "@/utils/orpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

interface Suggestion {
   id: string;
   type: "plan" | "briefing" | "reschedule";
   content: any; // JSON content
   isApplied: boolean;
   createdAt: Date | string;
   updatedAt: Date | string;
}

export default function Four() {
   const [filter, setFilter] = useState<"all" | "plan" | "briefing" | "reschedule">("all");
   const [showApplied, setShowApplied] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const [showCheckin, setShowCheckin] = useState(false);
   const [checkinQuestion, setCheckinQuestion] = useState("");
   const queryClient = useQueryClient();
   const router = useRouter();

   const foregroundColor = useThemeColor("foreground");
   const mutedColor = useThemeColor("muted");




   // Mock data for today's tasks - replace with actual API calls
   const { data: todayTasks = [] } = useQuery({
      queryKey: ["today-tasks"],
      queryFn: async () => {
         // Mock data - replace with actual API call
         return [
            { id: "1", title: "Morning standup", status: "completed", priority: "medium" },
            { id: "2", title: "Review PRs", status: "pending", priority: "high" },
            { id: "3", title: "Team meeting", status: "pending", priority: "medium" },
            { id: "4", title: "Update docs", status: "skipped", priority: "low" },
         ];
      },
   });

   // Mock data for today's habits - replace with actual API calls
   const { data: todayHabits = [] } = useQuery({
      queryKey: ["today-habits"],
      queryFn: async () => {
         // Mock data - replace with actual API call
         return [
            { id: "1", title: "Meditation", currentStreak: 7, todayStatus: "completed" },
            { id: "2", title: "Exercise", currentStreak: 3, todayStatus: "pending" },
            { id: "3", title: "Read", currentStreak: 14, todayStatus: "partial" },
         ];
      },
   });

   const {
      data: suggestionsData,
      isLoading,
      refetch,
      error,
   } = useQuery({
      queryKey: ["ai-suggestions", filter, showApplied, searchQuery],
      queryFn: async () => {
         try {
            console.log("🔍 Fetching suggestions with filters:", { filter, showApplied, searchQuery });
            const result = await orpc.AI.getSuggestions.call({
               limit: 10,
            });
            return result;
         } catch (err) {
            console.error("❌ Error fetching suggestions:", err);
            throw err;
         }
      },
   });


   const applySuggestionMutation = useMutation({
      mutationFn: async (suggestionId: string) => {
         const result = await orpc.AI.applySuggestion.call({
            suggestionId,
         });
         return result;
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["ai-suggestions"] });
         Alert.alert("Success", "Suggestion applied successfully!");
      },
      onError: (error) => {
         Alert.alert("Error", `Failed to apply suggestion: ${error.message}`);
      },
   });

   const getTypeColor = (type: string) => {
      switch (type) {
         case "plan":
            return "bg-blue-500";
         case "briefing":
            return "bg-green-500";
         case "reschedule":
            return "bg-orange-500";
         default:
            return "bg-gray-500";
      }
   };

   const getTypeIcon = (type: string) => {
      switch (type) {
         case "plan":
            return "📋";
         case "briefing":
            return "📝";
         case "reschedule":
            return "🔄";
         default:
            return "💡";
      }
   };

   const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   };

   const formatContent = (content: any): string => {
      if (typeof content === 'string') {
         return content;
      }
      if (typeof content === 'object') {
         return JSON.stringify(content, null, 2);
      }
      return String(content);
   };

   // Calculate today's stats
   const taskStats = {
      total: todayTasks.length,
      completed: todayTasks.filter(t => t.status === "completed").length,
      pending: todayTasks.filter(t => t.status === "pending").length,
   };

   const habitStats = {
      total: todayHabits.length,
      completed: todayHabits.filter(h => h.todayStatus === "completed").length,
      partial: todayHabits.filter(h => h.todayStatus === "partial").length,
      longestStreak: Math.max(...todayHabits.map(h => h.currentStreak), 0),
   };

   const handleQuickAction = (action: string) => {
      switch (action) {
         case "add-task":
            router.push("/(drawer)/(tabs)/tasks");
            break;
         case "add-habit":
            router.push("/(drawer)/(tabs)/habits");
            break;
         case "generate-plan":
            router.push("/(drawer)/(tabs)/three");
            break;
         case "checkin":
            setCheckinQuestion("How are you feeling about your productivity today?");
            setShowCheckin(true);
            break;
      }
   };

   const handleCheckinResponse = (response: string) => {
      console.log("Check-in response:", response);
      setShowCheckin(false);
      // Here you would send the response to your API
   };

   return (
      <Container className="p-3">
         <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
               <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
         >
            {/* Today's Progress Overview */}
            <Card variant="secondary" className="mb-6 p-4 w-full">
               <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-foreground text-2xl font-black">Today</Text>
                  <Pressable
                     onPress={() => handleQuickAction("checkin")}
                     className="px-3 py-1.5 rounded-lg bg-secondary border border-secondary"
                  >
                     <Text className="text-foreground text-sm font-medium">Check-in</Text>
                  </Pressable>
               </View>

               {/* Quick Stats */}
               <View className="grid grid-cols-2 gap-4 mb-4">
                  <View className="bg-muted/10 rounded-lg p-3">
                     <View className="flex-row items-center gap-2 mb-2">
                        <Ionicons name="checkbox" size={16} color={foregroundColor} />
                        <Text className="text-foreground font-medium">Tasks</Text>
                     </View>
                     <Text className="text-2xl font-bold text-foreground mb-1">
                        {taskStats.completed}/{taskStats.total}
                     </Text>
                     <Text className="text-muted-foreground text-xs">
                        {taskStats.pending} pending
                     </Text>
                  </View>

                  <View className="bg-muted/10 rounded-lg p-3">
                     <View className="flex-row items-center gap-2 mb-2">
                        <Ionicons name="repeat" size={16} color={foregroundColor} />
                        <Text className="text-foreground font-medium">Habits</Text>
                     </View>
                     <Text className="text-2xl font-bold text-foreground mb-1">
                        {habitStats.completed}/{habitStats.total}
                     </Text>
                     <Text className="text-muted-foreground text-xs">
                        {habitStats.longestStreak} day streak
                     </Text>
                  </View>
               </View>

               {/* Quick Actions */}
               <View className="flex-row gap-2">
                  <Pressable
                     onPress={() => handleQuickAction("add-task")}
                     className="flex-1 py-2.5 rounded-lg bg-surface border border-divider flex-row items-center justify-center gap-2"
                  >
                     <Ionicons name="add-circle" size={16} color={foregroundColor} />
                     <Text className="text-foreground text-sm font-medium">Add Task</Text>
                  </Pressable>
                  <Pressable
                     onPress={() => handleQuickAction("add-habit")}
                     className="flex-1 py-2.5 rounded-lg bg-surface border border-divider flex-row items-center justify-center gap-2"
                  >
                     <Ionicons name="add-circle" size={16} color={foregroundColor} />
                     <Text className="text-foreground text-sm font-medium">Add Habit</Text>
                  </Pressable>
                  <Pressable
                     onPress={() => handleQuickAction("generate-plan")}
                     className="flex-1 py-2.5 rounded-lg bg-secondary border border-secondary flex-row items-center justify-center gap-2"
                  >
                     <Ionicons name="create" size={16} color={foregroundColor} />
                     <Text className="text-foreground text-sm font-medium">Plan</Text>
                  </Pressable>
               </View>
            </Card>

            {/* Today's Tasks Preview */}
            <Card variant="secondary" className="mb-6 p-4 w-full">
               <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-foreground text-lg font-semibold">Today's Tasks</Text>
                  <Pressable
                     onPress={() => router.push("/(drawer)/(tabs)/tasks")}
                  >
                     <Text className="text-secondary text-sm font-medium">View All</Text>
                  </Pressable>
               </View>

               {todayTasks.length === 0 ? (
                  <View className="items-center py-4">
                     <Ionicons name="checkbox-outline" size={32} color={foregroundColor} />
                     <Text className="text-foreground text-sm mt-2">
                        No tasks for today
                     </Text>
                  </View>
               ) : (
                  <View className="space-y-2">
                     {todayTasks.slice(0, 3).map((task) => (
                        <View key={task.id} className="flex-row items-center justify-between py-2">
                           <View className="flex-1 mr-3">
                              <Text className="text-foreground text-sm font-medium">
                                 {task.title}
                              </Text>
                              <TaskStatusBadge status={task.status as any} size="small" />
                           </View>
                           <Ionicons
                              name="chevron-forward"
                              size={16}
                              color={mutedColor}
                           />
                        </View>
                     ))}
                     {todayTasks.length > 3 && (
                        <Text className="text-muted-foreground text-xs text-center mt-2">
                           +{todayTasks.length - 3} more tasks
                        </Text>
                     )}
                  </View>
               )}
            </Card>

            {/* Today's Habits Preview */}
            <Card variant="secondary" className="mb-6 p-4 w-full">
               <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-foreground text-lg font-semibold">Today's Habits</Text>
                  <Pressable
                     onPress={() => router.push("/(drawer)/(tabs)/habits")}
                  >
                     <Text className="text-secondary text-sm font-medium">View All</Text>
                  </Pressable>
               </View>

               {todayHabits.length === 0 ? (
                  <View className="items-center py-4">
                     <Ionicons name="repeat-outline" size={32} color={mutedColor} />
                     <Text className="text-muted-foreground text-sm mt-2">
                        No habits yet
                     </Text>
                  </View>
               ) : (
                  <View className="space-y-2">
                     {todayHabits.slice(0, 3).map((habit) => (
                        <View key={habit.id} className="flex-row items-center justify-between py-2">
                           <View className="flex-1 mr-3">
                              <Text className="text-foreground text-sm font-medium">
                                 {habit.title}
                              </Text>
                              <HabitStreakBadge streak={habit.currentStreak} size="small" />
                           </View>
                           <Ionicons
                              name="chevron-forward"
                              size={16}
                              color={mutedColor}
                           />
                        </View>
                     ))}
                     {todayHabits.length > 3 && (
                        <Text className="text-muted-foreground text-xs text-center mt-2">
                           +{todayHabits.length - 3} more habits
                        </Text>
                     )}
                  </View>
               )}
            </Card>

            {/* AI Check-in Modal */}
            <AICheckin
               visible={showCheckin}
               type="morning"
               question={checkinQuestion}
               onResponse={handleCheckinResponse}
               onDismiss={() => setShowCheckin(false)}
            />

            {/* AI Suggestions */}
            <Card variant="secondary" className="mb-6 p-4 w-full">
               <Card.Title className="mb-4 text-2xl font-black">AI Suggestions</Card.Title>
               <Text className="text-foreground mb-4">
                  Get personalized AI-powered suggestions for your goals and tasks
               </Text>

               {/* Search Input */}
               <View className="mb-4">
                  <Text className="text-foreground font-medium mb-2">Search Suggestions:</Text>
                  <TextInput
                     className="py-3 px-4 rounded-lg bg-surface text-foreground border border-divider"
                     placeholder="Search in suggestion content..."
                     value={searchQuery}
                     onChangeText={setSearchQuery}
                     placeholderTextColor={foregroundColor}
                  />
               </View>

               {/* Filter Options */}
               <View className="mb-4">
                  <Text className="text-foreground font-medium mb-2">Filter by Type:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                     <View className="flex-row gap-2">
                        {["all", "plan", "briefing", "reschedule"].map((type) => (
                           <Pressable
                              key={type}
                              className={`px-3 py-2 rounded-lg border ${filter === type
                                 ? "bg-secondary border-segment"
                                 : "bg-surface border-surface"
                                 }`}
                              onPress={() => setFilter(type as any)}
                           >
                              <Text
                                 className={`text-sm capitalize ${filter === type ? "text-foreground" : "text-secondary"
                                    }`}
                              >
                                 {type}
                              </Text>
                           </Pressable>
                        ))}
                     </View>
                  </ScrollView>
               </View>

               {/* Show Applied Toggle */}
               <View className="flex-row items-center justify-between">
                  <Text className="text-foreground font-medium">Show Applied Suggestions</Text>
                  <Pressable
                     className={`w-12 h-6 rounded-full ${showApplied ? "bg-primary" : "bg-surface"
                        }`}
                     onPress={() => setShowApplied(!showApplied)}
                  >
                     <View
                        className={`w-5 h-5 bg-white rounded-full shadow-md ${showApplied ? "translate-x-6" : "translate-x-0.5"
                           }`}
                     />
                  </Pressable>
               </View>
            </Card>

            {/* Suggestions List */}
            {isLoading ? (
               <View className="flex-1 justify-center items-center py-12">
                  <ActivityIndicator size="large" color={foregroundColor} />
                  <Text className="text-foreground mt-4">Loading suggestions...</Text>
               </View>
            ) : error ? (
               <Card variant="secondary" className="p-6">
                  <View className="items-center py-8">
                     <Text className="text-4xl mb-4">❌</Text>
                     <Text className="text-foreground font-medium text-lg mb-2">
                        Error Loading Suggestions
                     </Text>
                     <Text className="text-foreground text-center">
                        {error.message}
                     </Text>
                     <Pressable
                        className="mt-4 bg-primary px-4 py-2 rounded-lg"
                        onPress={() => refetch()}
                     >
                        <Text className="text-white text-sm font-medium">Retry</Text>
                     </Pressable>
                  </View>
               </Card>
            ) : suggestionsData?.suggestions?.length === 0 ? (
               <Card variant="secondary" className="p-6">
                  <View className="items-center py-8">
                     <Text className="text-4xl mb-4">💡</Text>
                     <Text className="text-foreground font-medium text-lg mb-2">
                        No suggestions found
                     </Text>
                     <Text className="text-foreground text-center">
                        {showApplied
                           ? "No applied suggestions match your filters."
                           : "Generate some AI suggestions to get started!"}
                     </Text>
                  </View>
               </Card>
            ) : (
               <View className="gap-4">
                  {suggestionsData?.suggestions?.map((suggestion: Suggestion) => (
                     <Card key={suggestion.id} variant="secondary" className="p-4">
                        <View className="flex-row items-start justify-between mb-3">
                           <View className="flex-row items-center gap-2">
                              <Text className="text-lg">{getTypeIcon(suggestion.type)}</Text>
                              <View className={`px-2 py-1 rounded-full ${getTypeColor(suggestion.type)}`}>
                                 <Text className="text-white text-xs font-medium capitalize">
                                    {suggestion.type}
                                 </Text>
                              </View>
                           </View>
                           <Text className="text-foreground text-xs">
                              {formatDate(suggestion.createdAt)}
                           </Text>
                        </View>

                        <Text className="text-foreground mb-3 text-sm leading-relaxed">
                           {formatContent(suggestion.content)}
                        </Text>

                        <View className="flex-row items-center justify-between">
                           <View className="flex-row items-center gap-2">
                              {suggestion.isApplied && (
                                 <View className="bg-green-100 px-2 py-1 rounded-full">
                                    <Text className="text-green-800 text-xs font-medium">Applied</Text>
                                 </View>
                              )}
                           </View>

                           {!suggestion.isApplied && (
                              <Pressable
                                 className="bg-primary px-3 py-1.5 rounded-lg"
                                 onPress={() => applySuggestionMutation.mutate(suggestion.id)}
                                 disabled={applySuggestionMutation.isPending}
                              >
                                 <Text className="text-white text-sm font-medium">
                                    {applySuggestionMutation.isPending ? "Applying..." : "Apply"}
                                 </Text>
                              </Pressable>
                           )}
                        </View>
                     </Card>
                  ))}
               </View>
            )}

            {/* Summary */}
            {suggestionsData && (
               <Card variant="secondary" className="mt-6 p-4">
                  <Text className="text-foreground text-sm">
                     Showing {suggestionsData.count} suggestion{suggestionsData.count !== 1 ? "s" : ""}
                  </Text>
               </Card>
            )}
         </ScrollView>
      </Container>
   );
}
