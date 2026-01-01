import { useState } from "react";
import { Tabs } from "heroui-native";
import TemplatesTab from "@/components/planner/templates";
import MyPlansTab from "@/components/planner/plans";

export default function PlannerTabs() {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <Tabs
      variant="pill"
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex-1 bg-background pt-9"
    >
      <Tabs.List className="rounded-none mx-2">
        <Tabs.Trigger value="templates">
          <Tabs.Label className="">Templates</Tabs.Label>
        </Tabs.Trigger>
        <Tabs.Trigger value="plans">
          <Tabs.Label>My Plans</Tabs.Label>
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="templates" className="flex-1">
        <TemplatesTab />
      </Tabs.Content>

      <Tabs.Content value="plans" className="flex-1">
        <MyPlansTab />
      </Tabs.Content>
    </Tabs>
  );
}
