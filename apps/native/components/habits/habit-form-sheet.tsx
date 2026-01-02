/**
 * Habit Form Sheet Component
 *
 * Bottom sheet for creating and editing habits
 */

import React, { useState, useCallback, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import BottomSheet, { BottomSheetView, type BottomSheetMethods } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
import type { Habit } from "@/hooks/useHabits";

// Local type definitions (avoiding cross-package imports)
type HabitFrequency = "daily" | "weekly" | "custom";
type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

interface HabitFormSheetProps {
  sheetRef: React.RefObject<BottomSheetMethods>;
  habit?: Habit | null;
  onSubmit: (data: {
    name: string;
    description?: string;
    frequency: HabitFrequency;
    targetDays: WeekDay[];
    color: string;
    icon: string;
  }) => Promise<void>;
  onDelete?: (habitId: number) => Promise<void>;
}

// Constants
const habitColors = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
] as const;

const habitIcons = ["💪", "📚", "🧘", "💧", "😴", "🥗", "✍️", "🎯", "🏃", "🧹", "💰", "🎨"] as const;

const weekDays: WeekDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function HabitFormSheet({ sheetRef, habit, onSubmit, onDelete }: HabitFormSheetProps) {
  const { muted, surface, danger } = useSemanticColors();

  const [name, setName] = useState(habit?.name || "");
  const [description, setDescription] = useState(habit?.description || "");
  const [frequency, setFrequency] = useState<HabitFrequency>(habit?.frequency || "daily");
  const [targetDays, setTargetDays] = useState<WeekDay[]>(
    habit?.targetDays || [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
  );
  const [color, setColor] = useState(habit?.color || habitColors[5]);
  const [icon, setIcon] = useState(habit?.icon || habitIcons[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!habit;

  const snapPoints = useMemo(() => ["85%", "95%"], []);

  const toggleDay = useCallback((day: WeekDay) => {
    setTargetDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        frequency,
        targetDays: frequency === "daily" ? weekDays : targetDays,
        color,
        icon,
      });
      // Reset form
      setName("");
      setDescription("");
      setFrequency("daily");
      setTargetDays(weekDays);
      setColor(habitColors[5]);
      setIcon(habitIcons[0]);
      sheetRef.current?.close();
    } finally {
      setIsSubmitting(false);
    }
  }, [name, description, frequency, targetDays, color, icon, onSubmit, sheetRef]);

  const handleDelete = useCallback(async () => {
    if (!habit || !onDelete) return;

    setIsSubmitting(true);
    try {
      await onDelete(habit.id);
      sheetRef.current?.close();
    } finally {
      setIsSubmitting(false);
    }
  }, [habit, onDelete, sheetRef]);

  const dayLabels: Record<WeekDay, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      handleIndicatorStyle={{ backgroundColor: muted, width: 40 }}
      backgroundStyle={{ backgroundColor: surface }}
    >
      <BottomSheetView className="flex-1 p-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">
            {isEditing ? "Edit Habit" : "New Habit"}
          </Text>
          <TouchableOpacity onPress={() => sheetRef.current?.close()}>
            <Ionicons name="close" size={24} color={muted} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Name Input */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
              Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Morning meditation"
              placeholderTextColor={muted}
              className="w-full p-4 rounded-xl bg-surface border border-border text-foreground text-base"
            />
          </View>

          {/* Description Input */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
              Description (optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add a note about this habit"
              placeholderTextColor={muted}
              multiline
              numberOfLines={2}
              className="w-full p-4 rounded-xl bg-surface border border-border text-foreground text-base"
            />
          </View>

          {/* Frequency Selection */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
              Frequency
            </Text>
            <View className="flex-row gap-2">
              {(["daily", "weekly", "custom"] as HabitFrequency[]).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => setFrequency(freq)}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    frequency === freq ? "bg-primary border-primary" : "bg-surface border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium capitalize ${
                      frequency === freq ? "text-white" : "text-foreground"
                    }`}
                  >
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target Days (for weekly/custom) */}
          {frequency !== "daily" && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                Target Days
              </Text>
              <View className="flex-row gap-2 flex-wrap">
                {weekDays.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                    className={`w-12 h-12 rounded-full items-center justify-center border ${
                      targetDays.includes(day)
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        targetDays.includes(day) ? "text-white" : "text-foreground"
                      }`}
                    >
                      {dayLabels[day]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Color Selection */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
              Color
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              {habitColors.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                    color === c ? "border-foreground" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Ionicons name="checkmark" size={18} color="white" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Icon Selection */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
              Icon
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              {habitIcons.map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setIcon(i)}
                  className={`w-12 h-12 rounded-xl items-center justify-center border ${
                    icon === i ? "bg-primary border-primary" : "bg-surface border-border"
                  }`}
                >
                  <Text className="text-xl">{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Delete Button (edit mode only) */}
          {isEditing && onDelete && (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isSubmitting}
              className="flex-row items-center justify-center gap-2 py-4 rounded-xl bg-danger/10 border border-danger mt-4"
            >
              <Ionicons name="trash" size={18} color={danger} />
              <Text className="text-sm font-semibold text-danger">Delete Habit</Text>
            </TouchableOpacity>
          )}

          {/* Spacer */}
          <View className="h-8" />
        </ScrollView>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={
            !name.trim() || isSubmitting || (frequency !== "daily" && targetDays.length === 0)
          }
          className={`py-4 rounded-xl items-center ${
            !name.trim() || isSubmitting || (frequency !== "daily" && targetDays.length === 0)
              ? "bg-muted"
              : "bg-primary"
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              !name.trim() || isSubmitting ? "text-muted" : "text-white"
            }`}
          >
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Habit"}
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}
