import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, usePathname } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { useAuthStore } from "@/stores/auth-store";
import { queryClient } from "@/utils/orpc";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

function AuthNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;

    const isAuthRoute = pathname === "/sign-in" || pathname === "/sign-up";

    if (isAuthenticated && isAuthRoute) {
      router.replace("/(tabs)");
    } else if (!isAuthenticated && !isAuthRoute) {
      router.replace("/sign-in");
    }
  }, [isAuthenticated, isInitialized, pathname, router]);

  return null;
}

function StackLayout() {
  return (
    <Stack screenOptions={{}}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ title: "Modal", presentation: "modal" }} />
      <Stack.Screen
        name="sign-up"
        options={{ title: "Sign Up", presentation: "formSheet", headerShown: false }}
      />
      <Stack.Screen name="sign-in" options={{ title: "Sign In", presentation: "formSheet" }} />
    </Stack>
  );
}

function AuthInitializer() {
  const checkSession = useAuthStore((state) => state.checkSession);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (!isInitialized) {
      checkSession();
    }
  }, [checkSession, isInitialized]);

  return null;
}

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <AppThemeProvider>
            <HeroUINativeProvider>
              <AuthInitializer />
              <AuthNavigation />
              <StackLayout />
            </HeroUINativeProvider>
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
