import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColor } from 'heroui-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { initializeAuth } from '@/stores/useAuthStore';
import { initializePreferences } from '@/stores/useUserPreferenceStore';
import { useRouter } from 'expo-router';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/',
}) => {
  const [initializing, setInitializing] = useState(true);
  const { isAuthenticated, authLoaded, user } = useAuthStore();
  const router = useRouter();
  const themeColorBackground = useThemeColor('background');
  const themeColorForeground = useThemeColor('foreground');

  useEffect(() => {
    const init = async () => {
      // Initialize auth and preferences
      initializeAuth();
      initializePreferences();

      // Give it a moment to complete initialization
      setTimeout(() => {
        setInitializing(false);
      }, 500);
    };

    init();
  }, []);

  useEffect(() => {
    if (!initializing && authLoaded) {
      if (requireAuth && !isAuthenticated) {
        // Redirect to login if auth is required but user is not authenticated
        router.replace('/');
      } else if (!requireAuth && isAuthenticated) {
        // Redirect to main app if user is authenticated but auth is not required
        router.replace('/(tabs)');
      }
    }
  }, [initializing, authLoaded, isAuthenticated, requireAuth, router]);

  // Show loading screen during initialization
  if (initializing || !authLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: themeColorBackground }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={themeColorForeground} />
          <Text style={[styles.loadingText, { color: themeColorForeground }]}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  // If auth is required and user is not authenticated, show nothing (will redirect)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If auth is not required but user is authenticated, show nothing (will redirect)
  if (!requireAuth && isAuthenticated) {
    return null;
  }

  // Otherwise, render children
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
});

// Higher-order component for route protection
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requireAuth: boolean = true
) => {
  return (props: P) => (
    <AuthGuard requireAuth={requireAuth}>
      <WrappedComponent {...props} />
    </AuthGuard>
  );
};