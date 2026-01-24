import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  AiMagicIcon,
  Analytics01Icon,
  Calendar01Icon,
  Location01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useSemanticColors } from "@/utils/theme";

interface QuickAction {
  icon: any;
  label: string;
  route?: string;
  color?: string;
}

const actions: QuickAction[] = [
  {
    icon: PlusSignIcon,
    label: "Add Task",
    route: "/planners/create",
    color: "bg-blue-500",
  },
  {
    icon: AiMagicIcon,
    label: "Generate",
    route: "/planners/create",
    color: "bg-purple-500",
  },
  {
    icon: Calendar01Icon,
    label: "Calendar",
    route: "/calendar",
    color: "bg-emerald-500",
  },
  {
    icon: Analytics01Icon,
    label: "Insights",
    route: "/coaching",
    color: "bg-orange-500",
  },
  {
    icon: Location01Icon,
    label: "Explore",
    route: "/explore",
    color: "bg-pink-500",
  },
];

export function QuickActions() {
  const router = useRouter();

  const colors = useSemanticColors();

  return (
    <View className="mb-8">
      <View className="px-6 mb-4 flex-row items-center justify-between">
        <Text className="text-sm font-sans-bold text-foreground uppercase tracking-widest">
          Quick Access
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        {actions.map((action, index) => (
          <Animated.View key={index} entering={FadeInRight.delay(400 + index * 100).duration(600)}>
            <TouchableOpacity
              onPress={() => action.route && router.push(action.route as any)}
              activeOpacity={0.7}
              className="items-center mr-6"
            >
              <View className="w-16 h-16 rounded-[22px] bg-surface border border-border/50 items-center justify-center mb-2 shadow-sm">
                <HugeiconsIcon icon={action.icon} size={24} color={colors.foreground} />
              </View>
              <Text className="text-[11px] font-sans-semibold text-muted-foreground uppercase tracking-tighter">
                {action.label}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}
