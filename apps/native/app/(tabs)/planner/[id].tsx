import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { PlanView } from "@/components/planner/plan-view";
import { PlanViewTabs } from "@/components/planner/plan-view-tabs";
import { PlanViewSimple } from "@/components/planner/plan-view-simple";
import { PlanViewMinimal } from "@/components/planner/plan-view-minimal";
import { authClient } from "@/lib/auth-client";
import { Container } from "@/components/ui/container";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { AlertCircleFreeIcons, ArrowLeft01FreeIcons } from "@hugeicons/core-free-icons";
import { useSemanticColors } from "@/utils/theme";
import { Tabs } from "heroui-native";

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
      <View className="flex-1 bg-background justify-center items-center p-4">
        <HugeiconsIcon icon={AlertCircleFreeIcons} size={48} color={danger} />
        <Text className="text-danger text-center mt-4">Invalid plan ID</Text>
      </View>
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

  return (
    <Container>
      <View>
        <Pressable
          className="pt-9 flex-row gap-2 items-center align-middle"
          onPress={() => router.push("/(tabs)/planner")}
        >
          <HugeiconsIcon icon={ArrowLeft01FreeIcons} size={20} color={accent} />
          <Text className="text-foreground">Back</Text>
        </Pressable>
      </View>

      <Tabs
        value={activeView}
        onValueChange={(v) => setActiveView(v as ViewVariant)}
        variant="line"
        className="flex-1"
      >
        <Tabs.List className="">
          <Tabs.ScrollView
            contentContainerClassName="gap-4"
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <Tabs.Indicator />
            <Tabs.Trigger value="full">
              <Tabs.Label>Full</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="tabs">
              <Tabs.Label>Tabs</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="simple">
              <Tabs.Label>Simple</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="minimal">
              <Tabs.Label>Minimal</Tabs.Label>
            </Tabs.Trigger>
          </Tabs.ScrollView>
        </Tabs.List>
        {renderView()}
      </Tabs>
    </Container>
  );
}
