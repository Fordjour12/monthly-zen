import type React from "react";
import { useState } from "react";
import { Platform, TouchableOpacity, View, Text } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Calendar03Icon, Clock01Icon, Tick01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp, FadeInDown, LinearTransition } from "react-native-reanimated";

type PickerMode = "date" | "time";

type DateTimePickerProps = {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  mode?: PickerMode;
  placeholder?: string;
  className?: string;
};

export const AppDateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  mode = "date",
  placeholder = mode === "date" ? "Select Date Protocol" : "Select Temporal Offset",
  className,
}) => {
  const [show, setShow] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }

    if (event.type === "set" && selectedDate) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View className={`gap-y-3 ${className}`}>
      {label && (
        <View className="flex-row items-center gap-x-2 ml-1">
          <HugeiconsIcon
            icon={mode === "date" ? Calendar03Icon : Clock01Icon}
            size={14}
            color="var(--muted-foreground)"
          />
          <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
            {label}
          </Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        className={`flex-row items-center justify-between px-6 h-16 rounded-[24px] bg-surface border ${value ? "border-accent/40 bg-accent/5" : "border-border/50"}`}
        onPress={() => {
          Haptics.selectionAsync();
          setShow(true);
        }}
      >
        <Text
          className={`text-sm font-sans-medium flex-1 ${value ? "text-foreground" : "text-muted-foreground/40"}`}
        >
          {formatValue(value)}
        </Text>
        <HugeiconsIcon
          icon={mode === "date" ? Calendar03Icon : Clock01Icon}
          size={18}
          color={value ? "var(--accent)" : "var(--muted-foreground)"}
        />
      </TouchableOpacity>

      {show && (
        <Animated.View
          entering={FadeInUp}
          layout={LinearTransition}
          className="bg-surface rounded-[32px] border border-border/50 p-6 overflow-hidden mt-2"
        >
          {Platform.OS === "ios" ? (
            <View className="gap-y-6">
              <DateTimePicker
                display="spinner"
                mode={mode}
                onChange={handleChange}
                value={value || new Date()}
                is24Hour={true}
                className="w-full"
                textColor="var(--foreground)"
              />
              <TouchableOpacity
                className="bg-foreground h-14 rounded-2xl items-center justify-center flex-row gap-x-2"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShow(false);
                }}
              >
                <Text className="text-background font-sans-bold text-xs uppercase tracking-widest">
                  Confirm Logic
                </Text>
                <HugeiconsIcon icon={Tick01Icon} size={14} color="var(--background)" />
              </TouchableOpacity>
            </View>
          ) : (
            <DateTimePicker
              display="default"
              mode={mode}
              onChange={handleChange}
              value={value || new Date()}
              is24Hour={true}
            />
          )}
        </Animated.View>
      )}
    </View>
  );
};

export const DatePicker = AppDateTimePicker;
export const TimePicker = AppDateTimePicker;
