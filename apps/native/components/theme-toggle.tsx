import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform, Pressable } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";
import { withUniwind } from "uniwind";
import { useAppTheme } from "@/contexts/app-theme-context";

const StyledIonicons = withUniwind(Ionicons);

export function ThemeToggle() {
	const { toggleTheme, isZen, isZenLight, currentTheme } = useAppTheme();

	const getIconAndName = () => {
		if (isZen) {
			return { icon: "moon", name: "Zen Dark" };
		} else if (isZenLight) {
			return { icon: "sunny", name: "Zen Light" };
		} else {
			return { icon: "settings", name: "System" };
		}
	};

	const { icon, name } = getIconAndName();

	return (
		<Pressable
			onPress={() => {
				if (Platform.OS === "ios") {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				}
				toggleTheme();
			}}
			className="px-2.5"
			accessibilityLabel={`Current theme: ${name}. Tap to switch theme.`}
		>
			<Animated.View key={icon} entering={ZoomIn} exiting={FadeOut}>
				<StyledIonicons
					name={icon as any}
					size={20}
					className="text-foreground"
				/>
			</Animated.View>
		</Pressable>
	);
}
