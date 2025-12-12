import React, { createContext, useCallback, useContext, useMemo, useEffect } from "react";
import { Uniwind, useUniwind } from "uniwind";
import { useUserPreferenceStore } from "@/stores/useUserPreferenceStore";

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
   const { theme: preferredTheme, setPreference } = useUserPreferenceStore();

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

   // Initialize theme from preferences on mount
   useEffect(() => {
      if (preferredTheme && theme !== preferredTheme) {
         Uniwind.setTheme(preferredTheme);
      }
   }, [preferredTheme, theme]);

   const setTheme = useCallback((newTheme: ThemeName) => {
      Uniwind.setTheme(newTheme);
      setPreference('theme', newTheme);
   }, [setPreference]);

   const toggleTheme = useCallback(() => {
      const currentTheme = theme === "zen" || theme === "zen-light"
         ? theme as ThemeName
         : "zen"; // fallback to zen if current theme is unknown

      let nextTheme: ThemeName;
      if (currentTheme === "zen") {
         nextTheme = "zen-light";
      } else if (currentTheme === "zen-light") {
         nextTheme = "system";
      } else {
         nextTheme = "zen";
      }

      Uniwind.setTheme(nextTheme);
      setPreference('theme', nextTheme);
   }, [theme, setPreference]);

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
