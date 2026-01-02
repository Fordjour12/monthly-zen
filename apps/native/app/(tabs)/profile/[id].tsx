import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { Container } from "@/components/ui/container";
import { orpc } from "@/utils/orpc";
import { useAppTheme } from "@/contexts/app-theme-context";

export default function ProfileDynamicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { isLight } = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isEditProfile = id === "edit-profile";
  const isEditPreferences = id === "edit-preferences";

  // Form State for Profile
  const [name, setName] = useState(user?.name || "");

  // Profile Mutation
  const updateProfileMutation = useMutation(
    orpc.user.updateProfile.mutationOptions({
      onSuccess: () => {
        Alert.alert("Success", "Profile updated successfully");
        router.back();
      },
      onError: (err) => {
        Alert.alert("Error", err.message || "Failed to update profile");
      },
    }),
  );

  const handleSave = () => {
    if (isEditProfile) {
      updateProfileMutation.mutate({ name });
    } else {
      Alert.alert("Coming Soon", "Preference editing is currently being optimized.");
    }
  };

  return (
    <Container>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isEditProfile
            ? "Edit Profile"
            : isEditPreferences
              ? "Edit Preferences"
              : "Settings",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
              <Ionicons name="chevron-back" size={28} color={isLight ? "#000" : "#fff"} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 p-4" contentContainerClassName="pb-10">
        {isEditProfile ? (
          <View>
            <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 ml-1">
              Display Name
            </Text>
            <View className="bg-surface rounded-2xl border border-border px-4 py-3 mb-6">
              <TextInput
                className="text-foreground text-lg"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#a3a3a3"
              />
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={updateProfileMutation.isPending}
              className="bg-primary h-14 rounded-2xl items-center justify-center shadow-sm"
            >
              {updateProfileMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-bold">Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : isEditPreferences ? (
          <View className="items-center justify-center mt-20">
            <Ionicons name="construct-outline" size={64} color="#a3a3a3" />
            <Text className="text-xl font-bold text-foreground mt-4">Goal Preferences</Text>
            <Text className="text-muted-foreground text-center mt-2 px-6">
              We're fine-tuning the AI preference engine. This feature will be available shortly.
            </Text>
          </View>
        ) : (
          <View className="items-center justify-center mt-20">
            <Text className="text-muted-foreground">Screen not found</Text>
          </View>
        )}
      </ScrollView>
    </Container>
  );
}
