import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Home12Icon, TsunamiIcon, PenTool01Icon, CompassIcon, Calendar01Icon, TaskEdit01Icon } from "@hugeicons/core-free-icons";


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
                  <HugeiconsIcon
                     icon={Home12Icon}
                     size={size}
                     color={color}
                     strokeWidth={1.5}
                  />
               ),
            }}
         />
         <Tabs.Screen
            name="calendar"
            options={{
               title: "Calendar",
               tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <HugeiconsIcon
                     icon={Calendar01Icon}
                     size={size}
                     color={color}
                     strokeWidth={1.5} />

               ),
            }}
         />
         <Tabs.Screen
            name="tasks"
            options={{
               title: "Tasks",
               tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <HugeiconsIcon
                     icon={TaskEdit01Icon}
                     size={size}
                     color={color}
                     strokeWidth={1.5}
                  />
               ),
            }}
         />
         <Tabs.Screen
            name="habits"
            options={{
               title: "Habits",
               tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <HugeiconsIcon
                     icon={CompassIcon}
                     size={size}
                     color={color}
                     strokeWidth={1.5}
                  />

               ),
            }}
         />
         <Tabs.Screen
            name="plan"
            options={{
               title: "Plan",
               tabBarIcon: ({ color, size }: { color: string; size: number }) => (

                  <HugeiconsIcon
                     icon={PenTool01Icon}
                     size={size}
                     color={color}
                     strokeWidth={1.5}
                  />
               ),
            }}
         />
         <Tabs.Screen
            name="suggestion"
            options={{
               title: "Suggestion",
               tabBarIcon: ({ color, size }: { color: string; size: number }) => (

                  <HugeiconsIcon
                     icon={TsunamiIcon}
                     size={size}
                     color={color}
                     strokeWidth={1.5}
                  />
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
