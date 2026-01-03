/**
 * Task Form Sheet Component (Native)
 *
 * Bottom sheet form for creating and editing tasks.
 */

import React, { useState, useCallback, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
import { DatePicker } from "@/components/ui/DateTimePicker";
import type { Task, CreateTaskInput, UpdateTaskInput } from "@/hooks/useTasks";

interface TaskFormSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  task?: Task | null;
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  focusAreas: string[];
  isSubmitting?: boolean;
}

const difficultyOptions = [
  { value: "simple", label: "Simple", color: "#22C55E" },
  { value: "moderate", label: "Moderate", color: "#EAB308" },
  { value: "advanced", label: "Advanced", color: "#EF4444" },
];

const defaultFocusAreas = [
  "Health",
  "Work",
  "Learning",
  "Relationships",
  "Productivity",
  "Creativity",
  "Finance",
  "Other",
];

export function TaskFormSheet({
  sheetRef,
  task,
  onSubmit,
  focusAreas,
  isSubmitting = false,
}: TaskFormSheetProps) {
  const { muted, foreground, primary, border, background, surface } = useSemanticColors();
  const snapPoints = useMemo(() => ["85%", "95%"], []);

  const isEditing = !!task;

  const [taskDescription, setTaskDescription] = useState(task?.taskDescription || "");
  const [focusArea, setFocusArea] = useState(task?.focusArea || focusAreas[0] || "Other");
  const [difficultyLevel, setDifficultyLevel] = useState<"simple" | "moderate" | "advanced">(
    (task?.difficultyLevel as "simple" | "moderate" | "advanced") || "moderate",
  );
  const [schedulingReason, setSchedulingReason] = useState(task?.schedulingReason || "");
  const [startDate, setStartDate] = useState<Date | null>(
    task?.startTime ? new Date(task.startTime) : new Date(),
  );
  const [endDate, setEndDate] = useState<Date | null>(
    task?.endTime ? new Date(task.endTime) : new Date(Date.now() + 60 * 60 * 1000),
  );

  const handleSubmit = useCallback(async () => {
    if (!taskDescription.trim() || !startDate || !endDate) return;

    const data = isEditing
      ? {
          taskId: task.id,
          taskDescription: taskDescription.trim(),
          focusArea,
          difficultyLevel,
          schedulingReason: schedulingReason.trim(),
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        }
      : {
          taskDescription: taskDescription.trim(),
          focusArea,
          difficultyLevel,
          schedulingReason: schedulingReason.trim(),
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        };

    await onSubmit(data as CreateTaskInput | UpdateTaskInput);
  }, [
    isEditing,
    task,
    taskDescription,
    focusArea,
    difficultyLevel,
    schedulingReason,
    startDate,
    endDate,
    onSubmit,
  ]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      // Sheet is closed, could reset form here if needed
    }
  }, []);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      handleIndicatorStyle={{ backgroundColor: border, width: 40 }}
      backgroundStyle={{ backgroundColor: surface }}
      enablePanDownToClose
    >
      <BottomSheetView className="flex-1 px-6 pb-8">
        {/* Header */}
        <View className="flex-row items-center justify-between py-4 border-b border-border">
          <Text className="text-xl font-bold text-foreground">
            {isEditing ? "Edit Task" : "New Task"}
          </Text>
          <TouchableOpacity
            onPress={() => sheetRef.current?.close()}
            className="p-2 rounded-full bg-muted/30"
          >
            <Ionicons name="close" size={20} color={muted} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 py-4" showsVerticalScrollIndicator={false}>
          {/* Task Description */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-muted-foreground mb-2">
              Task Description
            </Text>
            <TextInput
              value={taskDescription}
              onChangeText={setTaskDescription}
              placeholder="What do you want to accomplish?"
              placeholderTextColor={muted}
              multiline
              numberOfLines={3}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          {/* Focus Area */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-muted-foreground mb-2">Focus Area</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-2">
                {(focusAreas.length > 0 ? focusAreas : defaultFocusAreas).map((area) => {
                  const isSelected = focusArea === area;
                  return (
                    <TouchableOpacity
                      key={area}
                      onPress={() => setFocusArea(area)}
                      className={`px-4 py-2 rounded-full border ${
                        isSelected ? "bg-accent border-accent" : "bg-surface border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          isSelected ? "text-accent-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {area}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Difficulty */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-muted-foreground mb-2">Difficulty</Text>
            <View className="flex-row gap-2">
              {difficultyOptions.map((option) => {
                const isSelected = difficultyLevel === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() =>
                      setDifficultyLevel(option.value as "simple" | "moderate" | "advanced")
                    }
                    className={`flex-1 py-3 rounded-xl border items-center ${
                      isSelected ? "bg-surface border-border" : "bg-surface border-border"
                    }`}
                    style={{ borderColor: isSelected ? option.color : border }}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "font-bold" : "text-muted-foreground"
                      }`}
                      style={{ color: isSelected ? option.color : muted }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date/Time */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-muted-foreground mb-2">Start Time</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <DatePicker value={startDate} onChange={setStartDate} label="Date" mode="date" />
              </View>
              <View className="flex-1">
                <DatePicker
                  value={startDate}
                  onChange={(date) => date && setStartDate(date)}
                  label="Time"
                  mode="time"
                />
              </View>
            </View>
          </View>

          {/* End Time */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-muted-foreground mb-2">End Time</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <DatePicker value={endDate} onChange={setEndDate} label="Date" mode="date" />
              </View>
              <View className="flex-1">
                <DatePicker
                  value={endDate}
                  onChange={(date) => date && setEndDate(date)}
                  label="Time"
                  mode="time"
                />
              </View>
            </View>
          </View>

          {/* Scheduling Reason */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-muted-foreground mb-2">
              Scheduling Reason (Optional)
            </Text>
            <TextInput
              value={schedulingReason}
              onChangeText={setSchedulingReason}
              placeholder="Why this time works for you..."
              placeholderTextColor={muted}
              multiline
              numberOfLines={2}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              style={{ textAlignVertical: "top" }}
            />
          </View>
        </ScrollView>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!taskDescription.trim() || !startDate || !endDate || isSubmitting}
          className={`py-4 rounded-xl items-center ${
            !taskDescription.trim() || !startDate || !endDate ? "bg-muted/30" : "bg-accent"
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              !taskDescription.trim() || !startDate || !endDate
                ? "text-muted-foreground"
                : "text-accent-foreground"
            }`}
          >
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Task"}
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}
