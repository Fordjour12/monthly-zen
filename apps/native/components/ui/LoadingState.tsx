import { ScrollView, View } from "react-native";
import React from "react";
import { RefreshControl } from "react-native";
import { Container } from "./container";
import { Skeleton, Card } from "heroui-native";

interface LoadingStateProps {
  refreshing?: boolean;
  onRefresh?: () => void;
  cardCount?: number;
}

export const TaskLoadingState: React.FC<LoadingStateProps> = ({
  refreshing = false,
  onRefresh,
  cardCount = 3,
}) => {
  return (
    <Container>
      <ScrollView
        contentContainerClassName="p-4 pb-24"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="mb-6 mt-4">
          <Skeleton className="h-9 w-48 rounded mb-2" />
          <Skeleton className="h-5 w-64 rounded" />
        </View>

        <View className="flex-row justify-end mb-4">
          <Skeleton className="h-10 w-28 rounded" />
        </View>

        <View className="gap-4">
          {Array.from({ length: cardCount }).map((_, i) => (
            <Card key={i} className="p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <Skeleton className="size-12 rounded-lg" />
                  <View className="flex-1 gap-1">
                    <Skeleton className="h-5 w-32 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                    <Skeleton className="h-4 w-full rounded mt-1" />
                  </View>
                </View>
                <Skeleton className="size-5 rounded" />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
};
