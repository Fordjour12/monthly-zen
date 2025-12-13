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