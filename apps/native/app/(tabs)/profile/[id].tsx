import React, { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/auth-store";
import { Container } from "@/components/ui/container";
import { orpc } from "@/utils/orpc";
import { useAppTheme } from "@/contexts/app-theme-context";

export default function ProfileDynamicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { isLight } = useAppTheme();
  const router = useRouter();

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
          headerStyle: {
            backgroundColor: isLight ? "#fff" : "#000",
          },
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
            {/* Header Preview Section */}
            <View className="items-center mb-8 mt-4">
              <View className="relative">
                <View className="w-28 h-28 rounded-full border-4 border-surface shadow-xl overflow-hidden bg-muted">
                  {user?.image ? (
                    <Image
                      source={{ uri: user.image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Image
                      source={require("@/assets/images/default-avatar.png")}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  )}
                </View>
                <View className="absolute bottom-1 right-1 bg-primary w-8 h-8 rounded-full items-center justify-center border-2 border-surface">
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </View>
              <Text className="text-2xl font-bold text-foreground mt-4">
                {name || user?.name || "No Name"}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">{user?.email}</Text>
            </View>

            <View className="space-y-6">
              {/* Editable Name Section */}
              <View>
                <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
                  Display Name
                </Text>
                <View className="bg-surface rounded-2xl border border-border px-4 py-4 mb-4">
                  <TextInput
                    className="text-foreground text-lg font-medium"
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor="#a3a3a3"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Read-only Sections */}
              <View className="bg-surface/50 rounded-2xl border border-border p-4 space-y-4">
                <View>
                  <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                    Email Address
                  </Text>
                  <Text className="text-foreground text-base opacity-70">{user?.email}</Text>
                </View>

                <View className="h-px bg-border w-full" />

                <View>
                  <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                    Joined Date
                  </Text>
                  <Text className="text-foreground text-base opacity-70">
                    {user?.createdAt
                      ? format(new Date(user.createdAt), "MMMM d, yyyy")
                      : "Recently"}
                  </Text>
                </View>

                <View className="h-px bg-border w-full" />

                <View>
                  <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                    User ID
                  </Text>
                  <Text className="text-foreground text-[12px] opacity-50 font-mono">
                    {user?.id}
                  </Text>
                </View>
              </View>

              <View className="mt-8">
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="bg-primary h-16 rounded-2xl items-center justify-center shadow-lg active:opacity-90 transition-all"
                >
                  {updateProfileMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-lg font-bold">Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
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
