import "@/global.css";
import React, { useEffect } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import { useAuthStore } from "@/stores/useAuthStore";
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';

import { queryClient } from "@/utils/orpc";

const isWeb = Platform.OS === "web";
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
   initialRouteName: "(tabs)",
};

function StackLayout() {
   const {
      isAuthenticated,
      hasCompletedOnboarding,
      _hasHydrated,
   } = useAuthStore();
   const router = useRouter();
   const segments = useSegments();

   useEffect(() => {
      console.log('🔄 Layout - Auth state changed:', {
         isAuthenticated,
         hasCompletedOnboarding,
         _hasHydrated
      });
   }, [isAuthenticated, hasCompletedOnboarding, _hasHydrated]);

   // Handle navigation based on auth state
   useEffect(() => {
      if (!_hasHydrated) return;

      const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'modal';
      const inOnboarding = segments[0] === 'onboarding';
      const inAuthScreens = segments[0] === 'sign-in' || segments[0] === 'sign-up';

      // Use setTimeout to ensure Stack is mounted before navigation
      const navigate = () => {
         if (isAuthenticated && hasCompletedOnboarding) {
            // User is fully authenticated and onboarded - go to main app
            if (!inAuthGroup) {
               console.log('🔄 Layout - Redirecting to main app');
               router.replace('/(tabs)');
            }
         } else if (isAuthenticated && !hasCompletedOnboarding) {
            // User is authenticated but needs onboarding
            if (!inOnboarding) {
               console.log('🔄 Layout - Redirecting to onboarding');
               router.replace('/onboarding');
            }
         } else if (!isAuthenticated) {
            // User is not authenticated - stay on landing or auth screens
            if (inAuthGroup || inOnboarding) {
               console.log('🔄 Layout - Redirecting to landing page');
               router.replace('/');
            }
         }
      };

      // Delay navigation to ensure Stack is mounted
      const timer = setTimeout(navigate, 0);
      return () => clearTimeout(timer);
   }, [_hasHydrated, isAuthenticated, hasCompletedOnboarding, segments]);

   useEffect(() => {
      if (_hasHydrated) {
         SplashScreen.hideAsync();
      }
   }, [_hasHydrated]);

   if (!_hasHydrated && !isWeb) {
      return null;
   }

   return (
      <React.Fragment>
         <StatusBar style="dark" />
         <Stack>
            <Stack.Protected guard={isAuthenticated && hasCompletedOnboarding}>
               <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
               <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </Stack.Protected>

            <Stack.Protected guard={!isAuthenticated}>
               <Stack.Screen name="sign-in" options={{ headerShown: false }} />
               <Stack.Screen name="sign-up" options={{ headerShown: false }} />
            </Stack.Protected>

            <Stack.Protected guard={isAuthenticated && !hasCompletedOnboarding}>
               <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            </Stack.Protected>

            {/* Landing page - always accessible */}
            <Stack.Screen name="index" options={{ headerShown: false }} />
         </Stack>
      </React.Fragment>
   );
}

export default function Layout() {
   return (
      <QueryClientProvider client={queryClient}>
         <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
               <AppThemeProvider>
                  <HeroUINativeProvider>
                     <StackLayout />
                  </HeroUINativeProvider>
               </AppThemeProvider>
            </KeyboardProvider>
         </GestureHandlerRootView>
      </QueryClientProvider>
   );
}
