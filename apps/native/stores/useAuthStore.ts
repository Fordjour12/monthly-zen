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
   shouldCreateAccount: boolean;
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
         shouldCreateAccount: false,
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

         // Check authentication status on app startup
         checkAuthStatus: async () => {
            try {
               set({ isLoading: true, error: null });

               // Check if auth token exists in secure store
               const token = await get().getAuthToken();

               if (!token) {
                  set({
                     isAuthenticated: false,
                     user: null,
                     authLoaded: true,
                     isLoading: false
                  });
                  return;
               }

               // Get current session from better-auth
               const { data: session } = await authClient.getSession();

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
                  });
               } else {
                  // Invalid session, clear token
                  await get().removeAuthToken();
                  set({
                     isAuthenticated: false,
                     user: null,
                     authLoaded: true,
                     isLoading: false,
                  });
               }
            } catch (error) {
               console.error('Auth check error:', error);
               set({
                  isAuthenticated: false,
                  user: null,
                  authLoaded: true,
                  isLoading: false,
                  error: 'Failed to check authentication status',
               });
            }
         },

         // Sign in user
         signIn: async (email: string, password: string) => {
            try {
               set({ isLoading: true, error: null });

               const { data, error } = await authClient.signIn.email({
                  email,
                  password,
               });

               if (error) {
                  set({
                     error: error.message || 'Sign in failed',
                     isLoading: false
                  });
                  return false;
               }

               if (data?.user && data.token) {
                  // Store session token in secure store
                  await get().setAuthToken(data.token);

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

                  // Invalidate queries to refresh data
                  queryClient.invalidateQueries();

                  return true;
               }

               set({
                  error: 'Sign in failed: Invalid response',
                  isLoading: false
               });
               return false;
            } catch (error) {
               console.error('Sign in error:', error);
               set({
                  error: 'Sign in failed: Network error',
                  isLoading: false
               });
               return false;
            }
         },

         // Sign up user
         signUp: async (email: string, password: string, name: string) => {
            try {
               set({ isLoading: true, error: null });

               const { data, error } = await authClient.signUp.email({
                  email,
                  password,
                  name,
               });

               if (error) {
                  set({
                     error: error.message || 'Sign up failed',
                     isLoading: false
                  });
                  return false;
               }

               if (data?.user) {
                  // User created successfully, now sign them in
                  const signInSuccess = await get().signIn(email, password);
                  return signInSuccess;
               }

               set({
                  error: 'Sign up failed: Invalid response',
                  isLoading: false
               });
               return false;
            } catch (error) {
               console.error('Sign up error:', error);
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

         // Token management methods
         getAuthToken: async () => {
            try {
               return await SecureStore.getItemAsync('auth_token');
            } catch (error) {
               console.error('Error getting auth token:', error);
               return null;
            }
         },

         setAuthToken: async (token: string) => {
            try {
               await SecureStore.setItemAsync('auth_token', token);
            } catch (error) {
               console.error('Error setting auth token:', error);
            }
         },

         removeAuthToken: async () => {
            try {
               await SecureStore.deleteItemAsync('auth_token');
            } catch (error) {
               console.error('Error removing auth token:', error);
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
               state.setHasHydrated(true);
               state.authLoaded = false; // Will check real auth status
               // Trigger auth check after hydration
               state.checkAuthStatus();
            }
         },
      }
   )
);

// Initialize auth check on app start
export const initializeAuth = () => {
   useAuthStore.getState().checkAuthStatus();
};
