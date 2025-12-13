# Lean Authentication Implementation

## Overview
This document contains the lean implementation of authentication store and client for the my-better-t-app.

## Files

### 1. `apps/native/stores/useAuthStoreLean.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { authClientLean } from '@/lib/auth-client-lean';

const isWeb = Platform.OS === "web";

// MMKV storage for non-sensitive data
const mmkvStorage = createMMKV({
  id: 'auth-lean-storage',
});

// Zustand storage adapter
const zustandStorage = {
  getItem: (name: string) => {
    return isWeb ? localStorage.getItem(name) : mmkvStorage.getString(name) ?? null;
  },
  setItem: (name: string, value: string) => {
    if (isWeb) {
      localStorage.setItem(name, value);
    } else {
      mmkvStorage.set(name, value);
    }
  },
  removeItem: (name: string) => {
    if (isWeb) {
      localStorage.removeItem(name);
    } else {
      mmkvStorage.remove(name);
    }
  },
};

interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified?: boolean;
}

interface AuthStoreLean {
  // Core auth state
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStoreLean = create<AuthStoreLean>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,

      // Sign in
      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await authClientLean.signIn.email({
            email,
            password,
          });

          if (error) {
            set({ error: error.message || 'Sign in failed', isLoading: false });
            return false;
          }

          if (data?.user) {
            const user: User = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name || '',
              image: data.user.image,
              emailVerified: data.user.emailVerified,
            };

            set({
              isAuthenticated: true,
              user,
              isLoading: false,
            });

            return true;
          }

          set({ error: 'Sign in failed: Invalid response', isLoading: false });
          return false;
        } catch (error) {
          set({ error: 'Sign in failed: Network error', isLoading: false });
          return false;
        }
      },

      // Sign up
      signUp: async (email: string, password: string, name: string) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await authClientLean.signUp.email({
            email,
            password,
            name,
          });

          if (error) {
            set({ error: error.message || 'Sign up failed', isLoading: false });
            return false;
          }

          if (data?.user) {
            // Auto sign in after successful sign up
            return await get().signIn(email, password);
          }

          set({ error: 'Sign up failed: Invalid response', isLoading: false });
          return false;
        } catch (error) {
          set({ error: 'Sign up failed: Network error', isLoading: false });
          return false;
        }
      },

      // Sign out
      signOut: async () => {
        try {
          await authClientLean.signOut();
        } catch (error) {
          console.error('Sign out error:', error);
        } finally {
          // Always clear local state
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        }
      },

      // Check auth status
      checkAuthStatus: async () => {
        try {
          set({ isLoading: true });

          const { data: session } = await authClientLean.getSession();

          if (session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name || '',
              image: session.user.image,
              emailVerified: session.user.emailVerified,
            };

            set({
              isAuthenticated: true,
              user,
              isLoading: false,
            });
          } else {
            set({
              isAuthenticated: false,
              user: null,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: 'Failed to check authentication status',
          });
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store-lean',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state: AuthStoreLean) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

// Initialize auth check
export const initializeAuthLean = async () => {
  const authStore = useAuthStoreLean.getState();
  await authStore.checkAuthStatus();
};
```

### 2. `apps/native/lib/auth-client-lean.ts`

```typescript
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// Create a leaner auth client with minimal configuration
export const authClientLean = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
  plugins: [
    expoClient({
      scheme: "my-better-t-app-lean",
      storagePrefix: "my-better-t-app-lean",
      storage: SecureStore,
    }),
  ],
});
```

## Key Differences from Original Implementation

### Auth Store (`useAuthStoreLean.ts`)
1. **Simplified State Management**: Removed onboarding state and complex hydration logic
2. **Cleaner Interface**: Focused only on core authentication functionality
3. **Removed Complex Logging**: Eliminated extensive console logging for better performance
4. **Streamlined Error Handling**: Simplified error states and messaging
5. **No Manual Token Management**: Relies entirely on better-auth's built-in token handling
6. **Minimal Persistence**: Only persists essential auth state (isAuthenticated, user)

### Auth Client (`auth-client-lean.ts`)
1. **Unique Storage Prefix**: Uses "my-better-t-app-lean" to avoid conflicts with original implementation
2. **Minimal Configuration**: Clean, focused setup without unnecessary complexity
3. **Separate Storage**: Completely isolated from the original auth client storage

## Usage

```typescript
// Import the lean implementations
import { useAuthStoreLean } from '@/stores/useAuthStoreLean';
import { initializeAuthLean } from '@/stores/useAuthStoreLean';

// Initialize on app start
initializeAuthLean();

// Use in components
const { signIn, signUp, signOut, isAuthenticated, user, isLoading } = useAuthStoreLean();

// Sign in
const success = await signIn(email, password);

// Sign up
const signUpSuccess = await signUp(email, password, name);

// Sign out
await signOut();
```

## Benefits

1. **Lighter Weight**: Less code and complexity
2. **Better Performance**: No unnecessary logging or state management overhead
3. **Cleaner API**: Focused on essential authentication features
4. **Isolated Storage**: No conflicts with existing implementation
5. **Easier to Maintain**: Simplified logic and fewer edge cases to handle