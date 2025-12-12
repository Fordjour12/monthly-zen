# Auth Guard Migration Plan

## Problem Statement
The current `AuthGuard` component causes unnecessary loading states even when navigating to public routes like sign-in and sign-up. This creates poor user experience with loading screens appearing on pages that should load instantly.

## Root Cause Analysis
- **AuthGuard wrapper pattern**: Every route change triggers AuthGuard initialization
- **Hardcoded 500ms timeout**: Unnecessary delay in AuthGuard
- **Manual redirects**: AuthGuard handles redirects instead of letting Expo Router manage them natively
- **Not following Expo Router best practices**: Using wrapper components instead of route-level protection

## Solution Overview
Migrate from wrapper-based auth protection to Expo Router's native conditional rendering pattern. This eliminates loading states on public routes while maintaining security.

## Implementation Plan

### Phase 1: Root Layout Restructuring
**File**: `/apps/native/app/_layout.tsx`

**Changes**:
- Implement conditional stack rendering based on auth state
- Move auth initialization to root level (executed once)
- Create separate `AuthenticatedStack` and `UnauthenticatedStack` components
- Show loading only during initial auth check, not on every route change

**Key Benefits**:
- Public routes (sign-in, sign-up) load instantly
- Single auth state management point
- Follows Expo Router v5 best practices

### Phase 2: Remove AuthGuard Wrappers
**Files**:
- `/apps/native/app/(auth)/_layout.tsx`
- `/apps/native/app/(tabs)/_layout.tsx`
- `/apps/native/app/index.tsx`

**Changes**:
- Remove `<AuthGuard requireAuth={false}>` wrappers from auth routes
- Remove `<AuthGuard requireAuth={true}>` wrappers from protected routes
- Clean up any related props and imports

### Phase 3: Delete AuthGuard Component
**File**: `/apps/native/components/auth-guard.tsx`

**Action**: Complete deletion of the component

### Phase 4: Add Navigation Helper (Optional)
**File**: `/apps/native/hooks/useAuthNavigation.ts` (new)

**Purpose**: Provide programmatic navigation utilities for auth flows
- `navigateToAuth()`
- `navigateToApp()`
- `signOutAndNavigate()`

## Detailed Implementation

### 1. New Root Layout Structure
```tsx
function StackLayout() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { isAuthenticated, authLoaded } = useAuthStore();

  // Initialize once on app start
  useEffect(() => {
    initializeAuth();
    initializePreferences();
  }, []);

  useEffect(() => {
    if (authLoaded) {
      setIsInitializing(false);
    }
  }, [authLoaded]);

  // Loading only during initial check
  if (isInitializing) {
    return <LoadingScreen />;
  }

  // Conditional rendering based on auth state
  return isAuthenticated ? <AuthenticatedStack /> : <UnauthenticatedStack />;
}
```

### 2. Stack Components
**AuthenticatedStack**: Contains `(tabs)` and protected routes
**UnauthenticatedStack**: Contains `index` (landing) and `(auth)` routes

### 3. Clean Layout Files
Remove all AuthGuard imports and wrappers, keep only the Stack components with proper styling.

## Benefits Achieved

1. **No loading states on auth routes** - Sign-in/sign-up load instantly
2. **Better UX** - Users see relevant content immediately
3. **Cleaner architecture** - Follows Expo Router patterns
4. **Maintained security** - Auth checks still enforced
5. **Performance improvement** - No unnecessary wrapper re-renders

## Testing Checklist

- [ ] Landing page loads immediately without loading state
- [ ] Sign-in/sign-up pages load immediately
- [ ] Auth redirect flows work correctly
- [ ] Protected routes properly redirect when not authenticated
- [ ] User stays logged in across app restarts
- [ ] Deep linking works with new structure

## Files to Modify

1. **Modify**: `/apps/native/app/_layout.tsx` - Core implementation
2. **Modify**: `/apps/native/app/(auth)/_layout.tsx` - Remove AuthGuard
3. **Modify**: `/apps/native/app/(tabs)/_layout.tsx` - Remove AuthGuard
4. **Modify**: `/apps/native/app/index.tsx` - Remove AuthGuard
5. **Delete**: `/apps/native/components/auth-guard.tsx` - Remove component
6. **Create**: `/apps/native/hooks/useAuthNavigation.ts` - Navigation helper (optional)

## Implementation Steps

1. Update root layout with conditional rendering
2. Remove AuthGuard from all layout files
3. Test auth flows thoroughly
4. Delete AuthGuard component
5. Add navigation helper if needed
6. Verify no loading states on public routes

## Risk Mitigation

- **Auth state hydration**: Ensure MMKV/SecureStore initialization before checks
- **Route transitions**: Test smooth transitions between auth states
- **Deep linking**: Verify deep links work correctly
- **State persistence**: Confirm login persistence across restarts

This migration provides significantly better user experience while maintaining all security and functionality.