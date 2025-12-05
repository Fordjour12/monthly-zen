import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// Helper function to format dates beautifully
const formatWeekDates = (weekNumber: number) => {
   const today = new Date();
   const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
   const startOfWeek = new Date(startOfMonth);
   startOfWeek.setDate(startOfMonth.getDate() + (weekNumber - 1) * 7);

   // Adjust to Monday
   const dayOfWeek = startOfWeek.getDay();
   const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
   startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

   const endOfWeek = new Date(startOfWeek);
   endOfWeek.setDate(startOfWeek.getDate() + 6);

   const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
   const startStr = startOfWeek.toLocaleDateString('en-US', options);
   const endStr = endOfWeek.toLocaleDateString('en-US', options);

   return `${startStr} - ${endStr}`;
};

// Component to render the full plan
export const MonthlyPlanViewer = ({ data }) => {
   // Handle different data formats
   const renderPlanContent = () => {
      // If it's a plain text string, render it as simple text
      if (typeof data === 'string') {
         return (
            <View style={styles.simpleContainer}>
               <Text style={styles.simpleText}>{data}</Text>
            </View>
         );
      }

      // If it's a simple object with just monthly_summary
      if (data && typeof data === 'object' && data.monthly_summary && !data.weekly_breakdown) {
          return (
             <View style={styles.simpleContainer}>
                <Text style={styles.heading2}>📅 Monthly Plan Summary</Text>
                <Text style={styles.summaryText}>{data.monthly_summary}</Text>
             </View>
          );
      }

      // Full structured plan
      if (data && typeof data === 'object' && data.monthly_summary) {
         return (
            <View>
               {/* Monthly Summary */}
               <Text style={styles.heading2}>📝 Monthly Summary</Text>
               <Text style={styles.summaryText}>{data.monthly_summary}</Text>

               <View style={styles.separator} />

               {/* Weekly Breakdown */}
               <Text style={styles.heading2}>📅 Weekly Breakdown</Text>
               {data.weekly_breakdown?.map((weekItem, index) => (
                  <View key={index} style={styles.weekContainer}>
                     {/* Week Focus Header with dates */}
                     <View style={styles.weekHeader}>
                        <Text style={styles.heading3}>
                           Week {weekItem.week}: {weekItem.focus}
                        </Text>
                        <Text style={styles.weekDates}>
                           {formatWeekDates(weekItem.week)}
                        </Text>
                     </View>

                     {/* Goals List */}
                     <Text style={styles.subHeading}>🎯 Goals</Text>
                     {weekItem.goals?.map((goal, gIndex) => (
                        <View key={gIndex} style={styles.listItemContainer}>
                           <Text style={styles.bullet}>•</Text>
                           <Text style={styles.listItem}>{goal}</Text>
                        </View>
                     ))}

                     {/* Daily Tasks */}
                     {weekItem.daily_tasks && renderDailyTasks(weekItem.daily_tasks)}
                  </View>
               ))}

               <View style={styles.separator} />

               {/* Planning & Success Metrics */}
               <Text style={styles.heading2}>🛡️ Planning & Success</Text>

               {data.potential_conflicts && (
                  <>
                     <Text style={styles.heading3}>⚠️ Potential Conflicts & Mitigation</Text>
                     {data.potential_conflicts.map((conflict, cIndex) => (
                        <View key={cIndex} style={styles.listItemContainer}>
                           <Text style={styles.bullet}>•</Text>
                           <Text style={styles.listItem}>{conflict}</Text>
                        </View>
                     ))}
                  </>
               )}

               {data.success_metrics && (
                  <>
                     <Text style={styles.heading3}>📊 Success Metrics</Text>
                     {data.success_metrics.map((metric, mIndex) => (
                        <View key={mIndex} style={styles.listItemContainer}>
                           <Text style={styles.bullet}>•</Text>
                           <Text style={styles.listItem}>{metric}</Text>
                        </View>
                     ))}
                  </>
               )}
            </View>
         );
      }

      // Fallback for any other format
      return (
         <View style={styles.simpleContainer}>
            <Text style={styles.simpleText}>
               {typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}
            </Text>
         </View>
      );
   };

   const renderDailyTasks = (tasksByDay) => {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      return (
         <View>
            <Text style={styles.subHeading}>📋 Daily Tasks</Text>
            {days.map(day => {
               const tasks = tasksByDay[day];
               if (!tasks || tasks.length === 0) return null;

               return (
                  <View key={day} style={styles.taskRow}>
                     <Text style={styles.taskDay}>{day}:</Text>
                     <View style={styles.taskDetailsContainer}>
                        {tasks.map((task, index) => (
                           <View key={index} style={styles.taskItem}>
                              <Text style={styles.taskBullet}>•</Text>
                              <Text style={styles.taskDetail}>{task}</Text>
                           </View>
                        ))}
                     </View>
                  </View>
               );
            })}
         </View>
      );
   };

   return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
         {renderPlanContent()}
      </ScrollView>
   );
};

// --- Styling Sheet ---
const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: 'transparent',
   },
   simpleContainer: {
      padding: 15,
   },
   simpleText: {
      fontSize: 14,
      lineHeight: 22,
      color: '#333',
   },
   heading1: {
      fontSize: 24,
      fontWeight: '900',
      color: '#1A237E',
      marginBottom: 15
   },
   heading2: {
      fontSize: 20,
      fontWeight: '700',
      color: '#333',
      marginTop: 15,
      marginBottom: 8
   },
   heading3: {
      fontSize: 16,
      fontWeight: '600',
      color: '#555',
      marginTop: 10,
      marginBottom: 5
   },
   weekHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
   },
   weekDates: {
      fontSize: 14,
      fontWeight: '500',
      color: '#666',
      fontStyle: 'italic',
   },
   summaryText: {
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 10,
      color: '#444',
   },
   subHeading: {
      fontSize: 14,
      fontWeight: 'bold',
      marginTop: 12,
      marginBottom: 6,
      color: '#333',
   },
   listItemContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 4,
      paddingLeft: 10,
   },
   bullet: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#4CAF50',
      marginRight: 8,
      marginTop: 2,
   },
   listItem: {
      fontSize: 14,
      flex: 1,
      lineHeight: 20,
      color: '#444',
   },
   separator: {
      height: 1,
      backgroundColor: '#E0E0E0',
      marginVertical: 15
   },
   weekContainer: {
      marginBottom: 20,
      padding: 15,
      borderRadius: 12,
      backgroundColor: '#F8F9FA',
      borderLeftWidth: 4,
      borderLeftColor: '#4CAF50',
   },

   // Task Row Styling
   taskRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
      alignItems: 'flex-start',
   },
   taskDay: {
      fontWeight: 'bold',
      width: 75,
      color: '#1A237E',
      fontSize: 13,
   },
   taskDetailsContainer: {
      flex: 1,
      paddingLeft: 10,
   },
   taskItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 3,
   },
   taskBullet: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#4CAF50',
      marginRight: 6,
      marginTop: 3,
   },
   taskDetail: {
      fontSize: 12,
      lineHeight: 18,
      color: '#666',
      flex: 1,
   },
});
