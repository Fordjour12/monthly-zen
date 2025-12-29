import { View, Text } from "react-native";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/auth-store";

export function HomeHeader() {
  const user = useAuthStore((state) => state.user);

  const now = new Date();
  const dayOfWeek = format(now, "EEE").toUpperCase();
  const month = format(now, "MMMM");
  const date = format(now, "d");
  const year = format(now, "yyyy");

  const hour = now.getHours();
  let greeting = "Good evening";
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
  }

  return (
    <View className="px-4 pt-8 pb-2">
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center gap-1 align-middle">
          <Text className="text-3xl font-bold text-foreground">{dayOfWeek}</Text>
          <View className="size-5 rounded-full bg-accent mt-1" />
        </View>
        <View className="items-end">
          <Text className="text-[18px] font-black text-[#fafafa]">
            {month} {date}
          </Text>
          <Text className="text-sm text-foreground">{year}</Text>
        </View>
      </View>

      <Text className="text-2xl font-bold text-foreground">
        {greeting}, {user?.name?.split(" ")[0] || "there"}! 👋
      </Text>
      <Text className="text-base text-muted-foreground mt-1">You have 4 tasks today</Text>
    </View>
  );
}
