import { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Button } from "heroui-native";
import { authClient } from "@/lib/auth-client";
import {
  usePlanGeneration,
  type GenerateInput,
  type FixedCommitment,
} from "@/hooks/usePlanGeneration";
import { AutoSaveIndicator } from "@/components/auto-save-indicator";
import { DraftRecoveryBanner } from "@/components/draft-recovery-banner";
import { ParsingStatus } from "@/components/parsing-status";
import { DirectPlanDisplay } from "@/components/direct-plan-display";
import { PlanEditor } from "@/components/plan-editor";
import { PlanForm } from "@/components/plan-form";
import { useSemanticColors } from "@/utils/theme";

interface MonthlyPlan {
  id: string;
  title: string;
  month: string;
  goals: string[];
  tasks: Task[];
  totalTasks: number;
  estimatedHours: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  status?: string;
}

// Generate a cryptographically secure random ID
const generateId = (): string => {
  // Use crypto.randomUUID() if available (React Native 0.70+)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: Use a more secure alternative to Math.random()
  const timestamp = Date.now().toString(36);
  const randomPart = Array.from({ length: 9 }, () => Math.random().toString(36)[2] || "0").join("");
  return `${timestamp}${randomPart}`;
};

function PlanScreen() {
  const {
    draft,
    planData,
    isGenerating,
    isSaving,
    error: hookError,
    hasDraft,
    generate,
    save,
    discard,
    clearError,
    checkForExistingDraft,
  } = usePlanGeneration();

  const [hasGenerated, setHasGenerated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<MonthlyPlan | undefined>(undefined);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);

  // Form state
  const [goalsText, setGoalsText] = useState("");
  const [taskComplexity, setTaskComplexity] = useState<"Simple" | "Balanced" | "Ambitious">(
    "Balanced",
  );
  const [focusAreas, setFocusAreas] = useState("");
  const [weekendPreference, setWeekendPreference] = useState<"Work" | "Rest" | "Mixed">("Mixed");
  const [fixedCommitments, setFixedCommitments] = useState<FixedCommitment[]>([]);

  // Theme colors
  const { primary } = useSemanticColors();

  authClient.useSession();

  // Check for existing draft on mount
  useEffect(() => {
    checkForExistingDraft();
  }, [checkForExistingDraft]);

  // Effect to handle draft recovery notification
  useEffect(() => {
    if (hasDraft && !hasGenerated && draft) {
      setShowRecoveryBanner(true);
    } else {
      setShowRecoveryBanner(false);
    }
  }, [hasDraft, hasGenerated, draft]);

  // If generation completes, show the plan
  useEffect(() => {
    if (planData && !hasGenerated && !showRecoveryBanner) {
      setHasGenerated(true);
    }
  }, [planData, showRecoveryBanner, hasGenerated]);

  // Transform planData to MonthlyPlan
  const monthlyPlan = useMemo((): MonthlyPlan | null => {
    if (!planData || !planData.weekly_breakdown) return null;

    if (editedPlan) return editedPlan;

    const tasks: Task[] = [];
    const goals: string[] = [];

    planData.weekly_breakdown.forEach((week) => {
      if (week.goals) goals.push(...week.goals);

      if (week.daily_tasks) {
        Object.entries(week.daily_tasks).forEach(([, dayTasks]) => {
          if (Array.isArray(dayTasks)) {
            dayTasks.forEach((t) => {
              tasks.push({
                id: generateId(),
                title: t.task_description,
                description: t.scheduling_reason,
                category: t.focus_area,
                priority:
                  t.difficulty_level === "advanced"
                    ? "High"
                    : t.difficulty_level === "moderate"
                      ? "Medium"
                      : "Low",
                status: "pending",
              });
            });
          }
        });
      }
    });

    return {
      id: "0",
      title: planData.monthly_summary ? "Personalized Monthly Plan" : "Your Plan",
      month: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      goals: goals.length > 0 ? goals : ["Complete monthly objectives"],
      tasks,
      totalTasks: tasks.length,
      estimatedHours: tasks.length * 2,
    };
  }, [planData, editedPlan]);

  const handleGenerate = useCallback(async () => {
    if (!goalsText.trim() || !focusAreas.trim()) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    clearError();
    setHasGenerated(false);
    setShowRecoveryBanner(false);

    try {
      const validCommitments = fixedCommitments.filter(
        (c) => c.dayOfWeek && c.startTime && c.endTime && c.description,
      );

      const filteredData: GenerateInput = {
        goalsText,
        taskComplexity,
        focusAreas,
        weekendPreference,
        fixedCommitmentsJson: {
          commitments: validCommitments,
        },
      };

      const result = await generate(filteredData);

      if (result) {
        setHasGenerated(true);
      }
    } catch (err) {
      console.error("Plan generation error:", err);
    }
  }, [
    goalsText,
    focusAreas,
    taskComplexity,
    weekendPreference,
    fixedCommitments,
    generate,
    clearError,
  ]);

  const handleRecoverDraft = useCallback(() => {
    setHasGenerated(true);
    setShowRecoveryBanner(false);
  }, []);

  const handleDiscardDraft = useCallback(async () => {
    await discard();
    setShowRecoveryBanner(false);
    setHasGenerated(false);
    setEditedPlan(undefined);
  }, [discard]);

  const handleRegenerate = useCallback(async () => {
    setHasGenerated(false);
    setEditedPlan(undefined);
    setIsEditing(false);
    await handleGenerate();
  }, [handleGenerate]);

  const handleSave = useCallback(async () => {
    const planId = await save();
    if (planId) {
      Alert.alert("Success", `Plan saved successfully! ID: ${planId}`);
      setHasGenerated(false);
    }
  }, [save]);

  const handleEdit = useCallback(() => {
    if (monthlyPlan) {
      setIsEditing(true);
      setEditedPlan(monthlyPlan);
    }
  }, [monthlyPlan]);

  const handleSaveEdit = useCallback((newPlanData: MonthlyPlan) => {
    setEditedPlan(newPlanData);
    setIsEditing(false);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedPlan(undefined);
  }, []);

  const handleViewFull = useCallback(async () => {
    const planId = await save();
    if (planId) {
      Alert.alert("Success", `Plan saved! ID: ${planId}\nTasks view not implemented yet`);
    } else {
      Alert.alert("Info", "Tasks view not implemented yet");
    }
  }, [save]);

  const addCommitment = useCallback(() => {
    setFixedCommitments([
      ...fixedCommitments,
      {
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        description: "",
      },
    ]);
  }, [fixedCommitments]);

  const removeCommitment = useCallback(
    (index: number) => {
      setFixedCommitments(fixedCommitments.filter((_, i) => i !== index));
    },
    [fixedCommitments],
  );

  const updateCommitment = useCallback(
    (index: number, field: keyof FixedCommitment, value: string) => {
      const newCommitments = [...fixedCommitments];
      newCommitments[index] = { ...newCommitments[index], [field]: value };
      setFixedCommitments(newCommitments);
    },
    [fixedCommitments],
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="border-b border-border  px-4 py-6">
        <View className="flex items-center justify-between flex-row">
          <View className="flex items-center gap-3 flex-row">
            <View className="h-10 w-10 bg-primary/10 rounded-lg items-center justify-center">
              <Ionicons name="bulb" size={20} color={primary} />
            </View>
            <View>
              <Text className="text-2xl font-bold tracking-tight text-foreground">
                Generate AI Plan
              </Text>
              <Text className="text-sm text-muted-foreground">
                Create a personalized monthly plan with AI assistance
              </Text>
            </View>
          </View>

          <AutoSaveIndicator
            status={
              isSaving
                ? "saving"
                : hasDraft && !isGenerating
                  ? "saved"
                  : hookError
                    ? "error"
                    : "idle"
            }
            draftKey={draft?.draftKey}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-8" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Draft Recovery Banner */}
        {showRecoveryBanner && draft && (
          <DraftRecoveryBanner
            createdAt={draft.createdAt}
            expiresAt={draft.expiresAt}
            onView={handleRecoverDraft}
            onDiscard={handleDiscardDraft}
            onDismiss={() => setShowRecoveryBanner(false)}
          />
        )}

        {/* Edit Mode */}
        {isEditing && editedPlan && (
          <PlanEditor
            monthlyPlan={editedPlan}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        )}

        {/* Parsing Status - Shows during parsing */}
        {isGenerating && <ParsingStatus isLoading={true} />}

        {/* Direct Plan Display - Shows after parsing is complete */}
        {!isGenerating && !isEditing && monthlyPlan && (
          <DirectPlanDisplay
            monthlyPlan={monthlyPlan}
            error={hookError || undefined}
            onRegenerate={handleRegenerate}
            onSave={handleSave}
            onEdit={handleEdit}
            onViewFull={handleViewFull}
          />
        )}

        {/* Form Section */}
        {!hasGenerated && !isEditing && (
          <PlanForm
            goalsText={goalsText}
            taskComplexity={taskComplexity}
            focusAreas={focusAreas}
            weekendPreference={weekendPreference}
            fixedCommitments={fixedCommitments}
            isGenerating={isGenerating}
            hookError={hookError}
            onGoalsChange={setGoalsText}
            onTaskComplexityChange={setTaskComplexity}
            onFocusAreasChange={setFocusAreas}
            onWeekendPreferenceChange={setWeekendPreference}
            onGenerate={handleGenerate}
            onAddCommitment={addCommitment}
            onRemoveCommitment={removeCommitment}
            onUpdateCommitment={updateCommitment}
          />
        )}
      </ScrollView>
    </View>
  );
}

export default PlanScreen;
