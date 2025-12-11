import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Home12Icon, TsunamiIcon, PenTool01Icon, CompassIcon, Calendar01Icon, TaskEdit01Icon } from "@hugeicons/core-free-icons";


export default function TabLayout() {
   const themeColorForeground = useThemeColor("foreground");
   const themeColorBackground = useThemeColor("background");
   const themeOrange = useThemeColor("orange-500");
   const themeOrangeLighter = useThemeColor("background-quaternary")

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
            tabBarActiveTintColor: themeOrange,
            tabBarInactiveTintColor: themeColorForeground,
            tabBarActiveBackgroundColor: themeOrangeLighter,
            tabBarInactiveBackgroundColor: themeColorBackground,
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
      </Tabs>
   );
}
