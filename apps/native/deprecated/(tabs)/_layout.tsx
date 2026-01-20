import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  AiEditingIcon,
  Calendar01Icon,
  Home12Icon,
  Tag01Icon,
  TeachingIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";

export default function TabLayout() {
  const themeColorForeground = useThemeColor("foreground");
  const themeColorBackground = useThemeColor("background");

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: themeColorBackground,
        },
        headerTintColor: themeColorForeground,
        headerTitleStyle: {
          color: themeColorForeground,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: themeColorBackground,
        },
        tabBarActiveTintColor: themeColorForeground,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <HugeiconsIcon icon={Home12Icon} size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <HugeiconsIcon icon={Calendar01Icon} size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: "Planner",
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <HugeiconsIcon icon={AiEditingIcon} size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="coaching"
        options={{
          title: "Coaching",
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <HugeiconsIcon icon={TeachingIcon} size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="task"
        options={{
          title: "Tasks",
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <HugeiconsIcon icon={Tag01Icon} size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <HugeiconsIcon icon={UserCircleIcon} size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
    </Tabs>
  );
}
