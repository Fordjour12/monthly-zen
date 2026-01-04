import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Tag01Icon,
  FlashIcon,
  Clock01Icon,
  SparklesIcon,
  AiMagicIcon,
  Compass01Icon,
  Calendar03Icon,
  Target01Icon,
} from "@hugeicons/core-free-icons";
import { DatePicker } from "@/components/ui/DateTimePicker";
import type { Task, CreateTaskInput, UpdateTaskInput } from "@/hooks/useTasks";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { useSemanticColors } from "@/utils/theme";

interface TaskFormSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  task?: Task | null;
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  focusAreas: string[];
  isSubmitting?: boolean;
}

const difficultyOptions = [
  { value: "simple", label: "Simple", color: "#22C55E", description: "Low energy requirement" },
  { value: "moderate", label: "Balanced", color: "#3B82F6", description: "Standard productivity" },
  { value: "advanced", label: "Ambitious", color: "#F59E0B", description: "High focus intensity" },
];

export function TaskFormSheet({
  sheetRef,
  task,
  onSubmit,
  focusAreas,
  isSubmitting = false,
}: TaskFormSheetProps) {
  const snapPoints = useMemo(() => ["85%", "95%"], []);
  const isEditing = !!task;

  const [taskDescription, setTaskDescription] = useState(task?.taskDescription || "");
  const [focusArea, setFocusArea] = useState(task?.focusArea || focusAreas[0] || "Other");
  const [difficultyLevel, setDifficultyLevel] = useState<"simple" | "moderate" | "advanced">(
    (task?.difficultyLevel as "simple" | "moderate" | "advanced") || "moderate",
  );
  const [schedulingReason, setSchedulingReason] = useState(task?.schedulingReason || "");
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date(Date.now() + 60 * 60 * 1000));

  useEffect(() => {
    if (task) {
      setTaskDescription(task.taskDescription || "");
      setFocusArea(task.focusArea || focusAreas[0] || "Other");
      setDifficultyLevel((task.difficultyLevel as any) || "moderate");
      setSchedulingReason(task.schedulingReason || "");
      if (task.startTime) setStartDate(new Date(task.startTime));
      if (task.endTime) setEndDate(new Date(task.endTime));
    } else {
      setTaskDescription("");
      setFocusArea(focusAreas[0] || "Other");
      setDifficultyLevel("moderate");
      setSchedulingReason("");
      setStartDate(new Date());
      setEndDate(new Date(Date.now() + 60 * 60 * 1000));
    }
  }, [task, focusAreas]);

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

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  const colors = useSemanticColors();

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "var(--border)", width: 40 }}
      backgroundStyle={{ backgroundColor: colors.background, borderRadius: 40 }}
      enablePanDownToClose
    >
      <BottomSheetView className="flex-1 px-6 pb-8">
        {/* Header */}
        <View className="flex-row items-center justify-between py-6 border-b border-border/30">
          <View>
            <Text className="text-2xl font-sans-bold text-foreground">
              {isEditing ? "Modify Unit" : "Deploy Task"}
            </Text>
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mt-1">
              System Configuration
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => sheetRef.current?.close()}
            className="w-10 h-10 rounded-full bg-surface border border-border/50 items-center justify-center"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} color="var(--muted-foreground)" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 24, paddingBottom: 120 }}
        >
          {/* Unit Description */}
          <Section icon={AiMagicIcon} title="Interaction Description">
            <View className="bg-surface/50 border border-border/50 rounded-[24px] p-4">
              <TextInput
                value={taskDescription}
                onChangeText={setTaskDescription}
                placeholder="What is the objective?"
                placeholderTextColor="var(--muted-foreground)"
                multiline
                numberOfLines={3}
                className="font-sans text-lg text-foreground leading-6"
                style={{ textAlignVertical: "top" }}
              />
            </View>
          </Section>

          {/* Allocation Cluster */}
          <Section icon={Target01Icon} title="Allocation Cluster">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-x-2">
                {focusAreas.map((area) => {
                  const isSelected = focusArea === area;
                  return (
                    <TouchableOpacity
                      key={area}
                      onPress={() => setFocusArea(area)}
                      className={`px-6 py-3 rounded-2xl border ${
                        isSelected
                          ? "bg-foreground border-foreground"
                          : "bg-surface border-border/50"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-sans-bold uppercase tracking-widest ${
                          isSelected ? "text-background" : "text-muted-foreground"
                        }`}
                      >
                        {area}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </Section>

          {/* Intensity Level */}
          <Section icon={FlashIcon} title="Intensity Level">
            <View className="bg-surface/30 p-2 rounded-[24px] border border-border/30 gap-y-1">
              {difficultyOptions.map((opt) => {
                const active = difficultyLevel === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setDifficultyLevel(opt.value as any)}
                    className={`p-4 rounded-[20px] flex-row items-center justify-between ${
                      active ? "bg-foreground" : "bg-transparent"
                    }`}
                  >
                    <View>
                      <Text
                        className={`font-sans-bold text-base ${active ? "text-background" : "text-foreground"}`}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        className={`font-sans text-[11px] mt-0.5 ${active ? "text-background/70" : "text-muted-foreground"}`}
                      >
                        {opt.description}
                      </Text>
                    </View>
                    {active && (
                      <HugeiconsIcon icon={SparklesIcon} size={18} color="var(--background)" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Section>

          {/* Temporal Alignment */}
          <Section icon={Calendar03Icon} title="Temporal Alignment">
            <View className="gap-y-6">
              <View>
                <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
                  Launch Time
                </Text>
                <View className="flex-row gap-x-3">
                  <View className="flex-1">
                    <DatePicker
                      value={startDate}
                      onChange={setStartDate}
                      mode="date"
                      label="Date"
                    />
                  </View>
                  <View className="flex-1">
                    <DatePicker
                      value={startDate}
                      onChange={(d) => d && setStartDate(d)}
                      mode="time"
                      label="Time"
                    />
                  </View>
                </View>
              </View>

              <View>
                <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
                  Conclusion
                </Text>
                <View className="flex-row gap-x-3">
                  <View className="flex-1">
                    <DatePicker value={endDate} onChange={setEndDate} mode="date" label="Date" />
                  </View>
                  <View className="flex-1">
                    <DatePicker
                      value={endDate}
                      onChange={(d) => d && setEndDate(d)}
                      mode="time"
                      label="Time"
                    />
                  </View>
                </View>
              </View>
            </View>
          </Section>

          {/* Logic Reasoning */}
          <Section icon={Compass01Icon} title="Logic Reasoning">
            <View className="bg-surface/30 border border-border/50 rounded-[24px] p-4">
              <TextInput
                value={schedulingReason}
                onChangeText={setSchedulingReason}
                placeholder="Why is this scheduled now?"
                placeholderTextColor="var(--muted-foreground)"
                multiline
                numberOfLines={2}
                className="font-sans text-sm text-foreground italic"
                style={{ textAlignVertical: "top" }}
              />
            </View>
          </Section>
        </ScrollView>

        {/* Global Action */}
        <View className="absolute bottom-10 left-6 right-6">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!taskDescription.trim() || isSubmitting}
            activeOpacity={0.8}
            className={`h-16 rounded-[24px] flex-row items-center justify-center gap-x-3 shadow-xl ${
              !taskDescription.trim() || isSubmitting
                ? "bg-muted opacity-50"
                : "bg-foreground shadow-black/20"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="var(--background)" />
            ) : (
              <>
                <Text className="text-background font-sans-bold text-lg">
                  {isEditing ? "Sync Changes" : "Deploy Operation"}
                </Text>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color="var(--background)" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

function Section({ icon, title, children }: any) {
  return (
    <View className="mb-8">
      <View className="flex-row items-center gap-x-2 mb-4 px-1">
        <View className="w-8 h-8 rounded-xl bg-surface items-center justify-center border border-border/50">
          <HugeiconsIcon icon={icon} size={16} color="var(--muted-foreground)" />
        </View>
        <Text className="text-base font-sans-bold text-foreground">{title}</Text>
      </View>
      {children}
    </View>
  );
}
