import { useState, useCallback } from "react";
import { orpc } from "@/utils/orpc";
import { useMutation } from "@tanstack/react-query";

export interface TaskData {
  task_description: string;
  scheduling_reason?: string;
  focus_area: string;
  difficulty_level: "beginner" | "moderate" | "advanced";
  [key: string]: unknown;
}

export interface DailyTasks {
  [day: string]: TaskData[];
}

export interface WeekData {
  week_number?: number;
  goals?: string[];
  daily_tasks?: DailyTasks;
  [key: string]: unknown;
}

export interface PlanData {
  monthly_summary?: string;
  weekly_breakdown?: WeekData[];
  [key: string]: unknown;
}

export interface DraftState {
  draftKey: string;
  planData: PlanData;
  createdAt: string;
  expiresAt: string;
}

export interface FixedCommitment {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  description: string;
}

export interface GenerateInput {
  goalsText: string;
  taskComplexity: "Simple" | "Balanced" | "Ambitious";
  focusAreas: string;
  weekendPreference: "Work" | "Rest" | "Mixed";
  fixedCommitmentsJson: { commitments: FixedCommitment[] };
}

export interface GenerateResult {
  draftKey: string;
  planData: PlanData;
  preferenceId: number;
  generatedAt: string;
}

export function usePlanGeneration() {
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateMutation = useMutation(
    orpc.plan.generate.mutationOptions({
      context: {
        cache: true,
      },
      onSuccess: (response) => {
        setDraft({
          draftKey: response.data.draftKey,
          planData: response.data.planData as PlanData,
          createdAt: response.data.generatedAt,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
        setError(null);
        console.log("[usePlanGeneration] Plan generated");
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "Generation failed";
        setError(message);
      },
    }),
  );

  const confirmMutation = useMutation(
    orpc.plan.confirm.mutationOptions({
      onSuccess: (response) => {
        console.log("[usePlanGeneration] Plan saved permanently, ID:", response.data.planId);
        setDraft(null);
        setError(null);
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "Save failed";
        setError(message);
      },
    }),
  );

  const deleteDraftMutation = useMutation(
    orpc.plan.deleteDraft.mutationOptions({
      onSuccess: () => {
        console.log("[usePlanGeneration] Draft discarded");
        setDraft(null);
        setError(null);
      },
      onError: (err) => {
        console.error("[usePlanGeneration] Failed to discard draft:", err);
      },
    }),
  );

  const planData = draft?.planData || null;

  const generate = useCallback(
    async (input: GenerateInput): Promise<GenerateResult | null> => {
      const response = await generateMutation.mutateAsync(input);
      return {
        draftKey: response.data.draftKey,
        planData: response.data.planData as PlanData,
        preferenceId: response.data.preferenceId,
        generatedAt: response.data.generatedAt,
      };
    },
    [generateMutation],
  );

  const save = useCallback(async (): Promise<number | null> => {
    if (!draft) {
      setError("No draft to save");
      return null;
    }

    const response = await confirmMutation.mutateAsync({ draftKey: draft.draftKey });
    return response.data.planId;
  }, [draft, confirmMutation]);

  const discard = useCallback(async () => {
    if (!draft) return;

    await deleteDraftMutation.mutateAsync({ key: draft.draftKey });
  }, [draft, deleteDraftMutation]);

  return {
    draft,
    planData,
    isGenerating: generateMutation.isPending,
    isSaving: confirmMutation.isPending,
    error,
    generate,
    save,
    discard,
    clearError: () => setError(null),
  };
}
