import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Container } from "@/components/container";
import { HabitTracker, HabitStreakBadge, HabitCalendar } from "@/components/habit-tracker";
import { Card, useThemeColor } from "heroui-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Mock data - replace with actual API calls
interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly";
  targetValue: number;
  currentStreak: number;
  todayStatus?: "completed" | "partial" | "skipped" | "pending";
  todayValue?: number;
}

interface HabitLog {
  id: string;
  habitId: string;
  date: Date;
  value: number;
  status: "completed" | "partial" | "skipped";
}

export default function HabitsScreen() {
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitTarget, setNewHabitTarget] = useState("1");
  const [newHabitFrequency, setNewHabitFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const foregroundColor = useThemeColor("foreground");

  // Mock query - replace with actual API call
  const {
    data: habits = [],
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      // Mock data - replace with actual API call
      const mockHabits: Habit[] = [
        {
          id: "1",
          title: "Morning Meditation",
          description: "10 minutes of mindfulness meditation",
          frequency: "daily",
          targetValue: 1,
          currentStreak: 7,
          todayStatus: "pending",
        },
        {
          id: "2",
          title: "Exercise",
          description: "30 minutes of physical activity",
          frequency: "daily",
          targetValue: 1,
          currentStreak: 3,
          todayStatus: "completed",
          todayValue: 1,
        },
        {
          id: "3",
          title: "Read Books",
          description: "Read for personal growth",
          frequency: "daily",
          targetValue: 20,
          currentStreak: 14,
          todayStatus: "partial",
          todayValue: 10,
        },
        {
          id: "4",
          title: "Drink Water",
          description: "Stay hydrated throughout the day",
          frequency: "daily",
          targetValue: 8,
          currentStreak: 21,
          todayStatus: "completed",
          todayValue: 8,
        },
      ];

      return mockHabits;
    },
  });

  // Mock query for habit logs - replace with actual API call
  const {
    data: habitLogs = [],
    isLoading: isLoadingLogs,
  } = useQuery({
    queryKey: ["habit-logs", selectedHabit],
    queryFn: async () => {
      if (!selectedHabit) return [];
      
      // Mock logs data - replace with actual API call
      const mockLogs: HabitLog[] = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Random status for demo
        const status = Math.random() > 0.2 ? "completed" : Math.random() > 0.5 ? "partial" : "skipped";
        const value = status === "completed" ? 8 : status === "partial" ? 4 : 0;
        
        mockLogs.push({
          id: `log-${i}`,
          habitId: selectedHabit,
          date,
          value,
          status,
        });
      }
      
      return mockLogs;
    },
    enabled: !!selectedHabit,
  });

  const logHabitMutation = useMutation({
    mutationFn: async ({ habitId, value, status }: { habitId: string; value: number; status: string }) => {
      // Mock API call - replace with actual API call
      console.log("Logging habit:", { habitId, value, status });
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
    },
    onError: (error) => {
      Alert.alert("Error", `Failed to log habit: ${error.message}`);
    },
  });

  const addHabitMutation = useMutation({
    mutationFn: async (habit: { title: string; targetValue: number; frequency: string }) => {
      // Mock API call - replace with actual API call
      console.log("Adding habit:", habit);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, id: Date.now().toString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      setNewHabitTitle("");
      setNewHabitTarget("1");
      setNewHabitFrequency("daily");
      setShowAddHabit(false);
      Alert.alert("Success", "Habit added successfully!");
    },
    onError: (error) => {
      Alert.alert("Error", `Failed to add habit: ${error.message}`);
    },
  });

  const handleLogHabit = (habitId: string, value: number, status: string) => {
    logHabitMutation.mutate({ habitId, value, status });
  };

  const handleAddHabit = () => {
    if (newHabitTitle.trim() && newHabitTarget) {
      addHabitMutation.mutate({
        title: newHabitTitle.trim(),
        targetValue: parseInt(newHabitTarget),
        frequency: newHabitFrequency,
      });
    }
  };

  const getHabitStats = () => {
    const total = habits.length;
    const completedToday = habits.filter(h => h.todayStatus === "completed").length;
    const partialToday = habits.filter(h => h.todayStatus === "partial").length;
    const pendingToday = habits.filter(h => h.todayStatus === "pending").length;
    const longestStreak = Math.max(...habits.map(h => h.currentStreak), 0);
    
    return { total, completedToday, partialToday, pendingToday, longestStreak };
  };

  const stats = getHabitStats();

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "sunny-outline";
      case "weekly":
        return "calendar-outline";
      case "monthly":
        return "calendar-number-outline";
      default:
        return "help-circle-outline";
    }
  };

  return (
    <Container className="p-3">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <Card variant="secondary" className="mb-6 p-4 w-full">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-foreground text-2xl font-black">Habits</Text>
            <Pressable
              onPress={() => setShowAddHabit(true)}
              className="w-10 h-10 rounded-full bg-secondary items-center justify-center"
            >
              <Ionicons name="add" size={24} color={foregroundColor} />
            </Pressable>
          </View>

          {/* Stats */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1 items-center">
              <Text className="text-foreground text-lg font-semibold">{stats.total}</Text>
              <Text className="text-foreground text-xs">Total</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-success text-lg font-semibold">{stats.completedToday}</Text>
              <Text className="text-foreground text-xs">Done</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-warning text-lg font-semibold">{stats.partialToday}</Text>
              <Text className="text-foreground text-xs">Partial</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-foreground text-lg font-semibold">{stats.longestStreak}</Text>
              <Text className="text-foreground text-xs">Best Streak</Text>
            </View>
          </View>

          {/* Today's Progress */}
          <View className="mb-4">
            <Text className="text-foreground font-medium mb-2">Today's Progress</Text>
            <View className="h-2 bg-surface rounded-full overflow-hidden">
              <View 
                className="h-full bg-success rounded-full"
                style={{ 
                  width: `${stats.total > 0 ? (stats.completedToday / stats.total) * 100 : 0}%` 
                }}
              />
            </View>
            <Text className="text-foreground text-xs mt-1">
              {stats.completedToday} of {stats.total} habits completed
            </Text>
          </View>
        </Card>

        {/* Add Habit Modal */}
        {showAddHabit && (
          <Card variant="secondary" className="mb-4 p-4">
            <Text className="text-foreground text-lg font-semibold mb-3">Add New Habit</Text>
            
            <TextInput
              className="w-full p-3 rounded-lg bg-surface border border-divider text-foreground mb-3"
              placeholder="Habit title..."
              value={newHabitTitle}
              onChangeText={setNewHabitTitle}
              autoFocus
                placeholderTextColor={foregroundColor}
            />

            <View className="mb-3">
              <Text className="text-foreground font-medium mb-2">Target per day:</Text>
              <TextInput
                className="w-full p-3 rounded-lg bg-surface border border-divider text-foreground"
                placeholder="Target value..."
                value={newHabitTarget}
                onChangeText={setNewHabitTarget}
                keyboardType="numeric"
              placeholderTextColor={foregroundColor}
              />
            </View>

            <View className="mb-4">
              <Text className="text-foreground font-medium mb-2">Frequency:</Text>
              <View className="flex-row gap-2">
                {["daily", "weekly", "monthly"].map((freq) => (
                  <Pressable
                    key={freq}
                    className={`flex-1 py-2 rounded-lg border ${
                      newHabitFrequency === freq
                        ? "bg-secondary border-secondary"
                        : "bg-surface border-surface"
                    }`}
                    onPress={() => setNewHabitFrequency(freq as any)}
                  >
                    <Text
                      className={`text-sm capitalize text-center ${
                        newHabitFrequency === freq ? "text-foreground" : "text-secondary"
                      }`}
                    >
                      {freq}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowAddHabit(false)}
                className="flex-1 py-3 rounded-lg bg-surface border border-surface"
              >
                <Text className="text-foreground text-center font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddHabit}
                disabled={!newHabitTitle.trim() || !newHabitTarget || addHabitMutation.isPending}
                className="flex-1 py-3 rounded-lg bg-secondary border border-secondary"
              >
                <Text className="text-foreground text-center font-medium">
                  {addHabitMutation.isPending ? "Adding..." : "Add Habit"}
                </Text>
              </Pressable>
            </View>
          </Card>
        )}

        {/* Habits List */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-12">
            <Ionicons name="time" size={48} color={foregroundColor} />
            <Text className="text-foreground mt-4">Loading habits...</Text>
          </View>
        ) : error ? (
          <Card variant="secondary" className="p-6">
            <View className="items-center py-8">
              <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
              <Text className="text-foreground font-medium text-lg mb-2">
                Error Loading Habits
              </Text>
              <Text className="text-foreground text-center mb-4">
                {error.message}
              </Text>
              <Pressable
                className="bg-secondary px-4 py-2 rounded-lg"
                onPress={() => refetch()}
              >
                <Text className="text-foreground text-sm font-medium">Retry</Text>
              </Pressable>
            </View>
          </Card>
        ) : habits.length === 0 ? (
          <Card variant="secondary" className="p-6">
            <View className="items-center py-8">
              <Ionicons name="repeat-outline" size={48} color={foregroundColor} />
              <Text className="text-foreground font-medium text-lg mb-2">
                No habits yet
              </Text>
              <Text className="text-foreground text-center">
                Create your first habit to start building consistency!
              </Text>
            </View>
          </Card>
        ) : (
          <View className="gap-4">
            {habits.map((habit) => (
              <Card key={habit.id} variant="secondary" className="p-4">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-foreground font-semibold text-base">
                        {habit.title}
                      </Text>
                      <Ionicons 
                        name={getFrequencyIcon(habit.frequency) as any} 
                        size={16} 
                        color={foregroundColor} 
                      />
                    </View>
                    {habit.description && (
                      <Text className="text-foreground text-sm mb-2">
                        {habit.description}
                      </Text>
                    )}
                    <View className="flex-row items-center gap-3">
                      <HabitStreakBadge streak={habit.currentStreak} size="small" />
                      <Text className="text-xs text-foreground">
                        Target: {habit.targetValue} per {habit.frequency}
                      </Text>
                    </View>
                  </View>
                </View>

                <HabitTracker
                  habitId={habit.id}
                  title={habit.title}
                  targetValue={habit.targetValue}
                  currentStreak={habit.currentStreak}
                  todayStatus={habit.todayStatus}
                  todayValue={habit.todayValue}
                  onLogHabit={handleLogHabit}
                />

                {/* Show Calendar Button */}
                <Pressable
                  onPress={() => setSelectedHabit(selectedHabit === habit.id ? null : habit.id)}
                  className="mt-3 flex-row items-center justify-center py-2 rounded-lg bg-surface/50"
                >
                  <Ionicons 
                    name={selectedHabit === habit.id ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={foregroundColor} 
                  />
                  <Text className="text-foreground text-sm ml-1">
                    {selectedHabit === habit.id ? "Hide" : "Show"} Calendar
                  </Text>
                </Pressable>

                {/* Calendar View */}
                {selectedHabit === habit.id && (
                  <View className="mt-3">
                    <HabitCalendar 
                      logs={habitLogs.filter(log => log.habitId === habit.id)} 
                    />
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </Container>
  );
}