import React, { useState, useMemo } from 'react';
import {
   View,
   Text,
   Modal,
   ScrollView,
   TouchableOpacity,
   StyleSheet,
   Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

interface SuggestionApplyModalProps {
   visible: boolean;
   classifications: SuggestionItem[];
   applyAs: 'task' | 'habit' | 'recurring-task';
   onClose: () => void;
   onApply: (selectedItems: any[]) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SuggestionApplyModal: React.FC<SuggestionApplyModalProps> = ({
   visible,
   classifications,
   applyAs,
   onClose,
   onApply,
}) => {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

   // Filter items by applyAs type
   const filteredItems = useMemo(() => {
      return classifications.filter(item => item.type === applyAs);
   }, [classifications, applyAs]);

   // Reset selection when applyAs changes
   React.useEffect(() => {
      setSelectedItems(new Set());
   }, [applyAs]);

   const toggleItem = (itemTitle: string) => {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(itemTitle)) {
         newSelected.delete(itemTitle);
      } else {
         newSelected.add(itemTitle);
      }
      setSelectedItems(newSelected);
   };

   const toggleSelectAll = () => {
      if (selectedItems.size === filteredItems.length) {
         setSelectedItems(new Set());
      } else {
         setSelectedItems(new Set(filteredItems.map(item => item.title)));
      }
   };

   const handleApply = () => {
      const items = filteredItems.filter(item => selectedItems.has(item.title));
      const formattedItems = items.map(item => ({
         title: item.title,
         description: item.reasoning,
         priority: item.suggested_priority,
         dueDate: item.due_date,
         frequency: item.suggested_frequency,
         recurrenceRule: item.recurrence_rule,
         habitPotential: item.habit_potential ? {
            isHabit: item.habit_potential.is_habit,
            frequency: item.habit_potential.frequency,
            targetValue: item.habit_potential.target_value,
            streakSuggestion: item.habit_potential.streak_suggestion,
            bestTime: item.habit_potential.best_time,
            triggerActivity: item.habit_potential.trigger_activity,
         } : undefined,
      }));
      
      onApply(formattedItems);
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

   const getConfidenceLabel = (confidence: number) => {
      if (confidence >= 0.9) return 'High';
      if (confidence >= 0.7) return 'Good';
      if (confidence >= 0.5) return 'Moderate';
      return 'Low';
   };

   if (!visible) return null;

   return (
      <Modal
         visible={visible}
         animationType="slide"
         presentationStyle="pageSheet"
      >
         <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
               <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#374151" />
               </TouchableOpacity>
               <Text style={styles.title}>
                  Select {applyAs === 'task' ? 'Tasks' : applyAs === 'habit' ? 'Habits' : 'Recurring Tasks'} to Create
               </Text>
               <View style={styles.placeholder} />
            </View>

            {/* Select All / Deselect All */}
            <View style={styles.selectAllContainer}>
               <TouchableOpacity 
                  style={styles.selectAllButton} 
                  onPress={toggleSelectAll}
               >
                  <Text style={styles.selectAllButtonText}>
                     {selectedItems.size === filteredItems.length ? 'Deselect All' : 'Select All'}
                  </Text>
               </TouchableOpacity>
               <Text style={styles.selectedCount}>
                  {selectedItems.size} of {filteredItems.length} selected
               </Text>
            </View>

            {/* Items List */}
            <ScrollView 
               style={styles.itemsList}
               showsVerticalScrollIndicator={false}
            >
               {filteredItems.map((item, index) => {
                  const isSelected = selectedItems.has(item.title);
                  const confidenceColor = getConfidenceColor(item.confidence);
                  const priorityColor = getPriorityColor(item.suggested_priority);

                  return (
                     <TouchableOpacity
                        key={index}
                        style={[
                           styles.itemCard,
                           isSelected && styles.selectedItemCard
                        ]}
                        onPress={() => toggleItem(item.title)}
                     >
                        <View style={styles.itemHeader}>
                           {/* Checkbox */}
                           <View style={[
                              styles.checkbox,
                              isSelected && styles.checkboxSelected
                           ]}>
                              {isSelected && (
                                 <Ionicons name="checkmark" size={16} color="#ffffff" />
                              )}
                           </View>

                           {/* Title and Confidence */}
                           <View style={styles.titleContainer}>
                              <Text style={[
                                 styles.itemTitle,
                                 isSelected && styles.itemTitleSelected
                              ]}>
                                 {item.title}
                              </Text>
                              <View style={styles.confidenceContainer}>
                                 <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                                    {Math.round(item.confidence * 100)}%
                                 </Text>
                                 <Text style={[styles.confidenceLabel, { color: confidenceColor }]}>
                                    {getConfidenceLabel(item.confidence)}
                                 </Text>
                              </View>
                           </View>
                        </View>

                        {/* Reasoning */}
                        <Text style={styles.itemReasoning}>{item.reasoning}</Text>

                        {/* Tags */}
                        <View style={styles.itemTags}>
                           <View style={[styles.priorityTag, { backgroundColor: priorityColor }]}>
                              <Text style={styles.tagText}>{item.suggested_priority.toUpperCase()}</Text>
                           </View>
                           
                           {item.estimated_duration && (
                              <View style={styles.durationTag}>
                                 <Text style={styles.tagText}>{item.estimated_duration}</Text>
                              </View>
                           )}
                           
                           {item.quick_win && (
                              <View style={styles.quickWinTag}>
                                 <Text style={styles.tagText}>QUICK WIN</Text>
                              </View>
                           )}
                           
                           {item.long_term_build && (
                              <View style={styles.longTermTag}>
                                 <Text style={styles.tagText}>LONG TERM</Text>
                              </View>
                           )}

                           {item.confidence < 0.7 && (
                              <View style={styles.lowConfidenceTag}>
                                 <Text style={styles.lowConfidenceText}>LOW CONFIDENCE</Text>
                              </View>
                           )}
                        </View>

                        {/* Habit Potential */}
                        {item.habit_potential && item.habit_potential.is_habit && (
                           <View style={styles.habitPotentialContainer}>
                              <Text style={styles.habitPotentialTitle}>Habit Potential:</Text>
                              <View style={styles.habitDetails}>
                                 {item.habit_potential.frequency && (
                                    <Text style={styles.habitDetailText}>
                                       • Frequency: {item.habit_potential.frequency}
                                    </Text>
                                 )}
                                 {item.habit_potential.target_value && (
                                    <Text style={styles.habitDetailText}>
                                       • Target: {item.habit_potential.target_value}x/day
                                    </Text>
                                 )}
                                 {item.habit_potential.streak_suggestion && (
                                    <Text style={styles.habitDetailText}>
                                       • Suggested streak: {item.habit_potential.streak_suggestion} days
                                    </Text>
                                 )}
                                 {item.habit_potential.best_time && (
                                    <Text style={styles.habitDetailText}>
                                       • Best time: {item.habit_potential.best_time}
                                    </Text>
                                 )}
                              </View>
                           </View>
                        )}
                     </TouchableOpacity>
                  );
               })}
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
               <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={onClose}
               >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                  style={[
                     styles.applyButton,
                     selectedItems.size === 0 && styles.applyButtonDisabled
                  ]}
                  onPress={handleApply}
                  disabled={selectedItems.size === 0}
               >
                  <Text style={styles.applyButtonText}>
                     Create {selectedItems.size} {applyAs === 'task' ? 'Task' : applyAs === 'habit' ? 'Habit' : 'Recurring Task'}{selectedItems.size !== 1 ? 's' : ''}
                  </Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: '#ffffff',
   },
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
   },
   closeButton: {
      padding: 8,
   },
   title: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1f2937',
      flex: 1,
      textAlign: 'center',
   },
   placeholder: {
      width: 40,
   },
   selectAllContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: '#f9fafb',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
   },
   selectAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#f3f4f6',
      borderRadius: 6,
   },
   selectAllButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#374151',
   },
   selectedCount: {
      fontSize: 14,
      color: '#6b7280',
   },
   itemsList: {
      flex: 1,
      paddingHorizontal: 20,
   },
   itemCard: {
      backgroundColor: '#ffffff',
      padding: 16,
      marginVertical: 8,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#e5e7eb',
   },
   selectedItemCard: {
      borderColor: '#f97316',
      backgroundColor: '#fff7ed',
   },
   itemHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
   },
   checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#d1d5db',
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
   },
   checkboxSelected: {
      backgroundColor: '#f97316',
      borderColor: '#f97316',
   },
   titleContainer: {
      flex: 1,
   },
   itemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: 4,
      lineHeight: 22,
   },
   itemTitleSelected: {
      color: '#ea580c',
   },
   confidenceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
   },
   confidenceText: {
      fontSize: 12,
      fontWeight: '700',
   },
   confidenceLabel: {
      fontSize: 11,
      fontWeight: '500',
   },
   itemReasoning: {
      fontSize: 14,
      color: '#6b7280',
      lineHeight: 20,
      marginBottom: 12,
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
   },
   tagText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#ffffff',
   },
   durationTag: {
      backgroundColor: '#dbeafe',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
   },
   quickWinTag: {
      backgroundColor: '#d1fae5',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
   },
   longTermTag: {
      backgroundColor: '#e9d5ff',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
   },
   lowConfidenceTag: {
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
   habitPotentialContainer: {
      marginTop: 8,
      padding: 12,
      backgroundColor: '#f0f9ff',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#0ea5e9',
   },
   habitPotentialTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#0c4a6e',
      marginBottom: 6,
   },
   habitDetails: {
      marginLeft: 8,
   },
   habitDetailText: {
      fontSize: 12,
      color: '#075985',
      marginBottom: 2,
   },
   footer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: '#e5e7eb',
      backgroundColor: '#ffffff',
   },
   cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      backgroundColor: '#f3f4f6',
      borderWidth: 1,
      borderColor: '#d1d5db',
   },
   cancelButtonText: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
   },
   applyButton: {
      flex: 2,
      paddingVertical: 14,
      borderRadius: 8,
      backgroundColor: '#f97316',
   },
   applyButtonDisabled: {
      backgroundColor: '#d1d5db',
   },
   applyButtonText: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
   },
});