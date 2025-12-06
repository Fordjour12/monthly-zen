import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Container } from '@/components/container';
import { Card, useThemeColor } from 'heroui-native';
import { useSuggestions, useApplySuggestion } from '@/hooks/use-suggestions';
import { useRouter } from 'expo-router';

// Helper function to parse suggestion content like monthly-plan.tsx
const parseSuggestionContent = (content: any) => {
   try {
      // If content is already an object, return as is
      if (typeof content === 'object') {
         return content;
      }

      // If content is a string, try to parse as JSON
      if (typeof content === 'string') {
         // Try to parse as JSON first
         try {
            return JSON.parse(content);
         } catch {
            // If JSON parsing fails, return as plain text
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

   // For plan type suggestions, extract monthly summary
   if (suggestion.type === 'plan') {
      // If it's a plain text string, use it directly
      if (typeof parsedContent === 'string') {
         return parsedContent;
      }

      // If it's an object with monthly_summary, use that
      if (parsedContent && typeof parsedContent === 'object' && parsedContent.monthly_summary) {
         return parsedContent.monthly_summary;
      }

      // Fallback to stringified content
      return typeof parsedContent === 'object'
         ? `${JSON.stringify(parsedContent).substring(0, 200)} ...`
         : String(parsedContent);
   }

   // For other types, use existing logic
   return typeof parsedContent === 'string'
      ? parsedContent
      : `${JSON.stringify(parsedContent).substring(0, 200)}  ...`
};

export default function Index() {
   const mutedColor = useThemeColor("muted");
   const foregroundColor = useThemeColor("foreground");

   const router = useRouter();

   // Use custom hook for suggestions with persistence
   const {
      suggestions,
      count,
      isLoading,
      error,
      refetch,
      isFetching
   } = useSuggestions({
      limit: 50, // Load up to 50 suggestions
   });

   const { applySuggestion } = useApplySuggestion();

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
        <Card  className="mb-6 p-2">
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
                              // Navigate to suggestion detail or open modal
                              console.log('View suggestion:', suggestion.id);
                              router.push(`/suggestion/${suggestion.id}`);
                           }}
                        >
                           <Text className="text-foreground font-medium text-sm">View Details</Text>
                        </Pressable>

                        {!suggestion.isApplied && (
                           <Pressable
                              className="flex-1 bg-surface p-2 rounded-lg flex-row justify-center items-center"
                              onPress={async () => {
                                 try {
                                    await applySuggestion(suggestion.id);
                                    refetch(); // Refresh the list
                                 } catch (error) {
                                    console.error('Failed to apply suggestion:', error);
                                 }
                              }}
                           >
                              <Text className="text-foreground font-medium text-sm">Apply</Text>
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
