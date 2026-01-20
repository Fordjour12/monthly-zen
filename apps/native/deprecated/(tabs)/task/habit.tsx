/**
 * Habits Page (Native)
 *
 * Main page for viewing and managing habits
 */

import { useRef, useCallback, useState } from "react";
import { View } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { HabitDashboard } from "@/components/habits/habit-dashboard";
import { HabitFormSheet } from "@/components/habits/habit-form-sheet";
import { useHabits } from "@/hooks/useHabits";
import type { Habit } from "@/hooks/useHabits";

export default function HabitPage() {
  const formSheetRef = useRef<BottomSheet>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const { createHabit, updateHabit, deleteHabit } = useHabits();

  const handlePresent = useCallback(() => {
    setEditingHabit(null);
    formSheetRef.current?.expand();
  }, []);

  const handleEdit = useCallback((habit: Habit) => {
    setEditingHabit(habit);
    formSheetRef.current?.expand();
  }, []);

  const handleSubmit = useCallback(
    async (data: {
      name: string;
      description?: string;
      frequency: "daily" | "weekly" | "custom";
      targetDays: string[];
      color: string;
      icon: string;
    }) => {
      if (editingHabit) {
        await updateHabit(editingHabit.id, data);
      } else {
        await createHabit(data);
      }
    },
    [editingHabit, createHabit, updateHabit],
  );

  const handleDelete = useCallback(
    async (habitId: number) => {
      await deleteHabit(habitId);
    },
    [deleteHabit],
  );

  return (
    <View className="flex-1 bg-background">
      <HabitDashboard onCreateHabit={handlePresent} onEditHabit={handleEdit} />

      <HabitFormSheet
        sheetRef={formSheetRef}
        habit={editingHabit}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </View>
  );
}
