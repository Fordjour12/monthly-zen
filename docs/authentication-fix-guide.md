# Authentication Token Management Fix Guide

## Problem Summary

The current authentication system has **conflicting token management** where both better-auth and manual token storage are used simultaneously, causing:

- Token storage conflicts between `'auth_token'` (manual) and `'my-better-t-app_session_token'` (better-auth)
- Authentication state synchronization issues
- Cache-related button lockups on the landing page
- Redundant and problematic token management code

## Root Cause

The auth store (`useAuthStore.ts`) implements manual token management that conflicts with better-auth's built-in secure token handling through the expoClient plugin.

## How Better-Auth Handles Tokens

When better-auth handles tokens:
1. **Storage**: Tokens are automatically stored in Expo SecureStore using the configured prefix (`my-better-t-app`)
2. **Format**: Better-auth manages the token format and encryption internally
3. **Validation**: `authClient.getSession()` validates tokens against the server
4. **Refresh**: Token refresh is handled automatically when sessions expire
5. **Cleanup**: `authClient.signOut()` properly removes all authentication data

The manual token management in `useAuthStore.ts` interferes with this process by trying to store the same tokens under different keys, causing conflicts and authentication state issues.

## Solution Overview

**Remove all manual token management** and rely solely on better-auth's built-in token handling. This eliminates conflicts and simplifies the authentication flow.

**Storage Strategy**:
- **Native**: Better-auth handles all sensitive data (tokens) via Expo SecureStore
- **Web**: localStorage stores only non-sensitive UI state (onboarding completion)
- **No MMKV**: Removed unnecessary dependency since better-auth handles secure storage

## Implementation: Fixed Authentication Store

### `/apps/native/stores/useAuthStore.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import { authClient } from '@/lib/auth-client';
import { queryClient } from '@/lib/query-client';

const isWeb = Platform.OS === "web";

interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified?: boolean;
}

interface AuthStore {
  // Core auth state
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  authLoaded: boolean;
  hasCompletedOnboarding: boolean;

  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // Actions
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
  setOnboardingComplete: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      authLoaded: false,
      hasCompletedOnboarding: false,

      // Hydration state
      _hasHydrated: false,
      setHasHydrated: (value: boolean) => {
        set({ _hasHydrated: value });
      },

      // Sign in
      signIn: async (email: string, password: string) => {
        console.log('🔐 ===== STARTING SIGN IN =====');
        console.log('🔐 Sign In - Email:', email);

        // Basic validation
        if (!email || !password) {
          console.log('🔐 Sign In - Missing credentials');
          set({ error: 'Email and password are required', isLoading: false });
          return false;
        }

        try {
          set({ isLoading: true, error: null });

          const { data, error } = await authClient.signIn.email({
            email,
            password,
          });

          if (error) {
            console.log('🔐 Sign In - Better-auth error:', error.message);
            set({ error: error.message || 'Sign in failed', isLoading: false });
            return false;
          }

          if (data?.user) {
            console.log('🔐 Sign In - User authenticated, better-auth handles token storage');

            const user: User = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name || '',
              image: data.user.image,
              emailVerified: data.user.emailVerified,
            };

            const currentState = get();
            set({
              isAuthenticated: true,
              user,
              isLoading: false,
              hasCompletedOnboarding: currentState.hasCompletedOnboarding,
            });

            console.log('🔐 Sign In - Final state:', {
              isAuthenticated: true,
              hasCompletedOnboarding: currentState.hasCompletedOnboarding
            });

            // Invalidate queries to refresh data
            queryClient.invalidateQueries();

            return true;
          }

          console.log('🔐 Sign In - Invalid response structure');
          set({ error: 'Sign in failed: Invalid response', isLoading: false });
          return false;
        } catch (error) {
          console.error('🔐 Sign In - Unexpected error:', error);
          set({ error: 'Sign in failed: Network error', isLoading: false });
          return false;
        }
      },

      // Sign up
      signUp: async (email: string, password: string, name: string) => {
        console.log('🔐 ===== STARTING SIGN UP =====');
        console.log('🔐 Sign Up - Email:', email);

        // Basic validation
        if (!email || !password || !name) {
          console.log('🔐 Sign Up - Missing information');
          set({ error: 'All fields are required', isLoading: false });
          return false;
        }

        try {
          set({ isLoading: true, error: null });

          console.log('🔐 Sign Up - Calling better-auth signUp');
          const { data, error } = await authClient.signUp.email({
            email,
            password,
            name,
          });

          if (error) {
            console.log('🔐 Sign Up - Better-auth error:', error.message);
            set({ error: error.message || 'Sign up failed', isLoading: false });
            return false;
          }

          if (data?.user) {
            console.log('🔐 Sign Up - User created successfully');

            // Set onboarding as incomplete for new users
            set({ hasCompletedOnboarding: false });

            // Auto sign in after successful sign up
            const signInSuccess = await get().signIn(email, password);
            if (signInSuccess) {
              console.log('🔐 Sign Up - Auto sign-in successful');
              return true;
            } else {
              console.log('🔐 Sign Up - Auto sign-in failed, but user created');
              set({ error: 'Account created but sign in failed. Please try signing in manually.', isLoading: false });
              return false;
            }
          }

          console.log('🔐 Sign Up - Invalid response structure');
          set({ error: 'Sign up failed: Invalid response', isLoading: false });
          return false;
        } catch (error) {
          console.error('🔐 Sign Up - Unexpected error:', error);
          set({ error: 'Sign up failed: Network error', isLoading: false });
          return false;
        }
      },

      // Sign out
      signOut: async () => {
        console.log('🔐 ===== STARTING SIGN OUT =====');
        try {
          set({ isLoading: true });

          // Call sign out API (better-auth handles token cleanup)
          await authClient.signOut();

          // Clear state
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
            hasCompletedOnboarding: false,
          });

          console.log('🔐 Sign Out - State cleared successfully');

          // Clear all React Query cache
          queryClient.clear();
        } catch (error) {
          console.error('Sign out error:', error);
          // Even if sign out API fails, clear local state
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
            hasCompletedOnboarding: false,
          });
          queryClient.clear();
        }
        console.log('🔐 ===== SIGN OUT COMPLETE =====');
      },

      // Check auth status
      checkAuthStatus: async () => {
        console.log('🔐 ===== STARTING AUTH STATUS CHECK =====');
        try {
          set({ isLoading: true, error: null });

          // Preserve existing onboarding state
          const currentState = get();
          const hasCompletedOnboarding = currentState.hasCompletedOnboarding;

          console.log('🔐 Auth Check - Current onboarding state:', hasCompletedOnboarding);

          // Get current session from better-auth directly (no manual token check)
          const { data: session } = await authClient.getSession();
          console.log('🔐 Auth Check - Session data:', !!session?.user);

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
              authLoaded: true,
              isLoading: false,
              hasCompletedOnboarding,
            });
            console.log('🔐 Auth Check - User authenticated:', user.email);
            console.log('🔐 Auth Check - Final state - isAuthenticated: true, hasCompletedOnboarding:', hasCompletedOnboarding);
          } else {
            set({
              isAuthenticated: false,
              user: null,
              authLoaded: true,
              isLoading: false,
              hasCompletedOnboarding,
            });
            console.log('🔐 Auth Check - No valid session found');
            console.log('🔐 Auth Check - Final state - isAuthenticated: false, hasCompletedOnboarding:', hasCompletedOnboarding);
          }
        } catch (error) {
          console.error('🔐 Auth check error:', error);
          set({
            isAuthenticated: false,
            user: null,
            authLoaded: true,
            isLoading: false,
            error: 'Failed to check authentication status',
            hasCompletedOnboarding: get().hasCompletedOnboarding,
          });
        }
        console.log('🔐 ===== AUTH STATUS CHECK COMPLETE =====');
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set onboarding complete
      setOnboardingComplete: () => {
        const currentState = get();
        console.log('🔐 Onboarding - Setting complete, current state:', {
          isAuthenticated: currentState.isAuthenticated,
          hasCompletedOnboarding: currentState.hasCompletedOnboarding
        });
        set({ hasCompletedOnboarding: true });
        console.log('🔐 Onboarding - New state:', { hasCompletedOnboarding: true });
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          return isWeb ? localStorage.getItem(name) : null;
        },
        setItem: (name: string, value: string) => {
          if (isWeb) {
            localStorage.setItem(name, value);
          }
        },
        removeItem: (name: string) => {
          if (isWeb) {
            localStorage.removeItem(name);
          }
        },
      })),
      partialize: (state: AuthStore) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Initialize auth check
export const initializeAuth = async () => {
  const authStore = useAuthStore.getState();
  await authStore.checkAuthStatus();
};
```

## Key Changes Made

### 1. Removed MMKV Dependency
- **Removed**: `react-native-mmkv` import and MMKV storage setup
- **Simplified**: Now uses localStorage for web and no persistence for native (better-auth handles tokens)
- **Benefit**: Reduces bundle size and eliminates unnecessary complexity

### 2. Removed Manual Token Methods
- **Removed**: `getAuthToken()`, `setAuthToken()`, `removeAuthToken()`
- **Removed**: All manual SecureStore operations for `'auth_token'`

### 3. Added Proper Hydration Support
- **Added**: `_hasHydrated` state and `setHasHydrated` method to the interface
- **Added**: `onRehydrateStorage` callback to properly track hydration state
- **Benefit**: Prevents hydration mismatches and ensures UI waits for persistence to complete

### 4. Updated `checkAuthStatus()` Method
- **Before**: Checked for manual token storage before calling better-auth
- **After**: Directly calls `authClient.getSession()` to validate authentication
- **Benefit**: Eliminates token conflicts and relies solely on better-auth's session management

### 5. Updated `signIn()` Method
- **Removed**: Manual token storage via `setAuthToken(data.token)`
- **Kept**: All existing validation and error handling logic
- **Benefit**: Prevents duplicate token storage and conflicts

### 6. Updated `signOut()` Method
- **Removed**: Manual token removal via `removeAuthToken()`
- **Kept**: API call to `authClient.signOut()` for proper server-side cleanup
- **Benefit**: Ensures clean sign-out without token remnant issues

## Benefits of This Fix

1. **Eliminates Token Conflicts**: No more dual storage between manual and better-auth
2. **Simplifies Code**: Removes ~50 lines of redundant token management code
3. **Removes MMKV Dependency**: Reduces bundle size and eliminates unnecessary storage complexity
4. **Fixes Cache Issues**: Resolves landing page button lockups without cache clearing
5. **Proper Hydration Support**: Ensures UI waits for persistence to complete before rendering
6. **Leverages Better-Auth Properly**: Uses the library as intended with secure token handling
7. **Reduces Bugs**: No chance of token sync issues between two storage systems
8. **Cleaner Auth Flow**: Authentication status determined solely by session validity

## Expected Outcome

After implementing these changes:
- Sign-up and sign-in flows will work correctly without requiring cache clearing
- Landing page buttons will remain functional after authentication
- Authentication state will be properly synchronized between stores
- Better-auth will handle all token operations securely and automatically
- The app will have a more maintainable and reliable authentication system

## Testing Checklist

- [ ] Sign-up flow automatically redirects to onboarding
- [ ] Sign-in flow routes correctly (onboarding if incomplete, main app if complete)
- [ ] Landing page buttons work after authentication without cache clearing
- [ ] Sign-out properly clears authentication state
- [ ] App restarts maintain proper authentication state
- [ ] Console logs show clean authentication flow without token conflicts

## Files That DON'T Need Changes

- `/apps/native/lib/auth-client.ts` - Better-auth configuration is correct
- `/apps/native/stores/useUserPreferenceStore.ts` - User preferences are separate from auth
- `/apps/native/app/_layout.tsx` - Route protection logic is fine
- Authentication components - They work correctly once token conflicts are resolved

## Lean Alternative Implementation

For projects that want a completely fresh start, there's also a lean implementation available in the separate documentation file that removes all non-essential authentication features and focuses purely on core authentication functionality. This includes:

- Simplified state management without onboarding complexity
- Cleaner interface with only essential auth features
- Unique storage prefix to avoid any conflicts
- Minimal persistence for better performance

Use the lean implementation if you want to start with a completely clean authentication system.