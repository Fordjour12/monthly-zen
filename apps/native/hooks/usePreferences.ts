/**
 * usePreferences Hook - User Preferences Management for Native
 *
 * Provides access to and management of user preferences for AI coaching and goals.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
type CoachTone = "encouraging" | "direct" | "analytical" | "friendly";

type FixedCommitmentsJson = {
  commitments: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    description: string;
  }>;
};

type ResolutionsJson = {
  resolutions: Array<{
    title: string;
    category: string;
    targetCount: number;
  }>;
};

export type UpdatePreferencesInput = {
  coachName?: string;
  coachTone?: CoachTone;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  defaultFocusArea?: string;
  taskComplexity?: "Simple" | "Balanced" | "Ambitious";
  weekendPreference?: "Work" | "Rest" | "Mixed";
  preferredTaskDuration?: number;
  fixedCommitmentsJson?: FixedCommitmentsJson;
  resolutionsJson?: ResolutionsJson;
};

export function useHelloPreference() {
  return useQuery(orpc.preferences.hello.queryOptions());
}

export function usePreferences() {
  return useQuery(
    orpc.preferences.get.queryOptions({
      context: {
        cache: true,
      },
    }),
  );
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.preferences.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["preferences"] });
      },
    }),
  );
}
