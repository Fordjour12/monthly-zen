import { View, Text, TouchableOpacity } from "react-native";
import { Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { HeatmapHorizontalLabels, type DayData } from "@/components/ui/heatmap-horizontal-labels";

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
    <Card className="mx-4  pt-4">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="flame" size={20} color="#f59e0b" />
          <Text className="font-semibold text-foreground text-lg">Activity</Text>
        </View>
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <View className="size-2.5 rounded-xs bg-muted" />
            <View className="size-2.5 rounded-xs bg-red-500" />
            <View className="size-2.5 rounded-xs bg-yellow-500" />
            <View className="size-2.5 rounded-xs bg-blue-500" />
            <View className="size-2.5 rounded-xs bg-green-500" />
          </View>
          {onViewFull && (
            <TouchableOpacity onPress={onViewFull}>
              <Text className="text-sm text-primary">View Full</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="mb-4">
        <HeatmapHorizontalLabels data={data} weeksToShow={4} showLabels={true} title="" />
      </View>

      <View className="flex-row justify-between px-2">
        <View className="items-center">
          <Text className="text-2xl font-bold text-foreground">{completionRate}%</Text>
          <Text className="text-xs text-muted-foreground">Completion</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-foreground">{completedTasks}</Text>
          <Text className="text-xs text-muted-foreground">Tasks Done</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-foreground">{activeDays}</Text>
          <Text className="text-xs text-muted-foreground">Active Days</Text>
        </View>
      </View>
    </Card>
  );
}
