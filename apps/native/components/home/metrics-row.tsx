import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MetricCardProps {
  icon: string;
  value: string;
  label: string;
  iconColor: string;
}

function MetricCard({ icon, value, label, iconColor }: MetricCardProps) {
  return (
    <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
      <View className="flex-row items-center gap-2 mb-2">
        <Ionicons name={icon as any} size={18} color={iconColor} />
        <Text className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Text>
      </View>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
    </View>
  );
}

export function MetricsRow() {
  return (
    <View className="flex-row gap-3 px-4 mb-4">
      <MetricCard icon="checkbox" value="4/8" label="Tasks" iconColor="#22c55e" />
      <MetricCard icon="time" value="6h" label="Hours Left" iconColor="#3b82f6" />
      <MetricCard icon="calendar" value="85%" label="Month" iconColor="#a855f7" />
    </View>
  );
}
