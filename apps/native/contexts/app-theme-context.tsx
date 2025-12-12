import React, { createContext, useCallback, useContext, useMemo } from "react";
import { Uniwind, useUniwind } from "uniwind";

type ThemeName = "zen" | "zen-light" | "system";

type AppThemeContextType = {
	currentTheme: string;
	isLight: boolean;
	isDark: boolean;
	isZen: boolean;
	isZenLight: boolean;
	setTheme: (theme: ThemeName) => void;
	toggleTheme: () => void;
};

const AppThemeContext = createContext<AppThemeContextType | undefined>(
	undefined,
);

export const AppThemeProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { theme } = useUniwind();

	const isLight = useMemo(() => {
		return theme === "light" || theme === "zen-light";
	}, [theme]);

	const isDark = useMemo(() => {
		return theme === "dark" || theme === "zen";
	}, [theme]);

	const isZen = useMemo(() => {
		return theme === "zen";
	}, [theme]);

	const isZenLight = useMemo(() => {
		return theme === "zen-light";
	}, [theme]);

	const setTheme = useCallback((newTheme: ThemeName) => {
		Uniwind.setTheme(newTheme);
	}, []);

	const toggleTheme = useCallback(() => {
		if (theme === "zen") {
			Uniwind.setTheme("zen-light");
		} else if (theme === "zen-light") {
			Uniwind.setTheme("system");
		} else {
			Uniwind.setTheme("zen");
		}
	}, [theme]);

	const value = useMemo(
		() => ({
			currentTheme: theme,
			isLight,
			isDark,
			isZen,
			isZenLight,
			setTheme,
			toggleTheme,
		}),
		[theme, isLight, isDark, isZen, isZenLight, setTheme, toggleTheme],
	);

	return (
		<AppThemeContext.Provider value={value}>
			{children}
		</AppThemeContext.Provider>
	);
};

export function useAppTheme() {
	const context = useContext(AppThemeContext);
	if (!context) {
		throw new Error("useAppTheme must be used within AppThemeProvider");
	}
	return context;
}
