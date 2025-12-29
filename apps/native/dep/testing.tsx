import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useMemo } from "react";
import { Container } from "@/components/ui/container";
import { generateMockHeatmapData } from "@/components/ui/heatmap";
import { authClient } from "@/lib/auth-client";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

interface ProfileCompletionData {
  completion: number;
  completedFields: string[];
  incompleteFields: string[];
}

export default function HomeScreen() {
  const { data: session } = authClient.useSession();

  // Mock data for demonstration - replace with actual queries when available
  const { data: profile } = useQuery<{ data: ProfileData }>({
    queryKey: ["profile"],
    queryFn: async () => ({
      data: {
        firstName: session?.user?.name?.split(" ")[0] || "User",
        lastName: session?.user?.name?.split(" ")[1] || "",
        email: session?.user?.email || "user@example.com",
      },
    }),
    initialData: { data: { firstName: "User", lastName: "", email: "user@example.com" } },
  });

  const { data: profileCompletion } = useQuery<{ data: ProfileCompletionData }>({
    queryKey: ["profileCompletion"],
    queryFn: async () => ({
      data: {
        completion: 75,
        completedFields: ["name", "email", "goals"],
        incompleteFields: ["preferences", "notifications"],
      },
    }),
    initialData: { data: { completion: 75, completedFields: [], incompleteFields: [] } },
  });

  // Generate mock heatmap data for the last 4 weeks
  const heatmapData = useMemo(() => generateMockHeatmapData(28), []);
  const today = new Date();

  const navigateToTab = (route: string) => {
    router.push(`/(tabs)/${route}` as any);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Unused handler kept for potential future use
  const _handleDayPress = (day: any) => {
    // Show day details
    console.log("Day pressed:", day.date, `Completed: ${day.completed}/${day.total}`);
  };

  return (
    <Container>
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <View className="py-8">
          <Text className="mb-2 font-bold text-3xl text-foreground">
            {getGreeting()}, {profile?.data?.firstName || session?.user?.name || "there"}! 👋
          </Text>
          <Text className="text-lg text-muted-foreground">
            Your AI-powered habit and life coach is ready to help
          </Text>
        </View>

        {/* Profile Completion Card */}
        {profileCompletion?.data?.completion < 100 && (
          <TouchableOpacity
            className="mb-6 rounded-lg bg-muted p-4"
            onPress={() => navigateToTab("profile-setup")}
          >
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-medium text-foreground">Complete Your Profile</Text>
              <Ionicons color="#666" name="arrow-forward" size={20} />
            </View>
            <View className="mb-2 h-2 w-full rounded-full bg-background">
              <View
                className="h-2 rounded-full bg-primary"
                style={{ width: `${profileCompletion?.data?.completion || 0}%` }}
              />
            </View>
            <Text className="text-sm text-muted-foreground">
              {profileCompletion?.data?.completion || 0}% complete • Get more personalized AI
              insights
            </Text>
          </TouchableOpacity>
        )}

        {/* Heatmap Section */}
        <View className="mb-6">
          <View className="bg-[#18181b] rounded-xl p-4 border border-[#27272a]">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-[#fafafa]">Activity Heatmap</Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-[10px] text-[#71717a] mr-2">Less</Text>
                <View className="w-2.5 h-2.5 rounded-[2px] bg-[#6b7280]/25" />
                <View className="w-2.5 h-2.5 rounded-[2px] bg-[#ef4444]" />
                <View className="w-2.5 h-2.5 rounded-[2px] bg-[#f59e0b]" />
                <View className="w-2.5 h-2.5 rounded-[2px] bg-[#3b82f6]" />
                <View className="w-2.5 h-2.5 rounded-[2px] bg-[#10b981]" />
                <Text className="text-[10px] text-[#71717a] ml-2">More</Text>
              </View>
            </View>
            <View className="flex-row">
              <View className="mr-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
                  <View key={index} className="h-7 mb-1 justify-center">
                    <Text className="text-[10px] text-[#71717a] text-center">{label}</Text>
                  </View>
                ))}
              </View>
              {useMemo(() => {
                const weeks: { date: Date; completed: number; total: number }[][] = [];
                for (let i = 0; i < heatmapData.length; i += 7) {
                  weeks.push(heatmapData.slice(i, i + 7));
                }
                return weeks;
              }, [heatmapData]).map((week, weekIndex) => (
                <View key={weekIndex} className="gap-1 ml-1">
                  {week.map((day, dayIndex) => {
                    const getColor = (completed: number, total: number) => {
                      if (total === 0) return "#6b7280";
                      const rate = completed / total;
                      if (rate === 0) return "#6b7280";
                      if (rate <= 0.25) return "#ef4444";
                      if (rate <= 0.5) return "#f59e0b";
                      if (rate <= 0.75) return "#3b82f6";
                      return "#10b981";
                    };
                    const bgColor = getColor(day.completed, day.total);
                    return (
                      <TouchableOpacity
                        key={dayIndex}
                        className="w-7 h-7 rounded-sm items-center justify-center"
                        style={{
                          backgroundColor: day.total === 0 ? "#6b7280/20" : bgColor + "30",
                          borderWidth: day.total > 0 ? 0 : 1,
                          borderColor: "#27272a",
                        }}
                        activeOpacity={0.7}
                      >
                        {day.total > 0 && (
                          <Text className="text-[8px] font-semibold text-[#fafafa]">
                            {day.completed}/{day.total}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <View className="flex-row justify-end mt-3">
              <Text className="text-[10px] text-[#71717a]">
                {useMemo(() => {
                  const start = new Date(today);
                  start.setDate(today.getDate() - 28 + 1);
                  return start;
                }, []).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                -{" "}
                {useMemo(() => {
                  const start = new Date(today);
                  start.setDate(today.getDate() - 28 + 1);
                  return new Date(start.getTime() + 28 * 24 * 60 * 60 * 1000);
                }, []).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="mb-4 font-semibold text-foreground text-xl">Quick Actions</Text>
          <View className="space-y-3">
            <TouchableOpacity
              className="flex-row items-center rounded-lg bg-primary p-4"
              onPress={() => navigateToTab("ai-chat")}
            >
              <Ionicons color="white" name="chatbubble" size={24} />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-lg text-primary-foreground">
                  Chat with AI Coach
                </Text>
                <Text className="text-primary-foreground/80">
                  Get personalized advice for habits, finances, and life
                </Text>
              </View>
              <Ionicons color="white" name="arrow-forward" size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center rounded-lg bg-green-500 p-4"
              onPress={() => navigateToTab("habit-generation")}
            >
              <Ionicons color="white" name="sparkles" size={24} />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-lg text-white">Generate Habits</Text>
                <Text className="text-white/80">AI-powered personalized habit recommendations</Text>
              </View>
              <Ionicons color="white" name="arrow-forward" size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center rounded-lg bg-blue-500 p-4"
              onPress={() => navigateToTab("habit-tracking")}
            >
              <Ionicons color="white" name="checkmark-circle" size={24} />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-lg text-white">Track Habits</Text>
                <Text className="text-white/80">Monitor your daily progress and consistency</Text>
              </View>
              <Ionicons color="white" name="arrow-forward" size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center rounded-lg bg-secondary p-4"
              onPress={() => navigateToTab("insights")}
            >
              <Ionicons color="white" name="bulb" size={24} />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-lg text-secondary-foreground">View Insights</Text>
                <Text className="text-secondary-foreground/80">
                  AI-powered recommendations based on your patterns
                </Text>
              </View>
              <Ionicons color="white" name="arrow-forward" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vector AI Features */}
        <View className="mb-6">
          <Text className="mb-4 font-semibold text-foreground text-xl">🤖 AI-Powered Features</Text>
          <View className="rounded-lg bg-muted p-4">
            <Text className="mb-3 font-medium text-foreground">
              Vector-Enhanced Personalization
            </Text>
            <View className="space-y-2">
              <View className="flex-row items-center">
                <Ionicons color="#10b981" name="checkmark-circle" size={16} />
                <Text className="ml-2 text-sm text-foreground">
                  Similarity search for consistent AI responses
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons color="#10b981" name="checkmark-circle" size={16} />
                <Text className="ml-2 text-sm text-foreground">
                  Pattern recognition from your behavior data
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons color="#10b981" name="checkmark-circle" size={16} />
                <Text className="ml-2 text-sm text-foreground">
                  Peer learning with similar users
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons color="#10b981" name="checkmark-circle" size={16} />
                <Text className="ml-2 text-sm text-foreground">
                  Semantic search through knowledge base
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Daily Motivation */}
        <View className="mb-6">
          <Text className="mb-4 font-semibold text-foreground text-xl">💪 Daily Motivation</Text>
          <View className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-4">
            <Text className="mb-2 font-medium text-white">Ready to transform your life?</Text>
            <Text className="text-white/90">
              Your AI coach learns from your patterns and provides increasingly personalized advice.
              The more you interact, the smarter it gets!
            </Text>
          </View>
        </View>

        {/* Stats Preview */}
        <View className="mb-6">
          <Text className="mb-4 font-semibold text-foreground text-xl">📊 Your Progress</Text>
          <View className="flex-row space-x-3">
            <View className="flex-1 rounded-lg border border-border bg-card p-4">
              <Text className="font-bold text-2xl text-foreground">
                {profileCompletion?.data?.completion || 0}%
              </Text>
              <Text className="text-sm text-muted-foreground">Profile Complete</Text>
            </View>
            <View className="flex-1 rounded-lg border border-border bg-card p-4">
              <Text className="font-bold text-2xl text-foreground">AI</Text>
              <Text className="text-sm text-muted-foreground">Coach Ready</Text>
            </View>
            <View className="flex-1 rounded-lg border border-border bg-card p-4">
              <Text className="font-bold text-2xl text-foreground">🔒</Text>
              <Text className="text-sm text-muted-foreground">Vector AI</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
