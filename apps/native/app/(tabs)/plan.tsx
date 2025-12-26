import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "heroui-native";
import { authClient } from "@/lib/auth-client";
import { usePlanGeneration, type GenerateInput, type FixedCommitment } from "@/hooks/usePlanGeneration";
import { AutoSaveIndicator } from "@/components/auto-save-indicator";
import { DraftRecoveryBanner } from "@/components/draft-recovery-banner";
import { ParsingStatus } from "@/components/parsing-status";
import { DirectPlanDisplay } from "@/components/direct-plan-display";
import { PlanEditor } from "@/components/plan-editor";

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
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: Use a more secure alternative to Math.random()
  const timestamp = Date.now().toString(36);
  const randomPart = Array.from({ length: 9 }, () =>
    Math.random().toString(36)[2] || '0'
  ).join('');
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

  authClient.useSession();

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
  }, [goalsText, focusAreas, taskComplexity, weekendPreference, fixedCommitments, generate, clearError]);

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

  const removeCommitment = useCallback((index: number) => {
    setFixedCommitments(fixedCommitments.filter((_, i) => i !== index));
  }, [fixedCommitments]);

  const updateCommitment = useCallback((index: number, field: keyof FixedCommitment, value: string) => {
    const newCommitments = [...fixedCommitments];
    newCommitments[index] = { ...newCommitments[index], [field]: value };
    setFixedCommitments(newCommitments);
  }, [fixedCommitments]);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="border-b border-border bg-card px-4 py-6">
        <View className="flex items-center justify-between flex-row">
          <View className="flex items-center gap-3 flex-row">
            <View className="h-10 w-10 bg-primary/10 rounded-lg items-center justify-center">
              <Ionicons name="bulb" size={20} className="text-primary" />
            </View>
            <View>
              <Text className="text-2xl font-bold tracking-tight">Generate AI Plan</Text>
              <Text className="text-foreground">
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

      <ScrollView className="flex-1 px-4 py-8">
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
          <View className="space-y-8">
            {/* Goals Section */}
            <Card className="p-4">
              <View className="flex items-center gap-2 flex-row mb-4">
                <Ionicons name="flag" size={20} className="text-primary" />
                <Text className="font-semibold">Your Goals & Objectives</Text>
              </View>
              <Text className="text-sm text-foreground mb-4">
                Describe what you want to achieve this month. Be specific about your goals,
                deadlines, and desired outcomes.
              </Text>
              <TextInput
                value={goalsText}
                onChangeText={setGoalsText}
                placeholder="e.g., I want to launch my e-commerce website, learn React, and exercise 3 times per week..."
                className="border border-border rounded-lg p-3 min-h-30 text-base"
                multiline
                textAlignVertical="top"
              />
              <Text className="text-xs text-foreground mt-2">
                The more detailed your goals, the better AI can tailor your plan.
              </Text>
            </Card>

            {/* Task Complexity */}
            <Card className="p-4">
              <View className="flex items-center gap-2 flex-row mb-4">
                <Ionicons name="flash" size={20} className="text-primary" />
                <Text className="font-semibold">Task Complexity</Text>
              </View>
              <Text className="text-sm text-foreground mb-4">
                Choose how ambitious you want your monthly plan to be.
              </Text>
              <View className="space-y-3">
                {["Simple", "Balanced", "Ambitious"].map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setTaskComplexity(level as "Simple" | "Balanced" | "Ambitious")}
                    className={`p-4 border rounded-lg ${taskComplexity === level ? "border-primary bg-primary/10" : "border-border"}`}
                    accessibilityLabel={`${level} task complexity`}
                    accessibilityHint={`Set task complexity to ${level.toLowerCase()}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: taskComplexity === level }}
                  >
                    <View className="flex items-center gap-3 flex-row">
                      <Ionicons
                        name={taskComplexity === level ? "radio-button-on" : "radio-button-off"}
                        size={20}
                        className={taskComplexity === level ? "text-primary" : "text-foreground"}
                      />
                      <View>
                        <Text className="font-medium">{level}</Text>
                        <Text className="text-sm text-foreground">
                          {level === "Simple"
                            ? "Fewer, manageable tasks"
                            : level === "Balanced"
                              ? "Mix of easy and challenging"
                              : "Challenging but rewarding"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Focus Areas */}
            <Card className="p-4">
              <Text className="font-semibold mb-4">Focus Areas</Text>
              <Text className="text-sm text-foreground mb-4">
                What areas do you want to focus on this month?
              </Text>
              <View className="flex items-center gap-2 border border-border rounded-lg p-3">
                <Ionicons name="flag" size={18} className="text-foreground" />
                <TextInput
                  value={focusAreas}
                  onChangeText={setFocusAreas}
                  placeholder="e.g., Health, Career, Learning, Personal Growth"
                  className="flex-1 text-base"
                />
              </View>
              <Text className="text-xs text-foreground mt-2">
                Separate multiple areas with commas.
              </Text>
            </Card>

            {/* Weekend Preference */}
            <Card className="p-4">
              <View className="flex items-center gap-2 flex-row mb-4">
                <Ionicons name="calendar" size={20} className="text-primary" />
                <Text className="font-semibold">Weekend Preference</Text>
              </View>
              <Text className="text-sm text-foreground mb-4">
                How would you like to handle weekends in your plan?
              </Text>
              <View className="space-y-3">
                {[
                  { value: "Work", label: "Deep Work", desc: "Focus on intensive tasks" },
                  { value: "Rest", label: "Rest & Recharge", desc: "Keep weekends free" },
                  { value: "Mixed", label: "Light Tasks", desc: "Easy activities only" },
                ].map((pref) => (
                  <TouchableOpacity
                    key={pref.value}
                    onPress={() => setWeekendPreference(pref.value as "Work" | "Rest" | "Mixed")}
                    className={`p-4 border rounded-lg ${weekendPreference === pref.value ? "border-primary bg-primary/10" : "border-border"}`}
                    accessibilityLabel={pref.label}
                    accessibilityHint={pref.desc}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: weekendPreference === pref.value }}
                  >
                    <View className="flex items-center gap-3 flex-row">
                      <Ionicons
                        name={
                          weekendPreference === pref.value ? "radio-button-on" : "radio-button-off"
                        }
                        size={20}
                        className={
                          weekendPreference === pref.value ? "text-primary" : "text-foreground"
                        }
                      />
                      <View>
                        <Text className="font-medium">{pref.label}</Text>
                        <Text className="text-sm text-foreground">{pref.desc}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Fixed Commitments */}
            <Card className="p-4">
              <View className="flex items-center gap-2 flex-row mb-4">
                <Ionicons name="time" size={20} className="text-primary" />
                <Text className="font-semibold">Fixed Commitments</Text>
              </View>
              <Text className="text-sm text-foreground mb-4">
                Add any regular commitments or blocked time slots (optional).
              </Text>
              <View className="space-y-4">
                {fixedCommitments.map((commitment, index) => (
                  <View key={index} className="p-4 border border-border rounded-lg relative">
                    <View className="space-y-3">
                      <View>
                        <Text className="text-xs text-foreground mb-1">Day</Text>
                        <TextInput
                          value={commitment.dayOfWeek}
                          onChangeText={(text) => updateCommitment(index, "dayOfWeek", text)}
                          placeholder="Day"
                          className="border border-border rounded-lg p-3"
                        />
                      </View>
                      <View className="flex gap-3 flex-row">
                        <View className="flex-1">
                          <Text className="text-xs text-foreground mb-1">Start</Text>
                          <TextInput
                            value={commitment.startTime}
                            onChangeText={(text) => updateCommitment(index, "startTime", text)}
                            placeholder="09:00"
                            className="border border-border rounded-lg p-3"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs text-foreground mb-1">End</Text>
                          <TextInput
                            value={commitment.endTime}
                            onChangeText={(text) => updateCommitment(index, "endTime", text)}
                            placeholder="10:00"
                            className="border border-border rounded-lg p-3"
                          />
                        </View>
                      </View>
                      <View>
                        <Text className="text-xs text-foreground mb-1">Description</Text>
                        <TextInput
                          value={commitment.description}
                          onChangeText={(text) => updateCommitment(index, "description", text)}
                          placeholder="e.g., Team standup, Gym workout"
                          className="border border-border rounded-lg p-3"
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeCommitment(index)}
                      className="absolute top-2 right-2"
                      accessibilityLabel="Remove commitment"
                      accessibilityHint={`Remove ${commitment.description || 'this'} commitment`}
                      accessibilityRole="button"
                    >
                      <Ionicons name="close" size={20} className="text-destructive" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={addCommitment}
                  className="border border-border p-4 rounded-lg items-center"
                  accessibilityLabel="Add Fixed Commitment"
                  accessibilityHint="Add a new time commitment to your schedule"
                  accessibilityRole="button"
                >
                  <Ionicons name="add" size={20} />
                  <Text className="text-sm font-medium ml-2">Add Fixed Commitment</Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={isGenerating}
              className={`p-4 rounded-lg items-center ${isGenerating ? "bg-muted" : "bg-primary"}`}
              accessibilityLabel="Generate AI Plan"
              accessibilityHint="Creates a personalized monthly plan based on your inputs"
              accessibilityRole="button"
              accessibilityState={{ disabled: isGenerating }}
            >
              <View className="flex items-center gap-2 flex-row">
                {isGenerating ? (
                  <>
                    <Ionicons
                      name="sync"
                      size={20}
                      className="animate-spin text-primary-foreground"
                    />
                    <Text className="font-medium text-primary-foreground">
                      Generating Your Plan...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="flash" size={20} className="text-primary-foreground" />
                    <Text className="font-medium text-primary-foreground">Generate AI Plan</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Form-level Error Display */}
            {hookError && (
              <View className="p-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-950/20">
                <Text className="text-sm text-red-700 dark:text-red-400">{hookError}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default memo(PlanScreen, (_prevProps, _nextProps) => {
  // Since this is a screen component without props, it will always re-render when parent re-renders
  // But the memo helps prevent re-renders when props don't change
  return true;
});
