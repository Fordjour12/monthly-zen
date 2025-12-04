import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useThemeColor } from 'heroui-native';
import CalendarView from '../../../components/calendar/calendar-view';
import EventForm from '../../../components/calendar/event-form';
import { useQuery } from '@tanstack/react-query';
import { orpc } from '@/utils/orpc';

interface CalendarEvent {
   id: string;
   title: string;
   description?: string;
   startTime: Date;
   endTime: Date;
   location?: string;
   allDay?: boolean;
   externalId?: string;
}

export default function CalendarScreen() {
   const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
   const [showEventDetails, setShowEventDetails] = useState(false);
   const [showEventForm, setShowEventForm] = useState(false);
   const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

   const themeColorBackground = useThemeColor('background');
   const themeColorForeground = useThemeColor('foreground');
   const themeColorPrimary = useThemeColor('foreground');
   const themeColorSurface = useThemeColor('surface');

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
      setSelectedEvent({
         id: event.id,
         title: event.title,
         description: event.description,
         startTime: new Date(event.start),
         endTime: new Date(event.end),
         location: event.location,
         allDay: event.allDay,
         externalId: event.externalId,
      });
      setShowEventDetails(true);
   }, []);

   const handleDatePress = useCallback((date: string) => {
      // Show event creation form for this date
      setSelectedDate(new Date(date));
      setShowEventForm(true);
   }, []);

   const handleEventLongPress = useCallback((event: any) => {
      Alert.alert(
         'Event Options',
         `What would you like to do with "${event.title}"?`,
         [
            {
               text: 'Edit',
               onPress: () => {
                  // TODO: Navigate to edit event screen
                  console.log('Edit event:', event);
               },
            },
            {
               text: 'Delete',
               style: 'destructive',
               onPress: () => {
                  Alert.alert(
                     'Delete Event',
                     `Are you sure you want to delete "${event.title}"?`,
                     [
                        {
                           text: 'Cancel',
                           style: 'cancel',
                        },
                        {
                           text: 'Delete',
                           style: 'destructive',
                           onPress: async () => {
                              try {
                                 // TODO: Delete event via API
                                 console.log('Delete event:', event);
                                 refetch();
                              } catch (error) {
                                 Alert.alert('Error', 'Failed to delete event');
                              }
                           },
                        },
                     ]
                  );
               },
            },
            {
               text: 'Cancel',
               style: 'cancel',
            },
         ]
      );
   }, [refetch]);

   const renderEventDetails = () => {
      if (!selectedEvent) return null;

      return (
         <View style={[styles.eventDetailsModal, { backgroundColor: themeColorBackground }]}>
            <View style={[styles.eventDetailsHeader, { backgroundColor: themeColorSurface }]}>
               <Text style={[styles.eventDetailsTitle, { color: themeColorForeground }]}>
                  {selectedEvent.title}
               </Text>
               <TouchableOpacity onPress={() => setShowEventDetails(false)}>
                  <Ionicons name="close" size={24} color={themeColorForeground} />
               </TouchableOpacity>
            </View>

            <ScrollView style={styles.eventDetailsContent}>
               {selectedEvent.description && (
                  <View style={styles.detailSection}>
                     <Text style={[styles.detailLabel, { color: themeColorForeground }]}>
                        Description
                     </Text>
                     <Text style={[styles.detailValue, { color: themeColorForeground }]}>
                        {selectedEvent.description}
                     </Text>
                  </View>
               )}

               <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: themeColorForeground }]}>
                     Start Time
                  </Text>
                  <Text style={[styles.detailValue, { color: themeColorForeground }]}>
                     {selectedEvent.startTime.toLocaleString()}
                  </Text>
               </View>

               <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: themeColorForeground }]}>
                     End Time
                  </Text>
                  <Text style={[styles.detailValue, { color: themeColorForeground }]}>
                     {selectedEvent.endTime.toLocaleString()}
                  </Text>
               </View>

               {selectedEvent.location && (
                  <View style={styles.detailSection}>
                     <Text style={[styles.detailLabel, { color: themeColorForeground }]}>
                        Location
                     </Text>
                     <Text style={[styles.detailValue, { color: themeColorForeground }]}>
                        {selectedEvent.location}
                     </Text>
                  </View>
               )}

               <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: themeColorForeground }]}>
                     All Day
                  </Text>
                  <Text style={[styles.detailValue, { color: themeColorForeground }]}>
                     {selectedEvent.allDay ? 'Yes' : 'No'}
                  </Text>
               </View>
            </ScrollView>

            <View style={styles.eventDetailsActions}>
               <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: themeColorPrimary }]}
                  onPress={() => {
                     // TODO: Navigate to edit event
                     console.log('Edit event:', selectedEvent);
                  }}
               >
                  <Text style={styles.actionButtonText}>Edit</Text>
               </TouchableOpacity>

               <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => {
                     Alert.alert(
                        'Delete Event',
                        `Are you sure you want to delete "${selectedEvent.title}"?`,
                        [
                           {
                              text: 'Cancel',
                              style: 'cancel',
                           },
                           {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                 try {
                                    // TODO: Delete event via API
                                    console.log('Delete event:', selectedEvent);
                                    setShowEventDetails(false);
                                    refetch();
                                 } catch (error) {
                                    Alert.alert('Error', 'Failed to delete event');
                                 }
                              },
                           },
                        ]
                     );
                  }}
               >
                  <Text style={styles.actionButtonText}>Delete</Text>
               </TouchableOpacity>
            </View>
         </View>
      );
   };

   if (isLoading) {
      return (
         <View style={[styles.loading, { backgroundColor: themeColorBackground }]}>
            <Text style={{ color: themeColorForeground }}>Loading calendar...</Text>
         </View>
      );
   }

   return (
      <View style={[styles.container, { backgroundColor: themeColorBackground }]}>
         {/* Floating Action Button */}
         <TouchableOpacity
            style={[styles.fab, { backgroundColor: themeColorPrimary }]}
            onPress={() => {
               setSelectedDate(new Date());
               setShowEventForm(true);
            }}
         >
            <Ionicons name="add" size={24} color="#fff" />
         </TouchableOpacity>

         <CalendarView
            onEventPress={handleEventPress}
            onDatePress={handleDatePress}
            onEventLongPress={handleEventLongPress}
         />

         {showEventDetails && renderEventDetails()}

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
   loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
   },
   eventDetailsModal: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
   },
   eventDetailsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e1e5e9',
   },
   eventDetailsTitle: {
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
   },
   eventDetailsContent: {
      flex: 1,
      padding: 16,
   },
   detailSection: {
      marginBottom: 20,
   },
   detailLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
      opacity: 0.7,
   },
   detailValue: {
      fontSize: 16,
   },
   eventDetailsActions: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
   },
   actionButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
   },
   deleteButton: {
      backgroundColor: '#dc3545',
   },
   actionButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
   },
   fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
   },
});
