import { View, Text, TouchableOpacity } from "react-native";
import React, { useRef, useCallback, useState } from "react";
import { Select } from "heroui-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { DatePicker } from "@/components/ui/DateTimePicker";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = ["40%", "70%"];
  const [date, setDate] = useState<Date | null>(null);

  const handlePresent = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  return (
    <View className="flex-1 p-5 bg-background">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-[32px] font-bold text-foreground">Tasks</Text>
        <TouchableOpacity className="w-11 h-11 rounded-full bg-accent items-center justify-center">
          <Ionicons name="add-outline" size={24} color="var(--accent-foreground)" />
        </TouchableOpacity>
      </View>

      <Select>
        <Select.Trigger className="bg-field-background border border-field-border rounded-xl px-4 py-3.5">
          <Select.Value
            placeholder="Choose an option"
            className="text-base text-field-placeholder"
          />
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay />
          <Select.Content className="w-full">
            <Select.Item value="apple" label="Apple" />
            <Select.Item value="orange" label="Orange" />
            <Select.Item value="banana" label="Banana" />
          </Select.Content>
        </Select.Portal>
      </Select>

      <View className="mt-4">
        <DatePicker value={date} onChange={setDate} label="Due Date" />
      </View>

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-accent items-center justify-center shadow-lg"
        onPress={handlePresent}
      >
        <Ionicons name="filter-outline" size={20} color="var(--accent-foreground)" />
      </TouchableOpacity>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        handleIndicatorStyle={{ backgroundColor: "var(--border)", width: 40 }}
      >
        <BottomSheetView className="flex-1 p-6 gap-6">
          <Text className="text-2xl font-bold text-foreground">Filter Tasks</Text>
          <View className="gap-3">
            <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Status
            </Text>
            <TouchableOpacity className="bg-field-background border border-field-border rounded-xl py-4 px-5">
              <Text className="text-base text-field-foreground">All</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-accent border border-accent rounded-xl py-4 px-5">
              <Text className="text-base text-accent-foreground">Active</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-field-background border border-field-border rounded-xl py-4 px-5">
              <Text className="text-base text-field-foreground">Completed</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
