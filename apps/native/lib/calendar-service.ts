import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  allDay?: boolean;
  reminders?: CalendarReminder[];
  recurrenceRule?: string;
}

export interface CalendarReminder {
  minutes: number;
  method: 'alert' | 'email' | 'sms';
}

export interface CalendarPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface NotificationSettings {
  enabled: boolean;
  defaultReminder: number; // minutes before event
  sound: boolean;
  vibration: boolean;
  customReminders: number[]; // custom reminder times in minutes
}

class CalendarService {
  private static instance: CalendarService;
  private defaultCalendarId: string | null = null;

  static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  // Permission Management
  async requestCalendarPermissions(): Promise<CalendarPermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        return {
          granted: status === 'granted',
          canAskAgain: status !== 'denied',
          status
        };
      } else {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        return {
          granted: status === 'granted',
          canAskAgain: status !== 'denied',
          status
        };
      }
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return {
        granted: false,
        canAskAgain: true,
        status: 'denied'
      };
    }
  }

  async getCalendarPermissionStatus(): Promise<CalendarPermissionStatus> {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      return {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
        status
      };
    } catch (error) {
      console.error('Error getting calendar permission status:', error);
      return {
        granted: false,
        canAskAgain: true,
        status: 'denied'
      };
    }
  }

  // Calendar Management
  async getDefaultCalendar(): Promise<string | null> {
    try {
      const calendars = await Calendar.getCalendarsAsync();
      if (calendars.length === 0) {
        return null;
      }

      // Try to find the default calendar
      const defaultCalendar = calendars.find(cal => cal.isPrimary) || calendars[0];
      this.defaultCalendarId = defaultCalendar.id;
      return defaultCalendar.id;
    } catch (error) {
      console.error('Error getting default calendar:', error);
      return null;
    }
  }

  async getAllCalendars(): Promise<Calendar.Calendar[]> {
    try {
      return await Calendar.getCalendarsAsync();
    } catch (error) {
      console.error('Error getting calendars:', error);
      return [];
    }
  }

  // Event Management
  async createEvent(event: CalendarEvent): Promise<string | null> {
    try {
      const calendarId = this.defaultCalendarId || await this.getDefaultCalendar();
      if (!calendarId) {
        throw new Error('No calendar available');
      }

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        notes: event.description,
        allDay: event.allDay || false,
        alarms: event.reminders?.map(reminder => ({
          relativeOffset: reminder.minutes,
          method: reminder.method === 'alert' ? Calendar.AlarmMethod.ALARM : Calendar.AlarmMethod.DEFAULT
        })) || []
      });

      return eventId;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<boolean> {
    try {
      const calendarId = this.defaultCalendarId || await this.getDefaultCalendar();
      if (!calendarId) {
        throw new Error('No calendar available');
      }

      await Calendar.updateEventAsync(eventId, {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        notes: event.description,
        allDay: event.allDay,
        alarms: event.reminders?.map(reminder => ({
          relativeOffset: reminder.minutes,
          method: reminder.method === 'alert' ? Calendar.AlarmMethod.ALARM : Calendar.AlarmMethod.DEFAULT
        })) || []
      });

      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return false;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await Calendar.deleteEventAsync(eventId);
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  async getEvents(startDate: Date, endDate: Date): Promise<Calendar.Event[]> {
    try {
      const calendarId = this.defaultCalendarId || await this.getDefaultCalendar();
      if (!calendarId) {
        return [];
      }

      return await Calendar.getEventsAsync([calendarId], startDate, endDate);
    } catch (error) {
      console.error('Error getting calendar events:', error);
      return [];
    }
  }

  // Sync with App Events
  async syncEventWithDevice(appEvent: any): Promise<string | null> {
    try {
      const calendarEvent: CalendarEvent = {
        id: appEvent.id,
        title: appEvent.title,
        description: appEvent.description,
        startDate: new Date(appEvent.startTime),
        endDate: new Date(appEvent.endTime),
        location: appEvent.location,
        allDay: appEvent.allDay || false,
        reminders: this.parseReminders(appEvent.reminders)
      };

      if (appEvent.externalId) {
        // Update existing event
        const success = await this.updateEvent(appEvent.externalId, calendarEvent);
        return success ? appEvent.externalId : null;
      } else {
        // Create new event
        const eventId = await this.createEvent(calendarEvent);
        return eventId;
      }
    } catch (error) {
      console.error('Error syncing event with device:', error);
      return null;
    }
  }

  async removeEventFromDevice(externalId: string): Promise<boolean> {
    return await this.deleteEvent(externalId);
  }

  private parseReminders(reminders: any[]): CalendarReminder[] {
    if (!reminders || !Array.isArray(reminders)) {
      return [{ minutes: 15, method: 'alert' as const }]; // Default reminder
    }

    return reminders.map(reminder => ({
      minutes: reminder.minutes || 15,
      method: reminder.method || 'alert'
    }));
  }

  // Offline Support
  async cacheEventsLocally(events: Calendar.Event[]): Promise<void> {
    try {
      // Store events in secure storage for offline access
      const eventsData = events.map(event => ({
        id: event.id,
        title: event.title,
        startDate: event.startDate ? new Date(event.startDate).toISOString() : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString() : '',
        location: event.location,
        notes: event.notes,
        allDay: event.allDay
      }));

      // Store in SecureStore for better security
      await SecureStore.setItemAsync('cached_calendar_events', JSON.stringify(eventsData));
    } catch (error) {
      console.error('Error caching events locally:', error);
    }
  }

  async getCachedEvents(): Promise<Calendar.Event[]> {
    try {
      // Retrieve cached events from secure storage
      const cachedData = await SecureStore.getItemAsync('cached_calendar_events');
      return cachedData ? JSON.parse(cachedData) : [];
    } catch (error) {
      console.error('Error getting cached events:', error);
      return [];
    }
  }
}

export default CalendarService.getInstance();