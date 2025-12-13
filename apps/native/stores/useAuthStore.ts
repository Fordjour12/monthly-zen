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

// User interface
interface User {
   id: string;
   email: string;
   name: string;
   image?: string | null;
   emailVerified?: boolean;
}

// Auth store interface
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

   // Actions
   signIn: (email: string, password: string) => Promise<boolean>;
   signUp: (email: string, password: string, name: string) => Promise<boolean>;
   signOut: () => Promise<void>;
   checkAuthStatus: () => Promise<void>;
   updateUser: (userData: Partial<User>) => Promise<boolean>;
   clearError: () => void;
   setLoading: (loading: boolean) => void;

   // Onboarding sync
   setOnboardingCompleted: (completed: boolean) => void;

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
            console.log('🔐 ===== COMPLETING ONBOARDING =====');
            console.log('🔐 Onboarding - State before:', {
               isAuthenticated: get().isAuthenticated,
               hasCompletedOnboarding: get().hasCompletedOnboarding
            });

            set({ hasCompletedOnboarding: true });

            console.log('🔐 Onboarding - State after:', {
               isAuthenticated: get().isAuthenticated,
               hasCompletedOnboarding: true
            });
            console.log('🔐 ===== ONBOARDING COMPLETE =====');
         },

         resetOnboarding: () => {
            console.log('🔐 ===== RESETTING ONBOARDING =====');
            console.log('🔐 Reset - State before:', {
               isAuthenticated: get().isAuthenticated,
               hasCompletedOnboarding: get().hasCompletedOnboarding
            });

            set({ hasCompletedOnboarding: false });

            console.log('🔐 Reset - State after:', {
               isAuthenticated: get().isAuthenticated,
               hasCompletedOnboarding: false
            });
            console.log('🔐 ===== ONBOARDING RESET =====');
         },

         // Hydration method
         setHasHydrated: (value: boolean) => {
            set({ _hasHydrated: value });
         },

         // Check authentication status on app startup
         checkAuthStatus: async () => {
            console.log('🔐 ===== STARTING AUTH STATUS CHECK =====');
            try {
               set({ isLoading: true, error: null });

               // Check if auth token exists in secure store
               const token = await get().getAuthToken();

               // Preserve existing onboarding state
               const currentState = get();
               const hasCompletedOnboarding = currentState.hasCompletedOnboarding;

               console.log('🔐 Auth Check - Token exists:', !!token);
               console.log('🔐 Auth Check - Current onboarding state:', hasCompletedOnboarding);
               console.log('🔐 Auth Check - Current isAuthenticated:', currentState.isAuthenticated);

               if (!token) {
                  set({
                     isAuthenticated: false,
                     user: null,
                     authLoaded: true,
                     isLoading: false,
                     hasCompletedOnboarding, // Preserve onboarding state
                  });
                  console.log('🔐 Auth Check - No token, user not authenticated');
                  console.log('🔐 Auth Check - Final state - isAuthenticated: false, hasCompletedOnboarding:', hasCompletedOnboarding);
                  return;
               }

               // Get current session from better-auth
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
                     hasCompletedOnboarding, // Preserve onboarding state
                  });
                  console.log('🔐 Auth Check - User authenticated:', user.email);
                  console.log('🔐 Auth Check - Onboarding state preserved:', hasCompletedOnboarding);
                  console.log('🔐 Auth Check - Final state - isAuthenticated: true, hasCompletedOnboarding:', hasCompletedOnboarding);
               } else {
                  // Invalid session, clear token
                  await get().removeAuthToken();
                  set({
                     isAuthenticated: false,
                     user: null,
                     authLoaded: true,
                     isLoading: false,
                     hasCompletedOnboarding, // Preserve onboarding state
                  });
                  console.log('🔐 Auth Check - Invalid session, token cleared');
                  console.log('🔐 Auth Check - Final state - isAuthenticated: false, hasCompletedOnboarding:', hasCompletedOnboarding);
               }
            } catch (error) {
               console.error('🔐 Auth check error:', error);
               const currentState = get();
               set({
                  isAuthenticated: false,
                  user: null,
                  authLoaded: true,
                  isLoading: false,
                  error: 'Failed to check authentication status',
                  hasCompletedOnboarding: currentState.hasCompletedOnboarding, // Preserve onboarding state
               });
               console.log('🔐 Auth Check - Error state - isAuthenticated: false, hasCompletedOnboarding:', currentState.hasCompletedOnboarding);
            }
            console.log('🔐 ===== AUTH STATUS CHECK COMPLETE =====');
         },

         // Sign in user
         signIn: async (email: string, password: string) => {
            console.log('🔐 ===== STARTING SIGN IN =====');
            console.log('🔐 Sign In - Email:', email);
            console.log('🔐 Sign In - Current state before:', {
               isAuthenticated: get().isAuthenticated,
               hasCompletedOnboarding: get().hasCompletedOnboarding
            });

            try {
               set({ isLoading: true, error: null });

               const { data, error } = await authClient.signIn.email({
                  email,
                  password,
               });

               console.log('🔐 Sign In - Auth response:', {
                  hasData: !!data,
                  hasError: !!error,
                  hasUser: !!data?.user,
                  hasToken: !!data?.token
               });

               if (error) {
                  console.log('🔐 Sign In - Error:', error.message);
                  set({
                     error: error.message || 'Sign in failed',
                     isLoading: false
                  });
                  return false;
               }

               if (data?.user && data.token) {
                  console.log('🔐 Sign In - Storing token and setting user state');
                  // Store session token in secure store
                  await get().setAuthToken(data.token);

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
                     hasCompletedOnboarding: currentState.hasCompletedOnboarding, // Preserve onboarding state
                  });

                  console.log('🔐 Sign In - Success! User authenticated:', user.email);
                  console.log('🔐 Sign In - Final state:', {
                     isAuthenticated: true,
                     hasCompletedOnboarding: currentState.hasCompletedOnboarding
                  });

                  // Invalidate queries to refresh data
                  queryClient.invalidateQueries();

                  return true;
               }

               console.log('🔐 Sign In - Invalid response from server');
               set({
                  error: 'Sign in failed: Invalid response',
                  isLoading: false
               });
               return false;
            } catch (error) {
               console.error('🔐 Sign In - Network error:', error);
               set({
                  error: 'Sign in failed: Network error',
                  isLoading: false
               });
               return false;
            }
         },

         // Sign up user
         signUp: async (email: string, password: string, name: string) => {
            console.log('🔐 ===== STARTING SIGN UP =====');
            console.log('🔐 Sign Up - Email:', email);
            console.log('🔐 Sign Up - Name:', name);
            console.log('🔐 Sign Up - Current state before:', {
               isAuthenticated: get().isAuthenticated,
               hasCompletedOnboarding: get().hasCompletedOnboarding
            });

            try {
               set({ isLoading: true, error: null });

               const { data, error } = await authClient.signUp.email({
                  email,
                  password,
                  name,
               });

               console.log('🔐 Sign Up - Auth response:', {
                  hasData: !!data,
                  hasError: !!error,
                  hasUser: !!data?.user
               });

               if (error) {
                  console.log('🔐 Sign Up - Error:', error.message);
                  set({
                     error: error.message || 'Sign up failed',
                     isLoading: false
                  });
                  return false;
               }

               if (data?.user) {
                  console.log('🔐 Sign Up - User created, now signing in');
                  // User created successfully, now sign them in
                  const signInSuccess = await get().signIn(email, password);

                  // Ensure onboarding state is false for fresh sign-ups
                  if (signInSuccess) {
                     console.log('🔐 Sign Up - Setting hasCompletedOnboarding to false for fresh user');
                     set({ hasCompletedOnboarding: false });
                     console.log('🔐 Sign Up - Final state:', {
                        isAuthenticated: true,
                        hasCompletedOnboarding: false
                     });
                  }

                  return signInSuccess;
               }

               console.log('🔐 Sign Up - Invalid response from server');
               set({
                  error: 'Sign up failed: Invalid response',
                  isLoading: false
               });
               return false;
            } catch (error) {
               console.error('🔐 Sign Up - Network error:', error);
               set({
                  error: 'Sign up failed: Network error',
                  isLoading: false
               });
               return false;
            }
         },

         // Sign out user
         signOut: async () => {
            try {
               set({ isLoading: true });

               // Call sign out API
               await authClient.signOut();

               // Remove token from secure store
               await get().removeAuthToken();

               // Clear state
               set({
                  isAuthenticated: false,
                  user: null,
                  isLoading: false,
                  error: null,
               });

               // Clear all React Query cache
               queryClient.clear();

            } catch (error) {
               console.error('Sign out error:', error);
               // Even if sign out API fails, clear local state
               await get().removeAuthToken();
               set({
                  isAuthenticated: false,
                  user: null,
                  isLoading: false,
                  error: null,
               });
               queryClient.clear();
            }
         },

         // Update user profile
         updateUser: async (userData: Partial<User>) => {
            try {
               set({ isLoading: true, error: null });

               const currentUser = get().user;
               if (!currentUser) {
                  set({ error: 'No authenticated user', isLoading: false });
                  return false;
               }

               // Call API to update user
               // This would need to be implemented in your API
               // For now, update local state
               const updatedUser = { ...currentUser, ...userData };

               set({
                  user: updatedUser,
                  isLoading: false,
               });

               return true;
            } catch (error) {
               console.error('Update user error:', error);
               set({
                  error: 'Failed to update user profile',
                  isLoading: false
               });
               return false;
            }
         },

         // Clear error
         clearError: () => set({ error: null }),

         // Set loading state
         setLoading: (loading: boolean) => set({ isLoading: loading }),

         // Set onboarding completed state (called from external sync)
         setOnboardingCompleted: (completed: boolean) => {
            set({ hasCompletedOnboarding: completed });
         },

         // Token management methods
         getAuthToken: async () => {
            try {
               console.log('🔐 Token - Attempting to get auth_token from SecureStore');
               const token = await SecureStore.getItemAsync('auth_token');
               console.log('🔐 Token - auth_token found:', !!token);

               // Also try to get token with better-auth prefix
               const expoToken = await SecureStore.getItemAsync('my-better-t-app');
               console.log('🔐 Token - my-better-t-app found: expoToken', !!expoToken);


               const expoToken2 = await SecureStore.getItemAsync('my-better-t-app_SecureStore');
               console.log('🔐 Token - my-better-t-app_session_token found: expoToken2', !!expoToken2);
               console.log('🔐 Token - my-better-t-app_session_token found: expoToken2', !!expoToken2);



               // Log all available secure store items for debugging
               console.log('🔐 Token - Checking all secure store items...');

               return token || expoToken; // Return whichever is found
            } catch (error) {
               console.error('🔐 Token - Error getting auth token:', error);
               return null;
            }
         },

         setAuthToken: async (token: string) => {
            try {
               console.log('🔐 Token - Storing auth_token in SecureStore, token length:', token.length);
               await SecureStore.setItemAsync('auth_token', token);
               console.log('🔐 Token - auth_token stored successfully:', token);
               console.log('🔐 Token - auth_token stored successfully');
            } catch (error) {
               console.error('🔐 Token - Error setting auth token:', error);
            }
         },

         removeAuthToken: async () => {
            try {
               console.log('🔐 Token - Removing auth_token from SecureStore');
               await SecureStore.deleteItemAsync('auth_token');
               console.log('🔐 Token - auth_token removed successfully');

               // Also try to remove better-auth token
               console.log('🔐 Token - Attempting to remove my-better-t-app_session_token');
               await SecureStore.deleteItemAsync('my-better-t-app_session_token');
               console.log('🔐 Token - my-better-t-app_session_token removed successfully');
            } catch (error) {
               console.error('🔐 Token - Error removing auth token:', error);
            }
         },
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
               console.log('🔄 Auth Store - Rehydrating with state:', {
                  isAuthenticated: state.isAuthenticated,
                  hasCompletedOnboarding: state.hasCompletedOnboarding,
                  authLoaded: state.authLoaded
               });
               state.setHasHydrated(true);
               state.authLoaded = false; // Will check real auth status
               // Trigger auth check after hydration - this should preserve the onboarding state
               state.checkAuthStatus();
            } else {
               console.log('🔄 Auth Store - No state to rehydrate');
            }
         },
      }
   )
);

// Initialize auth check on app start
export const initializeAuth = async () => {
   const authStore = useAuthStore.getState();

   // Sync onboarding state from user preferences if not already set
   if (!authStore.hasCompletedOnboarding) {
      try {
         const { useUserPreferenceStore } = await import('./useUserPreferenceStore');
         const userPrefs = useUserPreferenceStore.getState();
         const hasCompletedOnboarding = userPrefs.onboardingCompleted || false;
         if (hasCompletedOnboarding) {
            authStore.setOnboardingCompleted(hasCompletedOnboarding);
         }
      } catch (error) {
         console.error('Failed to sync onboarding state:', error);
      }
   }

   // Then check auth status (this will preserve the onboarding state)
   await authStore.checkAuthStatus();
};
