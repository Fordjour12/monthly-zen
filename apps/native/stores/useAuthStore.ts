import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { authClient } from '@/lib/auth-client';
import { queryClient } from '@/utils/orpc';

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
   setOnboardingCompleted: (completed: boolean) => void;
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
                  console.log('🔐 Sign Up - User created and session established by better-auth');

                  // Create user object from sign-up response
                  const user: User = {
                     id: data.user.id,
                     email: data.user.email,
                     name: data.user.name || name,
                     image: data.user.image,
                     emailVerified: data.user.emailVerified,
                  };

                  // Set authenticated state directly - better-auth already created the session
                  // New users should go through onboarding
                  set({
                     isAuthenticated: true,
                     user,
                     isLoading: false,
                     hasCompletedOnboarding: false, // New users need onboarding
                     authLoaded: true,
                  });

                  console.log('🔐 Sign Up - Successfully authenticated:', user.email);
                  console.log('🔐 Sign Up - Final state:', {
                     isAuthenticated: true,
                     hasCompletedOnboarding: false
                  });

                  // Invalidate queries to refresh data
                  queryClient.invalidateQueries();

                  return true;
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

         // Set onboarding completed state (called from external sync like useUserPreferenceStore)
         setOnboardingCompleted: (completed: boolean) => {
            console.log('🔐 Onboarding - Setting completed to:', completed);
            set({ hasCompletedOnboarding: completed });
         },
      }),
      {
         name: 'auth-store',
         storage: createJSONStorage(() => {
            if (isWeb) {
               return {
                  getItem: (name) => localStorage.getItem(name),
                  setItem: (name, value) => localStorage.setItem(name, value),
                  removeItem: (name) => localStorage.removeItem(name),
               };
            }

            const storage = createMMKV({ id: 'auth-storage' });
            return {
               getItem: (name) => storage.getString(name) || null,
               setItem: (name, value) => storage.set(name, value),
               removeItem: (name) => storage.remove(name),
            };
         }),
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
