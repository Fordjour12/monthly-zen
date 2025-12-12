import { useThemeColor } from 'heroui-native';

/**
 * HeroUI Native compatible theme utilities
 * Provides semantic color mappings and theme-aware utilities
 */

// Semantic color mappings for consistent theming
export const semanticColors = {
  // Surface colors
  background: 'background',
  foreground: 'foreground',
  surface: 'surface',
  overlay: 'overlay',
  muted: 'muted',

  // Accent colors
  accent: 'accent',
  primary: 'accent',
  secondary: 'foreground',

  // Status colors
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  error: 'danger',

  // Form field colors
  fieldBackground: 'field-background',
  fieldForeground: 'field-foreground',
  fieldBorder: 'field-border',

  // Utility colors
  border: 'border',
  divider: 'divider',
  link: 'link',
} as const;

// Helper hook to get theme-aware colors
export function useSemanticColor(colorKey: keyof typeof semanticColors): string {
  return useThemeColor(semanticColors[colorKey]);
}

// Multiple semantic colors hook
export function useSemanticColors() {
  const background = useThemeColor('background');
  const foreground = useThemeColor('foreground');
  const surface = useThemeColor('surface');
  const overlay = useThemeColor('overlay');
  const muted = useThemeColor('muted');
  const accent = useThemeColor('accent');
  const success = useThemeColor('success');
  const warning = useThemeColor('warning');
  const danger = useThemeColor('danger');
  const fieldBackground = useThemeColor('field-background');
  const fieldForeground = useThemeColor('field-foreground');
  const fieldBorder = useThemeColor('field-border');
  const border = useThemeColor('border');
  const divider = useThemeColor('divider');
  const link = useThemeColor('link');

  return {
    background,
    foreground,
    surface,
    overlay,
    muted,
    accent,
    primary: accent,
    secondary: foreground,
    success,
    warning,
    danger,
    error: danger,
    fieldBackground,
    fieldForeground,
    fieldBorder,
    border,
    divider,
    link,
  };
}

// Theme-aware style generator
export function createThemeAwareStyle<T extends Record<string, string>>(
  styleMap: T
): { [K in keyof T]: string } {
  const result = {} as { [K in keyof T]: string };

  for (const key in styleMap) {
    result[key] = styleMap[key];
  }

  return result;
}

// Common theme-aware patterns
export const themePatterns = {
  // Card patterns
  card: {
    backgroundColor: 'background',
    borderColor: 'border',
    color: 'foreground',
  },

  // Button patterns
  button: {
    primary: {
      backgroundColor: 'accent',
      color: 'background',
    },
    secondary: {
      backgroundColor: 'surface',
      borderColor: 'border',
      color: 'foreground',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'accent',
    },
  },

  // Input patterns
  input: {
    backgroundColor: 'field-background',
    borderColor: 'field-border',
    color: 'field-foreground',
    placeholderColor: 'muted',
  },

  // Text patterns
  text: {
    primary: {
      color: 'foreground',
    },
    secondary: {
      color: 'muted',
    },
    accent: {
      color: 'accent',
    },
    success: {
      color: 'success',
    },
    warning: {
      color: 'warning',
    },
    danger: {
      color: 'danger',
    },
  },
} as const;

// Utility functions for common operations
export function getContrastColor(backgroundColor: string): string {
  // Simple contrast calculation - in a real app, you might want more sophisticated logic
  const rgb = parseInt(backgroundColor.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luma < 128 ? '#FFFFFF' : '#000000';
}

// Theme checker utilities
export function useIsDarkTheme(): boolean {
  const background = useThemeColor('background');
  return getContrastColor(background) === '#FFFFFF';
}

export function useIsLightTheme(): boolean {
  return !useIsDarkTheme();
}

// Zen-specific utilities
export function useZenThemeInfo() {
  const accent = useThemeColor('accent');
  const background = useThemeColor('background');

  return {
    isZenAccent: accent === '#F44A22', // Primary orange from zen palette
    isZenDark: background === '#161616', // Midnight from zen palette
    isZenLight: background === '#FEF8E8', // Silver from zen palette
  };
}

// Export types for TypeScript users
export type SemanticColorKey = keyof typeof semanticColors;
export type ThemePattern = typeof themePatterns;
export type SemanticColors = ReturnType<typeof useSemanticColors>;