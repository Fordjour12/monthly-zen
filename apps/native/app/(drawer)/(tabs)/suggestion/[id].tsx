import React, { useState, useEffect } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   ActivityIndicator,
   Pressable,
   Modal,
   TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSuggestion } from '@/hooks/use-suggestions';
import { MonthlyPlanViewer } from '@/lib/monthly-plan';
import { Container } from '@/components/container';
import { Card, useThemeColor } from 'heroui-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/utils/orpc';
import { SuggestionApplyModal } from './suggestion-apply-modal';

interface SuggestionItem {
   title: string;
   type: 'task' | 'habit' | 'recurring-task';
   confidence: number;
   reasoning: string;
   suggested_priority: 'low' | 'medium' | 'high';
   suggested_frequency?: 'daily' | 'weekly' | 'monthly';
   estimated_duration?: string;
   due_date?: string;
   recurrence_rule?: string;
   habit_potential?: {
      is_habit: boolean;
      frequency?: 'daily' | 'weekly' | 'monthly';
      target_value?: number;
      streak_suggestion?: number;
      best_time?: 'morning' | 'afternoon' | 'evening';
      trigger_activity?: string;
   };
   quick_win?: boolean;
   long_term_build?: boolean;
}

interface SuggestionClassification {
   classifications: SuggestionItem[];
   application_strategy: {
      recommended_order: string[];
      dependencies: string[];
      quick_wins: string[];
      long_term_builds: string[];
      total_estimated_time: string;
      balance_score: number;
   };
   warnings: string[];
   success_metrics: string[];
}

export default function SuggestionDetailScreen() {
   const { id } = useLocalSearchParams<{ id: string }>();
   const { suggestion, isLoading, error } = useSuggestion(id || '');
   const [applyAs, setApplyAs] = useState<'task' | 'habit' | 'recurring-task'>('task');
   const [showApplyModal, setShowApplyModal] = useState(false);
   const [classifications, setClassifications] = useState<SuggestionClassification | null>(null);

   const queryClient = useQueryClient();
   const foregroundColor = useThemeColor('foreground');
   const mutedColor = useThemeColor('muted');

   // Classify suggestion items
   const { data: classificationData, isLoading: classificationLoading } = useQuery({
      queryKey: ['suggestion-classification', id],
      queryFn: async () => {
         if (!id) return null;
         const result = await orpc.ai.classifySuggestionItems.call({
            suggestionId: id,
         });
         return result;
      },
      enabled: !!id && !!suggestion && !suggestion?.isApplied,
   });

   // Apply suggestion mutation
   const applyMutation = useMutation({
      mutationFn: async (data: {
         suggestionId: string;
         applyAs: string;
         selectedItems?: any[];
      }) => {
         return orpc.ai.applySuggestionAsItems.call(data);
      },
      onSuccess: (result) => {
         Alert.alert(
            'Success!',
            `Successfully created ${result.createdCount} items from your suggestion.`
         );
         setShowApplyModal(false);
         // Invalidate relevant queries
         queryClient.invalidateQueries({ queryKey: ['tasks'] });
         queryClient.invalidateQueries({ queryKey: ['habits'] });
         queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      },
      onError: (error: any) => {
         Alert.alert('Error', `Failed to apply suggestion: ${error.message}`);
      },
   });

   useEffect(() => {
      if (classificationData) {
         setClassifications(classificationData);
      }
   }, [classificationData]);

   const handleApplyAll = () => {
      if (!suggestion || !id) return;

      applyMutation.mutate({
         suggestionId: id,
         applyAs,
         applyAll: true,
      });
   };

   const handleApplySelected = (selectedItems: any[]) => {
      if (!suggestion || !id) return;

      applyMutation.mutate({
         suggestionId: id,
         applyAs,
         selectedItems,
         applyAll: false,
      });
   };

   const getConfidenceColor = (confidence: number) => {
      if (confidence >= 0.9) return '#10b981'; // green-500
      if (confidence >= 0.7) return '#eab308'; // yellow-500
      if (confidence >= 0.5) return '#f97316'; // orange-500
      return '#ef4444'; // red-500
   };

   const getPriorityColor = (priority: string) => {
      switch (priority) {
         case 'high': return '#ef4444';
         case 'medium': return '#eab308';
         case 'low': return '#10b981';
         default: return '#6b7280';
      }
};

   const renderSuggestionContent = () => {
      if (!suggestion?.content) return null;

      const content = typeof suggestion.content === 'string' 
         ? JSON.parse(suggestion.content) 
         : suggestion.content;

      return (
         <Card variant="secondary" className="mb-6 p-4">
            <Card.Title className="mb-4">Suggestion Content</Card.Title>
            
            {content.monthly_summary && (
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Monthly Summary</Text>
                  <Text style={styles.sectionContent}>{content.monthly_summary}</Text>
               </View>
            )}

            {content.weekly_breakdown && (
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
                  {content.weekly_breakdown.map((week: any, index: number) => (
                     <View key={index} style={styles.weekCard}>
                        <Text style={styles.weekTitle}>Week {week.week}: {week.focus}</Text>
                        {week.goals && (
                           <View style={styles.goalsContainer}>
                              {week.goals.map((goal: any, goalIndex: number) => (
                                 <Text key={goalIndex} style={styles.goalText}>• {goal}</Text>
                              ))}
                           </View>
                        )}
                     </View>
                  ))}
               </View>
            )}
         </Card>
      );
   };

   const renderClassifications = () => {
      if (!classifications) return null;

      const filteredItems = classifications.classifications.filter(
         item => item.type === applyAs
      );

      return (
         <Card variant="secondary" className="mb-6 p-4">
            <Card.Title className="mb-4">
               {applyAs === 'task' ? 'Tasks' : applyAs === 'habit' ? 'Habits' : 'Recurring Tasks'} 
               {' '}({filteredItems.length})
            </Card.Title>

            {/* Apply Type Selector */}
            <View style={styles.applyTypeSelector}>
               {(['task', 'habit', 'recurring-task'] as const).map((type) => (
                  <TouchableOpacity
                     key={type}
                     style={[
                        styles.applyTypeButton,
                        applyAs === type && styles.applyTypeButtonActive
                     ]}
                     onPress={() => setApplyAs(type)}
                  >
                     <Text style={[
                        styles.applyTypeButtonText,
                        applyAs === type && styles.applyTypeButtonTextActive
                     ]}>
                        {type === 'task' ? 'Tasks' : type === 'habit' ? 'Habits' : 'Recurring'}
                     </Text>
                  </TouchableOpacity>
               ))}
            </View>

            {/* Warnings */}
            {classifications.warnings.length > 0 && (
               <View style={styles.warningsContainer}>
                  <Text style={styles.warningsTitle}>⚠️ Warnings</Text>
                  {classifications.warnings.map((warning, index) => (
                     <Text key={index} style={styles.warningText}>• {warning}</Text>
                  ))}
               </View>
            )}

            {/* Items List */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
               {filteredItems.map((item, index) => (
                  <View key={index} style={styles.itemCard}>
                     <View style={styles.itemHeader}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <View style={styles.itemBadges}>
                           <Text style={[styles.confidenceText, { color: getConfidenceColor(item.confidence) }]}>
                              {Math.round(item.confidence * 100)}%
                           </Text>
                           {item.confidence < 0.7 && (
                              <View style={styles.lowConfidenceBadge}>
                                 <Text style={styles.lowConfidenceText}>Low Confidence</Text>
                              </View>
                           )}
                        </View>
                     </View>

                     <Text style={styles.itemReasoning}>{item.reasoning}</Text>

                     <View style={styles.itemTags}>
                        <Text style={[styles.priorityTag, { backgroundColor: getPriorityColor(item.suggested_priority) }]}>
                           {item.suggested_priority.toUpperCase()}
                        </Text>
                        {item.estimated_duration && (
                           <Text style={styles.durationTag}>{item.estimated_duration}</Text>
                        )}
                        {item.quick_win && (
                           <Text style={styles.quickWinTag}>QUICK WIN</Text>
                        )}
                        {item.long_term_build && (
                           <Text style={styles.longTermTag}>LONG TERM</Text>
                        )}
                     </View>
                  </View>
               ))}
            </ScrollView>

            {/* Apply Actions */}
            <View style={styles.applyActions}>
               <TouchableOpacity
                  style={styles.applyAllButton}
                  onPress={handleApplyAll}
                  disabled={applyMutation.isPending || filteredItems.length === 0}
               >
                  {applyMutation.isPending ? (
                     <ActivityIndicator size="small" color="#fff" />
                  ) : (
                     <Text style={styles.applyAllButtonText}>
                        Apply All {filteredItems.length} {applyAs === 'task' ? 'Tasks' : applyAs === 'habit' ? 'Habits' : 'Recurring Tasks'}
                     </Text>
                  )}
               </TouchableOpacity>

               <TouchableOpacity
                  style={styles.selectItemsButton}
                  onPress={() => setShowApplyModal(true)}
                  disabled={filteredItems.length === 0}
               >
                  <Text style={styles.selectItemsButtonText}>
                     Select Specific Items to Apply
                  </Text>
               </TouchableOpacity>
            </View>
         </Card>
      );
   };

// Parse content data based on suggestion type
   const parseSuggestionContent = () => {
      try {
         // If content is already an object, return as is
         if (typeof suggestion?.content === 'object') {
            return suggestion.content;
         }
         
         // If content is a string, try to parse as JSON
         if (typeof suggestion?.content === 'string') {
            // Try to parse as JSON first
            try {
               return JSON.parse(suggestion.content);
            } catch {
               // If JSON parsing fails, return as plain text
               return suggestion.content;
            }
         }
         
         return suggestion?.content;
      } catch (error) {
         console.error('Error parsing suggestion content:', error);
         return suggestion?.content;
      }
};

    const parsedContent = parseSuggestionContent();

    if (isLoading || classificationLoading) {
      return (
         <Container className="p-4">
            <View style={styles.centerContainer}>
               <ActivityIndicator size="large" color={foregroundColor} />
               <Text style={styles.loadingText}>Loading suggestion...</Text>
            </View>
         </Container>
      );
   }

   const renderContent = () => {
      // For plan type suggestions, use MonthlyPlanViewer
      if (suggestion.type === 'plan') {
         return <MonthlyPlanViewer data={parsedContent} />;
      }

      // For other types, render basic content
      return (
         <View style={styles.contentContainer}>
            <Text style={styles.title}>{suggestion.title}</Text>
            <Text style={styles.description}>{suggestion.description}</Text>
            
            <View style={styles.separator} />
            
            {/* Render content based on type */}
            {typeof parsedContent === 'string' ? (
               <Text style={styles.textContent}>{parsedContent}</Text>
            ) : typeof parsedContent === 'object' ? (
               <Text style={styles.jsonContent}>
                  {JSON.stringify(parsedContent, null, 2)}
               </Text>
            ) : null}
         </View>
      );
   };

   return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
         {renderContent()}
      </ScrollView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: '#fff',
   },
   centerContainer: {
      flex:1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
   },
   loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#666',
   },
   errorText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#d32f2f',
      marginBottom: 8,
   },
   errorDetail: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
   },
   section: {
      marginBottom: 20,
   },
   sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: 10,
   },
   sectionContent: {
      fontSize: 16,
      color: '#374151',
      lineHeight: 24,
   },
   weekCard: {
      backgroundColor: '#f9fafb',
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: '#f97316',
   },
   weekTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: 8,
   },
   goalsContainer: {
      marginLeft: 10,
   },
   goalText: {
      fontSize: 14,
      color: '#374151',
      marginBottom: 4,
   },
   applyTypeSelector: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
   },
   applyTypeButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: '#f3f4f6',
      borderWidth: 1,
      borderColor: '#d1d5db',
   },
   applyTypeButtonActive: {
      backgroundColor: '#f97316',
      borderColor: '#f97316',
   },
   applyTypeButtonText: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '500',
      color: '#374151',
   },
   applyTypeButtonTextActive: {
      color: '#ffffff',
   },
   warningsContainer: {
      backgroundColor: '#fef2f2',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#ef4444',
   },
   warningsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#dc2626',
      marginBottom: 8,
   },
   warningText: {
      fontSize: 14,
      color: '#dc2626',
      marginBottom: 4,
   },
   itemCard: {
      backgroundColor: '#f9fafb',
      padding: 15,
      borderRadius: 8,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: '#e5e7eb',
   },
   itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
   },
   itemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1f2937',
      flex: 1,
      marginRight: 10,
   },
   itemBadges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
   },
   confidenceText: {
      fontSize: 12,
      fontWeight: '600',
   },
   lowConfidenceBadge: {
      backgroundColor: '#fed7aa',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
   },
   lowConfidenceText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#ea580c',
   },
   itemReasoning: {
      fontSize: 14,
      color: '#6b7280',
      marginBottom: 10,
      lineHeight: 20,
   },
   itemTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
   },
   priorityTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      fontSize: 10,
      fontWeight: '600',
      color: '#ffffff',
   },
   durationTag: {
      backgroundColor: '#dbeafe',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      fontSize: 10,
      fontWeight: '600',
      color: '#1e40af',
   },
   quickWinTag: {
      backgroundColor: '#d1fae5',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      fontSize: 10,
      fontWeight: '600',
      color: '#065f46',
   },
   longTermTag: {
      backgroundColor: '#e9d5ff',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      fontSize: 10,
      fontWeight: '600',
      color: '#581c87',
   },
   applyActions: {
      marginTop: 20,
      gap: 12,
   },
   applyAllButton: {
      backgroundColor: '#f97316',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
   },
   applyAllButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
   },
   selectItemsButton: {
      backgroundColor: '#f3f4f6',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#d1d5db',
   },
   selectItemsButtonText: {
      color: '#374151',
      fontSize: 16,
      fontWeight: '600',
   },
});