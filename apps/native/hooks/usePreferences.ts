/**
 * usePreferences Hook - User Preferences Management for Native
 *
 * Provides access to and management of user preferences for AI coaching and goals.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  focusAreas?: string;
  resolutionsJson?: ResolutionsJson;
  weekendPreference?: "Work" | "Rest" | "Mixed";
  preferredTaskDuration?: number;
  fixedCommitmentsJson?: FixedCommitmentsJson;
};

export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: () => orpc.preferences.get.query(),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePreferencesInput) => orpc.preferences.update.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
    },
  });
}
