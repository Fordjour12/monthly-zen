import React from "react";
import { View, ScrollView } from "react-native";
import { Skeleton } from "heroui-native";
import { Container } from "../ui/container";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

interface LoadingStateProps {
  cardCount?: number;
}

export const TaskLoadingState: React.FC<LoadingStateProps> = ({ cardCount = 4 }) => {
  return (
    <Container withScroll={false} className="bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6 pb-32"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(600)} className="mb-8 mt-4">
          <Skeleton className="h-4 w-24 rounded-full mb-3 opacity-40" />
          <Skeleton className="h-9 w-48 rounded-2xl" />
        </Animated.View>

        <View className="gap-y-4">
          {Array.from({ length: cardCount }).map((_, i) => (
            <Animated.View
              key={i}
              entering={FadeIn.delay(i * 100).duration(600)}
              layout={LinearTransition}
              className="p-5 rounded-[24px] bg-surface border border-border/50"
            >
              <View className="flex-row items-center gap-x-4">
                <Skeleton className="w-12 h-12 rounded-[16px] opacity-50" />
                <View className="flex-1 gap-y-2">
                  <View className="flex-row items-center justify-between">
                    <Skeleton className="h-5 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-10 rounded-full opacity-30" />
                  </View>
                  <Skeleton className="h-3 w-1/2 rounded-full opacity-30" />
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        <View className="mt-12">
          <Skeleton className="h-4 w-32 rounded-full mb-4 opacity-40" />
          <View className="flex-row gap-x-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 flex-1 rounded-[24px] opacity-30" />
            ))}
          </View>
        </View>
      </ScrollView>
    </Container>
  );
};
