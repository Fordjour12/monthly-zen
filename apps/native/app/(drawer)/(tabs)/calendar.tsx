import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useThemeColor } from 'heroui-native';
import CalendarView from '../../../components/calendar/calendar-view';
import EventForm from '../../../components/calendar/event-form';
import { useQuery } from '@tanstack/react-query';
import { orpc } from '@/utils/orpc';
import { } from "date-fns";

export default function CalendarScreen() {
   const [showEventForm, setShowEventForm] = useState(false);
   const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

   const themeColorBackground = useThemeColor('background');
   const themeColorForeground = useThemeColor('foreground');

   // Fetch calendar events from backend
   const {
      data: events = [],
      isLoading,
      refetch
   } = useQuery({
      queryKey: ['calendar-events'],
      queryFn: async () => {
         const result = await orpc.calendar.getTodayEvents.call();
         return result.success ? result.data : [];
      },
   });

   // Refresh events when screen comes into focus
   useFocusEffect(
      useCallback(() => {
         refetch();
      }, [refetch])
   );

   const handleEventPress = useCallback((event: any) => {
      // Open edit form
      setSelectedDate(new Date(event.start));
      setShowEventForm(true);
   }, []);

   const handleDatePress = useCallback((date: string) => {
      setSelectedDate(new Date(date));
   }, []);

   return (
      <View style={[styles.container, { backgroundColor: themeColorBackground }]}>
         <CalendarView
            onEventPress={handleEventPress}
            onDatePress={handleDatePress}
         />

         {/* Floating Action Button - Positioned over the list */}
         <TouchableOpacity
            style={[styles.fab, { backgroundColor: '#FF6B6B' }]}
            onPress={() => {
               setSelectedDate(new Date());
               setShowEventForm(true);
            }}
         >
            <Ionicons name="add" size={24} color="#fff" />
         </TouchableOpacity>

         <EventForm
            visible={showEventForm}
            onClose={() => {
               setShowEventForm(false);
               setSelectedDate(undefined);
            }}
            date={selectedDate}
         />
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   fab: {
      position: 'absolute',
      bottom: 30,
      right: 30,
      width: 40,
      height: 40,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#FF6B6B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
   },
});
