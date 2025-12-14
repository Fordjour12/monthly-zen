import React, { useState } from 'react';
import {
   View,
   Text,
   ScrollView,
   Pressable,
   Switch,
   Alert,
   ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from 'heroui-native';
import { useSemanticColors } from '@/utils/theme-utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUserPreferenceStore } from '@/stores/useUserPreferenceStore';
import { useAppTheme } from '@/contexts/app-theme-context';
import { Container } from "@/components/container";

export default function Profile() {
   const router = useRouter();
   const colors = useSemanticColors();
   const { currentTheme, setTheme } = useAppTheme();
   const { user, signOut, isAuthenticated } = useAuthStore();
   const {
      getAllPreferences,
      setPreference,
      resetAllPreferences,
      savePreferencesToServer,
   } = useUserPreferenceStore();

   const [isSaving, setIsSaving] = useState(false);
   const [isSigningOut, setIsSigningOut] = useState(false);

   // Get all preferences for display
   const preferences = getAllPreferences();

   // Handle theme change
   const handleThemeChange = async (theme: 'zen' | 'zen-light' | 'system') => {
      try {
         setTheme(theme);
         setPreference('theme', theme);
      } catch (error) {
         Alert.alert('Error', 'Failed to change theme');
      }
   };

   // Handle preference toggle
   const handleTogglePreference = async (key: keyof typeof preferences, value: any) => {
      try {
         setPreference(key, value);
      } catch (error) {
         Alert.alert('Error', `Failed to update ${key}`);
      }
   };

   // Handle reset preferences
   const handleResetPreferences = () => {
      Alert.alert(
         'Reset Preferences',
         'Are you sure you want to reset all preferences to default values? This action cannot be undone.',
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Reset',
               style: 'destructive',
               onPress: () => {
                  resetAllPreferences();
                  Alert.alert('Success', 'All preferences have been reset to default values');
               },
            },
         ]
      );
   };

   // Handle sign out
   const handleSignOut = async () => {
      Alert.alert(
         'Sign Out',
         'Are you sure you want to sign out?',
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Sign Out',
               style: 'destructive',
               onPress: async () => {
                  setIsSigningOut(true);
                  try {
                     await signOut();
                     router.replace('/');
                  } catch (error) {
                     Alert.alert('Error', 'Failed to sign out');
                  } finally {
                     setIsSigningOut(false);
                  }
               },
            },
         ]
      );
   };

   if (!isAuthenticated || !user) {
      return (
         <Container className="pt-9">
            <View className="flex-1 items-center justify-center">
               <Text className="text-foreground font-sans mb-4">Please sign in to view your profile</Text>
               <Pressable
                  className="py-2 px-4 rounded-lg bg-orange-500"
                  onPress={() => router.push('/sign-in')}
               >
                  <Text className="text-white font-sans-medium">Sign In</Text>
               </Pressable>
            </View>
         </Container>
      );
   }

   return (
      <Container className="pt-9">
         <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {/* User Info Section */}
            <Card variant="secondary" className="mb-6 p-4">
               <View className="items-center mb-4">
                  <View className="w-20 h-20 rounded-full bg-orange-500 items-center justify-center mb-3">
                     <Text className="text-white text-2xl font-sans-bold">
                        {user.name.charAt(0).toUpperCase()}
                     </Text>
                  </View>
                  <Text className="text-foreground font-sans-bold text-xl mb-1">{user.name}</Text>
                  <Text className="text-muted font-sans">{user.email}</Text>
                  {user.emailVerified && (
                     <View className="flex-row items-center mt-2">
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text className="text-green-600 text-sm font-sans ml-1">Verified</Text>
                     </View>
                  )}
               </View>
               <View className="flex-row justify-around pt-4 border-t border-divider">
                  <View className="items-center">
                     <Text className="text-foreground font-sans-bold text-lg">{preferences.dailyGoalMinutes}</Text>
                     <Text className="text-muted text-xs font-sans">Daily Goal (min)</Text>
                  </View>
                  <View className="items-center">
                     <Text className="text-foreground font-sans-bold text-lg">{preferences.defaultEventDuration}</Text>
                     <Text className="text-muted text-xs font-sans">Event Duration (min)</Text>
                  </View>
                  <View className="items-center">
                     <Text className="text-foreground font-sans-bold text-lg capitalize">{preferences.defaultTaskPriority}</Text>
                     <Text className="text-muted text-xs font-sans">Task Priority</Text>
                  </View>
               </View>
            </Card>

            {/* Theme Section */}
            <Card variant="secondary" className="mb-6 p-4">
               <Text className="text-foreground font-sans-semibold text-lg mb-4">Appearance</Text>
               <View className="space-y-3">
                  <Text className="text-foreground font-sans-medium mb-2">Theme</Text>
                  {[
                     { key: 'zen', label: 'Zen Dark', icon: 'moon' },
                     { key: 'zen-light', label: 'Zen Light', icon: 'sunny' },
                     { key: 'system', label: 'System', icon: 'settings' },
                  ].map(({ key, label, icon }) => (
                     <Pressable
                        key={key}
                        className={`flex-row items-center p-3 rounded-lg border mb-2 ${currentTheme === key ? 'border-orange-500 bg-orange-500/10' : 'border-divider'
                           }`}
                        onPress={() => handleThemeChange(key as any)}
                     >
                        <Ionicons
                           name={icon as any}
                           size={20}
                           color={currentTheme === key ? colors.accent : colors.muted}
                        />
                        <Text className={`ml-3 font-sans-medium flex-1 ${currentTheme === key ? 'text-orange-500' : 'text-foreground'
                           }`}>
                           {label}
                        </Text>
                        {currentTheme === key && (
                           <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                        )}
                     </Pressable>
                  ))}
               </View>
            </Card>

            {/* Notifications Section */}
            <Card variant="secondary" className="mb-6 p-4">
               <Text className="text-foreground font-sans-semibold text-lg mb-4">Notifications</Text>
               <View className="space-y-4">
                  <View className="flex-row items-center justify-between">
                     <View>
                        <Text className="text-foreground font-sans-medium">Push Notifications</Text>
                        <Text className="text-muted text-sm font-sans">Receive app notifications</Text>
                     </View>
                     <Switch
                        value={preferences.notificationsEnabled}
                        onValueChange={(value) => handleTogglePreference('notificationsEnabled', value)}
                        trackColor={{ false: colors.border, true: colors.accent + '40' }}
                        thumbColor={preferences.notificationsEnabled ? colors.accent : colors.muted}
                     />
                  </View>
                  <View className="flex-row items-center justify-between mt-2">
                     <View>
                        <Text className="text-foreground font-sans-medium">Daily Briefing</Text>
                        <Text className="text-muted text-sm font-sans">Start your day with a summary</Text>
                     </View>
                     <Switch
                        value={preferences.dailyBriefingEnabled}
                        onValueChange={(value) => handleTogglePreference('dailyBriefingEnabled', value)}
                        trackColor={{ false: colors.border, true: colors.accent + '40' }}
                        thumbColor={preferences.dailyBriefingEnabled ? colors.accent : colors.muted}
                     />
                  </View>
                  <View className="flex-row items-center justify-between my-2">
                     <View>
                        <Text className="text-foreground font-sans-medium">Task Reminders</Text>
                        <Text className="text-muted text-sm font-sans">Never miss important tasks</Text>
                     </View>
                     <Switch
                        value={preferences.taskRemindersEnabled}
                        onValueChange={(value) => handleTogglePreference('taskRemindersEnabled', value)}
                        trackColor={{ false: colors.border, true: colors.accent + '40' }}
                        thumbColor={preferences.taskRemindersEnabled ? colors.accent : colors.muted}
                     />
                  </View>
                  <View className="flex-row items-center justify-between">
                     <View>
                        <Text className="text-foreground font-sans-medium">Calendar Events</Text>
                        <Text className="text-muted text-sm font-sans">Event notifications</Text>
                     </View>
                     <Switch
                        value={preferences.calendarRemindersEnabled}
                        onValueChange={(value) => handleTogglePreference('calendarRemindersEnabled', value)}
                        trackColor={{ false: colors.border, true: colors.accent + '40' }}
                        thumbColor={preferences.calendarRemindersEnabled ? colors.accent : colors.muted}
                     />
                  </View>
               </View>
            </Card>

            {/* Productivity Section */}
            <Card variant="secondary" className="mb-6 p-4">
               <Text className="text-foreground font-sans-semibold text-lg mb-4">Productivity</Text>
               <View className="space-y-4">
                  <View className="flex-row items-center justify-between">
                     <View>
                        <Text className="text-foreground font-sans-medium">Focus Mode</Text>
                        <Text className="text-muted text-sm font-sans">Minimize distractions</Text>
                     </View>
                     <Switch
                        value={preferences.focusModeEnabled}
                        onValueChange={(value) => handleTogglePreference('focusModeEnabled', value)}
                        trackColor={{ false: colors.border, true: colors.accent + '40' }}
                        thumbColor={preferences.focusModeEnabled ? colors.accent : colors.muted}
                     />
                  </View>
                  <View className="flex-row items-center justify-between my-2">
                     <View>
                        <Text className="text-foreground font-sans-medium">AI Suggestions</Text>
                        <Text className="text-muted text-sm font-sans">Get smart recommendations</Text>
                     </View>
                     <Switch
                        value={preferences.aiSuggestionsEnabled}
                        onValueChange={(value) => handleTogglePreference('aiSuggestionsEnabled', value)}
                        trackColor={{ false: colors.border, true: colors.accent + '40' }}
                        thumbColor={preferences.aiSuggestionsEnabled ? colors.accent : colors.muted}
                     />
                  </View>
                  <View className="flex-row items-center justify-between">
                     <View>
                        <Text className="text-foreground font-sans-medium">Auto-sync Calendar</Text>
                        <Text className="text-muted text-sm font-sans">Sync device calendars</Text>
                     </View>
                     <Switch
                        value={preferences.autoSyncCalendar}
                        onValueChange={(value) => handleTogglePreference('autoSyncCalendar', value)}
                        trackColor={{ false: colors.border, true: colors.accent + '40' }}
                        thumbColor={preferences.autoSyncCalendar ? colors.accent : colors.muted}
                     />
                  </View>
               </View>
            </Card>

            {/* UI Preferences Section */}
            <Card variant="secondary" className="mb-6 p-4">
               <Text className="text-foreground font-sans-semibold text-lg mb-4">UI Preferences</Text>
               <View className="space-y-4">
                  <View className="flex-row items-center justify-between ">
                     <View>
                        <Text className="text-foreground font-sans-medium">Compact Mode</Text>
                        <Text className="text-muted text-sm font-sans">Show more content with less spacing</Text>
                     </View>
                     <Switch
                        value={preferences.compactMode}
                        onValueChange={(value) => handleTogglePreference('compactMode', value)}
                        trackColor={{ false: colors.border, true: colors.accent + '40' }}
                        thumbColor={preferences.compactMode ? colors.accent : colors.muted}
                     />
                  </View>
                  <View className="flex-row items-center justify-between my-2">
                     <View>
                        <Text className="text-foreground font-sans-medium">Show Completed Tasks</Text>
                        <Text className="text-muted text-sm font-sans">Keep completed tasks visible</Text>
                     </View>
                     <Switch
                        value={preferences.showCompletedTasks}
                        onValueChange={(value) => handleTogglePreference('showCompletedTasks', value)}
                        trackColor={{ false: colors.border, true: colors.accent + '40' }}
                        thumbColor={preferences.showCompletedTasks ? colors.accent : colors.muted}
                     />
                  </View>
               </View>
            </Card>

            {/* Account Actions */}
            <Card variant="secondary" className="mb-6 p-4">
               <Text className="text-foreground font-sans-semibold text-lg mb-4">Account</Text>
               <View className="space-y-3">
                  <Pressable
                     className="flex-row items-center justify-between p-3 rounded-lg  border border-divider"
                     onPress={() => Alert.alert('Info', 'Account settings coming soon!')}
                  >
                     <View className="flex-row items-center">
                        <Ionicons name="person-outline" size={20} color={colors.foreground} />
                        <Text className="ml-3 font-sans-medium text-foreground">Account Settings</Text>
                     </View>
                     <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                  </Pressable>
                  <Pressable
                     className="flex-row items-center justify-between p-3 rounded-lg my-2 border border-divider"
                     onPress={() => Alert.alert('Info', 'Privacy settings coming soon!')}
                  >
                     <View className="flex-row items-center">
                        <Ionicons name="lock-closed-outline" size={20} color={colors.foreground} />
                        <Text className="ml-3 font-sans-medium text-foreground">Privacy & Security</Text>
                     </View>
                     <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                  </Pressable>
                  <Pressable
                     className="flex-row items-center justify-between p-3 rounded-lg border border-divider"
                     onPress={handleResetPreferences}
                  >
                     <View className="flex-row items-center">
                        <Ionicons name="refresh-outline" size={20} color={colors.foreground} />
                        <Text className="ml-3 font-sans-medium text-foreground">Reset Preferences</Text>
                     </View>
                     <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                  </Pressable>
               </View>
            </Card>

            {/* Danger Zone */}
            <Card variant="secondary" className="mb-8 p-4">
               <Text className="text-danger font-sans-semibold text-lg mb-4">Danger Zone</Text>
               <Pressable
                  className="flex-row items-center justify-center p-4 rounded-lg bg-danger/10 border border-danger/20"
                  onPress={handleSignOut}
                  disabled={isSigningOut}
               >
                  {isSigningOut ? (
                     <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                     <>
                        <Ionicons name="log-out-outline" size={20} color={colors.accent} />
                        <Text className="ml-2 font-sans-medium text-danger">Sign Out</Text>
                     </>
                  )}
               </Pressable>
            </Card>

            {/* App Version */}
            <View className="items-center mb-8">
               <Text className="text-muted text-xs font-sans">Monthly Zen v1.0.0</Text>
            </View>
         </ScrollView>
      </Container>
   );
}
