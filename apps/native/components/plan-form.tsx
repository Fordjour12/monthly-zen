import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, RadioGroup, TextField, Button, Divider } from "heroui-native";
import { useSemanticColors } from "@/utils/theme";

export interface FixedCommitment {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  description: string;
}

export interface PlanFormProps {
  goalsText: string;
  taskComplexity: "Simple" | "Balanced" | "Ambitious";
  focusAreas: string;
  weekendPreference: "Work" | "Rest" | "Mixed";
  fixedCommitments: FixedCommitment[];
  isGenerating: boolean;
  hookError?: string | null;
  onGoalsChange: (text: string) => void;
  onTaskComplexityChange: (value: "Simple" | "Balanced" | "Ambitious") => void;
  onFocusAreasChange: (text: string) => void;
  onWeekendPreferenceChange: (value: "Work" | "Rest" | "Mixed") => void;
  onGenerate: () => void;
  onAddCommitment: () => void;
  onRemoveCommitment: (index: number) => void;
  onUpdateCommitment: (index: number, field: keyof FixedCommitment, value: string) => void;
}

const taskComplexityOptions = [
  { value: "Simple" as const, label: "Simple", description: "Fewer, manageable tasks" },
  { value: "Balanced" as const, label: "Balanced", description: "Mix of easy and challenging" },
  { value: "Ambitious" as const, label: "Ambitious", description: "Challenging but rewarding" },
];

const weekendPreferenceOptions = [
  { value: "Work" as const, label: "Deep Work", description: "Focus on intensive tasks" },
  { value: "Rest" as const, label: "Rest & Recharge", description: "Keep weekends free" },
  { value: "Mixed" as const, label: "Light Tasks", description: "Easy activities only" },
];

export function PlanForm({
  goalsText,
  taskComplexity,
  focusAreas,
  weekendPreference,
  fixedCommitments,
  isGenerating,
  hookError,
  onGoalsChange,
  onTaskComplexityChange,
  onFocusAreasChange,
  onWeekendPreferenceChange,
  onGenerate,
  onAddCommitment,
  onRemoveCommitment,
  onUpdateCommitment,
}: PlanFormProps) {
  const { primary, muted, foreground } = useSemanticColors();

  const handleGenerate = useCallback(() => {
    if (!goalsText.trim() || !focusAreas.trim()) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }
    onGenerate();
  }, [goalsText, focusAreas, onGenerate]);

  return (
    <Card className="p-6">
      <Text className="text-2xl font-bold text-foreground mb-8">Plan Configuration</Text>

      <View className="space-y-10">
        {/* Your Goals & Objectives */}
        <View className="space-y-4">
          <View className="flex items-center gap-2 flex-row">
            <Ionicons name="flag" size={20} color={primary} />
            <Text className="text-lg font-semibold text-foreground">Your Goals & Objectives</Text>
          </View>
          <Text className="text-sm text-muted-foreground">
            Describe what you want to achieve this month. Be specific about your goals, deadlines,
            and desired outcomes.
          </Text>
          <TextField isRequired>
            <TextField.Label>Your Goals</TextField.Label>
            <TextField.Input
              value={goalsText}
              onChangeText={onGoalsChange}
              placeholder="e.g., I want to launch my e-commerce website, learn React, and exercise 3 times per week..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TextField.Description className="text-sm text-muted-foreground">
              The more detailed your goals, the better AI can tailor your plan.
            </TextField.Description>
          </TextField>
        </View>

        <Divider className="my-4" />

        {/* Task Complexity */}
        <View className="space-y-4">
          <View className="flex items-center gap-2 flex-row">
            <Ionicons name="flash" size={20} color={primary} />
            <Text className="text-lg font-semibold text-foreground">Task Complexity</Text>
          </View>
          <Text className="text-sm text-muted-foreground">
            Choose how ambitious you want your monthly plan to be.
          </Text>
          <RadioGroup
            value={taskComplexity}
            onValueChange={(val) => onTaskComplexityChange(val as typeof taskComplexity)}
            className="mt-2"
          >
            {taskComplexityOptions.map((option, index) => (
              <View
                key={option.value}
                className={index < taskComplexityOptions.length - 1 ? "my-1" : ""}
              >
                <RadioGroup.Item value={option.value}>
                  <View>
                    <RadioGroup.Label>{option.label}</RadioGroup.Label>
                    <RadioGroup.Description className="text-sm text-muted-foreground">
                      {option.description}
                    </RadioGroup.Description>
                  </View>
                  <RadioGroup.Indicator />
                </RadioGroup.Item>
              </View>
            ))}
          </RadioGroup>
        </View>

        <Divider className="my-4" />

        {/* Focus Areas */}
        <View>
          <View className="flex items-center gap-2 flex-row mb-3">
            <Ionicons name="flag" size={20} color={primary} />
            <Text className="text-lg font-semibold text-foreground">Focus Areas</Text>
          </View>
          <Text className="text-sm text-muted-foreground mb-3">
            What areas do you want to focus on this month?
          </Text>
          <TextField isRequired>
            <TextField.Label>Focus Areas</TextField.Label>
            <TextField.Input
              value={focusAreas}
              onChangeText={onFocusAreasChange}
              placeholder="e.g., Health, Career, Learning, Personal Growth"
            >
              <TextField.InputStartContent>
                <Ionicons name="flag" size={16} color={muted} />
              </TextField.InputStartContent>
            </TextField.Input>
            <TextField.Description className="text-sm text-muted-foreground">
              Separate multiple areas with commas.
            </TextField.Description>
          </TextField>
        </View>

        <Divider className="my-4" />

        {/* Weekend Preference */}
        <View>
          <View className="flex items-center gap-2 flex-row mb-3">
            <Ionicons name="calendar" size={20} color={primary} />
            <Text className="text-lg font-semibold text-foreground">Weekend Preference</Text>
          </View>
          <Text className="text-sm text-muted-foreground mb-3">
            How would you like to handle weekends in your plan?
          </Text>
          <RadioGroup
            value={weekendPreference}
            onValueChange={(val) => onWeekendPreferenceChange(val as typeof weekendPreference)}
            className="mt-2"
          >
            {weekendPreferenceOptions.map((option, index) => (
              <View
                key={option.value}
                className={index < weekendPreferenceOptions.length - 1 ? "mb-1" : ""}
              >
                <RadioGroup.Item value={option.value}>
                  <View>
                    <RadioGroup.Label>{option.label}</RadioGroup.Label>
                    <RadioGroup.Description className="text-sm text-muted-foreground">
                      {option.description}
                    </RadioGroup.Description>
                  </View>
                  <RadioGroup.Indicator />
                </RadioGroup.Item>
              </View>
            ))}
          </RadioGroup>
        </View>

        <Divider className="my-4" />

        {/* Fixed Commitments */}
        <View>
          <View className="flex items-center justify-between flex-row mb-3">
            <View className="flex items-center gap-2 flex-row">
              <Ionicons name="time" size={20} color={primary} />
              <Text className="text-lg font-semibold text-foreground">Fixed Commitments</Text>
            </View>
            <Button onPress={onAddCommitment} variant="ghost" size="sm">
              <Ionicons name="add" size={18} color={foreground} />
              <Button.Label>Add</Button.Label>
            </Button>
          </View>
          <Text className="text-sm text-muted-foreground mb-3">
            Add any regular commitments or blocked time slots (optional).
          </Text>

          {fixedCommitments.length === 0 ? (
            <View className="p-8 border border-dashed border-border rounded-lg items-center justify-center">
              <Ionicons name="time-outline" size={32} color={muted} style={{ marginBottom: 8 }} />
              <Text className="text-sm text-muted-foreground text-center">
                No fixed commitments added yet
              </Text>
              <Text className="text-xs text-muted-foreground text-center mt-1">
                Tap "Add" to create one
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {fixedCommitments.map((commitment, index) => (
                <View key={index} className="relative">
                  <View className="flex items-start gap-2 flex-row">
                    <View className="flex-1 space-y-3">
                      <TextField>
                        <TextField.Label>Description</TextField.Label>
                        <TextField.Input
                          value={commitment.description}
                          onChangeText={(text) => onUpdateCommitment(index, "description", text)}
                          placeholder="e.g., Team standup, Gym workout"
                        />
                      </TextField>

                      <TextField>
                        <TextField.Label>Day</TextField.Label>
                        <TextField.Input
                          value={commitment.dayOfWeek}
                          onChangeText={(text) => onUpdateCommitment(index, "dayOfWeek", text)}
                          placeholder="e.g., Monday"
                        />
                      </TextField>

                      <View className="flex gap-3 flex-row">
                        <View className="flex-1">
                          <TextField>
                            <TextField.Label>Start Time</TextField.Label>
                            <TextField.Input
                              value={commitment.startTime}
                              onChangeText={(text) => onUpdateCommitment(index, "startTime", text)}
                              placeholder="09:00"
                              keyboardType="numbers-and-punctuation"
                            />
                          </TextField>
                        </View>
                        <View className="flex-1">
                          <TextField>
                            <TextField.Label>End Time</TextField.Label>
                            <TextField.Input
                              value={commitment.endTime}
                              onChangeText={(text) => onUpdateCommitment(index, "endTime", text)}
                              placeholder="10:00"
                              keyboardType="numbers-and-punctuation"
                            />
                          </TextField>
                        </View>
                      </View>
                    </View>

                    <Button
                      onPress={() => onRemoveCommitment(index)}
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      accessibilityLabel="Remove commitment"
                      accessibilityHint={`Remove ${commitment.description || "this"} commitment`}
                    >
                      <Ionicons name="close-circle" size={20} color={muted} />
                    </Button>
                  </View>

                  {index < fixedCommitments.length - 1 && <Divider className="my-3" />}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Submit Button */}
      <View className="mt-8">
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
                <Ionicons name="sync" size={20} className="animate-spin text-primary-foreground" />
                <Text className="font-semibold text-primary-foreground">
                  Generating Your Plan...
                </Text>
              </>
            ) : (
              <Button onPress={handleGenerate} className="w-full">
                <Ionicons name="flash" size={20} color={foreground} />
                <Button.Label>Generate AI Plan</Button.Label>
              </Button>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Form-level Error Display */}
      {hookError && (
        <View className="mt-4 p-4 border border-destructive rounded-lg bg-destructive/10">
          <Text className="text-sm text-destructive font-medium">{hookError}</Text>
        </View>
      )}
    </Card>
  );
}
