# Auth Guard Migration Plan with Onboarding Flow

## Problem Statement
The current `AuthGuard` component causes unnecessary loading states even when navigating to public routes like sign-in and sign-up. This creates poor user experience with loading screens appearing on pages that should load instantly. Additionally, we need to integrate the onboarding flow seamlessly with authentication.

## Root Cause Analysis
- **AuthGuard wrapper pattern**: Every route change triggers AuthGuard initialization
- **Hardcoded 500ms timeout**: Unnecessary delay in AuthGuard
- **Manual redirects**: AuthGuard handles redirects instead of letting Expo Router manage them natively
- **Not following Expo Router best practices**: Using wrapper components instead of route-level protection
- **Missing onboarding integration**: Onboarding state not properly integrated with auth flow

## Solution Overview
Migrate from wrapper-based auth protection to Expo Router's native conditional rendering pattern. This eliminates loading states on public routes while maintaining security and properly integrating the onboarding flow.

## Implementation Plan

### Phase 1: Root Layout Restructuring with Onboarding Integration
**File**: `/apps/native/app/_layout.tsx`

**Changes**:
- Implement conditional stack rendering based on auth and onboarding state
- Move auth initialization to root level (executed once)
- Create separate `AuthenticatedStack`, `UnauthenticatedStack`, and `OnboardingStack` components
- Show loading only during initial hydration, not on every route change
- Integrate onboarding flow checks before auth checks

**Key Benefits**:
- Onboarding loads instantly without loading states
- Public routes (sign-in, sign-up) load instantly
- Single auth and onboarding state management point
- Follows Expo Router v5 best practices
- Proper flow: Onboarding → Auth → App

### Phase 2: Update Auth Store with Onboarding State
**File**: `/apps/native/stores/useAuthStore.ts`

**Changes**:
- Merge your existing Zustand store with the better-auth implementation
- Add onboarding state management (`hasCompletedOnboarding`)
- Add `completeOnboarding()` and `resetOnboarding()` methods
- Keep the `_hasHydrated` state for proper hydration handling
- Maintain Platform-specific storage (SecureStore for native, localStorage for web)

**New Store Structure**:
```tsx
interface AuthStore {
  // Onboarding state
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // Auth state (from better-auth)
  isAuthenticated: boolean;
  user: User | null;
  authLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // Auth methods
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  // ... other methods
}
```

### Phase 3: Remove AuthGuard Wrappers
**Files**:
- `/apps/native/app/(auth)/_layout.tsx`
- `/apps/native/app/(tabs)/_layout.tsx`
- `/apps/native/app/index.tsx`
- `/apps/native/app/onboarding.tsx`

**Changes**:
- Remove `<AuthGuard requireAuth={false}>` wrappers from auth routes
- Remove `<AuthGuard requireAuth={true}>` wrappers from protected routes
- Clean up any related props and imports

### Phase 4: Delete AuthGuard Component
**File**: `/apps/native/components/auth-guard.tsx`

**Action**: Complete deletion of the component

### Phase 5: Add Navigation Helper (Optional)
**File**: `/apps/native/hooks/useAuthNavigation.ts` (new)

**Purpose**: Provide programmatic navigation utilities for auth flows
- `navigateToOnboarding()`
- `navigateToAuth()`
- `navigateToApp()`
- `signOutAndNavigate()`

## Detailed Implementation

### 1. Updated Auth Store (Merged Implementation)

```tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { authClient } from '@/lib/auth-client';
import { queryClient } from '@/utils/orpc';

const isWeb = Platform.OS === "web";

// Create MMKV instance for non-sensitive data
const mmkvStorage = createMMKV({
  id: 'auth-storage',
  encryptionKey: 'auth-encryption-key-123',
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

interface AuthStore {
  // Onboarding state
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // Auth state (from better-auth)
  isAuthenticated: boolean;
  user: User | null;
  authLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // Auth methods
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;

  // Token management
  getAuthToken: () => Promise<string | null>;
  setAuthToken: (token: string) => Promise<void>;
  removeAuthToken: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      hasCompletedOnboarding: false,
      isAuthenticated: false,
      user: null,
      authLoaded: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      // Onboarding methods
      completeOnboarding: () => {
        set({ hasCompletedOnboarding: true });
      },

      resetOnboarding: () => {
        set({ hasCompletedOnboarding: false });
      },

      // Hydration method
      setHasHydrated: (value: boolean) => {
        set({ _hasHydrated: value });
      },

      // Auth methods (from your existing implementation)
      checkAuthStatus: async () => {
        // ... existing checkAuthStatus implementation
      },

      signIn: async (email: string, password: string) => {
        // ... existing signIn implementation
      },

      signUp: async (email: string, password: string, name: string) => {
        // ... existing signUp implementation
      },

      signOut: async () => {
        // ... existing signOut implementation
      },

      // ... other methods
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state: AuthStore) => ({
        // Persist non-sensitive data
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        // Don't persist loading states or errors
      }),
      onRehydrateStorage: () => (state?: AuthStore) => {
        if (state) {
          state.setHasHydrated(true);
          state.authLoaded = false; // Will check real auth status
          // Trigger auth check after hydration
          state.checkAuthStatus();
        }
      },
    }
  )
);
```

### 2. New Root Layout Structure

```tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/useAuthStore';
import { Platform } from 'react-native';

const isWeb = Platform.OS === "web";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const {
    isAuthenticated,
    hasCompletedOnboarding,
    _hasHydrated,
  } = useAuthStore();

  // Hide splash screen after hydration
  useEffect(() => {
    if (_hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [_hasHydrated]);

  // Show nothing while hydrating (only on native)
  if (!_hasHydrated && !isWeb) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Protected routes for authenticated users */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />

        {/* Auth routes - accessible after onboarding */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Onboarding - only shown if not completed */}
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />

        {/* Landing page */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
```

### 2a. Alternative: Using Stack.Protected Pattern

If you want to use the Stack.Protected pattern you showed me:

```tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/useAuthStore';
import { Platform } from 'react-native';

const isWeb = Platform.OS === "web";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const {
    isAuthenticated,
    hasCompletedOnboarding,
    _hasHydrated,
  } = useAuthStore();

  // Hide splash screen after hydration
  useEffect(() => {
    if (_hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [_hasHydrated]);

  // Show nothing while hydrating (only on native)
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
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
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
```

### 3. Alternative: Stack Component Pattern

If you prefer the stack component pattern for better organization:

```tsx
function OnboardingStack() {
  return (
    <Stack>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}

function AuthStack() {
  return (
    <Stack>
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="create-account" options={{ headerShown: false }} />
    </Stack>
  );
}

function AuthenticatedStack() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const { hasCompletedOnboarding, isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [_hasHydrated]);

  if (!_hasHydrated && !isWeb) {
    return null;
  }

  // Flow: Onboarding → Auth → App
  if (!hasCompletedOnboarding) {
    return <OnboardingStack />;
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  return <AuthenticatedStack />;
}
```

### 4. Clean Layout Files
Remove all AuthGuard imports and wrappers from:
1. **`/apps/native/app/index.tsx`** - Remove AuthGuard wrapper, just return `<LandingScreen />`
2. **Check `/apps/native/app/(auth)/_layout.tsx`** - Verify if AuthGuard is used
3. **Check `/apps/native/app/(tabs)/_layout.tsx`** - Verify if AuthGuard is used

**Clean index.tsx**:
```tsx
export default function Home() {
   return <LandingScreen />;
}
```

## Benefits Achieved

1. **No loading states on onboarding/auth routes** - Onboarding, sign-in/sign-up load instantly
2. **Seamless onboarding flow** - Users go through onboarding before authentication
3. **Better UX** - Users see relevant content immediately without unnecessary delays
4. **Cleaner architecture** - Follows Expo Router patterns with proper state management
5. **Maintained security** - Auth checks still enforced at the right points
6. **Performance improvement** - No unnecessary wrapper re-renders
7. **Proper hydration** - Store hydration handled correctly with splash screen

## Testing Checklist

### Onboarding Flow
- [ ] Onboarding loads immediately on first app launch
- [ ] `completeOnboarding()` updates state correctly
- [ ] After onboarding, user is redirected to sign-in
- [ ] Onboarding is skipped on subsequent app launches

### Authentication Flow
- [ ] Sign-in/sign-up pages load immediately after onboarding
- [ ] Auth redirect flows work correctly
- [ ] Protected routes properly redirect when not authenticated
- [ ] User stays logged in across app restarts

### General App Behavior
- [ ] No loading screens on public routes
- [ ] Splash screen hides only after store hydration
- [ ] Deep linking works with new structure
- [ ] Web and native platforms both work correctly
- [ ] State persists across app restarts

## Files to Modify

Based on the actual file structure analysis:

1. **Modify**: `/apps/native/stores/useAuthStore.ts` - Merge onboarding with better-auth
2. **Modify**: `/apps/native/app/_layout.tsx` - Replace current simple Stack with conditional rendering
3. **Delete**: `/apps/native/components/auth-guard.tsx` - Remove AuthGuard component
4. **Verify**: `/apps/native/app/(auth)/_layout.tsx` - Check if AuthGuard is used there
5. **Verify**: `/apps/native/app/(tabs)/_layout.tsx` - Check if AuthGuard is used there
6. **Update**: `/apps/native/app/(auth)/onboarding.tsx` - Ensure it calls the auth store's `completeOnboarding()`

## Implementation Steps

1. **Phase 1**: Update auth store to merge onboarding and better-auth states
2. **Phase 2**: Implement new root layout with conditional rendering
3. **Phase 3**: Update onboarding screen to call `completeOnboarding()`
4. **Phase 4**: Remove AuthGuard from all layout files
5. **Phase 5**: Test all flows thoroughly
6. **Phase 6**: Delete AuthGuard component
7. **Phase 7**: Add navigation helper if needed
8. **Phase 8**: Final testing and verification

## Key Implementation Notes

### Storage Strategy
- **MMKV**: Store non-sensitive data (onboarding completion, user info)
- **SecureStore**: Store sensitive auth tokens (as in your current implementation)
- **Web**: Use localStorage for both (Platform check handles this automatically)

### Flow Logic
```tsx
// Decision tree for rendering:
if (!hasCompletedOnboarding) {
  // Show onboarding
} else if (!isAuthenticated) {
  // Show auth (sign-in/create-account)
} else {
  // Show app (tabs/modal)
}
```

### Onboarding Completion
In your onboarding screen's completion handler:
```tsx
const { completeOnboarding } = useAuthStore();

const handleCompleteOnboarding = async () => {
  setIsLoading(true);
  try {
    // Save preferences first
    await completeOnboarding({
      // ... all your preference data
    });

    // Router will automatically redirect to sign-in based on Stack.Protected
    // The guard condition `!isAuthenticated && hasCompletedOnboarding` will show auth routes
  } catch (error) {
    // Handle error
  } finally {
    setIsLoading(false);
  }
};
```

### 2b. Corrected Root Layout (What Actually Needs to Change)

Your current `_layout.tsx`:
```tsx
function StackLayout() {
   return (
      <Stack screenOptions={{ headerShown: false }}>
         <Stack.Screen name="index" options={{ headerShown: false }} />
         <Stack.Screen name="(auth)" options={{ headerShown: false }} />
         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
         <Stack.Screen name="modal" options={{ title: "Modal", presentation: "modal" }} />
      </Stack>
   );
}
```

Your current `app/index.tsx`:
```tsx
export default function Home() {
   return (
      <AuthGuard requireAuth={false} redirectTo="/(tabs)">
         <LandingScreen />
      </AuthGuard>
   );
}
```

**New implementation** should be:
```tsx
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';

const isWeb = Platform.OS === "web";
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
      <QueryClientProvider client={queryClient}>
         <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
               <AppThemeProvider>
                  <HeroUINativeProvider>
                     <React.Fragment>
                        <StatusBar style="auto" />
                        <Stack>
                           <Stack.Protected guard={isAuthenticated}>
                              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                           </Stack.Protected>

                           <Stack.Protected guard={!isAuthenticated && hasCompletedOnboarding}>
                              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                           </Stack.Protected>

                           <Stack.Protected guard={!hasCompletedOnboarding}>
                              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                           </Stack.Protected>

                           {/* Landing page - accessible if not onboarded */}
                           <Stack.Screen name="index" options={{ headerShown: false }} />
                        </Stack>
                     </React.Fragment>
                  </HeroUINativeProvider>
               </AppThemeProvider>
            </KeyboardProvider>
         </GestureHandlerRootView>
      </QueryClientProvider>
   );
}
```

## Risk Mitigation

- **Auth state hydration**: Ensure MMKV/SecureStore initialization before checks
- **Store synchronization**: Properly merge onboarding and auth state without conflicts
- **Route transitions**: Test smooth transitions between onboarding → auth → app
- **Deep linking**: Verify deep links work correctly with the new flow
- **State persistence**: Confirm both onboarding and auth state persist across restarts
- **Platform differences**: Ensure both web and native handle storage correctly

This migration provides significantly better user experience with a proper onboarding flow while maintaining all security and functionality. The key improvement is the elimination of unnecessary loading states and the seamless integration of onboarding with authentication.