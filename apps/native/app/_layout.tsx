import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, SplashScreen } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
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
  const { isLoggedIn, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !isWeb) {
      SplashScreen.hideAsync();
    }
  }, [_hasHydrated]);

  if (!_hasHydrated && !isWeb) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <AppThemeProvider>
            <HeroUINativeProvider>
              <Stack>
                <Stack.Protected guard={isLoggedIn}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                </Stack.Protected>
                <Stack.Protected guard={!isLoggedIn}>
                  <Stack.Screen name="sign-in" options={{ headerShown: false }} />
                  <Stack.Screen name="sign-up" options={{ headerShown: false }} />
                </Stack.Protected>
              </Stack>
            </HeroUINativeProvider>
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
