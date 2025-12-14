import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Home12Icon, TsunamiIcon, PenTool01Icon, UserStatusIcon } from "@hugeicons/core-free-icons";
import { useSemanticColors } from "@/utils/theme-utils";


export default function TabLayout() {
   /*
   const themeColorForeground = useThemeColor("foreground");
   const themeColorBackground = useThemeColor("background");
   const themeOrange = useThemeColor("accent");
   const themeOrangeLighter = useThemeColor("background-quaternary")

   */

   const color = useSemanticColors()



   return (
      <Tabs
         screenOptions={{
            headerShown: false,
            headerStyle: {
               backgroundColor: color.background,
            },
            headerTintColor: color.foreground,
            headerTitleStyle: {
               color: color.foreground,
               fontWeight: "600",
            },
            tabBarStyle: {
               backgroundColor: color.background,
            },
            tabBarActiveTintColor: color.accent,
            tabBarInactiveTintColor: color.foreground,
            tabBarActiveBackgroundColor: color.background,
            tabBarInactiveBackgroundColor: color.background,
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
            name="profile"
            options={{
               title: "Profile",
               tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <HugeiconsIcon
                     icon={UserStatusIcon}
                     size={size}
                     color={color}
                     strokeWidth={1.5}
                  />
               ),
            }}
         />
      </Tabs>
   );
}
