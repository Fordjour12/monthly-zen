import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";
import { AuthGuard } from "@/components/auth-guard";

export default function AuthLayout() {
  const themeColorBackground = useThemeColor("background");

  return (
    <AuthGuard requireAuth={false}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: themeColorBackground,
          },
        }}
      >
        <Stack.Screen
          name="sign-in"
          options={{
            title: "Sign In",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="sign-up"
          options={{
            title: "Sign Up",
            headerShown: false,
          }}
        />
      </Stack>
    </AuthGuard>
  );
}