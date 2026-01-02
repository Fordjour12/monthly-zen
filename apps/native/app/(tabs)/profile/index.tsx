import React from "react";
import { View, Text, TouchableOpacity, Image, Alert, Switch } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { useAuthStore } from "@/stores/auth-store";
import { Container } from "@/components/ui/container";
import { useAppTheme } from "@/contexts/app-theme-context";

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { isLight, toggleTheme } = useAppTheme();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/sign-in");
        },
      },
    ]);
  };

  const handleSupport = () => {
    Linking.openURL("mailto:support@monthlyzen.com");
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-6">
      <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-4 mb-2">
        {title}
      </Text>
      <View className="bg-surface rounded-2xl overflow-hidden border border-border shadow-sm">
        {children}
      </View>
    </View>
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
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    isLast?: boolean;
    isDestructive?: boolean;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center px-4 py-3.5 bg-surface ${
        !isLast ? "border-b border-border" : ""
      }`}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
          isDestructive ? "bg-red-100 dark:bg-red-900/30" : "bg-muted/30"
        }`}
      >
        <Ionicons
          name={icon}
          size={18}
          color={isDestructive ? "#ef4444" : isLight ? "#525252" : "#a3a3a3"}
        />
      </View>
      <Text
        className={`flex-1 text-base font-medium ${
          isDestructive ? "text-red-500" : "text-foreground"
        }`}
      >
        {label}
      </Text>
      {value && <Text className="text-muted-foreground text-sm mr-2">{value}</Text>}
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color={isLight ? "#d4d4d4" : "#525252"} />
      )}
    </TouchableOpacity>
  );

  return (
    <Container>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 pb-24 pt-12">
        <View className="px-4 mb-8">
          <Text className="text-3xl font-bold text-foreground">Profile</Text>
        </View>

        {/* User Card */}
        <View className="px-4 mb-8">
          <View className="flex-row items-center bg-surface p-4 rounded-3xl border border-border shadow-sm">
            <Image
              source={{
                uri:
                  user?.image ||
                  `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=random`,
              }}
              className="w-16 h-16 rounded-full border-2 border-surface shadow-sm"
            />
            <View className="ml-4 flex-1">
              <Text className="text-xl font-bold text-foreground">{user?.name || "User"}</Text>
              <Text className="text-muted-foreground">{user?.email || "No email"}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                router.push("/profile/edit-profile");
              }}
              className="w-10 h-10 rounded-full bg-muted/20 items-center justify-center"
            >
              <Ionicons name="pencil" size={20} color={isLight ? "#525252" : "#a3a3a3"} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-4">
          <Section title="Account Settings">
            <Row
              icon="person-outline"
              label="Goal Preferences"
              onPress={() => router.push("/profile/edit-preferences")}
            />
            <Row
              icon="notifications-outline"
              label="Notifications"
              rightElement={
                <Switch
                  trackColor={{ false: "#767577", true: "#3b82f6" }}
                  thumbColor={"#f4f3f4"}
                  ios_backgroundColor="#3e3e3e"
                  value={true} // TODO: Connect to state
                  onValueChange={() => {}}
                />
              }
            />
            <Row
              icon="moon-outline"
              label="Dark Mode"
              isLast
              rightElement={
                <Switch
                  trackColor={{ false: "#767577", true: "#3b82f6" }}
                  thumbColor={"#f4f3f4"}
                  ios_backgroundColor="#3e3e3e"
                  value={!isLight}
                  onValueChange={toggleTheme}
                />
              }
            />
          </Section>

          <Section title="Support">
            <Row
              icon="help-circle-outline"
              label="Help Center"
              onPress={() => router.push("/profile/help")}
            />
            <Row icon="mail-outline" label="Contact Support" onPress={handleSupport} />
            <Row
              icon="document-text-outline"
              label="Terms & Privacy"
              onPress={() => router.push("/profile/terms")}
              isLast
            />
          </Section>

          <Section title="Danger Zone">
            <Row
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleSignOut}
              isDestructive
              isLast
            />
          </Section>

          <View className="items-center mt-8">
            <Text className="text-xs text-muted-foreground text-center">
              Version {Constants.expoConfig?.version || "1.0.0"}
            </Text>
            <Text className="text-xs text-muted-foreground/50 text-center mt-1">
              Monthly Zen © {new Date().getFullYear()}
            </Text>
          </View>
        </View>
      </View>
    </Container>
  );
}
