import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Container } from '@/components/container';
import { Card, useThemeColor } from 'heroui-native';
import { useSuggestions } from '@/hooks/use-suggestions';
import { useRouter } from 'expo-router';
import { orpc } from '@/utils/orpc';

// Helper function to parse suggestion content
const parseSuggestionContent = (content: any) => {
   try {
      if (typeof content === 'object') {
         return content;
      }
      if (typeof content === 'string') {
         try {
            return JSON.parse(content);
         } catch {
            return content;
         }
      }
      return content;
   } catch (error) {
      console.error('Error parsing suggestion content:', error);
      return content;
   }
};

// Helper function to extract monthly summary for preview
const getPreviewContent = (suggestion: any) => {
   const parsedContent = parseSuggestionContent(suggestion.content);

   if (suggestion.type === 'plan') {
      if (typeof parsedContent === 'string') {
         return parsedContent;
      }
      if (parsedContent && typeof parsedContent === 'object' && parsedContent.monthly_summary) {
         return parsedContent.monthly_summary;
      }
      return typeof parsedContent === 'object'
         ? `${JSON.stringify(parsedContent).substring(0, 200)} ...`
         : String(parsedContent);
   }

   return typeof parsedContent === 'string'
      ? parsedContent
      : `${JSON.stringify(parsedContent).substring(0, 200)}  ...`
};

export default function Index() {
   const foregroundColor = useThemeColor("foreground");
   const router = useRouter();
   const [applyingId, setApplyingId] = useState<string | null>(null);

   const {
      suggestions,
      count,
      isLoading,
      error,
      refetch,
      isFetching
   } = useSuggestions({
      limit: 50,
   });

   const handleApplySuggestion = async (suggestionId: string) => {
      setApplyingId(suggestionId);

      try {
         // Step 1: AI Classifies Items
         console.log('🤖 Step 1: AI Classifying items...');

         // Step 2: Apply suggestion (creates Tasks/Habits/Recurring Tasks)
         console.log('📝 Step 2: Creating tasks, habits, and recurring tasks...');

         const result = await orpc.AI.applySuggestionAsItems.call({
            suggestionId,
            applyAs: "task", // Auto-classify and apply
         });

         // Step 3: Calendar Population happens automatically in the backend
         console.log('📅 Step 3: Populating calendar...');

         Alert.alert(
            'Success! 🎉',
            `Plan applied successfully!\n\n✓ Created ${result.createdCount} items\n✓ Tasks, habits, and recurring tasks added\n✓ Calendar populated`,
            [
               {
                  text: 'View Details',
                  onPress: () => router.push(`/suggestion/${suggestionId}`),
               },
               {
                  text: 'OK',
                  style: 'default',
               },
            ]
         );

         // Refresh the list to show updated status
         refetch();
      } catch (error) {
         console.error('Failed to apply suggestion:', error);
         Alert.alert(
            'Error',
            `Failed to apply plan: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or view details for more options.`,
            [
               {
                  text: 'View Details',
                  onPress: () => router.push(`/suggestion/${suggestionId}`),
               },
               {
                  text: 'OK',
                  style: 'cancel',
               },
            ]
         );
      } finally {
         setApplyingId(null);
      }
   };

   const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
      });
   };

   const getTypeIcon = (type: string) => {
      switch (type) {
         case 'plan':
            return '📋';
         case 'briefing':
            return '📝';
         case 'reschedule':
            return '🔄';
         default:
            return '💡';
      }
   };

   const getTypeColor = (type: string) => {
      switch (type) {
         case 'plan':
            return '#4CAF50';
         case 'briefing':
            return '#2196F3';
         case 'reschedule':
            return '#FF9800';
         default:
            return '#9C27B0';
      }
   };

   if (isLoading) {
      return (
         <Container className="p-6">
            <View className="flex-1 justify-center items-center">
               <ActivityIndicator size="large" color={foregroundColor} />
               <Text className="text-muted-foreground mt-4">Loading suggestions...</Text>
            </View>
         </Container>
      );
   }

   if (error) {
      return (
         <Container className="p-6">
            <Card variant="secondary" className="p-4">
               <Text className="text-danger text-center mb-4">Failed to load suggestions</Text>
               <Pressable
                  onPress={() => refetch()}
                  className="bg-accent p-3 rounded-lg flex-row justify-center items-center"
               >
                  <Text className="text-foreground font-medium">Try Again</Text>
               </Pressable>
            </Card>
         </Container>
      );
   }

   return (
      <Container className="p-2">
         <Card className="mb-6 p-2">
            <Card.Title className="mb-4 pb-3 text-2xl">AI Suggestions</Card.Title>
            <Text className="text-foreground mb-4">
               Your personalized AI suggestions and plans
            </Text>

            <View className="flex-row justify-between items-center">
               <Text className="text-sm text-foreground">
                  {count} suggestion{count !== 1 ? 's' : ''}
               </Text>
               <Pressable
                  onPress={() => refetch()}
                  disabled={isFetching}
                  className="bg-orange-500 px-3 py-1 rounded-lg disabled:opacity-50"
               >
                  <Text className="text-xs text-foreground">
                     {isFetching ? 'Refreshing...' : 'Refresh'}
                  </Text>
               </Pressable>
            </View>
         </Card>
         <ScrollView showsVerticalScrollIndicator={false}>
            {suggestions.length === 0 ? (
               <Card variant="secondary" className="p-6">
                  <View className="items-center">
                     <Text className="text-4xl mb-4">💡</Text>
                     <Text className="text-foreground text-center mb-2">No suggestions yet</Text>
                     <Text className="text-muted-foreground text-center text-sm">
                        Generate a plan or get AI suggestions to see them here
                     </Text>
                  </View>
               </Card>
            ) : (
               suggestions.map((suggestion: any) => (
                  <Card key={suggestion.id} variant="secondary" className="mb-4 p-4">
                     <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-row items-center flex-1">
                           <Text className="text-2xl mr-3">
                              {getTypeIcon(suggestion.type)}
                           </Text>
                           <View className="flex-1">
                              <Text className="text-foreground font-medium capitalize">
                                 {suggestion.type} Suggestion
                              </Text>
                              <Text className="text-xs text-orange-500">
                                 {formatDate(suggestion.createdAt)}
                              </Text>
                           </View>
                        </View>
                        <View
                           className="px-2 py-1 rounded-full"
                           style={{ backgroundColor: getTypeColor(suggestion.type) + '20' }}
                        >
                           <Text
                              className="text-xs font-medium"
                              style={{ color: getTypeColor(suggestion.type) }}
                           >
                              {suggestion.isApplied ? 'Applied' : 'Pending'}
                           </Text>
                        </View>
                     </View>

                     {/* Preview of content */}
                     <View className="bg-surface/50 rounded-lg p-3 mb-3">
                        <Text className="text-foreground text-sm leading-relaxed" numberOfLines={3}>
                           {getPreviewContent(suggestion)}
                        </Text>
                     </View>

                     {/* Action buttons */}
                     <View className="flex-row space-x-2">
                        <Pressable
                           className="flex-1 bg-orange-500  p-2 rounded-lg flex-row justify-center items-center"
                           onPress={() => {
                              router.push(`/suggestion/${suggestion.id}`);
                           }}
                        >
                           <Text className="text-foreground font-medium text-sm">View Details</Text>
                        </Pressable>

                        {!suggestion.isApplied && (
                           <Pressable
                              className="flex-1 bg-background p-2 rounded-lg flex-row justify-center items-center disabled:opacity-50"
                              onPress={() => handleApplySuggestion(suggestion.id)}
                              disabled={applyingId === suggestion.id}
                           >
                              {applyingId === suggestion.id ? (
                                 <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                 <Text className="text-foreground font-medium text-sm">✓ Apply</Text>
                              )}
                           </Pressable>
                        )}
                     </View>
                  </Card>
               ))
            )}
         </ScrollView>
      </Container>
   );
}
