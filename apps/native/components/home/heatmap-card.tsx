import { View, Text, TouchableOpacity } from "react-native";
import { Card } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { FireIcon, Analytics01Icon } from "@hugeicons/core-free-icons";
import { HeatmapHorizontalLabels, type DayData } from "@/components/ui/heatmap-horizontal-labels";
import Animated, { FadeInDown } from "react-native-reanimated";

interface HeatmapCardProps {
  onViewFull?: () => void;
}

function generateMockHeatmapData(days: number = 28): DayData[] {
  const data: DayData[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      data.push({ date, completed: 0, total: 0 });
      continue;
    }

    const random = Math.random();
    let completed: number;
    let total: number;

    if (random > 0.7) {
      completed = Math.floor(Math.random() * 3) + 2;
      total = completed;
    } else if (random > 0.4) {
      completed = Math.floor(Math.random() * 2) + 1;
      total = Math.max(completed + Math.floor(Math.random() * 2), 1);
    } else {
      completed = Math.floor(Math.random() * 2);
      total = Math.max(completed + Math.floor(Math.random() * 3), 1);
    }

    data.push({ date, completed, total });
  }

  return data;
}

export function HeatmapCard({ onViewFull }: HeatmapCardProps) {
  const data = generateMockHeatmapData(28);

  const completedTasks = data.reduce((sum, day) => sum + day.completed, 0);
  const totalTasks = data.reduce((sum, day) => sum + day.total, 0);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeDays = data.filter((day) => day.total > 0).length;

  return (
    <Animated.View entering={FadeInDown.delay(700).duration(600)} className="px-6 mb-8">
      <View className="flex-row items-center justify-between mb-4 px-1">
        <View className="flex-row items-center gap-x-2">
          <Text className="text-sm font-sans-bold text-foreground uppercase tracking-widest">
            Activity
          </Text>
        </View>
        <TouchableOpacity onPress={onViewFull} className="flex-row items-center gap-x-1">
          <HugeiconsIcon icon={Analytics01Icon} size={14} color="var(--accent)" />
          <Text className="text-xs font-sans-semibold text-accent">Insights</Text>
        </TouchableOpacity>
      </View>

      <Card className="p-6 border-none bg-surface/50 rounded-[28px]">
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-row items-center gap-x-3">
            <View className="w-10 h-10 rounded-full bg-orange-500/10 items-center justify-center">
              <HugeiconsIcon icon={FireIcon} size={20} color="#f97316" />
            </View>
            <View>
              <Text className="text-lg font-sans-bold text-foreground">Monthly Flow</Text>
              <Text className="text-xs font-sans text-muted-foreground">
                You're on a 5-day streak!
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-x-1">
            <View className="w-2 h-2 rounded-full bg-success/20" />
            <Text className="text-[10px] font-sans-bold text-success uppercase tracking-widest">
              High Focus
            </Text>
          </View>
        </View>

        <View className="mb-8 items-center">
          <HeatmapHorizontalLabels data={data} weeksToShow={4} showLabels={true} title="" />
        </View>

        <View className="flex-row justify-between pt-6 border-t border-border/30">
          <MetricItem value={`${completionRate}%`} label="Rate" />
          <MetricItem value={completedTasks.toString()} label="Done" />
          <MetricItem value={activeDays.toString()} label="Days" />
        </View>
      </Card>
    </Animated.View>
  );
}

function MetricItem({ value, label }: { value: string; label: string }) {
  return (
    <View className="items-center">
      <Text className="text-xl font-sans-bold text-foreground">{value}</Text>
      <Text className="text-[10px] font-sans-semibold text-muted-foreground uppercase tracking-widest">
        {label}
      </Text>
    </View>
  );
}
