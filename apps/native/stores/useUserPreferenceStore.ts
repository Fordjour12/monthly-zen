import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

// Create MMKV instance for user preferences (fast access)
const preferencesStorage = createMMKV({
  id: 'user-preferences',
  encryptionKey: 'preferences-encryption-key-456', // In production, use secure key
});

// Zustand storage adapter for MMKV
const zustandMMKVStorage = {
  getItem: (name: string) => {
    return preferencesStorage.getString(name) ?? null;
  },
  setItem: (name: string, value: string) => {
    preferencesStorage.set(name, value);
  },
  removeItem: (name: string) => {
    preferencesStorage.remove(name);
  },
};

// User preferences interface
interface UserPreferences {
  // Theme preferences
  theme: 'zen' | 'zen-light' | 'system';
  accentColor: string;

  // Language and region
  language: string;
  timezone: string;
  dateFormat: string;

  // Notification preferences
  notificationsEnabled: boolean;
  dailyBriefingEnabled: boolean;
  taskRemindersEnabled: boolean;
  calendarRemindersEnabled: boolean;
  reminderTime: string; // HH:mm format

  // UI preferences
  defaultView: 'dashboard' | 'calendar' | 'tasks' | 'plan';
  compactMode: boolean;
  showCompletedTasks: boolean;
  autoSyncCalendar: boolean;

  // AI and suggestions
  aiSuggestionsEnabled: boolean;
  aiAssistantName: string;
  aiResponseStyle: 'professional' | 'casual' | 'friendly';

  // Privacy and data
  dataCollectionEnabled: boolean;
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;

  // Productivity
  focusModeEnabled: boolean;
  pomodoroDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  dailyGoalMinutes: number;

  // Calendar integration
  primaryCalendarId: string | null;
  syncCalendars: string[];
  defaultEventDuration: number; // minutes

  // Task management
  defaultTaskPriority: 'low' | 'medium' | 'high' | 'urgent';
  taskAutoArchive: boolean;
  taskAutoArchiveDays: number;

  // Custom preferences
  customPreferences: Record<string, any>;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  theme: 'zen',
  accentColor: '#F44A22',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/dd/yyyy',
  notificationsEnabled: true,
  dailyBriefingEnabled: true,
  taskRemindersEnabled: true,
  calendarRemindersEnabled: true,
  reminderTime: '09:00',
  defaultView: 'dashboard',
  compactMode: false,
  showCompletedTasks: true,
  autoSyncCalendar: true,
  aiSuggestionsEnabled: true,
  aiAssistantName: 'Zeny',
  aiResponseStyle: 'professional',
  dataCollectionEnabled: false,
  analyticsEnabled: true,
  crashReportingEnabled: true,
  focusModeEnabled: false,
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  dailyGoalMinutes: 480, // 8 hours
  primaryCalendarId: null,
  syncCalendars: [],
  defaultEventDuration: 60,
  defaultTaskPriority: 'medium',
  taskAutoArchive: true,
  taskAutoArchiveDays: 30,
  customPreferences: {},
};

// User preference store interface
interface UserPreferenceStore extends UserPreferences {
  // Actions
  setPreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  setMultiplePreferences: (preferences: Partial<UserPreferences>) => void;
  resetPreference: <K extends keyof UserPreferences>(key: K) => void;
  resetAllPreferences: () => void;

  // Server sync
  loadPreferencesFromServer: () => Promise<void>;
  savePreferencesToServer: () => Promise<void>;
  syncPreferencesWithServer: () => Promise<void>;

  // Utility methods
  getPreference: <K extends keyof UserPreferences>(
    key: K
  ) => UserPreferences[K];
  getAllPreferences: () => UserPreferences;

  // Validation
  validatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: any
  ) => boolean;
}

export const useUserPreferenceStore = create<UserPreferenceStore>()(
  persist(
    (set, get) => ({
      ...defaultPreferences,

      // Set a single preference
      setPreference: (key, value) => {
        // Validate the preference
        if (get().validatePreference(key, value)) {
          set({ [key]: value } as Partial<UserPreferenceStore>);

          // Auto-save to server after a short delay
          setTimeout(() => {
            get().savePreferencesToServer();
          }, 1000);
        } else {
          console.warn(`Invalid value for preference ${key}:`, value);
        }
      },

      // Set multiple preferences at once
      setMultiplePreferences: (preferences) => {
        const validPreferences: Partial<UserPreferences> = {};

        // Validate all preferences
        Object.entries(preferences).forEach(([key, value]) => {
          if (get().validatePreference(key as keyof UserPreferences, value)) {
            validPreferences[key as keyof UserPreferences] = value;
          }
        });

        set(validPreferences);

        // Auto-save to server
        setTimeout(() => {
          get().savePreferencesToServer();
        }, 1000);
      },

      // Reset a single preference to default
      resetPreference: (key) => {
        const defaultValue = defaultPreferences[key];
        set({ [key]: defaultValue } as Partial<UserPreferenceStore>);

        // Auto-save to server
        setTimeout(() => {
          get().savePreferencesToServer();
        }, 1000);
      },

      // Reset all preferences to defaults
      resetAllPreferences: () => {
        set(defaultPreferences);

        // Auto-save to server
        setTimeout(() => {
          get().savePreferencesToServer();
        }, 1000);
      },

      // Load preferences from server (only when needed)
      loadPreferencesFromServer: async () => {
        try {
          // This would need to be implemented in your API
          // Example implementation:
          // const serverPrefs = await orpc.user.getPreferences();
          // if (serverPrefs) {
          //   set(serverPrefs);
          // }
        } catch (error) {
          console.error('Failed to load preferences from server:', error);
        }
      },

      // Sync preferences with server in background (don't block UI)
      syncPreferencesWithServer: async () => {
        try {
          // This would need to be implemented in your API
          // Get current preferences and sync to server
          // Example implementation:
          // const currentPrefs = get();
          // await orpc.user.syncPreferences(currentPrefs);
        } catch (error) {
          // Silently fail - don't block the app for server sync issues
          console.debug('Background sync failed:', error);
        }
      },

      // Save preferences to server
      savePreferencesToServer: async () => {
        try {
          const currentPrefs = get();

          // This would need to be implemented in your API
          // Example implementation:
          // await orpc.user.updatePreferences(currentPrefs);
        } catch (error) {
          console.error('Failed to save preferences to server:', error);
        }
      },

      // Get a specific preference value
      getPreference: (key) => {
        return get()[key];
      },

      // Get all preferences
      getAllPreferences: () => {
        const state = get();
        const prefs: UserPreferences = {} as UserPreferences;

        Object.keys(defaultPreferences).forEach(key => {
          prefs[key as keyof UserPreferences] = state[key as keyof UserPreferenceStore];
        });

        return prefs;
      },

      // Validate preference values
      validatePreference: (key: keyof UserPreferences, value: any) => {
        switch (key) {
          case 'theme':
            return ['zen', 'zen-light', 'system'].includes(value as string);
          case 'language':
            return typeof value === 'string' && value.length === 2;
          case 'timezone':
            return typeof value === 'string' && value.length > 0;
          case 'dateFormat':
            return typeof value === 'string';
          case 'notificationsEnabled':
          case 'dailyBriefingEnabled':
          case 'taskRemindersEnabled':
          case 'calendarRemindersEnabled':
          case 'compactMode':
          case 'showCompletedTasks':
          case 'autoSyncCalendar':
          case 'aiSuggestionsEnabled':
          case 'dataCollectionEnabled':
          case 'analyticsEnabled':
          case 'crashReportingEnabled':
          case 'focusModeEnabled':
          case 'taskAutoArchive':
            return typeof value === 'boolean';
          case 'reminderTime':
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value as string);
          case 'defaultView':
            return ['dashboard', 'calendar', 'tasks', 'plan'].includes(value as string);
          case 'aiResponseStyle':
            return ['professional', 'casual', 'friendly'].includes(value as string);
          case 'pomodoroDuration':
          case 'shortBreakDuration':
          case 'longBreakDuration':
          case 'dailyGoalMinutes':
          case 'defaultEventDuration':
          case 'taskAutoArchiveDays':
            return typeof value === 'number' && value > 0;
          case 'accentColor':
          case 'aiAssistantName':
            return typeof value === 'string' && value.length > 0;
          case 'defaultTaskPriority':
            return ['low', 'medium', 'high', 'urgent'].includes(value as string);
          case 'syncCalendars':
            return Array.isArray(value);
          case 'primaryCalendarId':
            return value === null || value === undefined || typeof value === 'string';
          case 'customPreferences':
            return typeof value === 'object' && value !== null;
          default:
            return true; // Allow unknown preferences
        }
      },
    }),
    {
      name: 'user-preference-store',
      storage: createJSONStorage(() => zustandMMKVStorage),
      // Store all preferences in MMKV for instant access
    }
  )
);

// Convenience hooks for common preferences
export const useThemePreferences = () => {
  const { theme, accentColor, setPreference } = useUserPreferenceStore();
  return {
    theme,
    accentColor,
    setTheme: (theme: UserPreferences['theme']) => setPreference('theme', theme),
    setAccentColor: (color: string) => setPreference('accentColor', color),
  };
};

export const useNotificationPreferences = () => {
  const {
    notificationsEnabled,
    dailyBriefingEnabled,
    taskRemindersEnabled,
    calendarRemindersEnabled,
    reminderTime,
    setPreference,
  } = useUserPreferenceStore();

  return {
    notificationsEnabled,
    dailyBriefingEnabled,
    taskRemindersEnabled,
    calendarRemindersEnabled,
    reminderTime,
    setNotificationsEnabled: (enabled: boolean) => setPreference('notificationsEnabled', enabled),
    setDailyBriefingEnabled: (enabled: boolean) => setPreference('dailyBriefingEnabled', enabled),
    setTaskRemindersEnabled: (enabled: boolean) => setPreference('taskRemindersEnabled', enabled),
    setCalendarRemindersEnabled: (enabled: boolean) => setPreference('calendarRemindersEnabled', enabled),
    setReminderTime: (time: string) => setPreference('reminderTime', time),
  };
};

export const useUIPreferences = () => {
  const {
    defaultView,
    compactMode,
    showCompletedTasks,
    setPreference,
  } = useUserPreferenceStore();

  return {
    defaultView,
    compactMode,
    showCompletedTasks,
    setDefaultView: (view: UserPreferences['defaultView']) => setPreference('defaultView', view),
    setCompactMode: (enabled: boolean) => setPreference('compactMode', enabled),
    setShowCompletedTasks: (show: boolean) => setPreference('showCompletedTasks', show),
  };
};

// Initialize preferences on app start (load from MMKV first, then sync with server)
export const initializePreferences = () => {
  // Preferences are automatically loaded from MMKV by zustand persistence
  // Sync with server in background if user is authenticated (no await)
  useUserPreferenceStore.getState().syncPreferencesWithServer();
};