import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from 'heroui-native';
import { format, startOfMonth, endOfMonth, setHours, parseISO, isToday } from 'date-fns';
import CalendarService from '../../lib/calendar-service';
import NotificationService from '../../lib/notification-service';

interface CalendarViewProps {
   onEventPress?: (event: any) => void;
   onDatePress?: (date: string) => void;
   onEventLongPress?: (event: any) => void;
}

export default function CalendarView({
   onEventPress,
   onDatePress,
   onEventLongPress
}: CalendarViewProps) {
   const [selectedDate, setSelectedDate] = useState(new Date());
   const [events, setEvents] = useState<any>({});
   const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);

   const themeColorBackground = useThemeColor('background');
   const themeColorForeground = useThemeColor('foreground');
   const themeColorSurface = useThemeColor('surface');

   // Initialize calendar
   useEffect(() => {
      initializeCalendar();
   }, []);

   // Load events when date changes
   useEffect(() => {
      loadEventsForMonth();
   }, [selectedDate]);

   // Update selected date events when events or selectedDate changes
   useEffect(() => {
      const dateKey = selectedDate.toISOString().split('T')[0];
      const daysEvents = events[dateKey] || [];
      setSelectedDateEvents(daysEvents);
   }, [events, selectedDate]);

   const initializeCalendar = async () => {
      try {
         const permissionStatus = await CalendarService.getCalendarPermissionStatus();
         if (!permissionStatus.granted) {
            await CalendarService.requestCalendarPermissions();
         }
         await NotificationService.requestPermissions();
      } catch (error) {
         console.error('Error initializing calendar:', error);
      }
   };

   const loadEventsForMonth = async () => {
      try {
         const startDate = startOfMonth(selectedDate);
         const endDate = endOfMonth(selectedDate);
         endDate.setHours(23, 59, 59, 999);

         const calendarEvents = await CalendarService.getEvents(startDate, endDate);
         const formattedEvents = formatEventsForCalendar(calendarEvents);
         setEvents(formattedEvents);
      } catch (error) {
         console.error('Error loading events:', error);
      }
   };

   const formatEventsForCalendar = (calendarEvents: any[]) => {
      const formatted: any = {};
      calendarEvents.forEach(event => {
         const dateKey = event.startDate?.split('T')[0];
         if (dateKey) {
            if (!formatted[dateKey]) {
               formatted[dateKey] = [];
            }
            formatted[dateKey].push({
               id: event.id,
               title: event.title,
               start: event.startDate,
               end: event.endDate,
               description: event.notes,
               location: event.location,
               allDay: event.allDay,
               color: '#FF6B6B', // Primary accent color
            });
         }
      });
      return formatted;
   };

   const handleDatePress = useCallback((day: any) => {
      const date = parseISO(day.dateString);
      const newDate = setHours(date, new Date().getHours());
      setSelectedDate(newDate);
      onDatePress?.(day.dateString);
   }, [onDatePress]);

   const renderHeader = () => {
      return (
         <View style={styles.header}>
            <View style={styles.headerLeft}>
               <TouchableOpacity style={[styles.monthSelector, { backgroundColor: themeColorBackground }]}>
                  <Ionicons name="calendar-outline" size={20} color={themeColorForeground} style={{ marginRight: 8 }} />
                  <Text style={[styles.headerTitle, { color: themeColorForeground }]}>
                     {format(selectedDate, 'MMMM')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={themeColorForeground} style={{ marginLeft: 4 }} />
               </TouchableOpacity>
            </View>

         </View>
      );
   };

   const renderEventItem = ({ item }: { item: any }) => {
      const startTime = parseISO(item.start);
      const endTime = parseISO(item.end);

      return (
         <TouchableOpacity
            style={[styles.eventCard, { backgroundColor: themeColorSurface }]}
            onPress={() => onEventPress?.(item)}
            onLongPress={() => onEventLongPress?.(item)}
         >
            <View style={styles.eventContent}>
               <Text style={[styles.eventTitle, { color: themeColorForeground }]}>{item.title}</Text>
               <View style={styles.eventTimeContainer}>
                  <View style={[styles.statusDot, { backgroundColor: item.color || themeColorForeground }]} />
                  <Text style={[styles.eventTime, { color: themeColorForeground }]}>
                     {item.allDay ? 'All Day' : `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`}
                  </Text>
               </View>
            </View>
            <TouchableOpacity style={[styles.deleteButton, { backgroundColor: themeColorForeground }]}>
               <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
         </TouchableOpacity>
      );
   };

    const markedDates = {
       ...Object.keys(events).reduce((acc: any, date) => {
          acc[date] = { marked: true, dotColor: themeColorForeground };
          return acc;
       }, {}),
       [format(selectedDate, 'yyyy-MM-dd')]: {
          selected: true,
          selectedColor: themeColorForeground,
          disableTouchEvent: true
       }
    };

    return (
       <View style={[styles.container, { backgroundColor: themeColorBackground }]}>
          {/* Calendar Section */}
          <View style={[styles.calendarContainer, { backgroundColor: themeColorSurface }]}>
             {renderHeader()}
             <Calendar
                current={format(selectedDate, 'yyyy-MM-dd')}
                onDayPress={handleDatePress}
                markedDates={markedDates}
                theme={{
                   backgroundColor: 'transparent',
                   calendarBackground: 'transparent',
                   textSectionTitleColor: themeColorForeground,
                   selectedDayBackgroundColor: themeColorForeground,
                   selectedDayTextColor: themeColorBackground,
                   todayTextColor: themeColorForeground,
                   dayTextColor: themeColorForeground,
                   textDisabledColor: '#CBD5E0',
                   dotColor: themeColorForeground,
                   selectedDotColor: themeColorBackground,
                   arrowColor: themeColorForeground,
                   monthTextColor: themeColorForeground,
                   textDayFontFamily: 'System',
                   textMonthFontFamily: 'System',
                   textDayHeaderFontFamily: 'System',
                   textDayFontWeight: '500',
                   textMonthFontWeight: 'bold',
                   textDayHeaderFontWeight: '500',
                   textDayFontSize: 14,
                }}
                enableSwipeMonths={true}
                hideExtraDays={true}
                style={styles.calendar}
             />
             <View style={[styles.handleBar, { backgroundColor: themeColorForeground }]} />
          </View>

         {/* Events Section */}
         <View style={styles.eventsContainer}>
            <View style={styles.dateHeader}>
               <View>
                  <Text style={[styles.dateTitle, { color: themeColorForeground }]}>{selectedDate.getDate()}</Text>
                  <Text style={[styles.dateSubtitle, { color: themeColorForeground }]}>
                     {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
                  </Text>
               </View>
                <TouchableOpacity style={[styles.viewAllButton, { backgroundColor: themeColorBackground }]}>
                   <Text style={[styles.viewAllText, { color: themeColorForeground }]}>View all</Text>
                </TouchableOpacity>
            </View>

             <Text style={[styles.eventsSummary, { color: themeColorForeground }]}>
                {selectedDateEvents.length} events
             </Text>

            <FlatList
               data={selectedDateEvents}
               renderItem={renderEventItem}
               keyExtractor={(item) => item.id}
               contentContainerStyle={styles.eventsList}
               showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                   <View style={styles.emptyState}>
                      <Text style={[styles.emptyStateText, { color: themeColorForeground }]}>No events for this day</Text>
                   </View>
                }
            />
         </View>
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   calendarContainer: {
      backgroundColor: '#fff',
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      paddingBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 5,
      zIndex: 10,
   },
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 10,
   },
   headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
   },
    monthSelector: {
       flexDirection: 'row',
       alignItems: 'center',
       paddingHorizontal: 12,
       paddingVertical: 8,
       borderRadius: 20,
    },
   headerTitle: {
      fontSize: 16,
      fontWeight: '600',
   },
   iconButton: {
      padding: 8,
   },
   avatarContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#E2E8F0',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
   },
   avatarPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: '#2D3748',
      justifyContent: 'center',
      alignItems: 'center',
   },
   avatarText: {
      color: '#fff',
      fontWeight: 'bold',
   },
   calendar: {
      marginBottom: 10,
   },
   handleBar: {
      width: 40,
      height: 4,
      backgroundColor: '#E2E8F0',
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 5,
   },
   eventsContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
   },
   dateHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
   },
    dateTitle: {
       fontSize: 32,
       fontWeight: 'bold',
    },
    dateSubtitle: {
       fontSize: 16,
       fontWeight: '500',
    },
   viewAllButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: '#FFF5F5',
      borderRadius: 12,
   },
    viewAllText: {
       fontSize: 12,
       fontWeight: '600',
    },
    eventsSummary: {
       fontSize: 14,
       marginBottom: 20,
    },
   eventsList: {
      paddingBottom: 20,
   },
    eventCard: {
       flexDirection: 'row',
       borderRadius: 16,
       padding: 16,
       marginBottom: 16,
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.05,
       shadowRadius: 8,
       elevation: 2,
       alignItems: 'center',
       justifyContent: 'space-between',
    },
   eventContent: {
      flex: 1,
   },
    eventTitle: {
       fontSize: 16,
       fontWeight: '600',
       marginBottom: 8,
    },
   eventTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
   },
    eventTime: {
       fontSize: 14,
    },
    deleteButton: {
       width: 40,
       height: 40,
       borderRadius: 12,
       justifyContent: 'center',
       alignItems: 'center',
       marginLeft: 12,
    },
   emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 40,
   },
    emptyStateText: {
       fontSize: 16,
    },
});
