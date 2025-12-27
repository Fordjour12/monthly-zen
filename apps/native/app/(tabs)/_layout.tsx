import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";

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
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Discover",
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="bulb" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: "Plans",
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="generate-plan"
        options={{
          title: "Generate",
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="flash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="checkmark-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
