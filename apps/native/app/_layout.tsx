import "@/global.css";
import React, { useEffect } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, Redirect, useSegments } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import { useAuthStore } from "@/stores/useAuthStore";
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';

import { queryClient } from "@/utils/orpc";
import { useSemanticColors } from "@/utils/theme-utils";

const isWeb = Platform.OS === "web";
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
   initialRouteName: "index",
};

function StackLayout() {
   const {
      isAuthenticated,
      hasCompletedOnboarding,
      _hasHydrated,
   } = useAuthStore();
   const segments = useSegments();

   useEffect(() => {
      console.log('🔄 Layout - Auth state changed:', {
         isAuthenticated,
         hasCompletedOnboarding,
         _hasHydrated
      });
   }, [isAuthenticated, hasCompletedOnboarding, _hasHydrated]);

   // Hide splash screen when hydrated
   useEffect(() => {
      if (_hasHydrated) {
         SplashScreen.hideAsync();
      }
   }, [_hasHydrated]);

   // Show nothing while hydrating (splash screen covers this)
   if (!_hasHydrated && !isWeb) {
      return null;
   }

   // Determine where to redirect based on current location and auth state
   const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'modal';
   const inOnboarding = segments[0] === 'onboarding';

   // Calculate redirect target
   let redirectTo: string | null = null;

   if (isAuthenticated && hasCompletedOnboarding) {
      // User is fully authenticated and onboarded - go to main app
      if (!inAuthGroup) {
         console.log('🔄 Layout - Redirecting to main app');
         redirectTo = '/(tabs)';
      }
   } else if (isAuthenticated && !hasCompletedOnboarding) {
      // User is authenticated but needs onboarding
      if (!inOnboarding) {
         console.log('🔄 Layout - Redirecting to onboarding');
         redirectTo = '/onboarding';
      }
   } else if (!isAuthenticated) {
      // User is not authenticated - stay on landing or auth screens
      if (inAuthGroup || inOnboarding) {
         console.log('🔄 Layout - Redirecting to landing page');
         redirectTo = '/';
      }
   }

   const colors = useSemanticColors();


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

         {/* Declarative redirect - rendered after Stack is mounted */}
         {redirectTo && <Redirect href={redirectTo as any} />}
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
