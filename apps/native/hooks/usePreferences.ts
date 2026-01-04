/**
 * usePreferences Hook - User Preferences Management for Native
 *
 * Provides access to and management of user preferences for AI coaching and goals.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import type { CoachTone } from "@monthly-zen/db";

export type UpdatePreferencesInput = {
  coachName?: string;
  coachTone?: CoachTone;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  defaultFocusArea?: string;
  goalsText?: string;
  taskComplexity?: "Simple" | "Balanced" | "Ambitious";
  focusAreas?: string;
  weekendPreference?: "Work" | "Rest" | "Mixed";
  fixedCommitmentsJson?: any;
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
