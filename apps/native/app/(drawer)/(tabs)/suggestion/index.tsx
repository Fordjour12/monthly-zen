import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Container } from '@/components/container';
import { Card, useThemeColor } from 'heroui-native';
import { useSuggestions, useApplySuggestion } from '@/hooks/use-suggestions';

export default function Index() {
   const mutedColor = useThemeColor("muted");
   const foregroundColor = useThemeColor("foreground");

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
      <Container className="p-6">
         <ScrollView showsVerticalScrollIndicator={false}>
            <Card variant="secondary" className="mb-6 p-4">
               <Card.Title className="mb-4 text-2xl">AI Suggestions</Card.Title>
               <Text className="text-muted-foreground mb-4">
                  Your personalized AI suggestions and plans
               </Text>
               
               <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted-foreground">
                     {count} suggestion{count !== 1 ? 's' : ''}
                  </Text>
                  <Pressable
                     onPress={() => refetch()}
                     disabled={isFetching}
                     className="bg-surface px-3 py-1 rounded-lg disabled:opacity-50"
                  >
                     <Text className="text-xs text-foreground">
                        {isFetching ? 'Refreshing...' : 'Refresh'}
                     </Text>
                  </Pressable>
               </View>
            </Card>

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
                              <Text className="text-xs text-muted-foreground">
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
                           {typeof suggestion.content === 'string' 
                              ? suggestion.content 
                              : JSON.stringify(suggestion.content).substring(0, 200) + '...'
                           }
                        </Text>
                     </View>

                     {/* Action buttons */}
                     <View className="flex-row space-x-2">
                        <Pressable
                           className="flex-1 bg-accent p-2 rounded-lg flex-row justify-center items-center"
                           onPress={() => {
                              // Navigate to suggestion detail or open modal
                              console.log('View suggestion:', suggestion.id);
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
