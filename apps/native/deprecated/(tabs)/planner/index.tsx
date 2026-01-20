import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Tabs } from "heroui-native";
import TemplatesTab from "@/components/planner/templates";
import MyPlansTab from "@/components/planner/plans";
import { Container } from "@/components/ui/container";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  AiEditingIcon,
  Files01Icon,
  DiscoverSquareIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useRouter } from "expo-router";

export default function PlannerTabs() {
  const [activeTab, setActiveTab] = useState("templates");
  const router = useRouter();

  return (
    <Container className="bg-background">
      <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-sm font-sans-bold text-muted-foreground uppercase tracking-[3px] mb-1">
            Planner
          </Text>
          <Text className="text-3xl font-sans-bold text-foreground">Design Your Month</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/planners/create")}
          className="w-12 h-12 rounded-2xl bg-accent items-center justify-center shadow-lg shadow-accent/20"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Tabs variant="pill" value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <Tabs.List className="mx-6 mb-4 border-b border-border/30">
          <Tabs.Trigger value="templates" className="flex-1">
            <View className="flex-row items-center gap-x-2 py-3">
              <HugeiconsIcon
                icon={DiscoverSquareIcon}
                size={18}
                color={activeTab === "templates" ? "var(--accent)" : "var(--muted-foreground)"}
              />
              <Tabs.Label
                className={`font-sans-bold text-sm ${activeTab === "templates" ? "text-accent" : "text-muted-foreground"}`}
              >
                Discover
              </Tabs.Label>
            </View>
          </Tabs.Trigger>
          <Tabs.Trigger value="plans" className="flex-1">
            <View className="flex-row items-center gap-x-2 py-3">
              <HugeiconsIcon
                icon={Files01Icon}
                size={18}
                color={activeTab === "plans" ? "var(--accent)" : "var(--muted-foreground)"}
              />
              <Tabs.Label
                className={`font-sans-bold text-sm ${activeTab === "plans" ? "text-accent" : "text-muted-foreground"}`}
              >
                My Plans
              </Tabs.Label>
            </View>
          </Tabs.Trigger>
          <Tabs.Indicator className="bg-accent" />
        </Tabs.List>

        <Tabs.Content value="templates" className="flex-1">
          <TemplatesTab />
        </Tabs.Content>

        <Tabs.Content value="plans" className="flex-1">
          <MyPlansTab />
        </Tabs.Content>
      </Tabs>
    </Container>
  );
}
