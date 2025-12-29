import React from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
import { Card, Divider, TextField } from "heroui-native";
import { Container } from "@/components/ui/container";
import { useAuthStore } from "@/stores/auth-store";
import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { z } from "zod";

const SignInSchema = z.object({
  email: z.email("Please enter a valid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid && (
        <Text className="text-sm text-danger">
          {field.state.meta.errors.map((err: unknown) => String(err)).join(",")}
        </Text>
      )}
    </>
  );
}

export default function SignInScreen() {
  const colors = useSemanticColors();
  const router = useRouter();
  const { signIn, isLoading, error } = useAuthStore();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: SignInSchema,
      onBlur: SignInSchema,
      onSubmit: SignInSchema,
    },
    onSubmit: async ({ value }) => {
      await signIn({ email: value.email, password: value.password });
      if (useAuthStore.getState().isLoggedIn) {
        router.replace("/(tabs)");
      }
    },
  });

  const handleGoogleSignIn = () => {
    Alert.alert("Coming Soon", "Google Sign In will be available soon!");
  };

  return (
    <Container>
      <ScrollView className="flex-1 px-4 py-8" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center">
          <View className="pt-2 pb-5">
            <Text className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</Text>
            <Text className="text-sm text-muted-foreground">
              Sign in to continue to your account
            </Text>
          </View>

          <Card className="p-6">
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

            <View className="flex-row items-center my-5">
              <Divider orientation="horizontal" variant="thin" />
              <Text className="text-xs px-3 text-muted-foreground">or continue with email</Text>
              <Divider orientation="horizontal" variant="thin" />
            </View>

            <form.Field
              name="email"
              children={(field) => (
                <TextField isRequired>
                  <TextField.Label>Email</TextField.Label>
                  <TextField.Input
                    value={field.state.value}
                    onChangeText={field.handleChange}
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
                  <FieldInfo field={field} />
                </TextField>
              )}
            />

            <form.Field
              name="password"
              children={(field) => (
                <TextField className="mt-4" isRequired>
                  <TextField.Label>Password</TextField.Label>
                  <TextField.Input
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    placeholder="Enter your password"
                    secureTextEntry
                    autoComplete="password"
                    autoCorrect={false}
                  >
                    <TextField.InputStartContent>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
                    </TextField.InputStartContent>
                  </TextField.Input>
                  <FieldInfo field={field} />
                </TextField>
              )}
            />

            {error && (
              <View className="rounded-lg p-3 mt-4 bg-danger/10 border border-danger">
                <Text className="text-sm text-center text-danger">{error}</Text>
              </View>
            )}

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Pressable
                  className="rounded-2xl py-4 items-center mt-5 mb-4"
                  style={{
                    backgroundColor: !canSubmit || isSubmitting ? colors.border : colors.primary,
                    opacity: !canSubmit || isSubmitting ? 0.5 : 1,
                  }}
                  onPress={() => form.handleSubmit()}
                  disabled={!canSubmit || isSubmitting || isLoading}
                  android_ripple={{ color: "rgba(255,255,255,0.1)" }}
                >
                  <Text className="text-base font-semibold text-primary-foreground">
                    {isSubmitting || isLoading ? "Signing in..." : "Sign in"}
                  </Text>
                </Pressable>
              )}
            />

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
    </Container>
  );
}
