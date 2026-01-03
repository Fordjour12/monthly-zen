/**
 * usePreferences Hook - User Preferences Management for Native
 *
 * Provides access to and management of user preferences for AI coaching.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import type { CoachTone } from "@monthly-zen/db";

export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: () => orpc.preferences.get.query(),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      coachName?: string;
      coachTone?: CoachTone;
      workingHoursStart?: string;
      workingHoursEnd?: string;
      defaultFocusArea?: string;
    }) => orpc.preferences.update.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
    },
  });
}
