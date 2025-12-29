import { View, Text } from "react-native";
import { Select } from "heroui-native";

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
}

export function TimePickerField({ label, value, onChange }: TimePickerFieldProps) {
  const selectedTime = TIME_OPTIONS.find((t) => t.value === value);

  return (
    <View className="flex-1">
      <Text className="text-sm text-muted-foreground mb-1 ml-1">{label}</Text>
      <Select value={selectedTime} onValueChange={(item) => item && onChange(item.value)}>
        <Select.Trigger>
          <View className="border border-border rounded-lg px-3 py-3 bg-card">
            <Select.Value placeholder="--:--" />
          </View>
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay />
          <Select.Content presentation="bottom-sheet" snapPoints={["60%"]}>
            <View className="p-4">
              <Text className="text-lg font-bold text-foreground mb-4 text-center">
                Select {label}
              </Text>
              {TIME_OPTIONS.map((time) => (
                <Select.Item key={time.value} value={time.value} label={time.label}>
                  <Text className="text-foreground">{time.label}</Text>
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
