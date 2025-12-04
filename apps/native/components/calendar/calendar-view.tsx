import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, Agenda } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from 'heroui-native';
import CalendarService from '../../lib/calendar-service';
import NotificationService from '../../lib/notification-service';

type ViewMode = 'month' | 'week' | 'day';

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
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<any>({});
  const [agendaItems, setAgendaItems] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  const themeColorBackground = useThemeColor('background');
  const themeColorForeground = useThemeColor('foreground');
  const themeColorPrimary = useThemeColor('foreground');
  const themeColorSecondary = useThemeColor('surface');

  // Initialize calendar
  useEffect(() => {
    initializeCalendar();
  }, []);

  // Load events when date or view mode changes
  useEffect(() => {
    loadEventsForCurrentView();
  }, [selectedDate, viewMode]);

  const initializeCalendar = async () => {
    try {
      // Request calendar permissions
      const permissionStatus = await CalendarService.getCalendarPermissionStatus();
      if (!permissionStatus.granted) {
        const granted = await CalendarService.requestCalendarPermissions();
        if (!granted) {
          console.warn('Calendar permissions not granted');
        }
      }

      // Initialize notifications
      await NotificationService.requestPermissions();
    } catch (error) {
      console.error('Error initializing calendar:', error);
    }
  };

  const loadEventsForCurrentView = async () => {
    setLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;

      switch (viewMode) {
        case 'day':
          startDate = new Date(selectedDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(selectedDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          const dayOfWeek = selectedDate.getDay();
          startDate = new Date(selectedDate);
          startDate.setDate(selectedDate.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
        default:
          startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
          endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
      }

      const calendarEvents = await CalendarService.getEvents(startDate, endDate);
      const formattedEvents = formatEventsForCalendar(calendarEvents);
      
      if (viewMode === 'month') {
        setEvents(formattedEvents);
      } else {
        setAgendaItems(formatEventsForAgenda(calendarEvents));
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
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
          color: themeColorPrimary,
        });
      }
    });

    return formatted;
  };

  const formatEventsForAgenda = (calendarEvents: any[]) => {
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
          color: themeColorPrimary,
        });
      }
    });

    return formatted;
  };

  const handleDatePress = useCallback((day: any) => {
    const date = new Date(day.dateString);
    setSelectedDate(date);
    onDatePress?.(day.dateString);
  }, [onDatePress]);

  const handleEventPress = useCallback((event: any) => {
    onEventPress?.(event);
  }, [onEventPress]);

  const handleEventLongPress = useCallback((event: any) => {
    onEventLongPress?.(event);
  }, [onEventLongPress]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
      default:
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const renderViewModeSelector = () => (
    <View style={[styles.viewModeSelector, { backgroundColor: themeColorSecondary }]}>
      {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.viewModeButton,
            viewMode === mode && [styles.activeViewMode, { backgroundColor: themeColorPrimary }]
          ]}
          onPress={() => setViewMode(mode)}
        >
          <Text style={[
            styles.viewModeText,
            { color: viewMode === mode ? '#fff' : themeColorForeground }
          ]}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderNavigation = () => (
    <View style={styles.navigation}>
      <TouchableOpacity onPress={() => navigateDate('prev')}>
        <Ionicons name="chevron-back" size={24} color={themeColorForeground} />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={goToToday}>
        <Text style={[styles.todayText, { color: themeColorPrimary }]}>Today</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigateDate('next')}>
        <Ionicons name="chevron-forward" size={24} color={themeColorForeground} />
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: themeColorBackground }]}>
      {renderNavigation()}
      {renderViewModeSelector()}
    </View>
  );

  const renderCalendar = () => {
    if (viewMode === 'month') {
      return (
        <Calendar
          current={selectedDate.toISOString().split('T')[0]}
          markedDates={Object.keys(events).reduce((acc: any, date) => {
            acc[date] = { marked: true, dots: events[date] };
            return acc;
          }, {})}
          onDayPress={handleDatePress}
          style={styles.calendar}
          theme={{
            backgroundColor: themeColorBackground,
            calendarBackground: themeColorBackground,
            textSectionTitleColor: themeColorForeground,
            selectedDayBackgroundColor: themeColorPrimary,
            selectedDayTextColor: '#fff',
            todayTextColor: themeColorPrimary,
            dayTextColor: themeColorForeground,
            textDisabledColor: '#d9e1e8',
            arrowColor: themeColorPrimary,
            monthTextColor: themeColorForeground,
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
          }}
        />
      );
    } else {
      return (
        <Agenda
          items={agendaItems}
          selected={selectedDate.toISOString().split('T')[0]}
          onDayPress={handleDatePress}
          onDayChange={(day) => setSelectedDate(new Date(day.dateString))}
          renderItem={(item) => (
            <TouchableOpacity
              style={[styles.agendaItem, { backgroundColor: themeColorSecondary }]}
              onPress={() => handleEventPress(item)}
              onLongPress={() => handleEventLongPress(item)}
            >
              <Text style={[styles.agendaItemTitle, { color: themeColorForeground }]}>
                {item.name || 'Event'}
              </Text>
              {item.height && (
                <Text style={[styles.agendaItemDescription, { color: themeColorForeground }]}>
                  Duration: {item.height} minutes
                </Text>
              )}
            </TouchableOpacity>
          )}
          style={styles.agenda}
          theme={{
            backgroundColor: themeColorBackground,
            calendarBackground: themeColorBackground,
            textSectionTitleColor: themeColorForeground,
            selectedDayBackgroundColor: themeColorPrimary,
            selectedDayTextColor: '#fff',
            todayTextColor: themeColorPrimary,
            dayTextColor: themeColorForeground,
            textDisabledColor: '#d9e1e8',
            arrowColor: themeColorPrimary,
            monthTextColor: themeColorForeground,
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            agendaDayTextColor: themeColorForeground,
            agendaDayNumColor: themeColorForeground,
            agendaTodayColor: themeColorPrimary,
            agendaKnobColor: themeColorPrimary,
          }}
        />
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: themeColorBackground }]}>
        <Text style={{ color: themeColorForeground }}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColorBackground }]}>
      {renderHeader()}
      {renderCalendar()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  todayText: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewModeSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  activeViewMode: {
    borderRadius: 6,
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  calendar: {
    flex: 1,
  },
  agenda: {
    flex: 1,
  },
  agendaItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  agendaItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  agendaItemDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});