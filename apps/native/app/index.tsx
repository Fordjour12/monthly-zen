import { Text, View, Pressable } from "react-native";
import { Container } from "@/components/container";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, useThemeColor, Button } from "heroui-native";
import { useQuery } from "@tanstack/react-query";
import { queryClient, orpc } from "@/utils/orpc";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { AuthGuard } from "@/components/auth-guard";
import { Link } from "expo-router";

function LandingScreen() {
   const healthCheck = useQuery(orpc.healthCheck.queryOptions());
   const router = useRouter();

   const isConnected = healthCheck?.data === "OK";
   const isLoading = healthCheck?.isLoading;

   const themeColorBackground = useThemeColor("background");
   const themeColorForeground = useThemeColor("foreground");
   const themeColorMuted = useThemeColor("muted");
   const themeColorSuccess = useThemeColor("success");
   const themeColorDanger = useThemeColor("danger");

   return (
      <Container className="p-6">
         <View className="py-8 mb-8">
            <Text className="text-5xl font-bold text-foreground mb-4 text-center">
               MONTHLY ZEN PLANNER
            </Text>
            <Text className="text-xl text-muted text-center">
               Your AI-powered productivity companion
            </Text>
         </View>

         <View className="space-y-4 mb-8">
            <Link href="/(auth)/sign-in" asChild>
               <Button size="lg" className="w-full">
                  Sign In
               </Button>
            </Link>

            <Link href="/(auth)/sign-up" asChild>
               <Button variant="primary" size="lg" className="w-full mt-4">
                  Create Account
               </Button>
            </Link>

<Link href="/(auth)/onboarding" asChild>
               <Button size="lg" className="w-full mt-4">
                  Onboarding
               </Button>
            </Link>
         </View>

         <Card variant="secondary" className="p-6">
            <View className="flex-row items-center justify-between mb-4">
               <Card.Title>System Status</Card.Title>
               <Chip
                  variant="secondary"
                  color={isConnected ? "success" : "danger"}
                  size="sm"
               >
                  <Chip.Label>{isConnected ? "LIVE" : "OFFLINE"}</Chip.Label>
               </Chip>
            </View>

            <Card className="p-4">
               <View className="flex-row items-center">
                  <View
                     className={`w-3 h-3 rounded-full mr-3 ${isConnected ? "bg-success" : "bg-muted"}`}
                  />
                  <View className="flex-1">
                     <Text className="text-foreground font-medium mb-1">
                        Backend Connection
                     </Text>
                     <Card.Description>
                        {isLoading
                           ? "Checking connection..."
                           : isConnected
                              ? "Connected to API"
                              : "API Disconnected"}
                     </Card.Description>
                  </View>
                  {isLoading && (
                     <Ionicons name="hourglass-outline" size={20} color={themeColorMuted} />
                  )}
                  {!isLoading && isConnected && (
                     <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={themeColorSuccess}
                     />
                  )}
                  {!isLoading && !isConnected && (
                     <Ionicons name="close-circle" size={20} color={themeColorDanger} />
                  )}
               </View>
            </Card>
         </Card>

         <View className="mt-8">
            <Text className="text-muted text-center text-sm">
              Better T Stack • Plan smarter, achieve more
            </Text>
         </View>


         <Pressable >
            <Text>Onboarding</Text>
         </Pressable>

      </Container>
   );
}

export default function Home() {
  return (
    <AuthGuard requireAuth={false} redirectTo="/(tabs)">
      <LandingScreen />
    </AuthGuard>
  );
}
