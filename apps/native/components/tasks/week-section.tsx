import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Flag01Icon,
  Calendar03Icon,
  CircleIcon,
} from "@hugeicons/core-free-icons";
import { DayTasks } from "../calendar/day-tasks";
import { WeekSectionData } from "@/hooks/usePlanData";
import { Card } from "heroui-native";
import Animated, { FadeInUp, FadeInDown, Layout, LinearTransition } from "react-native-reanimated";

interface WeekSectionProps {
  section: WeekSectionData;
  onToggleExpand: (weekNumber: number) => void;
  onToggleTaskComplete: (id: string, isCompleted: boolean) => void;
  index: number;
}

export const WeekSection = memo(
  ({ section, onToggleExpand, onToggleTaskComplete, index }: WeekSectionProps) => {
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 100).duration(600)}
        layout={LinearTransition}
        className="mb-6 mx-6"
      >
        <Card className="overflow-hidden border-none bg-surface shadow-sm rounded-[32px]">
          <TouchableOpacity
            onPress={() => onToggleExpand(section.weekNumber)}
            className="p-6 flex-row items-center justify-between"
            activeOpacity={0.8}
          >
            <View className="flex-1">
              <View className="flex-row items-center gap-x-2 mb-2">
                <View className="bg-accent/10 px-2 py-0.5 rounded-lg">
                  <Text className="text-[10px] font-sans-bold text-accent uppercase tracking-widest">
                    Milestone
                  </Text>
                </View>
                <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                  Week {section.weekNumber}
                </Text>
              </View>
              <Text className="text-xl font-sans-bold text-foreground">Blueprint System</Text>
              {section.goals.length > 0 && (
                <Text className="text-sm font-sans text-muted-foreground mt-1" numberOfLines={1}>
                  {section.goals[0]}{" "}
                  {section.goals.length > 1 ? `+${section.goals.length - 1} more` : ""}
                </Text>
              )}
            </View>
            <View className="w-10 h-10 rounded-full bg-muted/5 items-center justify-center">
              <HugeiconsIcon
                icon={section.isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                size={20}
                color="var(--muted-foreground)"
              />
            </View>
          </TouchableOpacity>

          {section.isExpanded && (
            <Animated.View entering={FadeInDown.duration(400)} className="px-6 pb-6">
              {section.goals.length > 0 && (
                <View className="bg-accent/5 rounded-2xl p-4 mb-6 border border-accent/10">
                  <View className="flex-row items-center gap-x-2 mb-3">
                    <HugeiconsIcon icon={Flag01Icon} size={14} color="var(--accent)" />
                    <Text className="text-[10px] font-sans-bold text-accent uppercase tracking-widest">
                      Expansion Focus
                    </Text>
                  </View>
                  {section.goals.map((goal, idx) => (
                    <View key={idx} className="flex-row items-start mb-2 last:mb-0">
                      <View className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 mr-3" />
                      <Text className="text-sm font-sans text-muted-foreground leading-5 flex-1">
                        {goal}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View className="gap-y-4">
                <View className="flex-row items-center gap-x-2 mb-2 px-1">
                  <HugeiconsIcon icon={Calendar03Icon} size={14} color="var(--muted-foreground)" />
                  <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                    Deployment Feed
                  </Text>
                </View>
                {section.dailyTasks.map((day) => (
                  <DayTasks
                    key={day.day}
                    dayWithTasks={day}
                    onToggleTaskComplete={onToggleTaskComplete}
                  />
                ))}
              </View>
            </Animated.View>
          )}
        </Card>
      </Animated.View>
    );
  },
);

WeekSection.displayName = "WeekSection";
Broadway;
