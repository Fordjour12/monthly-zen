import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.EXPO_PUBLIC_SERVER_URL || "";

export interface PlanData {
  monthly_summary?: string;
  weekly_breakdown?: any[];
  [key: string]: any;
}

export interface DraftState {
  draftKey: string;
  planData: PlanData;
  createdAt: string;
  expiresAt: string;
}

export interface GenerateInput {
  goalsText: string;
  taskComplexity: "Simple" | "Balanced" | "Ambitious";
  focusAreas: string;
  weekendPreference: "Work" | "Rest" | "Mixed";
  fixedCommitmentsJson: { commitments: any[] };
}

export interface GenerateResult {
  draftKey: string;
  planData: PlanData;
  preferenceId: number;
  generatedAt: string;
}

export function usePlanGeneration() {
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkForExistingDraft();
  }, []);

  const checkForExistingDraft = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/plan/draft`, {
        credentials: "include",
      });

      if (!response.ok) {
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        setDraft(result.data);
        console.log("[usePlanGeneration] Recovered draft from previous session");
      }
    } catch (err) {
      console.log("[usePlanGeneration] No existing draft found");
    }
  }, []);

  const generate = useCallback(async (input: GenerateInput): Promise<GenerateResult | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/plan/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Generation failed");
      }

      setDraft({
        draftKey: result.data.draftKey,
        planData: result.data.planData,
        createdAt: result.data.generatedAt,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      console.log("[usePlanGeneration] Plan generated and auto-staged");

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const save = useCallback(async (): Promise<number | null> => {
    if (!draft) {
      setError("No draft to save");
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/plan/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ draftKey: draft.draftKey }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Save failed");
      }

      console.log("[usePlanGeneration] Plan saved permanently");

      setDraft(null);

      return result.data.planId;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [draft]);

  const discard = useCallback(async () => {
    if (!draft) return;

    try {
      await fetch(`${API_BASE}/api/plan/draft/${draft.draftKey}`, {
        method: "DELETE",
        credentials: "include",
      });

      console.log("[usePlanGeneration] Draft discarded");
      setDraft(null);
    } catch (err) {
      console.error("[usePlanGeneration] Failed to discard draft:", err);
    }
  }, [draft]);

  return {
    draft,
    planData: draft?.planData || null,
    isGenerating,
    isSaving,
    error,
    hasDraft: !!draft,
    generate,
    save,
    discard,
    clearError: () => setError(null),
  };
}
