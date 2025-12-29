import type React from "react";
import { useState } from "react";
import { Platform, Pressable, View, Text } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

type PickerMode = "date" | "time";

type DateTimePickerProps = {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  mode?: PickerMode;
  placeholder?: string;
};

export const AppDateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  mode = "date",
  placeholder = mode === "date" ? "Select date" : "Select time",
}) => {
  const [show, setShow] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }

    if (event.type === "set" && selectedDate) {
      onChange(selectedDate);
    } else if (event.type === "dismissed") {
      setShow(false);
    }
  };

  const formatValue = (date: Date | null): string => {
    if (!date) return placeholder;
    if (mode === "time") {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <View className="gap-3">
      {label && <Text className="text-sm font-medium text-muted-foreground">{label}</Text>}

      <Pressable
        className={`flex-row items-center justify-between px-4 py-3.5 rounded-xl bg-field-background border border-field-border ${value ? "border-accent" : ""}`}
        onPress={() => setShow(true)}
      >
        <Text
          className={`text-base flex-1 ${value ? "text-field-foreground" : "text-field-placeholder"}`}
        >
          {formatValue(value)}
        </Text>
        <Ionicons
          name={mode === "date" ? "calendar-outline" : "time-outline"}
          size={22}
          color={value ? "var(--field-foreground)" : "var(--field-placeholder)"}
        />
      </Pressable>

      {show && (
        <>
          {Platform.OS === "ios" ? (
            <View className="bg-surface rounded-xl border border-border p-4 gap-4">
              <DateTimePicker
                display="spinner"
                mode={mode}
                onChange={handleChange}
                testID="dateTimePicker"
                value={value || new Date()}
                is24Hour={mode === "time"}
                className="w-full"
              />
              <Pressable
                className="bg-accent py-3.5 px-6 rounded-xl items-center"
                onPress={() => setShow(false)}
              >
                <Text className="text-center font-semibold text-base text-accent-foreground">
                  Done
                </Text>
              </Pressable>
            </View>
          ) : (
            <DateTimePicker
              display="default"
              mode={mode}
              onChange={handleChange}
              testID="dateTimePicker"
              value={value || new Date()}
              is24Hour={mode === "time"}
            />
          )}
        </>
      )}
    </View>
  );
};

export const DatePicker = AppDateTimePicker;
