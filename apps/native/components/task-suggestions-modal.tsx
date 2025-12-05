import { useState } from "react";
import { Pressable, Text, View, Modal, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { Card, useThemeColor } from "heroui-native";
import { Platform } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { formatSuggestion, getSuggestionIcon, getSuggestionColor, formatSuggestionPreview } from "@/lib/suggestion-formatter";
import { SuggestionDetailModal } from "./suggestion-detail-modal";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "completed" | "skipped";
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  goalId?: string;
  isRecurring: boolean;
}

interface TaskSuggestionsModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onApplySuggestion: (suggestion: any) => void;
}

export function TaskSuggestionsModal({
  visible,
  task,
  onClose,
  onApplySuggestion,
}: TaskSuggestionsModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const queryClient = useQueryClient();
  
  const foregroundColor = useThemeColor("foreground");
  const successColor = useThemeColor("success");
  const warningColor = useThemeColor("warning");

  // Fetch task-specific suggestions
  const {
    data: suggestions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['task-suggestions', task?.id],
    queryFn: async () => {
      if (!task) return [];
      
      const result = await orpc.AI.getSuggestions.call({
        type: 'briefing', // Use existing briefing type for task suggestions
      });
      
      return result.suggestions || [];
    },
    enabled: visible && !!task,
  });

  const applySuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      return orpc.AI.applySuggestion.call({
        suggestionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-suggestions', task?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert("Success", "Suggestion applied successfully!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to apply suggestion");
    },
  });

  const handleApplySuggestion = (suggestion: any) => {
    if (isAnimating) return;

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsAnimating(true);
    onApplySuggestion(suggestion);
    applySuggestionMutation.mutate(suggestion.id);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // TODO: Implement dismiss suggestion functionality
    Alert.alert("Dismiss", "Dismiss functionality coming soon!");
  };

  const handleViewDetails = (suggestion: any) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setSelectedSuggestion(suggestion);
    setShowDetailModal(true);
  };

  // Use the centralized icon and color functions from suggestion-formatter
  const getIonIconName = (type: string) => {
    switch (type) {
      case "plan":
        return "document-text";
      case "briefing":
        return "chatbubble";
      case "reschedule":
        return "calendar";
      case "prioritization":
        return "flag";
      case "breakdown":
        return "list";
      case "improvement":
        return "trending-up";
      default:
        return "sparkles";
    }
  };

  if (!task) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <Animated.View entering={SlideInDown} className="w-full max-w-sm">
          <Card variant="secondary" className="p-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Animated.View entering={FadeIn} className="mb-2">
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name="sparkles"
                      size={24}
                      color="#FF6B6B"
                    />
                    <Text className="text-foreground text-lg font-semibold">
                      AI Suggestions
                    </Text>
                  </View>
                </Animated.View>
                <Text className="text-foreground text-sm text-muted-foreground">
                  For: {task.title}
                </Text>
              </View>
              <Pressable onPress={onClose} className="p-2">
                <Ionicons name="close" size={24} color={foregroundColor} />
              </Pressable>
            </View>

            {/* Suggestions List */}
            {isLoading ? (
              <View className="items-center py-8">
                <Ionicons name="time" size={32} color={foregroundColor} />
                <Text className="text-foreground text-center mt-3">
                  Loading suggestions...
                </Text>
              </View>
            ) : error ? (
              <View className="items-center py-8">
                <Ionicons name="alert-circle" size={32} color="#FF6B6B" />
                <Text className="text-foreground text-center mt-3">
                  Failed to load suggestions
                </Text>
                <Pressable
                  onPress={() => queryClient.invalidateQueries({ queryKey: ['task-suggestions', task.id] })}
                  className="mt-3 px-4 py-2 rounded-lg bg-secondary border border-secondary"
                >
                  <Text className="text-white text-sm font-medium">Retry</Text>
                </Pressable>
              </View>
            ) : suggestions.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="sparkles-outline" size={32} color={foregroundColor} />
                <Text className="text-foreground text-center mt-3">
                  No suggestions available for this task
                </Text>
                <Text className="text-foreground text-sm text-center mt-1 text-muted-foreground">
                  Check back later or try again after making progress
                </Text>
              </View>
            ) : (
              <ScrollView className="max-h-64 mb-4" showsVerticalScrollIndicator={false}>
                <View className="space-y-3">
                  {suggestions.map((suggestion: any, index: number) => {
                    const formattedSuggestion = formatSuggestion(suggestion);
                    return (
                      <Animated.View key={suggestion.id} entering={FadeIn.delay(index * 100)}>
                        <Card variant="tertiary" className="p-3">
                          <View className="flex-row items-start gap-3">
                             <View
                               className="w-8 h-8 rounded-full items-center justify-center"
                               style={{ backgroundColor: getSuggestionColor(suggestion.type) }}
                             >
                               <Text className="text-white text-sm font-bold">
                                  {getSuggestionIcon(suggestion.type)}
                               </Text>
                             </View>
                            <View className="flex-1">
                               <Text className="text-foreground text-sm font-semibold mb-1">
                                 {formattedSuggestion.title}
                               </Text>
                               <Text className="text-foreground text-xs text-muted-foreground mb-2 leading-relaxed">
                                 {formatSuggestionPreview(suggestion, 100)}
                               </Text>
                              <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-2">
                                  <Text 
                                    className="text-xs font-medium uppercase"
                                    style={{ color: getSuggestionColor(suggestion.type) }}
                                  >
                                    {suggestion.type}
                                  </Text>
                                  {formattedSuggestion.displayInfo?.relativeTime && (
                                    <Text className="text-xs text-muted-foreground">
                                      {formattedSuggestion.displayInfo.relativeTime}
                                    </Text>
                                  )}
                                </View>
                                 <View className="flex-row gap-2">
                                   <Pressable
                                     onPress={() => handleViewDetails(suggestion)}
                                     className="p-1"
                                   >
                                     <Ionicons name="eye" size={16} color={foregroundColor} />
                                   </Pressable>
                                   <Pressable
                                     onPress={() => handleDismissSuggestion(suggestion.id)}
                                     className="p-1"
                                   >
                                     <Ionicons name="close" size={16} color={foregroundColor} />
                                   </Pressable>
                                   <Pressable
                                     onPress={() => handleApplySuggestion(suggestion)}
                                     disabled={applySuggestionMutation.isPending}
                                     className="p-1"
                                   >
                                     <Ionicons 
                                       name="checkmark" 
                                       size={16} 
                                       color={successColor} 
                                     />
                                   </Pressable>
                                 </View>
                              </View>
                            </View>
                          </View>
                        </Card>
                      </Animated.View>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* Action Buttons */}
            <View className="space-y-3">
              <Pressable
                onPress={() => {
                  // TODO: Generate new suggestions
                  Alert.alert("Generate", "Generate new suggestions coming soon!");
                }}
                className="py-3 rounded-lg bg-secondary border border-secondary"
              >
                <Text className="text-white text-center font-medium">
                  Generate New Suggestions
                </Text>
              </Pressable>
              
              <Pressable
                onPress={onClose}
                className="py-2 rounded-lg"
              >
                <Text className="text-foreground text-center text-sm">
                  Close
                </Text>
              </Pressable>
            </View>
          </Card>
        </Animated.View>
      </View>

      {/* Suggestion Detail Modal */}
      <SuggestionDetailModal
         visible={showDetailModal}
         suggestion={selectedSuggestion}
         onClose={() => {
            setShowDetailModal(false);
            setSelectedSuggestion(null);
         }}
      />
    </Modal>
  );
}