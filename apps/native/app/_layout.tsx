import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, SplashScreen } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useEffect } from "react";
import { Platform } from "react-native";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { useAuthStore } from "@/stores/auth-store";
import { queryClient } from "@/utils/orpc";

const isWeb = Platform.OS === "web";

if (!isWeb) {
  SplashScreen.preventAutoHideAsync();
}

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function Layout() {
  const {
    isLoggedIn,
    hasCompletedOnboarding,
    _hasHydrated,
    syncOnboarding,
    syncSession,
    syncOnboardingStatus,
  } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !isWeb) {
      SplashScreen.hideAsync();
    }
  }, [_hasHydrated]);

  // Sync onboarding status on app start
  useEffect(() => {
    if (_hasHydrated) {
      syncSession();
    }
  }, [_hasHydrated]);

  useEffect(() => {
    if (_hasHydrated && isLoggedIn) {
      syncOnboardingStatus();
      syncOnboarding();
    }
  }, [_hasHydrated, isLoggedIn]);

  if (!_hasHydrated && !isWeb) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <KeyboardProvider>
            <AppThemeProvider>
              <HeroUINativeProvider>
                <Stack>
                  <Stack.Protected guard={isLoggedIn && hasCompletedOnboarding}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  </Stack.Protected>

                  {/* Onboarding Routes */}
                  <Stack.Protected guard={isLoggedIn && !hasCompletedOnboarding}>
                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                  </Stack.Protected>

                  {/* Public Routes */}
                  <Stack.Protected guard={!isLoggedIn}>
                    <Stack.Screen name="sign-in" options={{ headerShown: false }} />
                    <Stack.Screen name="sign-up" options={{ headerShown: false }} />
                  </Stack.Protected>
                </Stack>
              </HeroUINativeProvider>
            </AppThemeProvider>
          </KeyboardProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
