import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  _hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (credentials: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist<AuthState>(
    (set) => ({
      isLoggedIn: false,
      user: null,
      _hasHydrated: false,
      isLoading: false,
      error: null,

      signIn: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const data = await authClient.signIn.email(credentials);

          if (data.error) {
            set({ error: data.error.message, isLoading: false });
            return;
          }

          const session = await authClient.getSession();
          set({
            isLoggedIn: true,
            user: session.data?.user as User | null,
            isLoading: false,
            _hasHydrated: true,
          });
        } catch {
          set({ error: "An unexpected error occurred", isLoading: false });
        }
      },

      signUp: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const data = await authClient.signUp.email(credentials);

          if (data.error) {
            set({ error: data.error.message, isLoading: false });
            return;
          }

          const session = await authClient.getSession();
          set({
            isLoggedIn: true,
            user: session.data?.user as User | null,
            isLoading: false,
            _hasHydrated: true,
          });
        } catch {
          set({ error: "An unexpected error occurred", isLoading: false });
        }
      },

      signOut: async () => {
        set({ isLoading: true });

        try {
          await authClient.signOut();
          set({ isLoggedIn: false, user: null, isLoading: false });
        } catch {
          set({ error: "Failed to sign out", isLoading: false });
        }
      },

      setHasHydrated: (value: boolean) => {
        set({ _hasHydrated: value });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => ({
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        getItem: (key: string) => SecureStore.getItemAsync(key),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      })),
      onRehydrateStorage: () => {
        return (state) => {
          state?.setHasHydrated(true);
        };
      },
    },
  ),
);
