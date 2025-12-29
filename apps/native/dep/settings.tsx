import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Card, Button, Divider, RadioGroup, TextField } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { Container } from "@/components/ui/container";
import { useSemanticColors } from "@/utils/theme";
import { Stack } from "expo-router";
import { orpc } from "@/utils/orpc";
import { authClient } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const taskComplexityOptions = [
  { value: "Simple", label: "Simple", description: "Fewer, manageable tasks" },
  { value: "Balanced", label: "Balanced", description: "Mix of easy and challenging" },
  { value: "Ambitious", label: "Ambitious", description: "Challenging but rewarding" },
] as const;

const weekendPreferenceOptions = [
  { value: "Work", label: "Deep Work", description: "Focus on intensive tasks" },
  { value: "Rest", label: "Rest & Recharge", description: "Keep weekends free" },
  { value: "Mixed", label: "Light Tasks", description: "Easy activities only" },
] as const;

export default function SettingsScreen() {
  const { primary, danger } = useSemanticColors();
  const queryClient = useQueryClient();

  // Queries
  const preferencesQuery = useQuery(orpc.user.getPreferences.queryOptions());

  const updatePreferencesMutation = useMutation(
    orpc.user.updatePreferences.mutationOptions({
      onSuccess: () => {
        Alert.alert("Success", "Preferences updated!");
        queryClient.invalidateQueries({ queryKey: ["user", "getPreferences"] });
      },
      onError: (error) => {
        Alert.alert("Error", error.message || "Failed to update preferences");
      },
    }),
  );

  const updateProfileMutation = useMutation(
    orpc.user.updateProfile.mutationOptions({
      onSuccess: () => {
        Alert.alert("Success", "Profile updated!");
        queryClient.invalidateQueries({ queryKey: ["user", "get"] });
      },
      onError: (error) => {
        Alert.alert("Error", error.message || "Failed to update profile");
      },
    }),
  );

  // Local State
  const [goalsText, setGoalsText] = useState("");
  const [taskComplexity, setTaskComplexity] = useState<"Simple" | "Balanced" | "Ambitious">(
    "Balanced",
  );
  const [focusAreas, setFocusAreas] = useState("");
  const [weekendPreference, setWeekendPreference] = useState<"Work" | "Rest" | "Mixed">("Rest");
  const [name, setName] = useState("");

  // Populate form when data is loaded
  useEffect(() => {
    if (preferencesQuery.data) {
      setGoalsText(preferencesQuery.data.goalsText);
      setTaskComplexity(preferencesQuery.data.taskComplexity as any);
      setFocusAreas(preferencesQuery.data.focusAreas);
      setWeekendPreference(preferencesQuery.data.weekendPreference as any);
    }
  }, [preferencesQuery.data]);

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate({
      goalsText,
      taskComplexity,
      focusAreas,
      weekendPreference,
      fixedCommitmentsJson: { commitments: [] }, // Simplified for now
    });
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authClient.signOut();
        },
      },
    ]);
  };

  return (
    <Container>
      <Stack.Screen options={{ title: "Settings", headerShown: false }} />

      <ScrollView className="flex-1 p-4" contentContainerClassName="pb-10">
        <View className="mb-6 mt-4">
          <Text className="text-3xl font-bold text-foreground">Settings</Text>
          <Text className="text-muted-foreground mt-1">
            Manage your profile and plan preferences.
          </Text>
        </View>

        {/* Profile Section */}
        <Card className="p-4 mb-6 border border-border bg-card">
          <View className="flex-row items-center gap-4 mb-4">
            <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
              <Ionicons name="person" size={32} color={primary} />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-foreground">Account</Text>
              <Text className="text-muted-foreground">Manage your identity</Text>
            </View>
          </View>

          <TextField>
            <TextField.Label>Display Name</TextField.Label>
            <TextField.Input value={name} onChangeText={setName} placeholder="Your name" />
          </TextField>

          <Button
            className="mt-4 bg-primary/10 border border-primary/20"
            onPress={() => updateProfileMutation.mutate({ name })}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator size="small" color={primary} />
            ) : (
              <Text className="text-primary font-bold">Update Profile</Text>
            )}
          </Button>
        </Card>

        {/* Plan Preferences Section */}
        <Card className="p-4 mb-6 border border-border bg-card">
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="options" size={24} color={primary} />
            <Text className="text-xl font-bold text-foreground">Plan Defaults</Text>
          </View>

          <View className="space-y-6">
            <TextField>
              <TextField.Label>Default Goals</TextField.Label>
              <TextField.Input
                placeholder="What do you usually aim for?"
                onChangeText={setGoalsText}
                value={goalsText}
                multiline
                numberOfLines={3}
                className="min-h-[80px]"
              />
            </TextField>

            <Divider />

            <View className="space-y-4">
              <Text className="text-sm font-semibold text-foreground">Default Complexity</Text>
              <RadioGroup
                value={taskComplexity}
                onValueChange={(val) => setTaskComplexity(val as any)}
              >
                {taskComplexityOptions.map((opt) => (
                  <RadioGroup.Item key={opt.value} value={opt.value} className="mb-2">
                    <View>
                      <RadioGroup.Label
                        className={
                          taskComplexity === opt.value
                            ? "text-primary font-bold"
                            : "text-foreground"
                        }
                      >
                        {opt.label}
                      </RadioGroup.Label>
                    </View>
                    <RadioGroup.Indicator />
                  </RadioGroup.Item>
                ))}
              </RadioGroup>
            </View>

            <Divider />

            <TextField>
              <TextField.Label>Default Focus Areas</TextField.Label>
              <TextField.Input
                placeholder="Health, Career, etc."
                onChangeText={setFocusAreas}
                value={focusAreas}
              />
            </TextField>

            <Divider />

            <View className="space-y-4">
              <Text className="text-sm font-semibold text-foreground">Weekend Preference</Text>
              <RadioGroup
                value={weekendPreference}
                onValueChange={(val) => setWeekendPreference(val as any)}
              >
                {weekendPreferenceOptions.map((opt) => (
                  <RadioGroup.Item key={opt.value} value={opt.value} className="mb-2">
                    <View>
                      <RadioGroup.Label
                        className={
                          weekendPreference === opt.value
                            ? "text-primary font-bold"
                            : "text-foreground"
                        }
                      >
                        {opt.label}
                      </RadioGroup.Label>
                    </View>
                    <RadioGroup.Indicator />
                  </RadioGroup.Item>
                ))}
              </RadioGroup>
            </View>

            <Button
              className="mt-6 bg-primary"
              onPress={handleSavePreferences}
              disabled={updatePreferencesMutation.isPending}
            >
              {updatePreferencesMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold">Save Preferences</Text>
              )}
            </Button>
          </View>
        </Card>

        {/* Danger Zone */}
        <Button variant="secondary" className="border border-danger/20" onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={danger} />
          <Text className="text-danger font-bold ml-2">Sign Out</Text>
        </Button>
      </ScrollView>
    </Container>
  );
}
