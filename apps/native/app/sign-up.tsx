import React, { useState } from "react";
import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
import { Card, Divider, TextField } from "heroui-native";
import { Container } from "@/components/ui/container";

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme utilities
  const colors = useSemanticColors();

  const router = useRouter();

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return false;
    }
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return false;
    }
    if (!password) {
      Alert.alert("Error", "Please enter a password");
      return false;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    await authClient.signUp.email(
      {
        email: email.trim(),
        password,
        name: name.trim(),
        callbackURL: "/onboarding",
      },
      {
        onError: (ctx) => {
          setError(ctx.error.message || "Failed to sign up");
          setIsLoading(false);
        },
        onSuccess: () => {
          console.log("📱 Sign-up successful, navigating to onboarding");
          router.replace("/");
        },
        onFinished: () => {
          setIsLoading(false);
        },
      },
    );
  };

  const handleGoogleSignUp = () => {
    Alert.alert("Coming Soon", "Google Sign Up will be available soon!");
  };

  return (
    <Container className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 py-8" contentContainerStyle={{ flexGrow: 1 }}>
        <Card className="p-6">
          <View>
            <Text className="text-2xl font-bold tracking-tight text-foreground">
              Create Account
            </Text>
            <Text className="text-sm text-muted-foreground">
              Join us to start tracking your plans
            </Text>
          </View>
          {/* Google Sign Up Button */}
          <Pressable
            className="rounded-2xl py-3.5 px-5 flex-row items-center justify-center mb-6"
            style={{ backgroundColor: colors.accent }}
            onPress={handleGoogleSignUp}
            android_ripple={{ color: "rgba(255,255,255,0.1)" }}
            disabled={isLoading}
          >
            <View className="rounded-xl w-6 h-6 items-center justify-center mr-3 bg-background">
              <Ionicons name="logo-google" size={20} color={colors.accent} />
            </View>
            <Text className="text-base font-semibold text-background">Sign up with Google</Text>
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center my-5">
            <Divider />
            <Text className="text-xs px-3 text-muted-foreground">or continue with email</Text>
            <Divider />
          </View>

          {/* Name Input */}
          <TextField isRequired>
            <TextField.Label>Full Name</TextField.Label>
            <TextField.Input
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="name"
            >
              <TextField.InputStartContent>
                <Ionicons name="person-outline" size={20} color={colors.muted} />
              </TextField.InputStartContent>
            </TextField.Input>
          </TextField>

          {/* Email Input */}
          <TextField className="mt-4" isRequired>
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
              placeholder="Create a password )"
              secureTextEntry
              autoComplete="password"
              autoCorrect={false}
            >
              <TextField.InputStartContent>
                <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
              </TextField.InputStartContent>
            </TextField.Input>
            <TextField.Description className="text-sm text-muted-foreground">
              Must be at least 8 characters long
            </TextField.Description>
          </TextField>

          {/* Error Message */}
          {error && (
            <View className="rounded-lg p-3 mt-4 bg-destructive/10 border border-destructive">
              <Text className="text-sm text-center text-destructive">{error}</Text>
            </View>
          )}

          {/* Sign Up Button */}
          <Pressable
            className="rounded-2xl py-4 items-center mt-5 mb-4"
            style={{
              backgroundColor:
                isLoading || !name || !email || !password ? colors.border : colors.primary,
              opacity: isLoading || !name || !email || !password ? 0.5 : 1,
            }}
            onPress={handleSignUp}
            disabled={isLoading || !name || !email || !password}
            android_ripple={{ color: "rgba(255,255,255,0.1)" }}
          >
            <Text className="text-base font-semibold text-primary-foreground">
              {isLoading ? "Creating account..." : "Create Account"}
            </Text>
          </Pressable>

          {/* Sign In Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-muted-foreground">Already have an account? </Text>
            <Link href="/sign-in" asChild>
              <Pressable>
                <Text className="text-sm underline text-primary font-medium">Sign in</Text>
              </Pressable>
            </Link>
          </View>

          {/* Terms */}
          <View className="pt-4 mt-2 border-t border-border">
            <Text className="text-xs text-center leading-relaxed text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Text className="font-semibold text-foreground">Terms</Text> and{" "}
              <Text className="font-semibold text-foreground">Privacy Policy</Text>
            </Text>
          </View>
        </Card>
      </ScrollView>
    </Container>
  );
}
