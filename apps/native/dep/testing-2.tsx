import { router } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, View, Pressable, Text, TouchableOpacity } from "react-native";

interface DayData {
  date: Date;
  completed: number;
  total: number;
}

interface Habit {
  id: string;
  name: string;
  completedToday: boolean;
  currentStreak: number;
}

interface Event {
  id: string;
  title: string;
  time?: string;
  color: string;
}

const generateMockHabits = (): Habit[] => {
  return [
    { id: "1", name: "Morning Meditation", completedToday: true, currentStreak: 7 },
    { id: "2", name: "Exercise 30min", completedToday: false, currentStreak: 3 },
    { id: "3", name: "Read 20 pages", completedToday: true, currentStreak: 12 },
    { id: "4", name: "Practice Guitar", completedToday: false, currentStreak: 5 },
    { id: "5", name: "Journal Entry", completedToday: true, currentStreak: 21 },
  ];
};

const generateMockTodayEvents = (): Event[] => {
  return [
    { id: "1", title: "Team Standup", time: "9:00 AM", color: "blue" },
    { id: "2", title: "Code Review", time: "2:00 PM", color: "green" },
    { id: "3", title: "Gym Session", time: "6:00 PM", color: "red" },
  ];
};

const generateMockHeatmapData = (days: number = 28): DayData[] => {
  const data: DayData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseCompletion = isWeekend ? 0.3 : 0.7;
    const randomFactor = Math.random() * 0.4 - 0.2;
    const rate = Math.max(0, Math.min(1, baseCompletion + randomFactor));

    const total = Math.floor(Math.random() * 8) + 3;
    const completed = Math.floor(total * rate);

    data.push({ date, completed, total });
  }

  return data;
};

const getHeatmapColor = (completed: number, total: number): string => {
  if (total === 0) return "#6b7280";
  const rate = completed / total;
  if (rate === 0) return "#6b7280";
  if (rate <= 0.25) return "#ef4444";
  if (rate <= 0.5) return "#f59e0b";
  if (rate <= 0.75) return "#3b82f6";
  return "#10b981";
};

export default function DashboardScreen() {
  const [showModal, setShowModal] = React.useState(false);
  const [showFinancialData, setShowFinancialData] = React.useState(true);

  const mockHabits = useMemo(() => generateMockHabits(), []);
  const mockTodayEvents = useMemo(() => generateMockTodayEvents(), []);
  const heatmapData = useMemo(() => generateMockHeatmapData(28), []);

  const today = new Date();
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "short" });
  const monthDay = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const year = today.getFullYear();

  const totalHabits = mockHabits.length;
  const completedHabits = mockHabits.filter((h) => h.completedToday).length;
  const totalTasks = 8;
  const totalMeetings = 3;
  const getTotalBalance = () => 4850.0;

  const getWeekDates = () => {
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + mondayOffset + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getWeekDates();
  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const weekLabels = ["S", "M", "T", "W", "T", "F", "S"];

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getHoursLeftInDay = () => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const diffMs = endOfDay.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return Math.max(0, diffHours);
  };

  const getHoursLeftColor = () => {
    const hoursLeft = getHoursLeftInDay();
    if (hoursLeft >= 12) return "#10b981";
    if (hoursLeft >= 8) return "#3b82f6";
    if (hoursLeft >= 4) return "#f59e0b";
    if (hoursLeft >= 2) return "#ef4444";
    return "#8b5cf6";
  };

  const getHoursLeftBgColor = () => {
    const hoursLeft = getHoursLeftInDay();
    if (hoursLeft >= 12) return "#10b98120";
    if (hoursLeft >= 8) return "#3b82f620";
    if (hoursLeft >= 4) return "#f59e0b20";
    if (hoursLeft >= 2) return "#ef444420";
    return "#8b5cf620";
  };

  const getEventColor = (color?: string) => {
    switch (color) {
      case "red":
        return "#ef4444";
      case "yellow":
        return "#f59e0b";
      case "green":
        return "#10b981";
      case "blue":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const weeks = useMemo(() => {
    const result: DayData[][] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      result.push(heatmapData.slice(i, i + 7));
    }
    return result;
  }, [heatmapData]);

  const startDate = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() - 28 + 1);
    return start;
  }, []);

  return (
    <View className="flex-1 bg-[#09090b]">
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View className="pt-12 pb-8">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-baseline gap-2">
              <Text className="text-[36px] font-black text-[#fafafa]">{dayOfWeek}</Text>
              <View className="w-5 h-5 rounded-full bg-[#ef4444] mt-1" />
            </View>
            <View className="items-end">
              <Text className="text-[18px] font-black text-[#fafafa]">{monthDay}</Text>
              <Text className="text-sm text-[#71717a]">{year}</Text>
            </View>
          </View>

          <Text className="text-[32px] text-[#71717a] font-black mb-6">{getGreeting()}, User.</Text>

          <View className="flex-row flex-wrap items-center">
            <Text className="text-[18px] font-bold text-[#fafafa]">Today you have </Text>
            <Text className="text-[18px] font-bold text-[#fafafa]">{totalMeetings} meetings, </Text>
            <Text className="text-[18px] font-bold text-[#fafafa]">{totalTasks} tasks, </Text>
            <Text className="text-[18px] font-bold text-[#fafafa]">{totalHabits} habits, and </Text>
            <Pressable onPress={() => setShowFinancialData(!showFinancialData)}>
              <Text className="text-[18px] font-bold text-[#fafafa] underline">
                {showFinancialData ? `$${getTotalBalance().toFixed(2)}` : "$······"}
              </Text>
            </Pressable>
            <Text className="text-[18px] font-bold text-[#fafafa]"> available.</Text>
          </View>
          <Text className="text-base text-[#71717a] mt-2">
            You're 65% through your planned tasks today
          </Text>

          <View className="flex-row gap-6 mt-4">
            <View className="flex-row items-center gap-2">
              <Text className="text-[20px] text-[#fafafa]">👟</Text>
              <Text className="text-sm font-bold text-[#fafafa]">6.5K steps</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View
                className="w-8 h-8 rounded-md items-center justify-center"
                style={{ backgroundColor: getHoursLeftBgColor() }}
              >
                <Text className="text-xs font-bold" style={{ color: getHoursLeftColor() }}>
                  ⏱
                </Text>
              </View>
              <Text className="text-sm font-bold" style={{ color: getHoursLeftColor() }}>
                {getHoursLeftInDay()} hours left
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 bg-[#22c55e] rounded-lg py-3 flex-row items-center justify-center"
              onPress={() => router.push("/(tabs)/testing" as any)}
            >
              <Text className="text-white font-bold ml-2">Add Habit</Text>
            </Pressable>
            <Pressable
              className="flex-1 bg-transparent rounded-lg py-3 flex-row items-center justify-center border border-[#27272a]"
              onPress={() => router.push("/(tabs)/testing" as any)}
            >
              <Text className="text-[#fafafa] font-bold ml-2">Add Transaction</Text>
            </Pressable>
          </View>
        </View>

        {totalHabits > 0 && (
          <View className="mb-6">
            <View className="bg-[#18181b] rounded-xl p-4 border border-[#27272a]">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-base font-semibold text-[#fafafa]">Today's Habits</Text>
                <Text className="text-xs text-[#71717a]">
                  {completedHabits}/{totalHabits} completed
                </Text>
              </View>
              {mockHabits.slice(0, 3).map((habit) => (
                <View key={habit.id} className="flex-row items-center gap-3 mb-2">
                  <View
                    className="w-4 h-4 rounded-sm border-2 items-center justify-center"
                    style={{
                      borderColor: habit.completedToday ? "#22c55e" : "#71717a",
                      backgroundColor: habit.completedToday ? "#22c55e" : "transparent",
                    }}
                  >
                    {habit.completedToday && <Text className="text-white text-[10px]">✓</Text>}
                  </View>
                  <Text className="flex-1 text-sm text-[#fafafa]">{habit.name}</Text>
                  <Text className="text-xs text-[#71717a]">{habit.currentStreak} day streak</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
                {weekLabels.map((label, index) => (
                  <View key={index} className="h-7 mb-1 justify-center">
                    <Text className="text-[10px] text-[#71717a] text-center">{label}</Text>
                  </View>
                ))}
              </View>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} className="gap-1 ml-1">
                  {week.map((day, dayIndex) => {
                    const bgColor = getHeatmapColor(day.completed, day.total);
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
                {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                {new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" },
                )}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <View className="bg-[#18181b] rounded-xl p-4 border border-[#27272a]">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-[#fafafa]">Savings Goal</Text>
              <Text className="text-sm font-bold text-[#22c55e]">+8.5%</Text>
            </View>
            <Text className="text-xs text-[#71717a]">
              You are on track to reach your emergency fund goal in 3 months.
            </Text>
            <View className="mb-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-xl font-bold text-[#fafafa]">$7,100</Text>
                <Text className="text-sm text-[#71717a]">of $10,000</Text>
              </View>
              <View className="h-2 bg-[#27272a] rounded-sm mt-2">
                <View className="h-2 bg-[#10b981] rounded-sm" style={{ width: "71%" }} />
              </View>
            </View>
            <View className="flex-row gap-2 mt-3">
              {["Savings", "Emergency Fund", "Financial Security"].map((tag, i) => (
                <View key={i} className="px-2 py-1 bg-[#27272a] rounded-sm">
                  <Text className="text-[10px] text-[#71717a]">{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <Pressable
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#22c55e] items-center justify-center"
        style={{ elevation: 4 }}
        onPress={() => setShowModal(true)}
      >
        <Text className="text-2xl text-white">+</Text>
      </Pressable>

      {showModal && (
        <View className="flex-1 bg-black/70 justify-center items-center">
          <View className="bg-[#18181b] rounded-2xl p-6 w-[90%] max-w-[400]">
            <View className="mb-4">
              <Text className="text-lg font-bold text-[#fafafa]">Today's Schedule</Text>
              <Text className="text-sm text-[#71717a] mt-1">
                Your weekly schedule reflects your habits and events.
              </Text>
            </View>
            <View className="flex-row justify-between mb-4">
              {weekDates.map((date, index) => {
                const isToday = date.toDateString() === today.toDateString();
                const dayNumber = date.getDate();
                const dayName = dayNames[index];
                return (
                  <View
                    key={index}
                    className="items-center p-2 rounded-lg"
                    style={{
                      backgroundColor: isToday ? "#27272a" : "transparent",
                      borderWidth: isToday ? 1 : 0,
                      borderColor: "#27272a",
                    }}
                  >
                    <Text className="text-base font-bold text-[#fafafa]">{dayNumber}</Text>
                    <Text
                      className="text-[10px]"
                      style={{ color: isToday ? "#ef4444" : "#71717a" }}
                    >
                      {dayName}
                    </Text>
                  </View>
                );
              })}
            </View>
            {mockTodayEvents.map((event) => (
              <View key={event.id} className="flex-row items-center gap-3 mb-3">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getEventColor(event.color) }}
                />
                <Text className="flex-1 text-sm font-semibold text-[#fafafa]">{event.title}</Text>
                {event.time && <Text className="text-xs text-[#71717a]">{event.time}</Text>}
              </View>
            ))}
            <Pressable
              className="mt-4 py-3 bg-[#27272a] rounded-lg items-center"
              onPress={() => setShowModal(false)}
            >
              <Text className="text-[#fafafa] font-semibold">Done</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
