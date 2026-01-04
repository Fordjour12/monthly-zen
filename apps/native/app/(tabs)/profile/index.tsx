import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, Image, Alert, Switch, ScrollView } from "react-native";
import { Stack, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Settings02Icon,
  UserCircleIcon,
  Notification03Icon,
  MoonIcon,
  HelpCircleIcon,
  Mail01Icon,
  Doc01Icon,
  Logout01Icon,
  PencilEdit01Icon,
  SparklesIcon,
  ArrowRight01Icon,
  WorkIcon,
  ChampionFreeIcons,
  Target02Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { useAuthStore } from "@/stores/auth-store";
import { Container } from "@/components/ui/container";
import { useAppTheme } from "@/contexts/app-theme-context";
import { useSemanticColors } from "@/utils/theme";
import Animated, { FadeInUp, FadeInDown, LinearTransition } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

export default function ProfileScreen() {
  const { user, signOut, hasCompletedOnboarding } = useAuthStore();
  const { isLight, toggleTheme } = useAppTheme();
  const router = useRouter();
  const colors = useSemanticColors();

  const handleSignOut = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Sign Out", "Are you sure you want to sign out from the Zen system?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/sign-in");
        },
      },
    ]);
  }, [signOut, router]);

  const handleSupport = useCallback(() => {
    Haptics.selectionAsync();
    Linking.openURL("mailto:support@monthlyzen.com");
  }, []);

  const Section = ({
    title,
    children,
    index,
  }: {
    title: string;
    children: React.ReactNode;
    index: number;
  }) => (
    <Animated.View entering={FadeInDown.delay(400 + index * 100).duration(600)} className="mb-8">
      <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-[3px] ml-6 mb-4">
        {title}
      </Text>
      <View className="bg-surface rounded-[32px] overflow-hidden border border-border/50 shadow-sm mx-4">
        {children}
      </View>
    </Animated.View>
  );

  const Row = ({
    icon,
    label,
    value,
    onPress,
    isLast,
    isDestructive,
    rightElement,
  }: {
    icon: any;
    label: string;
    value?: string;
    onPress?: () => void;
    isLast?: boolean;
    isDestructive?: boolean;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      onPress={() => {
        if (onPress) {
          Haptics.selectionAsync();
          onPress();
        }
      }}
      disabled={!onPress}
      className={`flex-row items-center px-6 py-5 bg-surface ${
        !isLast ? "border-b border-border/30" : ""
      }`}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 ${
          isDestructive ? "bg-danger/10" : "bg-muted/5 border border-border/30"
        }`}
      >
        <HugeiconsIcon
          icon={icon}
          size={20}
          color={isDestructive ? "var(--danger)" : "var(--foreground)"}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-base font-sans-semibold ${
            isDestructive ? "text-danger" : "text-foreground"
          }`}
        >
          {label}
        </Text>
        {value && (
          <Text className="text-muted-foreground text-xs font-sans-medium mt-0.5">{value}</Text>
        )}
      </View>

      {rightElement || (
        <View className="w-8 h-8 rounded-full bg-muted/5 items-center justify-center">
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="var(--muted-foreground)" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Container className="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 120 }}
      >
        {/* Header Section */}
        <Animated.View
          entering={FadeInUp.duration(600)}
          className="px-6 mb-8 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-[3px] mb-1">
              Command Center
            </Text>
            <Text className="text-3xl font-sans-bold text-foreground">Settings</Text>
          </View>
          <View className="w-12 h-12 rounded-2xl bg-surface border border-border/50 items-center justify-center shadow-sm">
            <HugeiconsIcon icon={Settings02Icon} size={24} color={colors.foreground} />
          </View>
        </Animated.View>

        {/* User Intelligence Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="px-4 mb-10">
          <View className="bg-foreground/50 rounded-[40px] p-6 shadow-xl shadow-black/20 relative overflow-hidden">
            {/* Background Decorative Element */}
            <View className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full" />
            <View className="absolute -left-5 -top-5 w-24 h-24 bg-white/5 rounded-full" />

            <View className="flex-row items-center">
              <View className="relative">
                <Image
                  source={{
                    uri:
                      user?.image ||
                      `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=random`,
                  }}
                  className="w-20 h-20 rounded-[28px] border-2 border-white/20 shadow-lg"
                />
                <TouchableOpacity
                  onPress={() => router.push("/profile/edit-profile")}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-accent items-center justify-center border-2 border-foreground shadow-sm"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={14} color="white" />
                </TouchableOpacity>
              </View>

              <View className="ml-5 flex-1">
                <Text className="text-xl font-sans-bold text-white mb-1">
                  {user?.name || "Zen User"}
                </Text>
                <View className="bg-white/10 self-start px-2 py-1 rounded-lg">
                  <Text className="text-[10px] font-sans-bold text-white/70 uppercase tracking-widest">
                    {user?.email || "Guest Account"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row mt-8 gap-x-3">
              <View className="flex-1 bg-white/5 rounded-2xl p-3 items-center border border-white/10">
                <HugeiconsIcon icon={Target02Icon} size={16} color="white" />
                <Text className="text-[9px] font-sans-bold text-white/50 uppercase tracking-widest mt-2">
                  Level
                </Text>
                <Text className="text-sm font-sans-bold text-white">Elite</Text>
              </View>
              <View className="flex-1 bg-white/5 rounded-2xl p-3 items-center border border-white/10">
                <HugeiconsIcon icon={ChampionFreeIcons} size={16} color="white" />
                <Text className="text-[9px] font-sans-bold text-white/50 uppercase tracking-widest mt-2">
                  Streaks
                </Text>
                <Text className="text-sm font-sans-bold text-white">12 Days</Text>
              </View>
              <View className="flex-1 bg-white/5 rounded-2xl p-3 items-center border border-white/10">
                <HugeiconsIcon icon={WorkIcon} size={16} color="white" />
                <Text className="text-[9px] font-sans-bold text-white/50 uppercase tracking-widest mt-2">
                  Plans
                </Text>
                <Text className="text-sm font-sans-bold text-white">4 Active</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Complete Setup Signal */}
        {!hasCompletedOnboarding && (
          <Animated.View entering={FadeInDown.delay(300).duration(600)} className="px-4 mb-10">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/onboarding/welcome");
              }}
              activeOpacity={0.9}
              className="bg-accent/10 border border-accent/20 rounded-[32px] p-6 flex-row items-center gap-x-4"
            >
              <View className="w-12 h-12 rounded-2xl bg-accent items-center justify-center shadow-lg shadow-accent/20">
                <HugeiconsIcon icon={SparklesIcon} size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-sans-bold text-foreground mb-0.5">
                  Initialize System
                </Text>
                <Text className="text-xs font-sans text-muted-foreground">
                  Complete your neural alignment for better insights.
                </Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="var(--accent)" />
            </TouchableOpacity>
          </Animated.View>
        )}

        <Section title="Intelligence Protocol" index={0}>
          <Row
            icon={Target02Icon}
            label="Goal Preferences"
            value="Refine your monthly focus"
            onPress={() => router.push("/profile/edit-preferences")}
          />
          <Row
            icon={Notification03Icon}
            label="Notifications"
            value="System alerts & reminders"
            rightElement={
              <Switch
                trackColor={{ false: "#d1d5db", true: "var(--accent)" }}
                thumbColor={"#f9fafb"}
                ios_backgroundColor="#d1d5db"
                value={true}
                onValueChange={() => {}}
              />
            }
          />
          <Row
            icon={MoonIcon}
            label="Neural Shade"
            value="Optimized visual experience"
            isLast
            rightElement={
              <Switch
                trackColor={{ false: "#d1d5db", true: "var(--accent)" }}
                thumbColor={"#f9fafb"}
                ios_backgroundColor="#d1d5db"
                value={!isLight}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleTheme();
                }}
              />
            }
          />
        </Section>

        <Section title="Support Network" index={1}>
          <Row
            icon={HelpCircleIcon}
            label="Knowledge Base"
            value="FAQs & user guides"
            onPress={() => router.push("/profile/help")}
          />
          <Row
            icon={Mail01Icon}
            label="Direct Uplink"
            value="Contact the support team"
            onPress={handleSupport}
          />
          <Row
            icon={Shield01Icon}
            label="Security & Privacy"
            value="Read our legal protocols"
            onPress={() => router.push("/profile/terms")}
            isLast
          />
        </Section>

        <Section title="System Access" index={2}>
          <Row
            icon={Logout01Icon}
            label="Terminate Session"
            onPress={handleSignOut}
            isDestructive
            isLast
          />
        </Section>

        <View className="items-center mt-4">
          <View className="bg-surface px-4 py-2 rounded-xl border border-border/50">
            <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-[2px]">
              System Version {Constants.expoConfig?.version || "1.0.0"}
            </Text>
          </View>
          <Text className="text-[9px] font-sans-bold text-muted-foreground/40 mt-3 uppercase tracking-widest">
            Monthly Zen • Neural Network Node
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
}
