import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TextInput,
} from "react-native";
import { useRouter, Link, Stack } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Mail01Icon,
  LockPasswordIcon,
  ViewIcon,
  ViewOffIcon,
  GoogleIcon,
  ArrowRight01Icon,
  AiMagicIcon,
  UserIcon,
  FingerPrintIcon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { useSemanticColors } from "@/utils/theme";
import { Container } from "@/components/ui/container";
import { useAuthStore } from "@/stores/auth-store";
import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { z } from "zod";
import Animated, { FadeInUp, FadeInDown, LinearTransition } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const SignUpSchema = z.object({
  name: z.string().min(1, "Identity label required"),
  email: z.string().email("Invalid neural identifier").min(1, "Email required"),
  password: z.string().min(8, "Access key must be >= 8 chars"),
});

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Text className="text-[10px] font-sans-medium text-danger mt-1 ml-1 uppercase tracking-widest">
            {field.state.meta.errors
              .map((err: any) => (typeof err === "string" ? err : err?.message || "Invalid input"))
              .join(", ")}
          </Text>
        </Animated.View>
      )}
    </>
  );
}

export default function SignUpScreen() {
  const colors = useSemanticColors();
  const router = useRouter();
  const { signUp, isLoading, error } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const { height } = Dimensions.get("window");

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signUp({
        name: value.name.trim(),
        email: value.email.trim(),
        password: value.password,
      });
      if (useAuthStore.getState().isLoggedIn) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
  });

  const handleGoogleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Neural Link Pending", "Google registration is currently in beta.");
  };

  return (
    <Container className="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-8 justify-center pt-20">
            {/* Header Section */}
            <Animated.View entering={FadeInUp.duration(600)} className="mb-12 items-center">
              <View className="w-20 h-20 rounded-[32px] bg-accent items-center justify-center mb-6 shadow-2xl shadow-accent/20">
                <HugeiconsIcon icon={AiMagicIcon} size={36} color="white" />
              </View>
              <Text className="text-3xl font-sans-bold text-foreground tracking-tight text-center">
                Create Identity
              </Text>
              <Text className="text-sm font-sans text-muted-foreground mt-2 text-center opacity-80">
                Register your neural signature to begin.
              </Text>
            </Animated.View>

            {/* Social Auth */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mb-10">
              <TouchableOpacity
                onPress={handleGoogleSignUp}
                disabled={isLoading}
                activeOpacity={0.8}
                className="bg-surface rounded-[24px] border border-border/50 h-16 flex-row items-center justify-center gap-x-3"
              >
                <HugeiconsIcon icon={GoogleIcon} size={20} color="var(--foreground)" />
                <Text className="text-sm font-sans-bold text-foreground uppercase tracking-widest">
                  Initialize via Google
                </Text>
              </TouchableOpacity>

              <View className="flex-row items-center my-8">
                <View className="flex-1 h-px bg-border/30" />
                <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-[3px] px-4">
                  or manual registry
                </Text>
                <View className="flex-1 h-px bg-border/30" />
              </View>
            </Animated.View>

            {/* Form Section */}
            <Animated.View entering={FadeInDown.delay(400).duration(600)} className="gap-y-6">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    const res = SignUpSchema.shape.name.safeParse(value);
                    return res.success ? undefined : res.error.errors[0].message;
                  },
                }}
                children={(field) => (
                  <View>
                    <View className="flex-row items-center gap-x-2 mb-3 ml-1">
                      <HugeiconsIcon icon={UserIcon} size={14} color="var(--muted-foreground)" />
                      <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                        Identity Label (Full Name)
                      </Text>
                    </View>
                    <View className="bg-surface rounded-2xl border border-border/50 px-5 h-14 justify-center focus:border-accent">
                      <TextInput
                        className="text-foreground text-sm font-sans-medium"
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        placeholder="Neural Entity Name"
                        placeholderTextColor="var(--muted-foreground)/30"
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                    <FieldInfo field={field} />
                  </View>
                )}
              />

              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => {
                    const res = SignUpSchema.shape.email.safeParse(value);
                    return res.success ? undefined : res.error.errors[0].message;
                  },
                }}
                children={(field) => (
                  <View>
                    <View className="flex-row items-center gap-x-2 mb-3 ml-1">
                      <HugeiconsIcon icon={Mail01Icon} size={14} color="var(--muted-foreground)" />
                      <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                        Neural Identifier (Email)
                      </Text>
                    </View>
                    <View className="bg-surface rounded-2xl border border-border/50 px-5 h-14 justify-center focus:border-accent">
                      <TextInput
                        className="text-foreground text-sm font-sans-medium"
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        placeholder="entity@uplink.com"
                        placeholderTextColor="var(--muted-foreground)/30"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    <FieldInfo field={field} />
                  </View>
                )}
              />

              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => {
                    const res = SignUpSchema.shape.password.safeParse(value);
                    return res.success ? undefined : res.error.errors[0].message;
                  },
                }}
                children={(field) => (
                  <View>
                    <View className="flex-row items-center justify-between mb-3 ml-1">
                      <View className="flex-row items-center gap-x-2">
                        <HugeiconsIcon
                          icon={LockPasswordIcon}
                          size={14}
                          color="var(--muted-foreground)"
                        />
                        <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                          Access Key (8+ Chars)
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.selectionAsync();
                          setShowPassword(!showPassword);
                        }}
                      >
                        <HugeiconsIcon
                          icon={showPassword ? ViewOffIcon : ViewIcon}
                          size={16}
                          color="var(--muted-foreground)"
                        />
                      </TouchableOpacity>
                    </View>
                    <View className="bg-surface rounded-2xl border border-border/50 px-5 h-14 justify-center focus:border-accent">
                      <TextInput
                        className="text-foreground text-sm font-sans-medium"
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        placeholder="••••••••"
                        placeholderTextColor="var(--muted-foreground)/30"
                        secureTextEntry={!showPassword}
                        autoCorrect={false}
                      />
                    </View>
                    <FieldInfo field={field} />
                  </View>
                )}
              />

              {error && (
                <Animated.View
                  entering={FadeInUp}
                  className="bg-danger/10 border border-danger/20 rounded-2xl p-4 mt-2"
                >
                  <Text className="text-xs font-sans-bold text-danger text-center uppercase tracking-widest">
                    {error}
                  </Text>
                </Animated.View>
              )}

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <TouchableOpacity
                    onPress={() => form.handleSubmit()}
                    disabled={!canSubmit || isSubmitting || isLoading}
                    activeOpacity={0.8}
                    className={`h-16 rounded-[24px] flex-row items-center justify-center gap-x-3 mt-4 shadow-xl ${
                      !canSubmit || isSubmitting || isLoading
                        ? "bg-muted opacity-50"
                        : "bg-foreground shadow-black/20"
                    }`}
                  >
                    {isSubmitting || isLoading ? (
                      <ActivityIndicator color="var(--background)" />
                    ) : (
                      <>
                        <Text className="text-sm font-sans-bold text-background uppercase tracking-widest">
                          Finalize Identity
                        </Text>
                        <HugeiconsIcon icon={Tick01Icon} size={18} color="var(--background)" />
                      </>
                    )}
                  </TouchableOpacity>
                )}
              />

              <View className="mt-8 flex-row justify-center items-center">
                <Text className="text-xs font-sans text-muted-foreground">
                  Already documented?{" "}
                </Text>
                <Link href="/sign-in" asChild>
                  <TouchableOpacity>
                    <Text className="text-xs font-sans-bold text-foreground uppercase tracking-widest underline">
                      Authorize Access
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <View className="mt-6 pt-6 border-t border-border/30">
                <Text className="text-[10px] text-center font-sans text-muted-foreground leading-relaxed">
                  By registering, you agree to the{" "}
                  <Text className="font-sans-bold text-foreground uppercase tracking-wider">
                    Usage Protocols
                  </Text>{" "}
                  and{" "}
                  <Text className="font-sans-bold text-foreground uppercase tracking-wider">
                    Neural Privacy Framework
                  </Text>
                </Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}
