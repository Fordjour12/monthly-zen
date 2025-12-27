import React, { useState, useCallback, useEffect, useMemo } from "react";
import { View, Text, Alert, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { usePlanGeneration, GenerateInput } from "@/hooks/usePlanGeneration";
import { usePlanData, WeekSectionData } from "@/hooks/usePlanData";
import { usePlanFormState } from "@/hooks/usePlanFormState";
import { PlanFormCollapsible } from "./plan-form-collapsible";
import { WeekSection } from "../tasks/week-section";
import { FloatingActionBar } from "../tasks/floating-action-bar";
import { useSemanticColors } from "@/utils/theme";

export function PlanDashboard() {
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
    checkForExistingDraft,
    clearError,
  } = usePlanGeneration();

  const {
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
  } = usePlanFormState();

  const { data: sectionedData, toggleWeek } = usePlanData(planData);
  const { primary, background } = useSemanticColors();

  // Dashboard state
  const [isFormExpanded, setIsFormExpanded] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Collapse form when plan is generated
  useEffect(() => {
    if (planData && !isGenerating) {
      setIsFormExpanded(false);
    }
  }, [planData, isGenerating]);

  // Initial check
  useEffect(() => {
    checkForExistingDraft();
  }, [checkForExistingDraft]);

  // Expand form if no plan
  useEffect(() => {
    if (!hasDraft && !planData) {
      setIsFormExpanded(true);
    }
  }, [hasDraft, planData]);

  const handleGenerate = useCallback(async () => {
    if (!goalsText.trim() || !focusAreas.trim()) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    clearError();

    try {
      const validCommitments = fixedCommitments.filter(
        (c) => c.dayOfWeek && c.startTime && c.endTime && c.description,
      );

      const input: GenerateInput = {
        goalsText,
        taskComplexity,
        focusAreas,
        weekendPreference,
        fixedCommitmentsJson: {
          commitments: validCommitments,
        },
      };

      await generate(input);
    } catch (err) {
      console.error("Plan generation error:", err);
      Alert.alert("Error", "Failed to generate plan. Please try again.");
    }
  }, [
    goalsText,
    taskComplexity,
    focusAreas,
    weekendPreference,
    fixedCommitments,
    generate,
    clearError,
  ]);

  const handleRefresh = useCallback(async () => {
    if (!hasDraft && !planData) return;

    setRefreshing(true);

    if (goalsText && focusAreas) {
      await handleGenerate();
    } else {
      checkForExistingDraft();
    }
    setRefreshing(false);
  }, [hasDraft, planData, handleGenerate, goalsText, focusAreas, checkForExistingDraft]);

  const handleSave = useCallback(async () => {
    const planId = await save();
    if (planId) {
      Alert.alert("Success", "Plan saved to your dashboard!");
    }
  }, [save]);

  const handleDiscard = useCallback(async () => {
    Alert.alert(
      "Discard Plan?",
      "Are you sure you want to discard this plan? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            await discard();
            setIsFormExpanded(true);
          },
        },
      ],
    );
  }, [discard]);

  const handleToggleTask = useCallback((taskId: string, isCompleted: boolean) => {
    console.log("Toggle task", taskId, isCompleted);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsFormExpanded((prev) => !prev);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: WeekSectionData }) => (
      <WeekSection
        section={item}
        onToggleExpand={toggleWeek}
        onToggleTaskComplete={handleToggleTask}
      />
    ),
    [toggleWeek, handleToggleTask],
  );

  // Memoize the header to prevent re-renders that cause input to lose focus
  const headerComponent = useMemo(
    () => (
      <View>
        <PlanFormCollapsible
          isExpanded={isFormExpanded}
          onToggleExpand={handleToggleExpand}
          hasPlan={!!planData}
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
        {hasDraft && !isGenerating && (
          <View className="px-4 mb-2 flex-row items-center justify-between">
            <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
              Draft Plan
            </Text>
          </View>
        )}
      </View>
    ),
    [
      isFormExpanded,
      handleToggleExpand,
      planData,
      goalsText,
      taskComplexity,
      focusAreas,
      weekendPreference,
      fixedCommitments,
      isGenerating,
      hookError,
      setGoalsText,
      setTaskComplexity,
      setFocusAreas,
      setWeekendPreference,
      handleGenerate,
      addCommitment,
      removeCommitment,
      updateCommitment,
      hasDraft,
    ],
  );

  const emptyComponent = useMemo(() => {
    if (isGenerating) {
      return (
        <View className="p-8 items-center justify-center">
          <Text className="text-muted-foreground">Creating your plan...</Text>
        </View>
      );
    }
    if (!planData) {
      return null;
    }
    return (
      <View className="p-8 items-center justify-center">
        <Text className="text-muted-foreground">No plan data available</Text>
      </View>
    );
  }, [isGenerating, planData]);

  const footerComponent = useMemo(() => <View className="h-24" />, []);

  return (
    <View className="flex-1 bg-background">
      <FlashList
        data={sectionedData}
        renderItem={renderItem}
        keyExtractor={(item) => `week-${item.weekNumber}`}
        ListHeaderComponent={headerComponent}
        ListFooterComponent={footerComponent}
        ListEmptyComponent={emptyComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={primary} />
        }
      />

      <FloatingActionBar
        isVisible={!!planData && !isFormExpanded}
        onSave={handleSave}
        onDiscard={handleDiscard}
        isSaving={isSaving}
      />
    </View>
  );
}
