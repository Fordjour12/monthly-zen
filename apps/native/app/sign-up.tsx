import React from "react";
import { View, Text, Pressable, ScrollView, Dimensions, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme";
import { Card, Divider, TextField } from "heroui-native";
import { Container } from "@/components/ui/container";
import { useAuthStore } from "@/stores/auth-store";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { z } from "zod";

const SignUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Please enter a valid email address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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

export default function SignUpScreen() {
  const { height } = Dimensions.get("window");

  const colors = useSemanticColors();
  const router = useRouter();
  const { signUp, isLoading, error } = useAuthStore();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onChange: SignUpSchema,
      onBlur: SignUpSchema,
      onSubmit: SignUpSchema,
    },
    onSubmit: async ({ value }) => {
      await signUp({
        name: value.name.trim(),
        email: value.email.trim(),
        password: value.password,
      });
      if (useAuthStore.getState().isLoggedIn) {
        router.replace("/");
      }
    },
  });

  const handleGoogleSignUp = () => {
    Alert.alert("Coming Soon", "Google Sign Up will be available soon!");
  };

  return (
    <Container className="pt-4">
      <ScrollView
        className="flex-1 px-4 py-8"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <KeyboardAvoidingView
          behavior={"padding"}
          keyboardVerticalOffset={100}
          style={{ flex: 1, height: height }}
        >
          <View className="pt-2 pb-5">
            <Text className="text-2xl font-bold tracking-tight text-foreground">
              Create Account
            </Text>
            <Text className="text-sm text-muted-foreground">
              Join us to start tracking your plans
            </Text>
          </View>
          <Card className="p-6">
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

            <View className="flex-row items-center my-5">
              <Divider />
              <Text className="text-xs px-3 text-muted-foreground">or continue with email</Text>
              <Divider />
            </View>

            <form.Field
              name="name"
              children={(field) => (
                <TextField isRequired>
                  <TextField.Label>Full Name</TextField.Label>
                  <TextField.Input
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    placeholder="Enter your name"
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoComplete="name"
                  >
                    <TextField.InputStartContent>
                      <Ionicons name="person-outline" size={20} color={colors.muted} />
                    </TextField.InputStartContent>
                  </TextField.Input>
                  <FieldInfo field={field} />
                </TextField>
              )}
            />

            <form.Field
              name="email"
              children={(field) => (
                <TextField className="mt-4" isRequired>
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
                    placeholder="Create a password"
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
                  android_ripple={{ color: colors.foreground }}
                >
                  <Text className="text-base font-semibold text-muted-foreground">
                    {isSubmitting || isLoading ? "Creating account..." : "Create Account"}
                  </Text>
                </Pressable>
              )}
            />

            <View className="flex-row justify-center items-center">
              <Text className="text-sm text-muted-foreground">Already have an account? </Text>
              <Link href="/sign-in" asChild>
                <Pressable>
                  <Text className="text-sm underline text-foreground font-medium">Sign in</Text>
                </Pressable>
              </Link>
            </View>

            <View className="pt-4 mt-2 border-t border-border">
              <Text className="text-xs text-center leading-relaxed text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Text className="font-semibold text-foreground">Terms</Text> and{" "}
                <Text className="font-semibold text-foreground">Privacy Policy</Text>
              </Text>
            </View>
          </Card>
        </KeyboardAvoidingView>
      </ScrollView>
    </Container>
  );
}
