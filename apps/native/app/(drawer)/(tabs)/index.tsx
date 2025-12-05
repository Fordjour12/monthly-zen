import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useThemeColor } from 'heroui-native';
import { useFocusEffect } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/utils/orpc';

import GoalCard from '../../../components/dashboard/goal-card';
import CalendarHeatmap from '../../../components/dashboard/calendar-heatmap';
import WeeklyOverview from '../../../components/dashboard/weekly-overview';
import QuickAdd from '../../../components/dashboard/quick-add';

// Mock data for now until API endpoints are ready
const MOCK_HEATMAP_DATA = [
   { date: '2025-11-01', count: 2 },
   { date: '2025-11-02', count: 5 },
   { date: '2025-11-03', count: 1 },
   { date: '2025-11-04', count: 4 },
   { date: '2025-11-05', count: 6 },
   { date: '2025-11-06', count: 3 },
   { date: '2025-11-07', count: 0 },
   { date: '2025-11-08', count: 2 },
   { date: '2025-11-09', count: 5 },
   { date: '2025-11-10', count: 4 },
   { date: '2025-12-01', count: 3 },
   { date: '2025-12-02', count: 6 },
   { date: '2025-12-03', count: 2 },
   { date: '2025-12-04', count: 5 },
];

const MOCK_WEEKLY_DATA = [
   { label: 'M', value: 3 },
   { label: 'T', value: 5 },
   { label: 'W', value: 4 },
   { label: 'T', value: 6 },
   { label: 'F', value: 2 },
   { label: 'S', value: 1 },
   { label: 'S', value: 0 },
];

export default function DashboardScreen() {
   const themeColorBackground = useThemeColor('background');
   const themeColorForeground = useThemeColor('foreground');

   const queryClient = useQueryClient();
   const [refreshing, setRefreshing] = useState(false);

   // Fetch Goals
   const { data: goals = [] } = useQuery({
      queryKey: ['goals'],
      queryFn: async () => {
         // TODO: Replace with actual API call
         // const result = await orpc.goals.list.call();
         // return result.success ? result.data : [];
         return [
            { id: '1', title: 'Run 5k 3x a week', category: 'Health', progress: 65, status: 'on-track' },
            { id: '2', title: 'Complete React Course', category: 'Learning', progress: 40, status: 'behind' },
            { id: '3', title: 'Read 2 Books', category: 'Personal', progress: 10, status: 'at-risk' },
         ];
      },
   });

   const quickAddMutation = useMutation({
      mutationFn: async (text: string) => {
         // Call AI to categorize
         const analysis = await orpc.AI.categorizeTask.call({ text });
         console.log('AI Analysis:', analysis);

         // Create task with analyzed data
         // TODO: Call create task API with analysis.title, analysis.category, etc.
         // For now just simulating success
         return { success: true, analysis };
      },
      onSuccess: (data) => {
         Alert.alert('Task Added', `Added "${data.analysis.title}" to ${data.analysis.category}`);
         queryClient.invalidateQueries({ queryKey: ['goals'] });
      },
      onError: (error) => {
         console.error('Quick add error:', error);
         Alert.alert('Error', 'Failed to add task');
      }
   });

   // Fetch Weekly Summary
   const { data: weeklySummary } = useQuery({
      queryKey: ['weekly-summary'],
      queryFn: async () => {
         try {
            const result = await orpc.AI.generateWeeklySummary.call({ weekData: MOCK_WEEKLY_DATA });
            return result;
         } catch (e) {
            return {
               summary: "You're doing great! Keep tracking your progress to get more detailed insights.",
               highlights: []
            };
         }
      },
   });

   const onRefresh = useCallback(async () => {
      setRefreshing(true);
      await queryClient.invalidateQueries();
      setRefreshing(false);
   }, [queryClient]);

   return (
      <ScrollView
         style={[styles.container, { backgroundColor: themeColorBackground }]}
         contentContainerStyle={styles.content}
         refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
         }
      >
         <View style={styles.header}>
            <Text style={[styles.greeting, { color: themeColorForeground }]}>Good Morning,</Text>
            <Text style={[styles.name, { color: themeColorForeground }]}>Phantom</Text>
         </View>

         <QuickAdd onAdd={async (text) => { await quickAddMutation.mutateAsync(text); }} />

         <WeeklyOverview
            summary={weeklySummary?.summary || "Loading insights..."}
            chartData={MOCK_WEEKLY_DATA}
         />

         <CalendarHeatmap data={MOCK_HEATMAP_DATA} />

         <Text style={[styles.sectionTitle, { color: themeColorForeground }]}>Your Goals</Text>
         {goals.map((goal: any) => (
            <GoalCard
               key={goal.id}
               title={goal.title}
               category={goal.category}
               progress={goal.progress}
               status={goal.status}
               onPress={() => console.log('Goal pressed:', goal.id)}
            />
         ))}

         <View style={{ height: 40 }} />
      </ScrollView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   content: {
      padding: 20,
   },
   header: {
      marginBottom: 24,
      marginTop: 10,
   },
   greeting: {
      fontSize: 16,
      opacity: 0.7,
   },
   name: {
      fontSize: 28,
      fontWeight: 'bold',
   },
   sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 16,
      marginTop: 8,
   },
});
