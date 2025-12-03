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
import { Container } from "@/components/container";
import { Card, useThemeColor } from "heroui-native";
import { orpc } from "@/utils/orpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Suggestion {
   id: string;
   type: "plan" | "briefing" | "reschedule";
   content: any; // JSON content
   isApplied: boolean;
   createdAt: string;
   updatedAt: string;
}

export default function Index() {
   const [filter, setFilter] = useState<"all" | "plan" | "briefing" | "reschedule">("all");
   const [showApplied, setShowApplied] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const queryClient = useQueryClient();

   const mutedColor = useThemeColor("muted");
   const foregroundColor = useThemeColor("foreground");




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

   return (
      <Container className="p-3">
         <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
               <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
         >
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
                     placeholderTextColor={mutedColor}
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
                                 : "bg-muted border-muted"
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
                     className={`w-12 h-6 rounded-full ${showApplied ? "bg-primary" : "bg-muted"
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
                  <Text className="text-muted-foreground mt-4">Loading suggestions...</Text>
               </View>
            ) : error ? (
               <Card variant="secondary" className="p-6">
                  <View className="items-center py-8">
                     <Text className="text-4xl mb-4">❌</Text>
                     <Text className="text-foreground font-medium text-lg mb-2">
                        Error Loading Suggestions
                     </Text>
                     <Text className="text-muted-foreground text-center">
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
                     <Text className="text-muted-foreground text-center">
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
                           <Text className="text-muted-foreground text-xs">
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

