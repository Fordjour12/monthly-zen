import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  measure,
  runOnUI,
  useAnimatedRef,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { DayTasks } from "../calendar/day-tasks";
import { WeekSectionData } from "@/hooks/usePlanData";
import { useSemanticColors } from "@/utils/theme";
import { Card } from "heroui-native";

interface WeekSectionProps {
  section: WeekSectionData;
  onToggleExpand: (weekNumber: number) => void;
  onToggleTaskComplete: (id: string, isCompleted: boolean) => void;
}

export const WeekSection = memo(
  ({ section, onToggleExpand, onToggleTaskComplete }: WeekSectionProps) => {
    const { primary, foreground, muted } = useSemanticColors();

    return (
      <View className="mb-4 mx-4">
        <Card className="overflow-hidden">
          <TouchableOpacity
            onPress={() => onToggleExpand(section.weekNumber)}
            className="p-4 flex-row items-center justify-between bg-card"
            activeOpacity={0.7}
          >
            <View className="flex-1">
              <Text className="text-xl font-bold text-foreground">Week {section.weekNumber}</Text>
              {section.goals.length > 0 && (
                <Text className="text-sm text-muted-foreground mt-1" numberOfLines={1}>
                  Focus: {section.goals[0]}{" "}
                  {section.goals.length > 1 ? `+${section.goals.length - 1} more` : ""}
                </Text>
              )}
            </View>
            <Ionicons
              name={section.isExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={muted}
            />
          </TouchableOpacity>

          {section.isExpanded && (
            <View className="border-t border-border">
              {section.goals.length > 0 && (
                <View className="p-4 bg-muted/5 border-b border-border">
                  <Text className="text-sm font-semibold mb-2 text-foreground">Weekly Goals:</Text>
                  {section.goals.map((goal, idx) => (
                    <View key={idx} className="flex-row items-start mb-1">
                      <Ionicons
                        name="ellipse"
                        size={6}
                        color={primary}
                        style={{ marginTop: 6, marginRight: 8 }}
                      />
                      <Text className="text-sm text-muted-foreground flex-1">{goal}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View className="pb-2">
                {section.dailyTasks.map((day) => (
                  <DayTasks
                    key={day.day}
                    dayWithTasks={day}
                    onToggleTaskComplete={onToggleTaskComplete}
                  />
                ))}
              </View>
            </View>
          )}
        </Card>
      </View>
    );
  },
);

WeekSection.displayName = "WeekSection";
