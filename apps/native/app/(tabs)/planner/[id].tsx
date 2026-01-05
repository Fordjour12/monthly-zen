import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { PlanView } from "@/components/planner/plan-view";
import { PlanViewTabs } from "@/components/planner/plan-view-tabs";
import { PlanViewSimple } from "@/components/planner/plan-view-simple";
import { PlanViewMinimal } from "@/components/planner/plan-view-minimal";
import { authClient } from "@/lib/auth-client";
import { Container } from "@/components/ui/container";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  AlertCircleIcon,
  ArrowLeft02Icon,
  Layout01Icon,
  Layout02Icon,
  Layout03Icon,
  DashboardCircleIcon,
} from "@hugeicons/core-free-icons";
import { useSemanticColors } from "@/utils/theme";
import { Tabs } from "heroui-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";

type ViewVariant = "full" | "tabs" | "simple" | "minimal";

export default function PlanDetail() {
  const { accent, danger } = useSemanticColors();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewVariant>("full");

  authClient.useSession();

  const planId = Array.isArray(id) ? parseInt(id[0], 10) : parseInt(id || "0", 10);

  if (!planId || isNaN(planId)) {
    return (
      <Container className="bg-background items-center justify-center p-10">
        <View className="w-16 h-16 rounded-[24px] bg-danger/10 items-center justify-center mb-6">
          <HugeiconsIcon icon={AlertCircleIcon} size={32} color="var(--danger)" />
        </View>
        <Text className="text-foreground font-sans-bold text-lg text-center">Invalid Node ID</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-8 bg-foreground px-8 py-4 rounded-2xl"
        >
          <Text className="text-background font-sans-bold uppercase tracking-widest text-[10px]">
            Revert Sync
          </Text>
        </TouchableOpacity>
      </Container>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case "full":
        return <PlanView planId={planId} />;
      case "tabs":
        return <PlanViewTabs planId={planId} />;
      case "simple":
        return <PlanViewSimple planId={planId} />;
      case "minimal":
        return <PlanViewMinimal planId={planId} />;
      default:
        return <PlanView planId={planId} />;
    }
  };

  const viewConfigs = [
    { id: "full", label: "Strategic", icon: DashboardCircleIcon },
    { id: "tabs", label: "Control", icon: Layout01Icon },
    { id: "simple", label: "Directive", icon: Layout02Icon },
    { id: "minimal", label: "Neural", icon: Layout03Icon },
  ];

  return (
    <Container className="bg-background" withScroll={false}>
      <Animated.View
        entering={FadeInUp.duration(600)}
        className="px-6 pt-10 pb-6 flex-row items-center justify-between border-b border-border/10"
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          className="w-10 h-10 rounded-full bg-surface border border-border/50 items-center justify-center"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={20} color="var(--foreground)" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-[4px] mb-1">
            Architecture
          </Text>
          <Text className="text-lg font-sans-bold text-foreground">Mission Config</Text>
        </View>
        <View className="w-10 opacity-0" />
      </Animated.View>

      <View className="bg-background pt-4 pb-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-6 gap-x-3"
        >
          {viewConfigs.map((config) => (
            <TouchableOpacity
              key={config.id}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveView(config.id as ViewVariant);
              }}
              className={`px-5 py-3 rounded-2xl flex-row items-center gap-x-2 border transition-all ${
                activeView === config.id
                  ? "bg-foreground border-foreground shadow-lg shadow-black/10"
                  : "bg-surface border-border/50 shadow-sm shadow-black/5"
              }`}
            >
              <HugeiconsIcon
                icon={config.icon}
                size={14}
                color={activeView === config.id ? "var(--background)" : "var(--muted-foreground)"}
              />
              <Text
                className={`text-[9px] font-sans-bold uppercase tracking-widest ${
                  activeView === config.id ? "text-background" : "text-muted-foreground"
                }`}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="flex-1">{renderView()}</View>
    </Container>
  );
}
