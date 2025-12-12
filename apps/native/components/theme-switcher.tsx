import { View, Pressable, Text, ScrollView, Platform } from "react-native";
import { Uniwind, useUniwind } from "uniwind";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

type ThemeName = "zen" | "zen-light" | "system";

type ThemeOption = {
    name: ThemeName;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    colors: { bg: string; accent: string };
};

const themes: ThemeOption[] = [
    {
        name: "zen",
        label: "Zen Dark",
        icon: "flame",
        colors: { bg: "#161616", accent: "#F44A22" },
    },
    {
        name: "zen-light",
        label: "Zen Light",
        icon: "flame-outline",
        colors: { bg: "#FEF8E8", accent: "#F44A22" },
    },
    {
        name: "system",
        label: "System",
        icon: "settings-outline",
        colors: { bg: "#888888", accent: "#888888" },
    },
];

export const ThemeSwitcher = () => {
    const { theme, hasAdaptiveThemes } = useUniwind();
    const activeTheme = hasAdaptiveThemes ? "system" : theme;

    const handleThemeChange = (themeName: ThemeName) => {
        if (Platform.OS === "ios") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        Uniwind.setTheme(themeName as "zen" | "zen-light" | "system");
    };

    return (
        <View className="py-2">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
                {themes.map((t, index) => {
                    const isActive = activeTheme === t.name;
                    return (
                        <Animated.View key={t.name} entering={FadeIn.delay(index * 50)}>
                            <Pressable
                                onPress={() => handleThemeChange(t.name)}
                                className={`
                  px-4 py-4 rounded-2xl items-center min-w-[85px]
                  ${isActive ? "border-2 border-primary" : "border border-border"}
                `}
                                style={{
                                    backgroundColor: isActive ? t.colors.bg : undefined,
                                }}
                            >
                                {/* Color preview dots */}
                                <View className="flex-row gap-1 mb-2">
                                    <View
                                        className="w-4 h-4 rounded-full border border-border"
                                        style={{ backgroundColor: t.colors.bg }}
                                    />
                                    <View
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: t.colors.accent }}
                                    />
                                </View>

                                <Ionicons
                                    name={t.icon}
                                    size={22}
                                    color={isActive ? t.colors.accent : "#A8AAAC"}
                                />

                                <Text
                                    className={`text-xs mt-2 font-medium ${isActive ? "text-primary" : "text-muted"
                                        }`}
                                >
                                    {t.label}
                                </Text>

                                {isActive && (
                                    <Animated.View
                                        entering={ZoomIn}
                                        className="absolute -top-1 -right-1"
                                    >
                                        <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                                            <Ionicons name="checkmark" size={12} color="#FEF8E8" />
                                        </View>
                                    </Animated.View>
                                )}
                            </Pressable>
                        </Animated.View>
                    );
                })}
            </ScrollView>
        </View>
    );
};
