import React, { useState } from "react";
import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Divider, TextField } from "heroui-native";
import { useSemanticColors } from "@/utils/theme";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = useSemanticColors();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/(tabs)",
      },
      {
        onError: (ctx) => {
          setError(ctx.error.message || "Failed to sign in");
          setIsLoading(false);
        },
        onSuccess: () => {
          console.log("📱 Sign-in successful, navigating to main app");
          router.replace("/(tabs)");
        },
        onFinished: () => {
          setIsLoading(false);
        },
      },
    );
  };

  const handleGoogleSignIn = () => {
    Alert.alert("Coming Soon", "Google Sign In will be available soon!");
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="border-b border-border px-4 py-6">
        <View className="flex items-center gap-3 flex-row">
          <View className="h-10 w-10 bg-primary/10 rounded-lg items-center justify-center">
            <Ionicons name="log-in" size={20} color={colors.primary} />
          </View>
          <View>
            <Text className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</Text>
            <Text className="text-sm text-muted-foreground">
              Sign in to continue to your account
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-8" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center">
          <Card className="p-6">
            {/* Google Sign In Button */}
            <Pressable
              className="rounded-2xl py-3.5 px-5 flex-row items-center justify-center mb-6"
              style={{ backgroundColor: colors.accent }}
              onPress={handleGoogleSignIn}
              android_ripple={{ color: "rgba(255,255,255,0.1)" }}
              disabled={isLoading}
            >
              <View className="rounded-xl w-6 h-6 items-center justify-center mr-3 bg-background">
                <Ionicons name="logo-google" size={20} color={colors.accent} />
              </View>
              <Text className="text-base font-semibold text-background">Sign in with Google</Text>
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center my-5">
              <Divider />
              <Text className="text-xs px-3 text-muted-foreground">or continue with email</Text>
              <Divider />
            </View>

            {/* Email Input */}
            <TextField isRequired>
              <TextField.Label>Email</TextField.Label>
              <TextField.Input
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              >
                <TextField.InputStartContent>
                  <Ionicons name="mail-outline" size={20} color={colors.muted} />
                </TextField.InputStartContent>
              </TextField.Input>
            </TextField>

            {/* Password Input */}
            <TextField className="mt-4" isRequired>
              <TextField.Label>Password</TextField.Label>
              <TextField.Input
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                autoComplete="password"
                autoCorrect={false}
              >
                <TextField.InputStartContent>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
                </TextField.InputStartContent>
              </TextField.Input>
            </TextField>

            {/* Error Message */}
            {error && (
              <View className="rounded-lg p-3 mt-4 bg-destructive/10 border border-destructive">
                <Text className="text-sm text-center text-destructive">{error}</Text>
              </View>
            )}

            {/* Sign In Button */}
            <Pressable
              className="rounded-2xl py-4 items-center mt-5 mb-4"
              style={{
                backgroundColor: isLoading || !email || !password ? colors.border : colors.primary,
                opacity: isLoading || !email || !password ? 0.5 : 1,
              }}
              onPress={handleSignIn}
              disabled={isLoading || !email || !password}
              android_ripple={{ color: "rgba(255,255,255,0.1)" }}
            >
              <Text className="text-base font-semibold text-primary-foreground">
                {isLoading ? "Signing in..." : "Sign in"}
              </Text>
            </Pressable>

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-sm text-muted-foreground">Don't have an account? </Text>
              <Link href="/sign-up" asChild>
                <Pressable>
                  <Text className="text-sm underline text-primary font-medium">Sign up</Text>
                </Pressable>
              </Link>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
