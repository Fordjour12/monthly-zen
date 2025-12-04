import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";

export default function TabLayout() {
	const themeColorForeground = useThemeColor("foreground");
	const themeColorBackground = useThemeColor("background");

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
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
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color, size }: { color: string; size: number }) => (
						<Ionicons name="home" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="calendar"
				options={{
					title: "Calendar",
					tabBarIcon: ({ color, size }: { color: string; size: number }) => (
						<Ionicons name="calendar" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="tasks"
				options={{
					title: "Tasks",
					tabBarIcon: ({ color, size }: { color: string; size: number }) => (
						<Ionicons name="checkbox" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="habits"
				options={{
					title: "Habits",
					tabBarIcon: ({ color, size }: { color: string; size: number }) => (
						<Ionicons name="repeat" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="three"
				options={{
					title: "Plan",
					tabBarIcon: ({ color, size }: { color: string; size: number }) => (
						<Ionicons name="create" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="[id]"
				options={{
					title: "Suggestion Details",
					href: null,
					tabBarStyle: { display: "none" },
				}}
			/>
		</Tabs>
	);
}
