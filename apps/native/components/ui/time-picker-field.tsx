import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Select } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Clock01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import * as Haptics from "expo-haptics";

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  const value = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  const label = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  return { value, label };
});

interface TimePickerFieldProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
  className?: string;
}

export function TimePickerField({ label, value, onChange, className }: TimePickerFieldProps) {
  const selectedTime = TIME_OPTIONS.find((t) => t.value === value);

  return (
    <View className={`flex-1 ${className}`}>
      <View className="flex-row items-center gap-x-2 mb-2 ml-1">
        <HugeiconsIcon icon={Clock01Icon} size={14} color="var(--muted-foreground)" />
        <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
          {label}
        </Text>
      </View>

      <Select
        value={selectedTime}
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
            className="h-14 bg-field-background border border-field-border rounded-2xl px-5 flex-row items-center justify-between"
          >
            <Text className="text-sm font-sans-medium text-foreground">
              {selectedTime?.label || "--:--"}
            </Text>
            <Select.Value />
          </TouchableOpacity>
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay />
          <Select.Content
            presentation="bottom-sheet"
            snapPoints={["70%"]}
            style={{
              backgroundColor: "var(--background)",
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
            }}
          >
            <View className="flex-1 p-6">
              <View className="items-center mb-6">
                <View className="w-10 h-1 rounded-full bg-border/50 mb-6" />
                <Text className="text-sm font-sans-bold text-foreground uppercase tracking-[3px]">
                  Temporal Offset
                </Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="flex-row flex-wrap gap-2">
                  {TIME_OPTIONS.map((time) => {
                    const active = value === time.value;
                    return (
                      <Select.Item
                        key={time.value}
                        value={time.value}
                        label={time.label}
                        className="w-[31%]"
                      >
                        <TouchableOpacity
                          activeOpacity={0.7}
                          className={`h-12 rounded-xl items-center justify-center border ${active ? "bg-foreground border-foreground" : "bg-surface border-border/30"}`}
                        >
                          <Text
                            className={`text-xs font-sans-bold ${active ? "text-background" : "text-foreground"}`}
                          >
                            {time.label}
                          </Text>
                        </TouchableOpacity>
                        <Select.ItemIndicator />
                      </Select.Item>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </Select.Content>
        </Select.Portal>
      </Select>
    </View>
  );
}
