import { View, Text, Pressable, TouchableOpacity } from "react-native";
import { Card } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { AiMagicIcon, CheckmarkIcon, Cancel01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { useCoaching } from "@/hooks/useCoaching";
import Animated, { FadeInDown } from "react-native-reanimated";

interface CoachingBannerProps {
  onViewAll?: () => void;
}

export function CoachingBanner({ onViewAll }: CoachingBannerProps) {
  const { insights, isLoading, generateInsights } = useCoaching();

  const insightList = insights || [];
  const topInsight = insightList[0];

  if (isLoading && insightList.length === 0) {
    return (
      <View className="px-6 mb-8">
        <View className="h-32 w-full bg-surface rounded-[28px] animate-pulse" />
      </View>
    );
  }

  if (insightList.length === 0) {
    return (
      <Animated.View entering={FadeInDown.delay(800).duration(600)} className="px-6 mb-8">
        <Card className="p-6 border-none bg-accent/5 rounded-[28px] border-dashed border border-accent/20 items-center">
          <View className="w-12 h-12 rounded-2xl bg-accent/10 items-center justify-center mb-4">
            <HugeiconsIcon icon={AiMagicIcon} size={24} color="var(--accent)" />
          </View>
          <Text className="text-lg font-sans-bold text-foreground mb-2 text-center">
            Unlock AI Insights
          </Text>
          <Text className="text-sm font-sans text-muted-foreground text-center mb-6 px-4">
            Get personalized coaching patterns based on your recent activity and goals.
          </Text>
          <TouchableOpacity
            className="w-full py-4 rounded-2xl bg-accent items-center justify-center"
            onPress={generateInsights}
          >
            <Text className="text-white font-sans-bold">Analyze Patterns</Text>
          </TouchableOpacity>
        </Card>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(800).duration(600)} className="px-6 mb-8">
      <Card className="p-6 border-none bg-amber-500/10 rounded-[28px] border border-amber-500/20">
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center gap-x-2">
            <View className="w-8 h-8 rounded-lg bg-amber-500/20 items-center justify-center">
              <HugeiconsIcon icon={SparklesIcon} size={16} color="#f59e0b" />
            </View>
            <Text className="text-sm font-sans-bold text-amber-600 uppercase tracking-tight">
              AI Coach
            </Text>
          </View>
          {onViewAll && (
            <TouchableOpacity
              onPress={onViewAll}
              className="bg-amber-500/10 px-3 py-1 rounded-full"
            >
              <Text className="text-[10px] font-sans-bold text-amber-600 uppercase">
                View History
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text className="text-xl font-sans-bold text-foreground mb-2 leading-7">
          {topInsight.title}
        </Text>
        <Text className="text-base font-sans text-muted-foreground mb-6 leading-6">
          {topInsight.description}
        </Text>

        <View className="flex-row gap-x-3">
          <TouchableOpacity
            className="flex-1 py-4 px-4 rounded-2xl bg-amber-500 items-center justify-center flex-row gap-x-2 shadow-lg shadow-amber-500/20"
            onPress={() => {}}
          >
            <HugeiconsIcon icon={CheckmarkIcon} size={18} color="white" />
            <Text className="text-white font-sans-bold">Apply Strategy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-14 h-14 rounded-2xl bg-surface border border-amber-500/20 items-center justify-center"
            onPress={() => {}}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} color="#f59e0b" />
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );
}
