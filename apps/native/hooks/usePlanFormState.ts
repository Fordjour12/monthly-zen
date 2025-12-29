import { useState, useCallback } from "react";
import { FixedCommitment } from "@/hooks/usePlanGeneration";

export function usePlanFormState() {
  const [goalsText, setGoalsText] = useState("");
  const [taskComplexity, setTaskComplexity] = useState<"Simple" | "Balanced" | "Ambitious">(
    "Balanced",
  );
  const [focusAreas, setFocusAreas] = useState("");
  const [weekendPreference, setWeekendPreference] = useState<"Work" | "Rest" | "Mixed">("Mixed");
  const [fixedCommitments, setFixedCommitments] = useState<FixedCommitment[]>([]);

  const addCommitment = useCallback(() => {
    setFixedCommitments((prev) => [
      ...prev,
      {
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        description: "",
      },
    ]);
  }, []);

  const removeCommitment = useCallback((index: number) => {
    setFixedCommitments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateCommitment = useCallback(
    (index: number, field: keyof FixedCommitment, value: string) => {
      setFixedCommitments((prev) => {
        const newCommitments = [...prev];
        newCommitments[index] = { ...newCommitments[index], [field]: value };
        return newCommitments;
      });
    },
    [],
  );

  return {
    goalsText,
    setGoalsText,
    taskComplexity,
    setTaskComplexity,
    focusAreas,
    setFocusAreas,
    weekendPreference,
    setWeekendPreference,
    fixedCommitments,
    addCommitment,
    removeCommitment,
    updateCommitment,
  };
}
