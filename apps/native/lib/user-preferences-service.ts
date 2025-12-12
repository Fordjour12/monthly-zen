import { AppRouterClient, AppRouter } from '@my-better-t-app/api';

// Types for user preferences
export interface UserPreferences {
  id?: string;
  userId?: string;
  theme: 'zen' | 'zen-light' | 'system';
  notificationsEnabled: boolean;
  dailyBriefingEnabled: boolean;
  taskRemindersEnabled: boolean;
  calendarRemindersEnabled: boolean;
  reminderTime: string;
  defaultView: 'dashboard' | 'calendar' | 'tasks' | 'plan';
  aiSuggestionsEnabled: boolean;
  aiAssistantName: string;
  aiResponseStyle: 'professional' | 'casual' | 'friendly';
  focusModeEnabled: boolean;
  pomodoroDuration: number;
  dailyGoalMinutes: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  compactMode: boolean;
  showCompletedTasks: boolean;
  language: string;
  timezone: string;
  dateFormat: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';
  autoSyncCalendar: boolean;
  defaultEventDuration: number;
  defaultTaskPriority: 'low' | 'medium' | 'high' | 'urgent';
  taskAutoArchive: boolean;
  taskAutoArchiveDays: number;
  primaryCalendarId: string | null;
  syncCalendars: string[];
  dataCollectionEnabled: boolean;
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
  customPreferences: Record<string, any>;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  created?: boolean;
  exists?: boolean;
}

class UserPreferencesService {
  private static instance: UserPreferencesService;
  private apiClient: AppRouterClient | null = null;
  private cache: UserPreferences | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  setApiClient(apiClient: AppRouterClient) {
    this.apiClient = apiClient;
  }

  private isCacheValid(): boolean {
    return this.cache !== null && Date.now() < this.cacheExpiry;
  }

  private updateCache(preferences: UserPreferences) {
    this.cache = preferences;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
  }

  private invalidateCache() {
    this.cache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Get user preferences from cache or API
   */
  async getPreferences(): Promise<ApiResponse<UserPreferences>> {
    // Return cached data if valid
    if (this.isCacheValid()) {
      return {
        success: true,
        data: { ...this.cache! },
        exists: true,
      };
    }

    if (!this.apiClient) {
      throw new Error('API client not initialized. Call setApiClient first.');
    }

    try {
      const response = await this.apiClient.userPreferences.getPreferences();

      if (response.success && response.data) {
        this.updateCache(response.data);
        return response;
      } else {
        return {
          success: false,
          error: response.error || 'Failed to fetch preferences',
        };
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
    if (!this.apiClient) {
      throw new Error('API client not initialized. Call setApiClient first.');
    }

    try {
      const response = await this.apiClient.userPreferences.updatePreferences(preferences);

      if (response.success && response.data) {
        this.updateCache(response.data);
        return response;
      } else {
        return {
          success: false,
          error: response.error || 'Failed to update preferences',
        };
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Complete onboarding with all preferences
   */
  async completeOnboarding(preferences: UserPreferences): Promise<ApiResponse<UserPreferences>> {
    if (!this.apiClient) {
      throw new Error('API client not initialized. Call setApiClient first.');
    }

    try {
      const response = await this.apiClient.userPreferences.completeOnboarding({
        ...preferences,
        onboardingCompleted: true,
      });

      if (response.success && response.data) {
        this.updateCache(response.data);
        return response;
      } else {
        return {
          success: false,
          error: response.error || 'Failed to complete onboarding',
        };
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(): Promise<ApiResponse<UserPreferences>> {
    if (!this.apiClient) {
      throw new Error('API client not initialized. Call setApiClient first.');
    }

    try {
      const response = await this.apiClient.userPreferences.resetPreferences();

      if (response.success && response.data) {
        this.updateCache(response.data);
        return response;
      } else {
        return {
          success: false,
          error: response.error || 'Failed to reset preferences',
        };
      }
    } catch (error) {
      console.error('Error resetting preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete user preferences (for account deletion)
   */
  async deletePreferences(): Promise<ApiResponse> {
    if (!this.apiClient) {
      throw new Error('API client not initialized. Call setApiClient first.');
    }

    try {
      const response = await this.apiClient.userPreferences.deletePreferences();

      if (response.success) {
        this.invalidateCache();
      }

      return response;
    } catch (error) {
      console.error('Error deleting preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get cached preferences without API call
   */
  getCachedPreferences(): UserPreferences | null {
    return this.isCacheValid() ? { ...this.cache! } : null;
  }

  /**
   * Force refresh preferences from server
   */
  async refreshPreferences(): Promise<ApiResponse<UserPreferences>> {
    this.invalidateCache();
    return this.getPreferences();
  }

  /**
   * Get default preferences for new users
   */
  getDefaultPreferences(): UserPreferences {
    return {
      theme: 'zen',
      notificationsEnabled: true,
      dailyBriefingEnabled: true,
      taskRemindersEnabled: true,
      calendarRemindersEnabled: true,
      reminderTime: '09:00',
      defaultView: 'dashboard',
      aiSuggestionsEnabled: true,
      aiAssistantName: 'Beerus',
      aiResponseStyle: 'professional',
      focusModeEnabled: false,
      pomodoroDuration: 25,
      dailyGoalMinutes: 480,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      compactMode: false,
      showCompletedTasks: true,
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/dd/yyyy',
      autoSyncCalendar: true,
      defaultEventDuration: 60,
      defaultTaskPriority: 'medium',
      taskAutoArchive: true,
      taskAutoArchiveDays: 30,
      primaryCalendarId: null,
      syncCalendars: [],
      dataCollectionEnabled: false,
      analyticsEnabled: true,
      crashReportingEnabled: true,
      customPreferences: {},
      onboardingCompleted: false,
    };
  }

  /**
   * Sync local preferences with server
   */
  async syncWithLocal(localPreferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
    try {
      // First try to get server preferences
      const serverResponse = await this.getPreferences();

      if (serverResponse.success && serverResponse.data) {
        // Merge local with server preferences, giving priority to server
        const mergedPreferences = {
          ...serverResponse.data,
          ...localPreferences,
        };

        // Update server with merged preferences
        return this.updatePreferences(mergedPreferences);
      } else {
        // If no server preferences exist, create them from local
        const defaultPrefs = this.getDefaultPreferences();
        const newPreferences = {
          ...defaultPrefs,
          ...localPreferences,
        };

        return this.updatePreferences(newPreferences);
      }
    } catch (error) {
      console.error('Error syncing preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default UserPreferencesService.getInstance();