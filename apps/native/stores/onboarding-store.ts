import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

export interface Resolution {
  title: string;
  category: string;
  targetCount: number;
}

export interface FixedCommitment {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  description: string;
}

export type TaskComplexity = "Simple" | "Balanced" | "Ambitious";
export type WeekendPreference = "Work" | "Rest" | "Mixed";

interface OnboardingState {
  mainGoal: string;
  resolutions: Resolution[];
  selectedCoachId: string;
  coachName: string;
  coachTone: string;
  fixedCommitments: FixedCommitment[];
  taskComplexity: TaskComplexity;
  weekendPreference: WeekendPreference;
  stepIndex: number;

  setMainGoal: (mainGoal: string) => void;
  addResolution: (resolution: Resolution) => void;
  removeResolution: (index: number) => void;
  setCoachProfile: (profile: { id: string; name: string; tone: string }) => void;
  addCommitment: (commitment: FixedCommitment) => void;
  removeCommitment: (index: number) => void;
  setTaskComplexity: (complexity: TaskComplexity) => void;
  setWeekendPreference: (preference: WeekendPreference) => void;
  setStepIndex: (index: number) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist<OnboardingState>(
    (set) => ({
      mainGoal: "",
      resolutions: [],
      selectedCoachId: "friendly",
      coachName: "Sunny",
      coachTone: "friendly",
      fixedCommitments: [],
      taskComplexity: "Balanced",
      weekendPreference: "Mixed",
      stepIndex: 0,

      setMainGoal: (mainGoal) => set({ mainGoal }),
      addResolution: (resolution) =>
        set((state) => ({ resolutions: [...state.resolutions, resolution] })),
      removeResolution: (index) =>
        set((state) => ({
          resolutions: state.resolutions.filter((_, currentIndex) => currentIndex !== index),
        })),
      setCoachProfile: (profile) =>
        set({ selectedCoachId: profile.id, coachName: profile.name, coachTone: profile.tone }),
      addCommitment: (commitment) =>
        set((state) => ({ fixedCommitments: [...state.fixedCommitments, commitment] })),
      removeCommitment: (index) =>
        set((state) => ({
          fixedCommitments: state.fixedCommitments.filter(
            (_, currentIndex) => currentIndex !== index,
          ),
        })),
      setTaskComplexity: (taskComplexity) => set({ taskComplexity }),
      setWeekendPreference: (weekendPreference) => set({ weekendPreference }),
      setStepIndex: (stepIndex) => set({ stepIndex }),
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => ({
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        getItem: (key: string) => SecureStore.getItemAsync(key),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      })),
    },
  ),
);
