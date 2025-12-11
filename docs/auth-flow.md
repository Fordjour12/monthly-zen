# Authentication & Authorization Flow

Here is the revised architecture, tailored for **React Native (Expo)**, utilizing **Zustand, MMKV, and `expo-secure-store`** for a modern, secure, and fast mobile application experience.

-----

## 📱 React Native (Expo) Authentication & Preference Architecture

First check @/app/index.tsx to see how so auth flow was been implemented before moving to implement you flow

We will separate state persistence based on sensitivity and retrieval speed.

### 1\. ⚙️ State and Persistence Strategy

| Item | Storage Location | State Management | Justification |
| :--- | :--- | :--- | :--- |
| **Authentication Token** | `expo-secure-store` | **`useAuthStore`** | Highest security for sensitive tokens. |
| **User ID & Profile** | **MMKV** (Encrypted) | **`useAuthStore`** | Fast synchronous read/write. Less sensitive than the token but needs to persist. |
| **User Preferences** | **MMKV** | **`useUserPreferenceStore`** | Fast synchronous read/write for instant UI updates (e.g., dark mode). |

### 2\. ⚛️ Zustand Stores with Storage Integrations

#### A. `useAuthStore`

This store focuses on core authentication state and the secure token handling.

* **Initial Check Flow:** The `checkAuthStatus` action is now critical and synchronous due to MMKV/Secure Store reads.
* **State:**
  * `isAuthenticated`: `boolean`
  * `user`: `{ id: string, email: string, ... }` | `null`
  * `authLoaded`: `boolean` (Crucial for RN/Expo to prevent initial screen flash)
* **Key Actions:**

| Action | Logic (RN Specific) |
| :--- | :--- |
| `signIn(creds)` | Call API. **Store token in `expo-secure-store`.** Store user object in **MMKV** (encrypted). Set `isAuthenticated: true`. |
| `signOut()` | **Delete token from `expo-secure-store`.** Clear user data from **MMKV**. Set `isAuthenticated: false`. |
| `checkAuthStatus()` | **Crucial:** *Run synchronously on app startup.* 1. Check `expo-secure-store` for token. 2. Read user data from MMKV. 3. Re-hydrate state. 4. Set **`authLoaded: true`**. |

#### B. `useUserPreferenceStore` (with MMKV Persistence)

This store manages non-sensitive UX preferences, using MMKV for instant retrieval on startup.

* **Integration:** Use the Zustand middleware with an MMKV wrapper to instantly persist and hydrate the store.
* **State:** `theme`, `language`, `notificationsEnabled`, etc.
* **Key Actions:** `setPreference(key, value)`, `loadPreferencesFromServer()`, `savePreferencesToServer()`.

-----

### 3\. 🗺️ React Navigation Flow (Public vs. Private)

In React Native, routing is handled by a stack navigator that branches based on the authentication status. This is where `authLoaded` is essential.

#### A. `RootNavigator.tsx` (Entry Point)

1. **Loading Screen:** Immediately render a splash screen or a lightweight loading component while `authLoaded` is `false`.
2. **`useEffect` Hook:**
      * On mount, call `useAuthStore.getState().checkAuthStatus()`.
      * This action reads from storage and eventually sets `authLoaded: true` and `isAuthenticated: (true/false)`.
3. **Conditional Rendering:** Once `authLoaded` is `true`, render the appropriate Stack Navigator:

<!-- end list -->

```jsx
// Simplified Pseudo-Code for RootNavigator

if (!useAuthStore().authLoaded) {
  return <LoadingScreen />; // Show your splash screen
}

return (

 <Stack screenOptions={{ headerShown: false }}>
               {/* Public routes */}
               <Stack.Protected guard={!isLoggedIn}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="register" />
                  <Stack.Screen name="login" />
               </Stack.Protected>

               {/* Onboarding flow */}
               <Stack.Protected guard={isLoggedIn && !hasCompletedOnboarding}>
                  <Stack.Screen name="onboarding" />
               </Stack.Protected>

               {/* Main app */}
               <Stack.Protected guard={isLoggedIn && hasCompletedOnboarding}>
                  <Stack.Screen name="(drawer)" />
               </Stack.Protected>
            </Stack>
);
```

#### B. Public Routes (`PublicNavigator`)

* **Accessible to Everyone:** Sign-in, Sign-up, Forgot Password, Welcome/Onboarding (if applicable).
* **Note:** If the user is authenticated but ends up here (e.g., they manually navigate), they should be redirected back to the private area via a component-level check.

#### C. Private Routes (`PrivateNavigator`)

* **Accessible Only When Authenticated:** Dashboard, Profile, Settings, etc.
* **Note:** This navigator can still include **"Hybrid"** screens that show limited content to authenticated users (e.g., a "Product Catalog" that becomes interactive/transactional after sign-in).

### 4\. 🔑 Security and UX Considerations

| Area | Best Practice (RN/Expo) | Benefit |
| :--- | :--- | :--- |
| **Token Storage** | `expo-secure-store` | Highest security standard for RN, isolates token from JS bundle and logs. |
| **Session Hydration** | **MMKV/Zustand** | Reads are **synchronous** (instant), preventing loading flickers and ensuring state is immediately available. |
| **Token Refresh** | Automated Silent Refresh | On app launch or when a network request fails with a 401 (Unauthorized), call a background API endpoint to use the refresh token (from `expo-secure-store`) to get a new access token. |
| **User Preferences** | **Zustand with MMKV Persistence** | Instant Dark Mode/Language switches. No waiting for API or AsyncStorage on app load. |
| **Hybrid Content** | Zustand Selectors | Use selectors like `const canPost = useAuthStore(s => s.isAuthenticated)` to conditionally render features within public screens. |

This refined plan provides a robust, secure, and performant flow for a modern React Native application.

Would you like me to draft the specific **Zustand store code structure** (e.g., `useAuthStore.ts`) with the MMKV/Secure Store integration for you to get started?
