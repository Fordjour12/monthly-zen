import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
  TextInput,
  Image,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Mail01Icon,
  LockPasswordIcon,
  ViewIcon,
  ViewOffIcon,
  GoogleIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { Container } from "@/components/ui/container";
import { useAuthStore } from "@/stores/auth-store";
import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { z } from "zod";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSemanticColors } from "@/utils/theme";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

const SignInSchema = z.object({
  email: z.email("Please enter a valid email address").min(1, "Email is required"),
  password: z.string().min(2, "Password is required"),
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

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, isLoading, error } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const colors = useSemanticColors();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: SignInSchema,
    },
    onSubmit: async ({ value }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signIn({ email: value.email.trim(), password: value.password });
      if (useAuthStore.getState().isLoggedIn) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
  });

  const handleGoogleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Neural Link Pending", "Google synchronization is currently in the beta phase.");
  };

  return (
    <Container className="bg-background" withScroll={false}>
      <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-8 justify-center pt-20">
            {/* Header / Logo Section */}
            <Animated.View entering={FadeInUp.duration(600)} className="mb-12 items-center">
              <View className="size-20 rounded-3xl bg-accent items-center justify-center shadow-2xl shadow-accent/40 rotate-12">
                <View className="-rotate-12">
                  <Image
                    source={require("../assets/images/android-icon-foreground.png")}
                    className="size-19"
                  />
                </View>
              </View>
              <Text className="text-3xl font-sans-bold text-foreground tracking-tight text-center">
                Welcome Back
              </Text>
              <Text className="text-sm font-sans text-muted-foreground mt-2 text-center opacity-80">
                Synchronize your neural objectives to continue.
              </Text>
            </Animated.View>

            {/* Social Authentication */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mb-10">
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={isLoading}
                activeOpacity={0.8}
                className="bg-surface rounded-4xl border border-border/50 h-16 flex-row items-center justify-center gap-x-3"
              >
                <View className="w-6 h-6 items-center justify-center">
                  <HugeiconsIcon icon={GoogleIcon} size={20} color={colors.foreground} />
                </View>
                <Text className="text-sm font-sans-bold text-foreground uppercase tracking-widest">
                  Connect via Google
                </Text>
              </TouchableOpacity>

              <View className="flex-row items-center my-8">
                <View className="flex-1 h-px bg-border/30" />
                <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-[3px] px-4">
                  or use neural uplink
                </Text>
                <View className="flex-1 h-px bg-border/30" />
              </View>
            </Animated.View>

            {/* Manual Form */}
            <Animated.View entering={FadeInDown.delay(400).duration(600)} className="gap-y-6">
              <form.Field
                name="email"
                children={(field) => (
                  <View>
                    <View className="flex-row items-center gap-x-2 mb-3 ml-1">
                      <HugeiconsIcon icon={Mail01Icon} size={14} color={colors.accent} />
                      <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                        Neural Identifier (Email)
                      </Text>
                    </View>
                    <View className="bg-surface rounded-2xl border border-border/50 px-5 h-14 justify-center focus:border-accent">
                      <TextInput
                        className="text-foreground text-sm font-sans-medium placeholder:text-muted-foreground/30"
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        placeholder="your@uplink.com"
                        placeholderTextColor="var(--muted-foreground)/30"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                      />
                    </View>
                    <FieldInfo field={field} />
                  </View>
                )}
              />

              <form.Field
                name="password"
                children={(field) => (
                  <View>
                    <View className="flex-row items-center justify-between mb-3 ml-1">
                      <View className="flex-row items-center gap-x-2">
                        <HugeiconsIcon icon={LockPasswordIcon} size={14} color={colors.accent} />
                        <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                          Access Key
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
                          color={colors.accent}
                        />
                      </TouchableOpacity>
                    </View>
                    <View className="bg-surface rounded-2xl border border-border/50 px-5 h-14 justify-center focus:border-accent">
                      <TextInput
                        className="text-foreground text-sm font-sans-medium placeholder:text-muted-foreground/30"
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        placeholder="••••••••"
                        placeholderTextColor="var(--muted-foreground)/30"
                        secureTextEntry={!showPassword}
                        autoCorrect={false}
                        autoComplete="password"
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
                    className={`h-16 rounded-4xl flex-row items-center justify-center gap-x-3 mt-4 shadow-xl ${
                      !canSubmit || isSubmitting || isLoading
                        ? "bg-muted opacity-50"
                        : "bg-foreground shadow-black/20"
                    }`}
                  >
                    {isSubmitting || isLoading ? (
                      <ActivityIndicator color={colors.background} />
                    ) : (
                      <>
                        <Text className="text-sm font-sans-bold text-background uppercase tracking-widest">
                          Authorize Access
                        </Text>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={18}
                          color={colors.background}
                        />
                      </>
                    )}
                  </TouchableOpacity>
                )}
              />

              <View className="mt-8 flex-row justify-center items-center">
                <Text className="text-xs font-sans text-muted-foreground">
                  New to the ecosystem?{" "}
                </Text>
                <Pressable>
                  <Link href="/sign-up" asChild>
                    <Text className="text-xs font-sans-bold text-foreground uppercase tracking-widest underline">
                      Register Entity
                    </Text>
                  </Link>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}
