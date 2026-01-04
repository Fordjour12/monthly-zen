import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/auth-store";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Notification03Icon, Search01Icon, UserCircleIcon } from "@hugeicons/core-free-icons";
import Animated, { FadeInUp } from "react-native-reanimated";

export function HomeHeader() {
  const user = useAuthStore((state) => state.user);
  const now = new Date();

  const hour = now.getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <Animated.View
      entering={FadeInUp.duration(600)}
      className="px-6 pt-10 pb-4 flex-row items-center justify-between"
    >
      <View className="flex-1">
        <View className="flex-row items-center gap-x-2 mb-1">
          <Text className="text-sm font-sans-semibold text-muted-foreground uppercase tracking-widest">
            {format(now, "EEEE, MMM do")}
          </Text>
        </View>
        <Text className="text-3xl font-sans-bold text-foreground">
          {greeting}, {firstName}
        </Text>
      </View>

      <View className="flex-row items-center gap-x-3">
        <TouchableOpacity className="w-10 h-10 rounded-full bg-surface border border-border/50 items-center justify-center">
          <HugeiconsIcon icon={Search01Icon} size={20} color="var(--foreground)" />
        </TouchableOpacity>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-surface border border-border/50 items-center justify-center">
          <HugeiconsIcon icon={Notification03Icon} size={20} color="var(--foreground)" />
        </TouchableOpacity>
        <TouchableOpacity className="ml-1">
          <View className="w-10 h-10 rounded-full bg-accent items-center justify-center">
            <HugeiconsIcon icon={UserCircleIcon} size={24} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
