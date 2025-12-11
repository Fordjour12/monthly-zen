import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Home12Icon, TsunamiIcon } from "@hugeicons/core-free-icons";
import { AuthGuard } from "@/components/auth-guard";


export default function TabLayout() {
   const themeColorForeground = useThemeColor("foreground");
   const themeColorBackground = useThemeColor("background");
   const themeOrange = useThemeColor("accent");
   const themeOrangeLighter = useThemeColor("background-quaternary")

   return (
      <AuthGuard requireAuth={true}>
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
      </AuthGuard>
   );
}
