import React from "react";
import { View, ScrollView } from "react-native";
import { Skeleton } from "heroui-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

export function PlansSkeleton() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 pb-32"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(600)} className="mb-10 mt-6">
        <Skeleton className="h-4 w-32 rounded-full mb-3 opacity-40" />
        <Skeleton className="h-10 w-64 rounded-2xl" />
      </Animated.View>

      <View className="gap-y-6">
        {[1, 2, 3].map((i) => (
          <Animated.View
            key={i}
            entering={FadeIn.delay(i * 100).duration(600)}
            layout={LinearTransition}
            className="p-6 rounded-[32px] bg-surface border border-border/50"
          >
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center gap-x-4 flex-1">
                <Skeleton className="w-14 h-14 rounded-[20px] opacity-60" />
                <View className="flex-1 gap-y-2">
                  <Skeleton className="h-6 w-40 rounded-xl" />
                  <Skeleton className="h-3 w-24 rounded-full opacity-40" />
                </View>
              </View>
              <Skeleton className="w-6 h-6 rounded-full opacity-30" />
            </View>

            <View className="gap-y-3">
              <Skeleton className="h-4 w-full rounded-lg opacity-40" />
              <Skeleton className="h-4 w-4/5 rounded-lg opacity-40" />
            </View>

            <View className="flex-row gap-2 mt-8">
              <Skeleton className="h-10 flex-1 rounded-2xl opacity-30" />
              <Skeleton className="h-10 flex-1 rounded-2xl opacity-30" />
            </View>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}
