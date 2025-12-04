import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface NotificationSettings {
  enabled: boolean;
  defaultReminder: number; // minutes before event
  sound: boolean;
  vibration: boolean;
  customReminders: number[]; // custom reminder times in minutes
  doNotDisturb: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
}

export interface ScheduledNotification {
  id: string;
  eventId: string;
  title: string;
  body: string;
  scheduledTime: Date;
  settings: NotificationSettings;
}

class NotificationService {
  private static instance: NotificationService;
  private notificationSettings: NotificationSettings;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  constructor() {
    this.notificationSettings = this.getDefaultSettings();
    this.initializeNotifications();
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      defaultReminder: 15,
      sound: true,
      vibration: true,
      customReminders: [15, 60, 1440], // 15 min, 1 hour, 1 day
      doNotDisturb: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      }
    };
  }

  // Initialize notification system
  private async initializeNotifications(): Promise<void> {
    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      // Set notification channel for Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('calendar-reminders', {
          name: 'Calendar Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          enableVibrate: true,
        });
      }

      // Load saved settings
      await this.loadSettings();

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: this.notificationSettings.sound,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  // Settings Management
  async loadSettings(): Promise<void> {
    try {
      const savedSettings = await SecureStore.getItemAsync('notification_settings');
      if (savedSettings) {
        this.notificationSettings = { ...this.getDefaultSettings(), ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  async saveSettings(): Promise<void> {
    try {
      await SecureStore.setItemAsync('notification_settings', JSON.stringify(this.notificationSettings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.notificationSettings };
  }

  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.notificationSettings = { ...this.notificationSettings, ...newSettings };
    await this.saveSettings();
  }

  // Permission Management
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status as Notifications.PermissionStatus;
    } catch (error) {
      console.error('Error getting notification permission status:', error);
      return 'undetermined' as Notifications.PermissionStatus;
    }
  }

  // Notification Scheduling
  async scheduleEventReminder(
    eventId: string,
    eventTitle: string,
    eventDescription: string,
    eventStartTime: Date,
    reminderMinutes: number
  ): Promise<string | null> {
    try {
      if (!this.notificationSettings.enabled) {
        return null;
      }

      // Check if we're in do-not-disturb mode
      if (this.isInDoNotDisturbTime(new Date(eventStartTime.getTime() - reminderMinutes * 60 * 1000))) {
        return null;
      }

      const triggerTime = new Date(eventStartTime.getTime() - reminderMinutes * 60 * 1000);
      
      // Don't schedule if the reminder time is in the past
      if (triggerTime <= new Date()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Upcoming Event: ${eventTitle}`,
          body: this.formatReminderBody(eventDescription, reminderMinutes),
          data: { eventId, type: 'calendar_reminder' },
          sound: this.notificationSettings.sound ? 'default' : undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerTime,
        },
        identifier: `${eventId}_${reminderMinutes}`,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling event reminder:', error);
      return null;
    }
  }

  async scheduleMultipleReminders(
    eventId: string,
    eventTitle: string,
    eventDescription: string,
    eventStartTime: Date,
    reminderTimes: number[]
  ): Promise<string[]> {
    const scheduledIds: string[] = [];

    for (const minutes of reminderTimes) {
      const notificationId = await this.scheduleEventReminder(
        eventId,
        eventTitle,
        eventDescription,
        eventStartTime,
        minutes
      );
      if (notificationId) {
        scheduledIds.push(notificationId);
      }
    }

    return scheduledIds;
  }

  async cancelEventReminders(eventId: string): Promise<void> {
    try {
      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Cancel notifications related to this event
      const notificationsToCancel = scheduledNotifications.filter(
        notification => 
          notification.content.data?.eventId === eventId ||
          notification.identifier?.startsWith(`${eventId}_`)
      );

      for (const notification of notificationsToCancel) {
        if (notification.identifier) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling event reminders:', error);
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Immediate Notifications
  async showImmediateNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<string | null> {
    try {
      if (!this.notificationSettings.enabled) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: this.notificationSettings.sound ? 'default' : undefined,
        },
        trigger: null, // Immediate notification
      });

      return notificationId;
    } catch (error) {
      console.error('Error showing immediate notification:', error);
      return null;
    }
  }

  // Utility Methods
  private formatReminderBody(eventDescription: string, minutes: number): string {
    const timeString = this.formatReminderTime(minutes);
    return `${eventDescription}\n\nStarting in ${timeString}`;
  }

  private formatReminderTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      }
      return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  }

  private isInDoNotDisturbTime(notificationTime: Date): boolean {
    if (!this.notificationSettings.doNotDisturb.enabled) {
      return false;
    }

    const currentTime = notificationTime.getHours() * 60 + notificationTime.getMinutes();
    const startTime = this.parseTime(this.notificationSettings.doNotDisturb.startTime);
    const endTime = this.parseTime(this.notificationSettings.doNotDisturb.endTime);

    if (startTime <= endTime) {
      // Same day range (e.g., 22:00 to 08:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight range (e.g., 22:00 to 08:00 next day)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Get scheduled notifications for debugging
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Clear all notifications (for testing or reset)
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }
}

export default NotificationService.getInstance();