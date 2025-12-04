import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from 'heroui-native';
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
      const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
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
    const date = new Date(day.dateString);
    // Adjust for timezone if needed, but usually dateString is local YYYY-MM-DD
    // We want to set the selected date to this day
    const newDate = new Date(date);
    newDate.setHours(new Date().getHours()); // Keep current time
    setSelectedDate(newDate);
    onDatePress?.(day.dateString);
  }, [onDatePress]);

  const renderHeader = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.monthSelector}>
            <Ionicons name="calendar-outline" size={20} color={themeColorForeground} style={{ marginRight: 8 }} />
            <Text style={[styles.headerTitle, { color: themeColorForeground }]}>
              {monthNames[selectedDate.getMonth()]}
            </Text>
            <Ionicons name="chevron-down" size={16} color={themeColorForeground} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={22} color={themeColorForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>U</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEventItem = ({ item }: { item: any }) => {
    const startTime = new Date(item.start);
    const endTime = new Date(item.end);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => onEventPress?.(item)}
        onLongPress={() => onEventLongPress?.(item)}
      >
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <View style={styles.eventTimeContainer}>
            <View style={[styles.statusDot, { backgroundColor: item.color || '#FF6B6B' }]} />
            <Text style={styles.eventTime}>
              {item.allDay ? 'All Day' : `${formatTime(startTime)} - ${formatTime(endTime)}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const markedDates = {
    ...Object.keys(events).reduce((acc: any, date) => {
      acc[date] = { marked: true, dotColor: '#FF6B6B' };
      return acc;
    }, {}),
    [selectedDate.toISOString().split('T')[0]]: {
      selected: true,
      selectedColor: '#FF6B6B',
      disableTouchEvent: true
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FB' }]}>
      {/* Calendar Section */}
      <View style={styles.calendarContainer}>
        {renderHeader()}
        <Calendar
          current={selectedDate.toISOString().split('T')[0]}
          onDayPress={handleDatePress}
          markedDates={markedDates}
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: '#A0A0A0',
            selectedDayBackgroundColor: '#FF6B6B',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#FF6B6B',
            dayTextColor: '#2D3748',
            textDisabledColor: '#CBD5E0',
            dotColor: '#FF6B6B',
            selectedDotColor: '#ffffff',
            arrowColor: '#2D3748',
            monthTextColor: '#2D3748',
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
        <View style={styles.handleBar} />
      </View>

      {/* Events Section */}
      <View style={styles.eventsContainer}>
        <View style={styles.dateHeader}>
          <View>
            <Text style={styles.dateTitle}>{selectedDate.getDate()}</Text>
            <Text style={styles.dateSubtitle}>Today</Text>
          </View>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.eventsSummary}>
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
              <Text style={styles.emptyStateText}>No events for this day</Text>
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
    backgroundColor: '#F3F4F6',
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
    color: '#1A202C',
  },
  dateSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#718096',
  },
  viewAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
  },
  viewAllText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  eventsSummary: {
    fontSize: 14,
    color: '#A0AEC0',
    marginBottom: 20,
  },
  eventsList: {
    paddingBottom: 20,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
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
    color: '#2D3748',
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
    color: '#718096',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
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
    color: '#A0AEC0',
    fontSize: 16,
  },
});