import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Camera01Icon,
  Tick01Icon,
  AiMagicIcon,
  Mail01Icon,
  Calendar03Icon,
  FingerPrintIcon,
  Settings04Icon,
  SparklesIcon,
  PencilEdit01Icon,
  Cancel01Icon,
  Target02Icon,
  FlashIcon,
  Target01Icon,
  Compass01Icon,
  DashboardSquare01Icon,
  Time01Icon,
  RocketIcon,
  EnergyIcon,
  AiChat01Icon,
  Clock01Icon,
  PlusSignIcon,
  Delete02Icon,
  WorkIcon,
} from "@hugeicons/core-free-icons";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/auth-store";
import { Container } from "@/components/ui/container";
import { orpc } from "@/utils/orpc";
import { useAppTheme } from "@/contexts/app-theme-context";
import { useSemanticColors } from "@/utils/theme";
import Animated, { FadeInUp, FadeInDown, LinearTransition } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { usePreferences, useUpdatePreferences } from "@/hooks/usePreferences";

const COACH_TONES = ["encouraging", "direct", "analytical", "friendly"] as const;

export default function ProfileDynamicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { isLight } = useAppTheme();
  const router = useRouter();
  const colors = useSemanticColors();

  const isEditProfile = id === "edit-profile";
  const isEditPreferences = id === "edit-preferences";

  // Data Fetching
  const { data: preferencesResponse, isLoading: isPreferencesLoading } = usePreferences();
  const preferences = preferencesResponse?.data;
  const updatePreferences = useUpdatePreferences();

  // Profile State
  const [profileName, setProfileName] = useState(user?.name || "");

  // Goal Preferences State
  const [taskComplexity, setTaskComplexity] = useState<"Simple" | "Balanced" | "Ambitious">(
    "Balanced",
  );
  const [defaultFocusArea, setDefaultFocusArea] = useState("");
  const [weekendPreference, setWeekendPreference] = useState<"Work" | "Rest" | "Mixed">("Mixed");
  const [preferredTaskDuration, setPreferredTaskDuration] = useState(45);

  // AI Coach & Schedule State
  const [coachName, setCoachName] = useState("Coach");
  const [coachTone, setCoachTone] = useState<(typeof COACH_TONES)[number]>("encouraging");
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("17:00");
  const [commitments, setCommitments] = useState<any[]>([]);

  // Sync preference state when data arrives
  useEffect(() => {
    if (preferences) {
      setTaskComplexity(preferences.taskComplexity || "Balanced");
      setDefaultFocusArea(preferences.defaultFocusArea || "");
      setWeekendPreference(preferences.weekendPreference || "Mixed");
      setPreferredTaskDuration(preferences.preferredTaskDuration || 45);
      setCoachName(preferences.coachName || "Coach");
      setCoachTone(preferences.coachTone || "encouraging");
      setWorkingHoursStart(preferences.workingHoursStart || "09:00");
      setWorkingHoursEnd(preferences.workingHoursEnd || "17:00");
      setCommitments(preferences.fixedCommitmentsJson?.commitments || []);
    }
  }, [preferences]);

  // Profile Mutation
  const updateProfileMutation = useMutation(
    orpc.user.updateProfile.mutationOptions({
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Profile alignment complete.");
        router.back();
      },
      onError: (err) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", err.message || "Failed to update profile");
      },
    }),
  );

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isEditProfile) {
      updateProfileMutation.mutate({ name: profileName });
    } else if (isEditPreferences) {
      updatePreferences.mutate(
        {
          taskComplexity,
          weekendPreference,
          preferredTaskDuration,
          coachName,
          coachTone,
          workingHoursStart,
          workingHoursEnd,
          defaultFocusArea,
          fixedCommitmentsJson: { commitments },
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Goal architecture optimized.");
            router.back();
          },
          onError: (err: any) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", err.message || "Failed to update preferences");
          },
        },
      );
    }
  }, [
    isEditProfile,
    isEditPreferences,
    profileName,
    taskComplexity,
    defaultFocusArea,
    weekendPreference,
    preferredTaskDuration,
    coachName,
    coachTone,
    workingHoursStart,
    workingHoursEnd,
    commitments,
    updateProfileMutation,
    updatePreferences,
  ]);

  const addCommitment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCommitments([
      ...commitments,
      { dayOfWeek: "Monday", startTime: "09:00", endTime: "10:00", description: "Fixed Activity" },
    ]);
  };

  const removeCommitment = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCommitments(commitments.filter((_, i) => i !== index));
  };

  const updateCommitment = (index: number, field: string, value: string) => {
    const newCommitments = [...commitments];
    newCommitments[index] = { ...newCommitments[index], [field]: value };
    setCommitments(newCommitments);
  };

  const isPending = updateProfileMutation.isPending || updatePreferences.isPending;

  return (
    <Container className="bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTitle: "",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                router.back();
              }}
              className="ml-4 w-10 h-10 rounded-full bg-surface border border-border/50 items-center justify-center"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="var(--foreground)" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isPending || (isEditProfile && !profileName.trim())}
              className="mr-4 px-4 h-10 rounded-2xl bg-foreground items-center justify-center flex-row gap-x-2"
            >
              {isPending ? (
                <ActivityIndicator size="small" color="var(--background)" />
              ) : (
                <>
                  <Text className="text-background font-sans-bold text-xs uppercase tracking-widest">
                    Done
                  </Text>
                  <HugeiconsIcon icon={Tick01Icon} size={14} color="var(--background)" />
                </>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {isEditProfile ? (
          <View className="px-6">
            <Animated.View entering={FadeInUp.duration(600)} className="mb-10 mt-4">
              <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-[3px] mb-1">
                Security clearance: Level 1
              </Text>
              <Text className="text-3xl font-sans-bold text-foreground">Identity Profile</Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              className="items-center mb-10"
            >
              <View className="relative">
                <View className="w-32 h-32 rounded-[40px] border-4 border-surface shadow-2xl overflow-hidden bg-muted/20">
                  <Image
                    source={{
                      uri:
                        user?.image ||
                        `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=random`,
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  className="absolute bottom-0 right-0 bg-accent w-10 h-10 rounded-2xl items-center justify-center border-4 border-background shadow-lg shadow-accent/20"
                >
                  <HugeiconsIcon icon={Camera01Icon} size={18} color="white" />
                </TouchableOpacity>
              </View>
              <View className="mt-6 items-center">
                <Text className="text-xl font-sans-bold text-foreground">
                  {profileName || user?.name || "Zen Identity"}
                </Text>
                <View className="flex-row items-center gap-x-1.5 mt-1 bg-surface px-3 py-1 rounded-full border border-border/50">
                  <HugeiconsIcon icon={AiMagicIcon} size={12} color="var(--muted-foreground)" />
                  <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest leading-4">
                    Neural Verified
                  </Text>
                </View>
              </View>
            </Animated.View>

            <View className="gap-y-8">
              <View>
                <View className="flex-row items-center gap-x-2 mb-4">
                  <View className="w-8 h-8 rounded-xl bg-surface border border-border/50 items-center justify-center">
                    <HugeiconsIcon icon={FingerPrintIcon} size={16} color={colors.foreground} />
                  </View>
                  <Text className="text-sm font-sans-bold text-foreground">Primary Identifier</Text>
                </View>
                <View className="bg-surface rounded-[24px] border border-border/50 px-5 py-5 focus:border-accent">
                  <TextInput
                    className="text-foreground text-lg font-sans-medium"
                    value={profileName}
                    onChangeText={setProfileName}
                    placeholder="Identify yourself..."
                    placeholderTextColor="var(--muted-foreground)"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View>
                <View className="flex-row items-center gap-x-2 mb-4">
                  <View className="w-8 h-8 rounded-xl bg-surface border border-border/50 items-center justify-center">
                    <HugeiconsIcon icon={Settings04Icon} size={16} color="var(--foreground)" />
                  </View>
                  <Text className="text-sm font-sans-bold text-foreground">Neural Registry</Text>
                </View>
                <View className="bg-surface/50 rounded-[32px] border border-border/30 p-1">
                  <MetadataRow
                    icon={Mail01Icon}
                    label="Neural Uplink"
                    value={user?.email || "Anonymous Connection"}
                  />
                  <MetadataRow
                    icon={Calendar03Icon}
                    label="Initialization"
                    value={
                      user?.createdAt
                        ? format(new Date(user.createdAt), "MMMM d, yyyy")
                        : "Alpha Entry"
                    }
                  />
                  <MetadataRow
                    icon={FingerPrintIcon}
                    label="System UUID"
                    value={user?.id || "Temporary ID"}
                    isLast
                  />
                </View>
              </View>
            </View>
          </View>
        ) : isEditPreferences ? (
          <View className="px-6">
            <Animated.View entering={FadeInUp.duration(600)} className="mb-10 mt-4">
              <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-[3px] mb-1">
                Algorithm Tuning
              </Text>
              <Text className="text-3xl font-sans-bold text-foreground">Goal Architecture</Text>
            </Animated.View>

            {isPreferencesLoading ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="large" color="var(--accent)" />
                <Text className="mt-4 text-muted-foreground font-sans-bold uppercase tracking-widest text-xs">
                  Syncing Neural Data...
                </Text>
              </View>
            ) : (
              <View className="gap-y-10">
                {/* 1. AI Companion Personality */}
                <Section icon={AiChat01Icon} title="Companion Intelligence">
                  <View className="bg-surface rounded-[32px] border border-border/50 p-6 mb-4">
                    <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
                      Identity Baseline
                    </Text>
                    <View className="flex-row items-center gap-x-3 mb-6">
                      <View className="w-12 h-12 rounded-2xl bg-accent items-center justify-center shadow-lg shadow-accent/20">
                        <HugeiconsIcon icon={AiMagicIcon} size={24} color="white" />
                      </View>
                      <View className="flex-1">
                        <TextInput
                          className="text-foreground text-lg font-sans-bold"
                          value={coachName}
                          onChangeText={setCoachName}
                          placeholder="Name your AI..."
                          placeholderTextColor="var(--muted-foreground)/40"
                        />
                        <Text className="text-[10px] font-sans-medium text-muted-foreground">
                          Neutral Name Registry
                        </Text>
                      </View>
                    </View>

                    <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
                      Interaction Tone
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {COACH_TONES.map((tone) => {
                        const active = coachTone === tone;
                        return (
                          <TouchableOpacity
                            key={tone}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setCoachTone(tone);
                            }}
                            className={`px-4 py-2.5 rounded-xl border ${active ? "bg-foreground border-foreground" : "bg-muted/5 border-border/50"}`}
                          >
                            <Text
                              className={`text-[10px] font-sans-bold uppercase tracking-widest ${active ? "text-background" : "text-muted-foreground"}`}
                            >
                              {tone}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </Section>

                {/* 2. Operational Hours */}
                <Section icon={Clock01Icon} title="Temporal Parameters">
                  <View className="bg-surface rounded-[32px] border border-border/50 p-6 flex-row gap-x-4">
                    <View className="flex-1">
                      <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
                        Online
                      </Text>
                      <View className="bg-muted/5 border border-border/50 rounded-2xl px-4 py-3">
                        <TextInput
                          className="text-foreground font-sans-bold text-base"
                          value={workingHoursStart}
                          onChangeText={setWorkingHoursStart}
                          placeholder="09:00"
                          placeholderTextColor="var(--muted-foreground)/40"
                        />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
                        Offline
                      </Text>
                      <View className="bg-muted/5 border border-border/50 rounded-2xl px-4 py-3">
                        <TextInput
                          className="text-foreground font-sans-bold text-base"
                          value={workingHoursEnd}
                          onChangeText={setWorkingHoursEnd}
                          placeholder="17:00"
                          placeholderTextColor="var(--muted-foreground)/40"
                        />
                      </View>
                    </View>
                  </View>
                </Section>

                {/* 3. Operating Habitat */}
                <Section icon={Compass01Icon} title="Operating Habitat">
                  <View className="bg-surface rounded-[24px] border border-border/50 px-5 py-5">
                    <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
                      Default Focus Area
                    </Text>
                    <TextInput
                      className="text-foreground text-base font-sans-medium"
                      value={defaultFocusArea}
                      onChangeText={setDefaultFocusArea}
                      placeholder="e.g. Health"
                      placeholderTextColor="var(--muted-foreground)/50"
                    />
                  </View>
                </Section>

                {/* 5. Fixed Commitments */}
                <Section icon={WorkIcon} title="Fixed Commitments">
                  <View className="gap-y-4">
                    {commitments.map((item, index) => (
                      <Animated.View
                        key={index}
                        layout={LinearTransition}
                        entering={FadeInDown}
                        className="bg-surface rounded-[24px] border border-border/50 p-5"
                      >
                        <View className="flex-row items-center justify-between mb-4">
                          <View className="flex-row items-center gap-x-2">
                            <View className="w-8 h-8 rounded-lg bg-muted/5 items-center justify-center border border-border/50">
                              <HugeiconsIcon
                                icon={Clock01Icon}
                                size={14}
                                color="var(--foreground)"
                              />
                            </View>
                            <Text className="text-sm font-sans-bold text-foreground">
                              Anchor {index + 1}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => removeCommitment(index)}>
                            <HugeiconsIcon icon={Delete02Icon} size={18} color="var(--danger)" />
                          </TouchableOpacity>
                        </View>

                        <TextInput
                          className="text-foreground font-sans-bold text-base mb-4 bg-muted/5 rounded-xl px-4 py-2 border border-border/30"
                          value={item.description}
                          onChangeText={(val) => updateCommitment(index, "description", val)}
                          placeholder="Activity Description"
                          placeholderTextColor="var(--muted-foreground)/40"
                        />

                        <View className="flex-row gap-x-3">
                          <TextInput
                            className="flex-1 text-foreground font-sans-medium text-sm bg-muted/5 rounded-xl px-4 py-2 border border-border/30"
                            value={item.dayOfWeek}
                            onChangeText={(val) => updateCommitment(index, "dayOfWeek", val)}
                            placeholder="Day (e.g. Monday)"
                            placeholderTextColor="var(--muted-foreground)/40"
                          />
                          <TextInput
                            className="w-20 text-foreground font-sans-medium text-sm bg-muted/5 rounded-xl px-4 py-2 border border-border/30 text-center"
                            value={item.startTime}
                            onChangeText={(val) => updateCommitment(index, "startTime", val)}
                            placeholder="Start"
                            placeholderTextColor="var(--muted-foreground)/40"
                          />
                          <TextInput
                            className="w-20 text-foreground font-sans-medium text-sm bg-muted/5 rounded-xl px-4 py-2 border border-border/30 text-center"
                            value={item.endTime}
                            onChangeText={(val) => updateCommitment(index, "endTime", val)}
                            placeholder="End"
                            placeholderTextColor="var(--muted-foreground)/40"
                          />
                        </View>
                      </Animated.View>
                    ))}

                    <TouchableOpacity
                      onPress={addCommitment}
                      className="h-14 rounded-2xl border-2 border-dashed border-border/50 items-center justify-center flex-row gap-x-2 bg-muted/5"
                    >
                      <HugeiconsIcon
                        icon={PlusSignIcon}
                        size={18}
                        color="var(--muted-foreground)"
                      />
                      <Text className="text-sm font-sans-bold text-muted-foreground uppercase tracking-widest">
                        Register Anchor
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Section>

                {/* 6. Intensity Protocol */}
                <Section icon={FlashIcon} title="Intensity Protocol">
                  <View className="flex-row gap-x-2 mb-6">
                    {(["Simple", "Balanced", "Ambitious"] as const).map((level) => {
                      const active = taskComplexity === level;
                      return (
                        <TouchableOpacity
                          key={level}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setTaskComplexity(level);
                          }}
                          className={`flex-1 py-5 rounded-[24px] border items-center ${active ? "bg-foreground border-foreground shadow-lg shadow-black/20" : "bg-surface border-border/50"}`}
                        >
                          <Text
                            className={`text-[10px] font-sans-bold uppercase tracking-widest ${active ? "text-background" : "text-muted-foreground"}`}
                          >
                            {level}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View className="bg-surface rounded-[24px] border border-border/50 p-5 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-x-3">
                      <View className="w-10 h-10 rounded-xl bg-muted/5 items-center justify-center border border-border/30">
                        <HugeiconsIcon icon={Time01Icon} size={18} color="var(--foreground)" />
                      </View>
                      <View>
                        <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-1">
                          Task Duration
                        </Text>
                        <Text className="text-base font-sans-bold text-foreground">
                          {preferredTaskDuration} Minutes
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row gap-x-2">
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setPreferredTaskDuration(Math.max(15, preferredTaskDuration - 15));
                        }}
                        className="w-10 h-10 rounded-xl bg-muted/10 items-center justify-center"
                      >
                        <Text className="text-xl font-sans-bold text-foreground">-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setPreferredTaskDuration(preferredTaskDuration + 15);
                        }}
                        className="w-10 h-10 rounded-xl bg-muted/10 items-center justify-center"
                      >
                        <Text className="text-xl font-sans-bold text-foreground">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Section>

                {/* 7. Temporal Balance */}
                <Section icon={DashboardSquare01Icon} title="Temporal Balance">
                  <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-4 ml-1">
                    Weekend Strategy
                  </Text>
                  <View className="flex-row gap-x-2">
                    {(["Rest", "Mixed", "Work"] as const).map((strategy) => {
                      const active = weekendPreference === strategy;
                      const getIcon = () => {
                        if (strategy === "Rest") return EnergyIcon;
                        if (strategy === "Work") return RocketIcon;
                        return SparklesIcon;
                      };
                      return (
                        <TouchableOpacity
                          key={strategy}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setWeekendPreference(strategy);
                          }}
                          className={`flex-1 py-4 rounded-[24px] border items-center gap-y-2 ${active ? "bg-accent border-accent shadow-lg shadow-accent/20" : "bg-surface border-border/50"}`}
                        >
                          <HugeiconsIcon
                            icon={getIcon()}
                            size={16}
                            color={active ? "white" : "var(--muted-foreground)"}
                          />
                          <Text
                            className={`text-[10px] font-sans-bold uppercase tracking-widest ${active ? "text-white" : "text-foreground"}`}
                          >
                            {strategy}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Section>
              </View>
            )}
          </View>
        ) : (
          <View className="items-center justify-center mt-20">
            <Text className="text-muted-foreground font-sans-medium">Protocol missing.</Text>
          </View>
        )}
      </ScrollView>
    </Container>
  );
}

function Section({ icon, title, children }: any) {
  return (
    <Animated.View layout={LinearTransition} className="mb-2">
      <View className="flex-row items-center gap-x-2 mb-4 px-1">
        <View className="w-8 h-8 rounded-xl bg-surface items-center justify-center border border-border/50">
          <HugeiconsIcon icon={icon} size={16} color="var(--muted-foreground)" />
        </View>
        <Text className="text-base font-sans-bold text-foreground">{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

function MetadataRow({ icon, label, value, isLast }: any) {
  return (
    <View
      className={`flex-row items-center px-6 py-5 ${!isLast ? "border-b border-border/20" : ""}`}
    >
      <View className="w-8 h-8 rounded-xl bg-muted/5 items-center justify-center mr-4 border border-border/20">
        <HugeiconsIcon icon={icon} size={14} color="var(--muted-foreground)" />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest mb-1">
          {label}
        </Text>
        <Text className="text-sm font-sans-medium text-foreground">{value}</Text>
      </View>
    </View>
  );
}
