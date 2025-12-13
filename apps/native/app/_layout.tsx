import "@/global.css";
import React, { useEffect } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
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
         <StatusBar style="auto" />
         <Stack>
            <Stack.Protected guard={isAuthenticated}>
               <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
               <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </Stack.Protected>

            <Stack.Protected guard={!isAuthenticated && hasCompletedOnboarding}>
               <Stack.Screen name="sign-in" options={{ headerShown: false }} />
               <Stack.Screen name="sign-up" options={{ headerShown: false }} />
            </Stack.Protected>

            <Stack.Protected guard={!hasCompletedOnboarding}>
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
