import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserPreferenceStore } from '@/stores/useUserPreferenceStore';
import { Ionicons } from '@expo/vector-icons';

const accentColors = [
  { name: 'Orange', value: '#F44A22' }, // Zen orange
  { name: 'Cyan', value: '#22B4C4' },  // Zen cyan
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
];

export default function OnboardingScreen() {
  const [theme, setTheme] = useState<'zen' | 'zen-light' | 'system'>('zen');
  const [accentColor, setAccentColor] = useState('#F44A22');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyBriefingEnabled, setDailyBriefingEnabled] = useState(true);
  const [taskRemindersEnabled, setTaskRemindersEnabled] = useState(true);
  const [calendarRemindersEnabled, setCalendarRemindersEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);
  const [defaultView, setDefaultView] = useState<'dashboard' | 'calendar' | 'tasks' | 'plan'>('dashboard');
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('MM/dd/yyyy');
  const [autoSyncCalendar, setAutoSyncCalendar] = useState(true);
  const [defaultEventDuration, setDefaultEventDuration] = useState(60);
  const [defaultTaskPriority, setDefaultTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [compactMode, setCompactMode] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(480);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { setMultiplePreferences } = useUserPreferenceStore();

  const handleCompleteOnboarding = async () => {
    setIsLoading(true);
    try {
      // Save all preferences at once
      setMultiplePreferences({
        theme,
        accentColor,
        notificationsEnabled,
        dailyBriefingEnabled,
        taskRemindersEnabled,
        calendarRemindersEnabled,
        reminderTime,
        autoSyncCalendar,
        defaultView,
        aiSuggestionsEnabled,
        aiAssistantName: 'Beerus',
        aiResponseStyle: 'professional',
        focusModeEnabled,
        pomodoroDuration,
        dailyGoalMinutes,
        compactMode,
        showCompletedTasks,
        language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat,
        defaultEventDuration,
        defaultTaskPriority,
        dataCollectionEnabled: false,
        analyticsEnabled: true,
        crashReportingEnabled: true,
        primaryCalendarId: null,
        syncCalendars: [],
        taskAutoArchive: true,
        taskAutoArchiveDays: 30,
        customPreferences: {},
        shortBreakDuration: 5,
        longBreakDuration: 15,
      });

      // Navigate to the main app
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <View className="absolute inset-0 bg-black" />

      <ScrollView
        className="flex-1 bg-white mt-20 rounded-t-3xl"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-8 pb-6">
          <Text className="text-3xl font-bold text-black mb-2">Welcome to Zen Calendar!</Text>
          <Text className="text-gray-600 text-base">
            Let's personalize your experience
          </Text>
        </View>

        <View className="px-6 pb-6">
          {/* Theme Selection */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-black mb-4">Choose Your Theme</Text>
            <View className="space-y-3 mb-4">
              {[
                { key: 'zen', label: 'Zen Dark', icon: 'moon' },
                { key: 'zen-light', label: 'Zen Light', icon: 'sunny' },
                { key: 'system', label: 'System', icon: 'settings' },
              ].map(({ key, label, icon }) => (
                <Pressable
                  key={key}
                  className={`flex-row items-center p-4 rounded-xl border-2 ${
                    theme === key ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => setTheme(key as any)}
                >
                  <Ionicons
                    name={icon as any}
                    size={20}
                    color={theme === key ? '#F44A22' : '#6B7280'}
                  />
                  <Text className={`ml-3 font-medium flex-1 ${
                    theme === key ? 'text-orange-600' : 'text-gray-700'
                  }`}>{label}</Text>
                  {theme === key && (
                    <Ionicons name="checkmark-circle" size={20} color="#F44A22" />
                  )}
                </Pressable>
              ))}
            </View>

            <Text className="text-sm font-medium text-gray-700 mb-3">Accent Color</Text>
            <View className="flex-row flex-wrap gap-3">
              {accentColors.map((color) => (
                <Pressable
                  key={color.value}
                  className={`w-14 h-14 rounded-xl items-center justify-center ${
                    accentColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  onPress={() => setAccentColor(color.value)}
                >
                  {accentColor === color.value && (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Notifications */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-black mb-4">Notifications</Text>
            <View className="space-y-3">
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-medium text-black">Push Notifications</Text>
                    <Text className="text-sm text-gray-500">Stay updated with reminders</Text>
                  </View>
                  <Pressable
                    className={`w-12 h-6 rounded-full ${notificationsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                    onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                  >
                    <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </Pressable>
                </View>
              </View>

              {notificationsEnabled && (
                <>
                  <View className="bg-white p-4 rounded-xl border border-gray-200">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="font-medium text-black">Daily Briefing</Text>
                        <Text className="text-sm text-gray-500">Start your day with a summary</Text>
                      </View>
                      <Pressable
                        className={`w-12 h-6 rounded-full ${dailyBriefingEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                        onPress={() => setDailyBriefingEnabled(!dailyBriefingEnabled)}
                      >
                        <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          dailyBriefingEnabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </Pressable>
                    </View>
                  </View>

                  <View className="bg-white p-4 rounded-xl border border-gray-200">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="font-medium text-black">Task Reminders</Text>
                        <Text className="text-sm text-gray-500">Never miss important tasks</Text>
                      </View>
                      <Pressable
                        className={`w-12 h-6 rounded-full ${taskRemindersEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                        onPress={() => setTaskRemindersEnabled(!taskRemindersEnabled)}
                      >
                        <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          taskRemindersEnabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </Pressable>
                    </View>
                  </View>

                  <View className="bg-white p-4 rounded-xl border border-gray-200">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="font-medium text-black">Calendar Events</Text>
                        <Text className="text-sm text-gray-500">Event notifications</Text>
                      </View>
                      <Pressable
                        className={`w-12 h-6 rounded-full ${calendarRemindersEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                        onPress={() => setCalendarRemindersEnabled(!calendarRemindersEnabled)}
                      >
                        <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          calendarRemindersEnabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </Pressable>
                    </View>
                  </View>

                  <View className="bg-white p-4 rounded-xl border border-gray-200">
                    <Text className="font-medium text-black mb-2">Default Reminder Time</Text>
                    <Text className="text-sm text-gray-500 mb-3">When should we send daily reminders?</Text>
                    <View className="flex-row gap-2 flex-wrap">
                      {['08:00', '09:00', '10:00', '18:00'].map((time) => (
                        <Pressable
                          key={time}
                          className={`px-3 py-2 rounded-lg border ${
                            reminderTime === time
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white'
                          }`}
                          onPress={() => setReminderTime(time)}
                        >
                          <Text className={`text-sm font-medium ${
                            reminderTime === time ? 'text-blue-600' : 'text-gray-700'
                          }`}>{time}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Default View */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-black mb-4">Default Screen</Text>
            <View className="space-y-2">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
                { key: 'calendar', label: 'Calendar', icon: 'calendar' },
                { key: 'tasks', label: 'Tasks', icon: 'checkmark-circle' },
                { key: 'plan', label: 'Plan', icon: 'list' },
              ].map(({ key, label, icon }) => (
                <Pressable
                  key={key}
                  className={`flex-row items-center p-3 rounded-lg border ${
                    defaultView === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => setDefaultView(key as any)}
                >
                  <Ionicons
                    name={icon as any}
                    size={18}
                    color={defaultView === key ? '#3B82F6' : '#6B7280'}
                  />
                  <Text className={`ml-3 font-medium flex-1 ${
                    defaultView === key ? 'text-blue-600' : 'text-gray-700'
                  }`}>{label}</Text>
                  {defaultView === key && (
                    <Ionicons name="checkmark" size={16} color="#3B82F6" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Language & Region */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-black mb-4">Language & Region</Text>
            <View className="space-y-3">
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <Text className="font-medium text-black mb-2">Language</Text>
                <Text className="text-sm text-gray-500 mb-3">Choose your preferred language</Text>
                <View className="flex-row gap-2 flex-wrap">
                  {[
                    { code: 'en', name: 'English' },
                    { code: 'es', name: 'Español' },
                    { code: 'fr', name: 'Français' },
                    { code: 'de', name: 'Deutsch' },
                  ].map((lang) => (
                    <Pressable
                      key={lang.code}
                      className={`px-3 py-2 rounded-lg border ${
                        language === lang.code
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      onPress={() => setLanguage(lang.code)}
                    >
                      <Text className={`text-sm font-medium ${
                        language === lang.code ? 'text-blue-600' : 'text-gray-700'
                      }`}>{lang.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <Text className="font-medium text-black mb-2">Date Format</Text>
                <Text className="text-sm text-gray-500 mb-3">How should dates be displayed?</Text>
                <View className="flex-row gap-2 flex-wrap">
                  {[
                    { format: 'MM/dd/yyyy', example: '12/25/2024' },
                    { format: 'dd/MM/yyyy', example: '25/12/2024' },
                    { format: 'yyyy-MM-dd', example: '2024-12-25' },
                  ].map((date) => (
                    <Pressable
                      key={date.format}
                      className={`px-3 py-2 rounded-lg border ${
                        dateFormat === date.format
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      onPress={() => setDateFormat(date.format)}
                    >
                      <Text className={`text-sm font-medium ${
                        dateFormat === date.format ? 'text-blue-600' : 'text-gray-700'
                      }`}>{date.example}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Calendar & Task Management */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-black mb-4">Calendar & Tasks</Text>
            <View className="space-y-3">
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-medium text-black">Auto-sync Calendars</Text>
                    <Text className="text-sm text-gray-500">Sync device calendars automatically</Text>
                  </View>
                  <Pressable
                    className={`w-12 h-6 rounded-full ${autoSyncCalendar ? 'bg-blue-500' : 'bg-gray-300'}`}
                    onPress={() => setAutoSyncCalendar(!autoSyncCalendar)}
                  >
                    <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      autoSyncCalendar ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </Pressable>
                </View>
              </View>

              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <Text className="font-medium text-black mb-2">Default Event Duration</Text>
                <Text className="text-sm text-gray-500 mb-3">Default length for new events</Text>
                <View className="flex-row gap-2 flex-wrap">
                  {[30, 45, 60, 90, 120].map((duration) => (
                    <Pressable
                      key={duration}
                      className={`px-3 py-2 rounded-lg border ${
                        defaultEventDuration === duration
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      onPress={() => setDefaultEventDuration(duration)}
                    >
                      <Text className={`text-sm font-medium ${
                        defaultEventDuration === duration ? 'text-blue-600' : 'text-gray-700'
                      }`}>{duration}m</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <Text className="font-medium text-black mb-2">Default Task Priority</Text>
                <Text className="text-sm text-gray-500 mb-3">Priority for new tasks</Text>
                <View className="space-y-2">
                  {[
                    { key: 'low', label: 'Low', color: 'green' },
                    { key: 'medium', label: 'Medium', color: 'yellow' },
                    { key: 'high', label: 'High', color: 'orange' },
                    { key: 'urgent', label: 'Urgent', color: 'red' },
                  ].map((priority) => (
                    <Pressable
                      key={priority.key}
                      className={`flex-row items-center p-3 rounded-lg border ${
                        defaultTaskPriority === priority.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                      }`}
                      onPress={() => setDefaultTaskPriority(priority.key as any)}
                    >
                      <View className={`w-3 h-3 rounded-full bg-${priority.color}-500 mr-3`} />
                      <Text className={`font-medium flex-1 ${
                        defaultTaskPriority === priority.key ? 'text-blue-600' : 'text-gray-700'
                      }`}>{priority.label}</Text>
                      {defaultTaskPriority === priority.key && (
                        <Ionicons name="checkmark" size={16} color="#3B82F6" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* UI Preferences */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-black mb-4">UI Preferences</Text>
            <View className="space-y-3">
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-medium text-black">Compact Mode</Text>
                    <Text className="text-sm text-gray-500">Show more content with less spacing</Text>
                  </View>
                  <Pressable
                    className={`w-12 h-6 rounded-full ${compactMode ? 'bg-blue-500' : 'bg-gray-300'}`}
                    onPress={() => setCompactMode(!compactMode)}
                  >
                    <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      compactMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </Pressable>
                </View>
              </View>

              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-medium text-black">Show Completed Tasks</Text>
                    <Text className="text-sm text-gray-500">Keep completed tasks visible</Text>
                  </View>
                  <Pressable
                    className={`w-12 h-6 rounded-full ${showCompletedTasks ? 'bg-blue-500' : 'bg-gray-300'}`}
                    onPress={() => setShowCompletedTasks(!showCompletedTasks)}
                  >
                    <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      showCompletedTasks ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Productivity */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-black mb-4">Productivity</Text>
            <View className="space-y-3">
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-medium text-black">Focus Mode</Text>
                    <Text className="text-sm text-gray-500">Minimize distractions during work</Text>
                  </View>
                  <Pressable
                    className={`w-12 h-6 rounded-full ${focusModeEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                    onPress={() => setFocusModeEnabled(!focusModeEnabled)}
                  >
                    <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      focusModeEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </Pressable>
                </View>
              </View>

              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <Text className="font-medium text-black mb-2">Daily Goal</Text>
                <Text className="text-sm text-gray-500 mb-3">Target productive minutes per day</Text>
                <View className="flex-row gap-2 flex-wrap">
                  {[240, 360, 480, 600, 720].map((minutes) => (
                    <Pressable
                      key={minutes}
                      className={`px-3 py-2 rounded-lg border ${
                        dailyGoalMinutes === minutes
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      onPress={() => setDailyGoalMinutes(minutes)}
                    >
                      <Text className={`text-sm font-medium ${
                        dailyGoalMinutes === minutes ? 'text-blue-600' : 'text-gray-700'
                      }`}>{Math.floor(minutes / 60)}h{minutes % 60 > 0 ? ` ${minutes % 60}m` : ''}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {focusModeEnabled && (
                <View className="bg-white p-4 rounded-xl border border-gray-200">
                  <Text className="font-medium text-black mb-2">Pomodoro Duration</Text>
                  <Text className="text-sm text-gray-500 mb-3">Work session length (minutes)</Text>
                  <View className="flex-row gap-2 flex-wrap">
                    {[15, 25, 30, 45, 60].map((duration) => (
                      <Pressable
                        key={duration}
                        className={`px-3 py-2 rounded-lg border ${
                          pomodoroDuration === duration
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}
                        onPress={() => setPomodoroDuration(duration)}
                      >
                        <Text className={`text-sm font-medium ${
                          pomodoroDuration === duration ? 'text-blue-600' : 'text-gray-700'
                        }`}>{duration}m</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* AI Assistant */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-black mb-4">AI Assistant</Text>
            <View className="bg-white p-4 rounded-xl border border-gray-200">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-medium text-black">AI Suggestions</Text>
                  <Text className="text-sm text-gray-500">Get smart recommendations</Text>
                </View>
                <Pressable
                  className={`w-12 h-6 rounded-full ${aiSuggestionsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                  onPress={() => setAiSuggestionsEnabled(!aiSuggestionsEnabled)}
                >
                  <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    aiSuggestionsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Complete Button */}
          <Pressable
            className="bg-black py-4 rounded-xl"
            onPress={handleCompleteOnboarding}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-semibold text-base">
              {isLoading ? 'Setting up...' : 'Get Started'}
            </Text>
          </Pressable>

          <Pressable
            className="mt-4 py-2"
            onPress={() => router.replace('/(tabs)')}
          >
            <Text className="text-gray-500 text-center">Skip for now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}