import { View, Text } from "react-native";
import { Select } from "heroui-native";

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
}

export function DayPickerField({ value, onChange }: DayPickerFieldProps) {
  const selectedDay = DAYS_OF_WEEK.find((d) => d.value === value);

  return (
    <View className="flex-1">
      <Text className="text-sm text-muted-foreground mb-1 ml-1">Day</Text>
      <Select value={selectedDay} onValueChange={(item) => item && onChange(item.value)}>
        <Select.Trigger>
          <View className="border border-border rounded-lg px-3 py-3 bg-card">
            <Select.Value placeholder="Select" />
          </View>
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay />
          <Select.Content presentation="bottom-sheet" snapPoints={["40%"]}>
            <View className="p-4">
              <Text className="text-lg font-bold text-foreground mb-4 text-center">Select Day</Text>
              {DAYS_OF_WEEK.map((day) => (
                <Select.Item key={day.value} value={day.value} label={day.label}>
                  <Text className="text-foreground">{day.label}</Text>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </View>
          </Select.Content>
        </Select.Portal>
      </Select>
    </View>
  );
}
