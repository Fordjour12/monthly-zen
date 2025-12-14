import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserPreferenceStore, completeOnboarding } from '@/stores/useUserPreferenceStore';
import { Ionicons } from '@expo/vector-icons';
import { useSemanticColors } from '@/utils/theme-utils';
import { useAppTheme } from '@/contexts/app-theme-context';


export default function OnboardingScreen() {
   const [notificationsEnabled, setNotificationsEnabled] = useState(true);

   // Theme utilities
   const colors = useSemanticColors();

   // App theme context
   const { currentTheme, setTheme } = useAppTheme();
   const theme = currentTheme as 'zen' | 'zen-light' | 'system';
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
         // Complete onboarding with server sync
         const success = await completeOnboarding({
            theme,
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

         if (success) {
            // Navigate to the main app
            router.replace('/(tabs)');
         } else {
            // Still navigate if server sync failed, but show a warning
            Alert.alert(
               'Partial Success',
               'Your preferences have been saved locally. We\'ll sync with the server when connection is restored.',
               [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
            );
         }
      } catch (error) {
         Alert.alert('Error', 'Failed to save preferences. Please try again.');
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
         <View className="absolute inset-0" style={{ backgroundColor: colors.background }} />

         <ScrollView
            className="flex-1 mt-20 rounded-t-3xl"
            style={{ backgroundColor: colors.surface }}
            showsVerticalScrollIndicator={false}
         >
            <View className="px-6 pt-8 pb-6">
               <Text className="text-3xl font-sans-bold mb-2" style={{ color: colors.foreground }}>
                  Welcome to Monthly Zen!
               </Text>
               <Text className="text-base font-sans" style={{ color: colors.muted }}>
                  Let's personalize your experience
               </Text>
            </View>

            <View className="px-6 pb-6">
               {/* Theme Selection */}
               <View className="mb-8">
                  <Text className="text-lg font-sans-semibold mb-4" style={{ color: colors.foreground }}>
                     Choose Your Theme
                  </Text>
                  <View className="space-y-3 mb-4">
                     {[
                        { key: 'zen', label: 'Zen Dark', icon: 'moon' },
                        { key: 'zen-light', label: 'Zen Light', icon: 'sunny' },
                        { key: 'system', label: 'System', icon: 'settings' },
                     ].map(({ key, label, icon }) => (
                        <Pressable
                           key={key}
                           className={`flex-row items-center p-4 rounded-xl border-2 mb-2`}
                           style={{
                              borderColor: theme === key ? colors.accent : colors.border,
                              backgroundColor: theme === key ? colors.accent + '10' : colors.surface,
                           }}
                           onPress={() => setTheme(key as any)}
                        >
                           <Ionicons
                              name={icon as any}
                              size={20}
                              color={theme === key ? colors.accent : colors.muted}
                           />
                           <Text className={`ml-3 font-sans-medium flex-1`} style={{
                              color: theme === key ? colors.accent : colors.foreground
                           }}>{label}</Text>
                           {theme === key && (
                              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                           )}
                        </Pressable>
                     ))}
                  </View>

               </View>

               {/* Notifications */}
               <View className="mb-8">
                  <Text className="text-lg font-sans-semibold mb-4" style={{ color: colors.foreground }}>
                     Notifications
                  </Text>
                  <View className="space-y-3">
                     <View className="p-4 rounded-xl border mb-2" style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                     }}>
                        <View className="flex-row items-center justify-between">
                           <View>
                              <Text className="font-sans-medium" style={{ color: colors.foreground }}>
                                 Push Notifications
                              </Text>
                              <Text className="text-sm" style={{ color: colors.muted }}>
                                 Stay updated with reminders
                              </Text>
                           </View>
                           <Pressable
                              className={`w-12 h-6 rounded-full`}
                              style={{
                                 backgroundColor: notificationsEnabled ? colors.accent : colors.border
                              }}
                              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                           >
                              <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                 }`} />
                           </Pressable>
                        </View>
                     </View>

                     {notificationsEnabled && (
                        <>
                           <View className="p-4 rounded-xl border mb-2" style={{
                              backgroundColor: colors.surface,
                              borderColor: colors.border
                           }}>
                              <View className="flex-row items-center justify-between">
                                 <View>
                                    <Text className="font-sans-medium" style={{ color: colors.foreground }}>
                                       Daily Briefing
                                    </Text>
                                    <Text className="text-sm" style={{ color: colors.muted }}>
                                       Start your day with a summary
                                    </Text>
                                 </View>
                                 <Pressable
                                    className={`w-12 h-6 rounded-full`}
                                    style={{
                                       backgroundColor: dailyBriefingEnabled ? colors.accent : colors.border
                                    }}
                                    onPress={() => setDailyBriefingEnabled(!dailyBriefingEnabled)}
                                 >
                                    <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${dailyBriefingEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                       }`} />
                                 </Pressable>
                              </View>
                           </View>

                           <View className="p-4 rounded-xl border mb-2" style={{
                              backgroundColor: colors.surface,
                              borderColor: colors.border
                           }}>
                              <View className="flex-row items-center justify-between">
                                 <View>
                                    <Text className="font-sans-medium" style={{ color: colors.foreground }}>
                                       Task Reminders
                                    </Text>
                                    <Text className="text-sm" style={{ color: colors.muted }}>
                                       Never miss important tasks
                                    </Text>
                                 </View>
                                 <Pressable
                                    className={`w-12 h-6 rounded-full`}
                                    style={{
                                       backgroundColor: taskRemindersEnabled ? colors.accent : colors.border
                                    }}
                                    onPress={() => setTaskRemindersEnabled(!taskRemindersEnabled)}
                                 >
                                    <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${taskRemindersEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                       }`} />
                                 </Pressable>
                              </View>
                           </View>

                           <View className="p-4 rounded-xl border mb-2" style={{
                              backgroundColor: colors.surface,
                              borderColor: colors.border
                           }}>
                              <View className="flex-row items-center justify-between">
                                 <View>
                                    <Text className="font-sans-medium" style={{ color: colors.foreground }}>
                                       Calendar Events
                                    </Text>
                                    <Text className="text-sm" style={{ color: colors.muted }}>
                                       Event notifications
                                    </Text>
                                 </View>
                                 <Pressable
                                    className={`w-12 h-6 rounded-full`}
                                    style={{
                                       backgroundColor: calendarRemindersEnabled ? colors.accent : colors.border
                                    }}
                                    onPress={() => setCalendarRemindersEnabled(!calendarRemindersEnabled)}
                                 >
                                    <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${calendarRemindersEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                       }`} />
                                 </Pressable>
                              </View>
                           </View>

                           <View className="p-4 rounded-xl border mb-2" style={{
                              backgroundColor: colors.surface,
                              borderColor: colors.border
                           }}>
                              <Text className="font-sans-medium mb-2" style={{ color: colors.foreground }}>
                                 Default Reminder Time
                              </Text>
                              <Text className="text-sm mb-3" style={{ color: colors.muted }}>
                                 When should we send daily reminders?
                              </Text>
                              <View className="flex-row gap-2 flex-wrap">
                                 {['08:00', '09:00', '10:00', '18:00'].map((time) => (
                                    <Pressable
                                       key={time}
                                       className={`px-3 py-2 rounded-lg border`}
                                       style={{
                                          borderColor: reminderTime === time ? colors.accent : colors.border,
                                          backgroundColor: reminderTime === time ? colors.accent + '10' : colors.surface,
                                       }}
                                       onPress={() => setReminderTime(time)}
                                    >
                                       <Text className={`text-sm font-sans-medium`} style={{
                                          color: reminderTime === time ? colors.accent : colors.foreground
                                       }}>{time}</Text>
                                    </Pressable>
                                 ))}
                              </View>
                           </View>
                        </>
                     )}
                  </View>
               </View>


               {/* Language & Region */}
               <View className="mb-8">
                  <Text className="text-lg font-sans-semibold mb-4" style={{ color: colors.foreground }}>
                     Language & Region
                  </Text>
                  <View className="space-y-3">
                     <View className="p-4 rounded-xl border" style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                     }}>
                        <Text className="font-sans-medium mb-2" style={{ color: colors.foreground }}>
                           Language
                        </Text>
                        <Text className="text-sm mb-3" style={{ color: colors.muted }}>
                           Choose your preferred language
                        </Text>
                        <View className="flex-row gap-2 flex-wrap">
                           {[
                              { code: 'en', name: 'English' },
                              { code: 'es', name: 'Español' },
                              { code: 'fr', name: 'Français' },
                              { code: 'de', name: 'Deutsch' },
                           ].map((lang) => (
                              <Pressable
                                 key={lang.code}
                                 className={`px-3 py-2 rounded-lg border`}
                                 style={{
                                    borderColor: language === lang.code ? colors.accent : colors.border,
                                    backgroundColor: language === lang.code ? colors.accent + '10' : colors.surface,
                                 }}
                                 onPress={() => setLanguage(lang.code)}
                              >
                                 <Text className={`text-sm font-sans-medium`} style={{
                                    color: language === lang.code ? colors.accent : colors.foreground
                                 }}>{lang.name}</Text>
                              </Pressable>
                           ))}
                        </View>
                     </View>

                     <View className="p-4 rounded-xl border mt-3" style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                     }}>
                        <Text className="font-sans-medium mb-2" style={{ color: colors.foreground }}>
                           Date Format
                        </Text>
                        <Text className="text-sm mb-3" style={{ color: colors.muted }}>
                           How should dates be displayed?
                        </Text>
                        <View className="flex-row gap-2 flex-wrap">
                           {[
                              { format: 'MM/dd/yyyy', example: '12/25/2024' },
                              { format: 'dd/MM/yyyy', example: '25/12/2024' },
                              { format: 'yyyy-MM-dd', example: '2024-12-25' },
                           ].map((date) => (
                              <Pressable
                                 key={date.format}
                                 className={`px-3 py-2 rounded-lg border`}
                                 style={{
                                    borderColor: dateFormat === date.format ? colors.accent : colors.border,
                                    backgroundColor: dateFormat === date.format ? colors.accent + '10' : colors.surface,
                                 }}
                                 onPress={() => setDateFormat(date.format)}
                              >
                                 <Text className={`text-sm font-sans-medium`} style={{
                                    color: dateFormat === date.format ? colors.accent : colors.foreground
                                 }}>{date.example}</Text>
                              </Pressable>
                           ))}
                        </View>
                     </View>
                  </View>
               </View>

               {/* Calendar & Task Management */}
               <View className="mb-8">
                  <Text className="text-lg font-sans-semibold mb-4" style={{ color: colors.foreground }}>
                     Calendar & Tasks
                  </Text>
                  <View className="space-y-3">
                     <View className="p-4 rounded-xl border mb-2" style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                     }}>
                        <View className="flex-row items-center justify-between">
                           <View>
                              <Text className="font-sans-medium" style={{ color: colors.foreground }}>
                                 Auto-sync Calendars
                              </Text>
                              <Text className="text-sm" style={{ color: colors.muted }}>
                                 Sync device calendars automatically
                              </Text>
                           </View>
                           <Pressable
                              className={`w-12 h-6 rounded-full`}
                              style={{
                                 backgroundColor: autoSyncCalendar ? colors.accent : colors.border
                              }}
                              onPress={() => setAutoSyncCalendar(!autoSyncCalendar)}
                           >
                              <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${autoSyncCalendar ? 'translate-x-6' : 'translate-x-0.5'
                                 }`} />
                           </Pressable>
                        </View>
                     </View>

                     <View className="p-4 rounded-xl border mb-2" style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                     }}>
                        <Text className="font-sans-medium mb-2" style={{ color: colors.foreground }}>
                           Default Event Duration
                        </Text>
                        <Text className="text-sm mb-3" style={{ color: colors.muted }}>
                           Default length for new events
                        </Text>
                        <View className="flex-row gap-2 flex-wrap">
                           {[30, 45, 60, 90, 120].map((duration) => (
                              <Pressable
                                 key={duration}
                                 className={`px-3 py-2 rounded-lg border`}
                                 style={{
                                    borderColor: defaultEventDuration === duration ? colors.accent : colors.border,
                                    backgroundColor: defaultEventDuration === duration ? colors.accent + '10' : colors.surface,
                                 }}
                                 onPress={() => setDefaultEventDuration(duration)}
                              >
                                 <Text className={`text-sm font-sans-medium`} style={{
                                    color: defaultEventDuration === duration ? colors.accent : colors.foreground
                                 }}>{duration}m</Text>
                              </Pressable>
                           ))}
                        </View>
                     </View>

                     <View className="p-4 rounded-xl border mb-2" style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                     }}>
                        <Text className="font-sans-medium mb-2" style={{ color: colors.foreground }}>
                           Default Task Priority
                        </Text>
                        <Text className="text-sm mb-3" style={{ color: colors.muted }}>
                           Priority for new tasks
                        </Text>
                        <View className="space-y-2">
                           {[
                              { key: 'low', label: 'Low', color: '#10B981' },
                              { key: 'medium', label: 'Medium', color: '#F59E0B' },
                              { key: 'high', label: 'High', color: '#F97316' },
                              { key: 'urgent', label: 'Urgent', color: '#EF4444' },
                           ].map((priority) => (
                              <Pressable
                                 key={priority.key}
                                 className={`flex-row items-center p-3 mb-2 rounded-lg border`}
                                 style={{
                                    borderColor: defaultTaskPriority === priority.key ? colors.accent : colors.border,
                                    backgroundColor: defaultTaskPriority === priority.key ? colors.accent + '10' : colors.surface,
                                 }}
                                 onPress={() => setDefaultTaskPriority(priority.key as any)}
                              >
                                 <View className={`w-3 h-3 rounded-full mr-3`} style={{ backgroundColor: priority.color }} />
                                 <Text className={`font-sans-medium flex-1`} style={{
                                    color: defaultTaskPriority === priority.key ? colors.accent : colors.foreground
                                 }}>{priority.label}</Text>
                                 {defaultTaskPriority === priority.key && (
                                    <Ionicons name="checkmark" size={16} color={colors.accent} />
                                 )}
                              </Pressable>
                           ))}
                        </View>
                     </View>
                  </View>
               </View>

               {/* UI Preferences */}
               <View className="mb-8">
                  <Text className="text-lg font-sans-semibold mb-4" style={{ color: colors.foreground }}>
                     UI Preferences
                  </Text>
                  <View className="space-y-3">
                     <View className="p-4 rounded-xl border mb-2" style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                     }}>
                        <View className="flex-row items-center justify-between">
                           <View>
                              <Text className="font-sans-medium" style={{ color: colors.foreground }}>
                                 Compact Mode
                              </Text>
                              <Text className="text-sm" style={{ color: colors.muted }}>
                                 Show more content with less spacing
                              </Text>
                           </View>
                           <Pressable
                              className={`w-12 h-6 rounded-full`}
                              style={{
                                 backgroundColor: compactMode ? colors.accent : colors.border
                              }}
                              onPress={() => setCompactMode(!compactMode)}
                           >
                              <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${compactMode ? 'translate-x-6' : 'translate-x-0.5'
                                 }`} />
                           </Pressable>
                        </View>
                     </View>

                     <View className="p-4 rounded-xl border mb-2" style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                     }}>
                        <View className="flex-row items-center justify-between">
                           <View>
                              <Text className="font-sans-medium" style={{ color: colors.foreground }}>
                                 Show Completed Tasks
                              </Text>
                              <Text className="text-sm" style={{ color: colors.muted }}>
                                 Keep completed tasks visible
                              </Text>
                           </View>
                           <Pressable
                              className={`w-12 h-6 rounded-full`}
                              style={{
                                 backgroundColor: showCompletedTasks ? colors.accent : colors.border
                              }}
                              onPress={() => setShowCompletedTasks(!showCompletedTasks)}
                           >
                              <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showCompletedTasks ? 'translate-x-6' : 'translate-x-0.5'
                                 }`} />
                           </Pressable>
                        </View>
                     </View>
                  </View>
               </View>

               {/* Productivity */}
               <View className="mb-8">
                  <Text className="text-lg font-sans-semibold mb-4" style={{ color: colors.foreground }}>
                     Productivity
                  </Text>
                  <View className="space-y-3">
                     <View className="p-4 rounded-xl border mb-2" style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                     }}>
                        <View className="flex-row items-center justify-between">
                           <View>
                              <Text className="font-sans-medium" style={{ color: colors.foreground }}>
                                 Focus Mode
                              </Text>
                              <Text className="text-sm" style={{ color: colors.muted }}>
                                 Minimize distractions during work
                              </Text>
                           </View>
                           <Pressable
                              className={`w-12 h-6 rounded-full`}
                              style={{
                                 backgroundColor: focusModeEnabled ? colors.accent : colors.border
                              }}
                              onPress={() => setFocusModeEnabled(!focusModeEnabled)}
                           >
                              <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${focusModeEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                 }`} />
                           </Pressable>
                        </View>
                     </View>

                     <View className="p-4 rounded-xl border" style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                     }}>
                        <Text className="font-sans-medium mb-2" style={{ color: colors.foreground }}>
                           Daily Goal
                        </Text>
                        <Text className="text-sm mb-3" style={{ color: colors.muted }}>
                           Target productive minutes per day
                        </Text>
                        <View className="flex-row gap-2 flex-wrap">
                           {[240, 360, 480, 600, 720].map((minutes) => (
                              <Pressable
                                 key={minutes}
                                 className={`px-3 py-2 rounded-lg border`}
                                 style={{
                                    borderColor: dailyGoalMinutes === minutes ? colors.accent : colors.border,
                                    backgroundColor: dailyGoalMinutes === minutes ? colors.accent + '10' : colors.surface,
                                 }}
                                 onPress={() => setDailyGoalMinutes(minutes)}
                              >
                                 <Text className={`text-sm font-sans-medium`} style={{
                                    color: dailyGoalMinutes === minutes ? colors.accent : colors.foreground
                                 }}>{Math.floor(minutes / 60)}h{minutes % 60 > 0 ? ` ${minutes % 60}m` : ''}</Text>
                              </Pressable>
                           ))}
                        </View>
                     </View>

                     {focusModeEnabled && (
                        <View className="p-4 rounded-xl border" style={{
                           backgroundColor: colors.surface,
                           borderColor: colors.border
                        }}>
                           <Text className="font-sans-medium mb-2" style={{ color: colors.foreground }}>
                              Pomodoro Duration
                           </Text>
                           <Text className="text-sm mb-3" style={{ color: colors.muted }}>
                              Work session length (minutes)
                           </Text>
                           <View className="flex-row gap-2 flex-wrap">
                              {[15, 25, 30, 45, 60].map((duration) => (
                                 <Pressable
                                    key={duration}
                                    className={`px-3 py-2 rounded-lg border`}
                                    style={{
                                       borderColor: pomodoroDuration === duration ? colors.accent : colors.border,
                                       backgroundColor: pomodoroDuration === duration ? colors.accent + '10' : colors.surface,
                                    }}
                                    onPress={() => setPomodoroDuration(duration)}
                                 >
                                    <Text className={`text-sm font-sans-medium`} style={{
                                       color: pomodoroDuration === duration ? colors.accent : colors.foreground
                                    }}>{duration}m</Text>
                                 </Pressable>
                              ))}
                           </View>
                        </View>
                     )}
                  </View>
               </View>

               {/* AI Assistant */}
               <View className="mb-8">
                  <Text className="text-lg font-sans-semibold mb-4" style={{ color: colors.foreground }}>
                     AI Assistant
                  </Text>
                  <View className="p-4 rounded-xl border" style={{
                     backgroundColor: colors.surface,
                     borderColor: colors.border
                  }}>
                     <View className="flex-row items-center justify-between">
                        <View>
                           <Text className="font-sans-medium" style={{ color: colors.foreground }}>
                              AI Suggestions
                           </Text>
                           <Text className="text-sm" style={{ color: colors.muted }}>
                              Get smart recommendations
                           </Text>
                        </View>
                        <Pressable
                           className={`w-12 h-6 rounded-full`}
                           style={{
                              backgroundColor: aiSuggestionsEnabled ? colors.accent : colors.border
                           }}
                           onPress={() => setAiSuggestionsEnabled(!aiSuggestionsEnabled)}
                        >
                           <View className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${aiSuggestionsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                              }`} />
                        </Pressable>
                     </View>
                  </View>
               </View>

               {/* Complete Button */}
               <Pressable
                  className="py-4 rounded-xl"
                  style={{ backgroundColor: colors.accent }}
                  onPress={handleCompleteOnboarding}
                  disabled={isLoading}
               >
                  <Text className="text-center font-sans-semibold text-base" style={{ color: colors.background }}>
                     {isLoading ? 'Setting up...' : 'Get Started'}
                  </Text>
               </Pressable>

               <Pressable
                  className="mt-4 py-2"
                  onPress={() => router.replace('/(tabs)')}
               >
                  <Text className="text-center" style={{ color: colors.muted }}>
                     Skip for now
                  </Text>
               </Pressable>
            </View>
         </ScrollView>
      </View>
   );
}
