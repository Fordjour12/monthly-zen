import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetMethods,
} from "@gorhom/bottom-sheet";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Tag01Icon,
  FlashIcon,
  Calendar03Icon,
  SparklesIcon,
  Delete02Icon,
  AiMagicIcon,
  ColorsIcon,
  Target01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { useSemanticColors } from "@/utils/theme";
import type { Habit } from "@/hooks/useHabits";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

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
  const [name, setName] = useState(habit?.name || "");
  const [description, setDescription] = useState(habit?.description || "");
  const [frequency, setFrequency] = useState<HabitFrequency>(habit?.frequency || "daily");
  const [targetDays, setTargetDays] = useState<WeekDay[]>(habit?.targetDays || weekDays);
  const [color, setColor] = useState(habit?.color || habitColors[5]);
  const [icon, setIcon] = useState(habit?.icon || habitIcons[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name || "");
      setDescription(habit.description || "");
      setFrequency(habit.frequency || "daily");
      setTargetDays(habit.targetDays || weekDays);
      setColor(habit.color || habitColors[5]);
      setIcon(habit.icon || habitIcons[0]);
    } else {
      setName("");
      setDescription("");
      setFrequency("daily");
      setTargetDays(weekDays);
      setColor(habitColors[5]);
      setIcon(habitIcons[0]);
    }
  }, [habit]);

  const isEditing = !!habit;
  const snapPoints = useMemo(() => ["85%", "95%"], []);

  const toggleDay = useCallback((day: WeekDay) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTargetDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        frequency,
        targetDays: frequency === "daily" ? weekDays : targetDays,
        color,
        icon,
      });
      sheetRef.current?.close();
    } finally {
      setIsSubmitting(false);
    }
  }, [name, description, frequency, targetDays, color, icon, onSubmit, sheetRef]);

  const handleDelete = useCallback(async () => {
    if (!habit || !onDelete) return;
    setIsSubmitting(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await onDelete(habit.id);
      sheetRef.current?.close();
    } finally {
      setIsSubmitting(false);
    }
  }, [habit, onDelete, sheetRef]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "var(--border)", width: 40 }}
      backgroundStyle={{ backgroundColor: "var(--background)", borderRadius: 40 }}
      enablePanDownToClose
    >
      <BottomSheetView className="flex-1 px-6 pb-8">
        {/* Header */}
        <View className="flex-row items-center justify-between py-6 border-b border-border/30">
          <View>
            <Text className="text-2xl font-sans-bold text-foreground">
              {isEditing ? "Modify Ritual" : "New Ritual"}
            </Text>
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mt-1">
              Ritual Configuration
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
          {/* Ritual Definition */}
          <Section icon={AiMagicIcon} title="Ritual Definition">
            <View className="bg-surface/50 border border-border/50 rounded-[24px] p-4 mb-4">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Name your ritual..."
                placeholderTextColor="var(--muted-foreground)"
                className="font-sans text-lg text-foreground mb-1"
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add a mantra or note (optional)..."
                placeholderTextColor="var(--muted-foreground)/60"
                multiline
                className="font-sans text-sm text-foreground opacity-60"
              />
            </View>
          </Section>

          {/* Recurrence Strategy */}
          <Section icon={Clock01Icon} title="Recurrence Strategy">
            <View className="flex-row gap-x-2 mb-6">
              {(["daily", "weekly", "custom"] as HabitFrequency[]).map((freq) => {
                const active = frequency === freq;
                return (
                  <TouchableOpacity
                    key={freq}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFrequency(freq);
                    }}
                    className={`flex-1 py-4 rounded-2xl border items-center ${
                      active ? "bg-foreground border-foreground" : "bg-surface border-border/50"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-sans-bold uppercase tracking-widest ${
                        active ? "text-background" : "text-muted-foreground"
                      }`}
                    >
                      {freq}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {frequency !== "daily" && (
              <Animated.View
                entering={FadeInDown}
                layout={LinearTransition}
                className="flex-row flex-wrap gap-2"
              >
                {weekDays.map((day) => {
                  const active = targetDays.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => toggleDay(day)}
                      className={`w-10 h-10 rounded-full items-center justify-center border ${
                        active ? "bg-accent border-accent" : "bg-surface border-border/30"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-sans-bold uppercase ${
                          active ? "text-white" : "text-foreground"
                        }`}
                      >
                        {day.substring(0, 1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            )}
          </Section>

          {/* Aesthetic Alignment */}
          <Section icon={ColorsIcon} title="Aesthetic Alignment">
            <View className="gap-y-6">
              <View>
                <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
                  Color Palette
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {habitColors.map((c) => {
                    const active = color === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setColor(c);
                        }}
                        className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                          active ? "border-foreground" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {active && (
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="white" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
                  Visual Anchor
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {habitIcons.map((i) => {
                    const active = icon === i;
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setIcon(i);
                        }}
                        className={`w-12 h-12 rounded-[20px] items-center justify-center border ${
                          active
                            ? "bg-foreground border-foreground shadow-lg shadow-black/10"
                            : "bg-surface border-border/30"
                        }`}
                      >
                        <Text className="text-xl">{i}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </Section>

          {/* Destructive Path */}
          {isEditing && (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isSubmitting}
              className="mt-8 flex-row items-center justify-center gap-x-3 py-4 rounded-2xl bg-danger/10 border border-danger/20"
            >
              <HugeiconsIcon icon={Delete02Icon} size={18} color="var(--danger)" />
              <Text className="text-danger font-sans-bold text-sm uppercase tracking-widest">
                Terminate Ritual
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Action Center */}
        <View className="absolute bottom-10 left-6 right-6">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={
              !name.trim() || isSubmitting || (frequency !== "daily" && targetDays.length === 0)
            }
            activeOpacity={0.8}
            className={`h-16 rounded-[24px] flex-row items-center justify-center gap-x-3 shadow-xl ${
              !name.trim() || isSubmitting ? "bg-muted opacity-50" : "bg-foreground shadow-black/20"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="var(--background)" />
            ) : (
              <>
                <Text className="text-background font-sans-bold text-lg">
                  {isEditing ? "Sync Ritual" : "Establish Ritual"}
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
    <View className="mb-10">
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
