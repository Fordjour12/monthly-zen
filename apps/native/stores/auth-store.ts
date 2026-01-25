import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

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
  hasCompletedOnboarding: boolean;
  onboardingSyncedToServer: boolean;

  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (credentials: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
  syncOnboarding: () => Promise<void>;
  syncSession: () => Promise<void>;
  syncOnboardingStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist<AuthState>(
    (set) => ({
      isLoggedIn: false,
      user: null,
      _hasHydrated: false,
      isLoading: false,
      error: null,
      hasCompletedOnboarding: false,
      onboardingSyncedToServer: false,

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
          set({
            isLoggedIn: false,
            user: null,
            isLoading: false,
            hasCompletedOnboarding: false,
            onboardingSyncedToServer: false,
          });
        } catch {
          set({ error: "Failed to sign out", isLoading: false });
        }
      },

      completeOnboarding: async () => {
        // Step 1: Update local state immediately (fast)
        set({ hasCompletedOnboarding: true });

        // Step 2: Sync to server in background
        try {
          await orpc.user.completeOnboarding.call({});
          set({ onboardingSyncedToServer: true });
        } catch {
          // Retry later on app foreground
          set({ onboardingSyncedToServer: false });
        }
      },

      syncOnboarding: async () => {
        const { hasCompletedOnboarding } = useAuthStore.getState();
        if (hasCompletedOnboarding) {
          try {
            await orpc.user.completeOnboarding.call({});
            set({ onboardingSyncedToServer: true });
          } catch {
            set({ onboardingSyncedToServer: false });
          }
        }
      },

      syncOnboardingStatus: async () => {
        try {
          const result = await orpc.user.getOnboardingStatus.call({});
          set({ hasCompletedOnboarding: result.hasCompletedOnboarding });
        } catch {
          set({ hasCompletedOnboarding: false });
        }
      },

      syncSession: async () => {
        set({ isLoading: true, error: null });

        try {
          const session = await authClient.getSession();
          const user = session.data?.user as User | undefined;

          if (!user) {
            set({
              isLoggedIn: false,
              user: null,
              isLoading: false,
              hasCompletedOnboarding: false,
              onboardingSyncedToServer: false,
            });
            return;
          }

          set({ isLoggedIn: true, user, isLoading: false, _hasHydrated: true });
        } catch {
          set({
            isLoggedIn: false,
            user: null,
            isLoading: false,
            hasCompletedOnboarding: false,
            onboardingSyncedToServer: false,
            error: "Failed to refresh session",
          });
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
          state?.syncSession();
        };
      },
    },
  ),
);
