import { Link, Stack, useRouter } from "expo-router";
import { Text, View, TouchableOpacity } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { RssErrorIcon, Home01Icon, ArrowLeft01Icon, AiMagicIcon } from "@hugeicons/core-free-icons";
import { Container } from "@/components/ui/container";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

export default function NotFoundScreen() {
  const router = useRouter();

  const handleHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/");
  };

  return (
    <Container className="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 justify-center items-center px-10">
        <Animated.View
          entering={FadeInUp.duration(800)}
          className="w-32 h-32 rounded-[48px] bg-danger/5 items-center justify-center mb-10 border border-danger/10"
        >
          <View className="w-24 h-24 rounded-[40px] bg-danger/10 items-center justify-center border border-danger/20">
            <HugeiconsIcon icon={RssErrorIcon} size={48} color="var(--danger)" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="items-center">
          <Text className="text-[10px] font-sans-bold text-danger uppercase tracking-[4px] mb-4">
            Signal Transmission Lost
          </Text>
          <Text className="text-3xl font-sans-bold text-foreground text-center tracking-tight mb-4">
            Neural Node Missing
          </Text>
          <Text className="text-base font-sans text-muted-foreground text-center leading-7 opacity-70 mb-12">
            The requested protocol could not be located in the current synaptic map. Your neural
            navigation may be out of sync.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} className="w-full gap-y-4">
          <TouchableOpacity
            onPress={handleHome}
            className="bg-foreground h-16 rounded-[24px] flex-row items-center justify-center gap-x-3 shadow-xl shadow-black/20"
          >
            <HugeiconsIcon icon={Home01Icon} size={20} color="var(--background)" />
            <Text className="text-sm font-sans-bold text-background uppercase tracking-widest">
              Return to Base
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
            className="h-16 rounded-[24px] bg-surface border border-border/50 flex-row items-center justify-center gap-x-3"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="var(--foreground)" />
            <Text className="text-sm font-sans-bold text-foreground uppercase tracking-widest">
              Revert Strategy
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          className="mt-16 flex-row items-center gap-x-2 opacity-40"
        >
          <HugeiconsIcon icon={AiMagicIcon} size={12} color="var(--muted-foreground)" />
          <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
            System Diagnostics: 404_PROTO_MISSING
          </Text>
        </Animated.View>
      </View>
    </Container>
  );
}
