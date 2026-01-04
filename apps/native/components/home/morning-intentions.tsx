import { View, Text, TouchableOpacity } from "react-native";
import { Card } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Sun01Icon, SparklesIcon, Add01Icon } from "@hugeicons/core-free-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

export function MorningIntentions() {
  const intention = {
    title: "Schedule Deep Work",
    reason: "Monday is your most productive day. Protect 2 hours for focus.",
    confidence: 85,
    patternType: "peak-energy",
  };

  return (
    <Animated.View entering={FadeInDown.delay(300).duration(600)} className="px-6 mb-8">
      <Card className="p-6 border-none bg-surface/50 rounded-[28px]">
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center gap-x-2">
            <View className="w-8 h-8 rounded-lg bg-orange-500/10 items-center justify-center">
              <HugeiconsIcon icon={Sun01Icon} size={16} color="#f97316" />
            </View>
            <Text className="text-sm font-sans-bold text-foreground tracking-tight">
              AI Insight
            </Text>
          </View>
          <View className="flex-row items-center gap-x-1 p-1 px-2 bg-success/10 rounded-full">
            <HugeiconsIcon icon={SparklesIcon} size={10} color="var(--success)" />
            <Text className="text-[10px] font-sans-bold text-success uppercase">
              {intention.confidence}% Match
            </Text>
          </View>
        </View>

        <Text className="text-xl font-sans-bold text-foreground mb-2 leading-7">
          {intention.title}
        </Text>

        <Text className="text-base font-sans text-muted-foreground mb-6 leading-6">
          {intention.reason}
        </Text>

        <TouchableOpacity
          className="py-4 px-6 rounded-2xl bg-foreground items-center justify-center flex-row gap-x-2 shadow-lg shadow-black/10"
          activeOpacity={0.8}
          onPress={() => {}}
        >
          <HugeiconsIcon icon={Add01Icon} size={18} color="var(--background)" />
          <Text className="text-background font-sans-bold text-base">Add to Tasks</Text>
        </TouchableOpacity>
      </Card>
    </Animated.View>
  );
}
