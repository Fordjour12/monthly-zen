# Implementation Plan: Zustand Auth Stores for Web and Native Apps

## Overview

Implement centralized authentication state management using Zustand for both web and native apps, integrating with the existing better-auth setup.

## Current State

- **No Zustand** in the codebase
- **Web**: Auth managed via `authClient`, session checked in middleware, no global auth state
- **Native**: Auth components exist but **NO auth state management or route protection**
- **Both**: Components directly call `authClient` methods with repetitive loading/error handling

## Implementation Steps

### Step 1: Install Zustand

**Action**: Add Zustand to the monorepo

**File**: `package.json`

```json
{
  "workspaces": {
    "catalog": {
      "zustand": "^5.0.0"  // Add this
    }
  }
}
```

**Command**: `bun install`

---

### Step 2: Create Web Auth Store

**File**: `apps/web/src/stores/auth-store.ts` (new file)

**State Shape**:

```typescript
interface AuthState {
  // State
  session: Session | null
  user: User | null
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean

  // Actions
  initializeFromServer: (session: Session | null) => void
  signIn: (credentials: { email: string; password: string }) => Promise<void>
  signUp: (credentials: { name: string; email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  checkSession: () => Promise<void>
  clearError: () => void
}
```

**Key Features**:

- Accept initial session from server (SSR support)
- Sync with better-auth session
- Provide reactive auth state

---

### Step 3: Create Native Auth Store

**File**: `apps/native/stores/auth-store.ts` (new file)

**State Shape**: Same as web store (without `initializeFromServer`)

**Key Features**:

- Initialize session from SecureStore via better-auth
- Handle network errors gracefully
- Support navigation guards

---

### Step 4: Implement Store Actions

**Common Actions (both platforms)**:

1. **signIn** - Call `authClient.signIn.email()`, update state on success/error
2. **signUp** - Call `authClient.signUp.email()`, update state on success/error
3. **signOut** - Call `authClient.signOut()`, clear session state
4. **refreshSession** - Fetch session via `authClient.getSession()`, update state
5. **checkSession** - One-time initialization check
6. **clearError** - Clear error state

**Web-specific**:

- `initializeFromServer(session)` - Hydrate store with server session

---

### Step 5: Integrate Web App

**5a. Update Root Layout**
**File**: `apps/web/src/routes/__root.tsx`

```typescript
// In loader
export const loader = async () => {
  const session = await authClient.getSession()
  return { session }
}

// In component, after loader
useAuthStore.getState().initializeFromServer(session)
```

**5b. Migrate Components**

Replace `authClient.useSession()` with `useAuthStore()`:

**Before**:

```typescript
const { data: session, isPending } = authClient.useSession()
```

**After**:

```typescript
const session = useAuthStore(state => state.session)
const isLoading = useAuthStore(state => state.isLoading)
```

**Components to Update**:

- `apps/web/src/components/user-menu.tsx`
- `apps/web/src/components/sign-in-form.tsx`
- `apps/web/src/components/sign-up-form.tsx`
- `apps/web/src/routes/dashboard.tsx`
- `apps/web/src/routes/plan.tsx`

---

### Step 6: Integrate Native App

**6a. Update Root Layout**
**File**: `apps/native/app/_layout.tsx`

Add store initialization on mount:

```typescript
useEffect(() => {
  useAuthStore.getState().checkSession()
}, [])
```

**6b. Migrate Sign-In/Sign-Up Components**

**Before**:

```typescript
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState(null)

await authClient.signIn.email({ email, password }, {
  onError: (ctx) => setError(ctx.error.message),
  onSuccess: () => router.replace('/(tabs)')
})
```

**After**:

```typescript
const { signIn, isLoading, error } = useAuthStore()

await signIn({ email, password })
// Navigation handled automatically
```

**Components to Update**:

- `apps/native/components/sign-in.tsx`
- `apps/native/components/sign-up.tsx`
- `apps/native/app/sign-in.tsx`
- `apps/native/app/sign-up.tsx`

---

### Step 7: Add Native Route Protection using Expo Router Protected Routes

**Use Expo Router's built-in `<Stack.Protected>` and `<Tabs.Protected>` components (SDK 53+)**

**7a. Update Root Layout with Protected Routes**
**File**: `apps/native/app/_layout.tsx`

```typescript
import { Stack } from 'expo-router'
import { useAuthStore } from '@/stores/auth-store'

export default function RootLayout() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isInitialized = useAuthStore(state => state.isInitialized)

  // Don't render until auth state is checked
  if (!isInitialized) {
    return <SplashScreen />
  }

  return (
    <Stack>
      {/* Authenticated routes - tabs and modals */}
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" />
      </Stack.Protected>

      {/* Unauthenticated routes - sign-in and sign-up */}
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
    </Stack>
  )
}
```

**7b. Optional: Protect Individual Tabs**
**File**: `apps/native/app/(tabs)/_layout.tsx`

```typescript
import { Tabs } from 'expo-router'
import { useAuthStore } from '@/stores/auth-store'

export default function TabsLayout() {
  const isVip = useAuthStore(state => state.user?.isVip)

  return (
    <Tabs>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="settings" />

      {/* Only show VIP tab to VIP users */}
      <Tabs.Protected guard={isVip}>
        <Tabs.Screen name="vip" />
      </Tabs.Protected>
    </Tabs>
  )
}
```

**Key Benefits of Expo Router Protected Routes**:

- Declarative - define auth logic directly in layout files
- Automatic redirects - no manual navigation logic needed
- Deep link protection - unauthenticated users can't deep link to protected screens
- Nested protection - can combine multiple guards for complex rules

---

### Step 8: Error Handling & Edge Cases

**Handle**:

- Network errors (show toast/notification)
- Invalid credentials (clear error message)
- Session expiration (auto-refresh)
- App backgrounding (native) - refresh session on foreground

---

## Migration Strategy

**Incremental Approach**:

1. Create stores alongside existing code
2. Migrate one component at a time
3. Test thoroughly after each migration
4. Remove redundant code after successful migration

**Order**:

1. Start with least critical components (user-menu)
2. Move to auth components (sign-in, sign-up)
3. Update route protection
4. Clean up old code

---

## Critical Files

### New Files

- `apps/web/src/stores/auth-store.ts`
- `apps/native/stores/auth-store.ts`

### Modified Files

- `package.json` - Add Zustand to catalog
- `apps/web/src/routes/__root.tsx` - Initialize store
- `apps/web/src/components/user-menu.tsx` - Use store
- `apps/web/src/components/sign-in-form.tsx` - Use store
- `apps/web/src/components/sign-up-form.tsx` - Use store
- `apps/web/src/routes/dashboard.tsx` - Use store
- `apps/web/src/routes/plan.tsx` - Use store
- `apps/native/app/_layout.tsx` - Initialize store with `<Stack.Protected>`
- `apps/native/components/sign-in.tsx` - Use store
- `apps/native/components/sign-up.tsx` - Use store
- `apps/native/app/sign-in.tsx` - Use store
- `apps/native/app/sign-up.tsx` - Use store

---

## Benefits

1. **Centralized state** - Single source of truth
2. **Less boilerplate** - Components don't manage auth state
3. **Type safety** - Full TypeScript support
4. **Better UX** - Consistent loading/error handling
5. **Native protection** - Expo Router's built-in `<Stack.Protected>` for authenticated routes
6. **Declarative auth** - Route protection defined in layout files, not imperative redirects

---

## Estimated Time: 5-6 hours

- Step 1: 5 minutes
- Steps 2-3: 60 minutes (create stores)
- Step 4: 45 minutes (implement actions)
- Steps 5-6: 120 minutes (integrate with apps)
- Step 7: 30 minutes (route protection)
- Steps 8-9: 120 minutes (error handling, testing, cleanup)
