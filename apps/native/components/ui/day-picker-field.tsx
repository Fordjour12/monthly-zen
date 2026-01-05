import { View, Text, TouchableOpacity } from "react-native";
import { Select } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Calendar03Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";

const DAYS_OF_WEEK = [
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
  { value: "Sunday", label: "Sunday" },
];

interface DayPickerFieldProps {
  value: string;
  onChange: (day: string) => void;
  className?: string;
}

export function DayPickerField({ value, onChange, className }: DayPickerFieldProps) {
  const selectedDay = DAYS_OF_WEEK.find((d) => d.value === value);

  return (
    <View className={`flex-1 ${className}`}>
      <View className="flex-row items-center gap-x-2 mb-2 ml-1">
        <HugeiconsIcon icon={Calendar03Icon} size={14} color="var(--muted-foreground)" />
        <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
          Select Interval
        </Text>
      </View>

      <Select
        value={selectedDay}
        onValueChange={(item) => {
          if (item) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(item.value);
          }
        }}
      >
        <Select.Trigger>
          <TouchableOpacity
            activeOpacity={0.7}
            className="h-14 bg-surface border border-border/50 rounded-2xl px-5 flex-row items-center justify-between"
          >
            <Text className="text-sm font-sans-medium text-foreground">
              {selectedDay?.label || "Day of week"}
            </Text>
            <Select.Value />
          </TouchableOpacity>
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay />
          <Select.Content
            presentation="bottom-sheet"
            snapPoints={["50%"]}
            style={{
              backgroundColor: "var(--background)",
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
            }}
          >
            <View className="p-6">
              <View className="items-center mb-6">
                <View className="w-10 h-1 rounded-full bg-border/50 mb-6" />
                <Text className="text-sm font-sans-bold text-foreground uppercase tracking-[3px]">
                  Temporal Anchors
                </Text>
              </View>
              {DAYS_OF_WEEK.map((day) => {
                const active = value === day.value;
                return (
                  <Select.Item key={day.value} value={day.value} label={day.label}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      className={`h-14 rounded-2xl mb-2 px-5 flex-row items-center justify-between ${active ? "bg-foreground" : "bg-surface border border-border/30"}`}
                    >
                      <Text
                        className={`text-sm font-sans-bold ${active ? "text-background" : "text-foreground"}`}
                      >
                        {day.label}
                      </Text>
                      {active && (
                        <HugeiconsIcon icon={Tick01Icon} size={16} color="var(--background)" />
                      )}
                    </TouchableOpacity>
                    <Select.ItemIndicator />
                  </Select.Item>
                );
              })}
            </View>
          </Select.Content>
        </Select.Portal>
      </Select>
    </View>
  );
}
