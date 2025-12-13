# Fix Better-Auth Token Management Conflicts

## Problem Summary
The current authentication system has **conflicting token management** where both better-auth and manual token storage are used simultaneously, causing:
- Token storage conflicts between `'auth_token'` (manual) and `'my-better-t-app_session_token'` (better-auth)
- Authentication state synchronization issues
- Cache-related button lockups on the landing page
- Redundant and problematic token management code

## Root Cause
The auth store (`useAuthStore.ts`) implements manual token management that conflicts with better-auth's built-in secure token handling through the expoClient plugin.

## What Happens to Better-Auth Tokens

When better-auth handles tokens:
1. **Storage**: Tokens are automatically stored in Expo SecureStore using the configured prefix (`my-better-t-app`)
2. **Format**: Better-auth manages the token format and encryption internally
3. **Validation**: `authClient.getSession()` validates tokens against the server
4. **Refresh**: Token refresh is handled automatically when sessions expire
5. **Cleanup**: `authClient.signOut()` properly removes all authentication data

The manual token management in `useAuthStore.ts` interferes with this process by trying to store the same tokens under different keys, causing conflicts and authentication state issues.

## Solution Overview
**Remove all manual token management** and rely solely on better-auth's built-in token handling. This eliminates conflicts and simplifies the authentication flow.

## Files to Modify

### 1. `/apps/native/stores/useAuthStore.ts`
**Changes: Remove manual token management entirely**

#### Remove Manual Token Methods:
- `getAuthToken()` (lines 445-470)
- `setAuthToken()` (lines 472-481)
- `removeAuthToken()` (lines 483-496)

#### Update AuthStore Interface:
Remove these method signatures from the interface:
```typescript
// Remove these lines:
getAuthToken: () => Promise<string | null>;
setAuthToken: (token: string) => Promise<void>;
removeAuthToken: () => Promise<void>;
```

#### Update `checkAuthStatus()` Method:
Replace the manual token check with direct better-auth session validation:

```typescript
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
}
```

#### Update `signIn()` Method:
Remove manual token storage:

```typescript
signIn: async (email: string, password: string) => {
   // ... existing validation and error handling code ...

   if (data?.user && data.token) {
      console.log('🔐 Sign In - User authenticated, better-auth handles token storage');

      // Remove: await get().setAuthToken(data.token);

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
}
```

#### Update `signOut()` Method:
Remove manual token removal:

```typescript
signOut: async () => {
   console.log('🔐 ===== STARTING SIGN OUT =====');
   try {
      set({ isLoading: true });

      // Call sign out API (better-auth handles token cleanup)
      await authClient.signOut();

      // Remove: await get().removeAuthToken();

      // Clear state
      set({
         isAuthenticated: false,
         user: null,
         isLoading: false,
         error: null,
      });

      console.log('🔐 Sign Out - State cleared successfully');

      // Clear all React Query cache
      queryClient.clear();
   } catch (error) {
      console.error('Sign out error:', error);
      // Even if sign out API fails, clear local state
      // Remove: await get().removeAuthToken();
      set({
         isAuthenticated: false,
         user: null,
         isLoading: false,
         error: null,
      });
      queryClient.clear();
   }
   console.log('🔐 ===== SIGN OUT COMPLETE =====');
}
```

## Benefits of This Fix

1. **Eliminates Token Conflicts**: No more dual storage between manual and better-auth
2. **Simplifies Code**: Removes ~50 lines of redundant token management code
3. **Fixes Cache Issues**: Resolves landing page button lockups without cache clearing
4. **Leverages Better-Auth Properly**: Uses the library as intended with secure token handling
5. **Reduces Bugs**: No chance of token sync issues between two storage systems
6. **Cleaner Auth Flow**: Authentication status determined solely by session validity

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