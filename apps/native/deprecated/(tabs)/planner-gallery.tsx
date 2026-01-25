import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { Container } from "@/components/ui/container";
import { PlanViewMinimal } from "@/components/planner/plan-view-minimal";
import { PlanViewSimple } from "@/components/planner/plan-view-simple";
import { PlanViewTabs } from "@/components/planner/plan-view-tabs";
import { PlanView } from "@/components/planner/plan-view";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft02Icon,
  Layout01Icon,
  Layout02Icon,
  Layout03Icon,
  DashboardCircleIcon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

type ViewType = "minimal" | "simple" | "tabs" | "flashlist";

export default function PlannerGallery() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewType>("flashlist");

  // Fetch a plan ID to use for demonstration
  const { data: result, isLoading } = useQuery(orpc.plan.getPlans.queryOptions());
  const planId = result?.data?.[0]?.id;

  const viewConfigs = [
    { id: "flashlist", label: "Strategic", icon: DashboardCircleIcon },
    { id: "tabs", label: "Control", icon: Layout01Icon },
    { id: "simple", label: "Directive", icon: Layout02Icon },
    { id: "minimal", label: "Neural", icon: Layout03Icon },
  ];

  if (isLoading) {
    return (
      <Container className="bg-background items-center justify-center">
        <Text className="text-muted-foreground font-sans-bold uppercase tracking-widest">
          Initialising Gallery...
        </Text>
      </Container>
    );
  }

  if (!planId) {
    return (
      <Container className="bg-background items-center justify-center p-10">
        <Text className="text-foreground font-sans-bold text-center mb-4">No Plans Found</Text>
        <Text className="text-muted-foreground text-center mb-8">
          Create a plan first to preview the views.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-foreground px-8 py-4 rounded-2xl"
        >
          <Text className="text-background font-sans-bold">Back</Text>
        </TouchableOpacity>
      </Container>
    );
  }

  return (
    <Container className="bg-background" withScroll={false}>
      {/* Gallery Header */}
      <View className="px-6 pt-10 pb-6 flex-row items-center justify-between border-b border-border/10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface border border-border/50 items-center justify-center"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={20} color="var(--foreground)" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-[4px] mb-1">
            Architecture Preview
          </Text>
          <Text className="text-lg font-sans-bold text-foreground">Planner Gallery</Text>
        </View>
        <View className="w-10 opacity-0" />
      </View>

      {/* View Selector */}
      <View className="p-4 bg-background">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-2"
        >
          {viewConfigs.map((config) => (
            <TouchableOpacity
              key={config.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveView(config.id as ViewType);
              }}
              className={`mr-3 px-6 py-3 rounded-2xl flex-row items-center gap-x-2 border transition-all ${
                activeView === config.id
                  ? "bg-foreground border-foreground shadow-lg shadow-black/10"
                  : "bg-surface border-border/50"
              }`}
            >
              <HugeiconsIcon
                icon={config.icon}
                size={16}
                color={activeView === config.id ? "var(--background)" : "var(--muted-foreground)"}
              />
              <Text
                className={`text-[10px] font-sans-bold uppercase tracking-widest ${
                  activeView === config.id ? "text-background" : "text-muted-foreground"
                }`}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* active View Display */}
      <View className="flex-1">
        {activeView === "minimal" && <PlanViewMinimal planId={planId} />}
        {activeView === "simple" && <PlanViewSimple planId={planId} />}
        {activeView === "tabs" && <PlanViewTabs planId={planId} />}
        {activeView === "flashlist" && <PlanView planId={planId} />}
      </View>

      {/* Info Overlay */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(800)}
        className="absolute bottom-10 left-6 right-6 p-4 bg-foreground/90 backdrop-blur-xl rounded-[24px] flex-row items-center justify-between shadow-2xl shadow-black/40"
      >
        <View>
          <Text className="text-[8px] font-sans-bold text-background/60 uppercase tracking-[2px] mb-1">
            Preview Protocol
          </Text>
          <Text className="text-xs font-sans-bold text-background uppercase tracking-widest">
            {activeView} architecture active
          </Text>
        </View>
        <View className="w-8 h-8 rounded-full bg-background items-center justify-center">
          <HugeiconsIcon icon={DashboardCircleIcon} size={14} color="var(--foreground)" />
        </View>
      </Animated.View>
    </Container>
  );
}
