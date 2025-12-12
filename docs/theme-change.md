# Zen Calendar Theme Implementation Plan

## Overview

Implement custom "zen" and "zen-light" themes for the React Native application using the extracted color palette. This theme system will be built on top of Uniwind and HeroUI Native, providing extensive customization while maintaining consistency.

## Extracted Color Palette

- **Primary Orange**: `#F44A22` (main accent/brand color)
- **Secondary Cyan**: `#22B4C4` (secondary accent color)
- **Midnight**: `#161616` (dark background/text)
- **Silver**: `#FEF8E8` (light background/cream)
- **Grey**: `#E4E2E3` (medium grey/borders)
- **Stone**: `#A8AAAC` (dark grey/secondary text)

## Implementation Steps

### 1. Configure Uniwind for Custom Themes

**File**: `apps/native/metro.config.js`

- Update the uniwind configuration to register the new themes
- Add `extraThemes: ['zen', 'zen-light']` to the withUniwindConfig options
- Ensure proper path configuration for dtsFile

### 2. Define HeroUI Native Compatible Theme Variables

**File**: `apps/native/global.css`

- Follow HeroUI Native's required CSS variable structure
- Define base theme variables that HeroUI Native components expect
- Use @layer theme with @variant zen and @variant zen-light
- Ensure all HeroUI Native required variables are defined

**Required HeroUI Native Variables:**
- Base: `--background`, `--foreground`, `--surface`, `--overlay`
- Colors: `--accent`, `--default`, `--success`, `--warning`, `--danger`
- Form fields: `--field-background`, `--field-foreground`, `--field-border`
- Utility: `--border`, `--divider`, `--link`

### 3. Update Theme Context

**File**: `apps/native/contexts/app-theme-context.tsx`

- Update ThemeName union to: `'zen' | 'zen-light' | 'system'`
- Add `isZen` and `isZenLight` boolean properties to context
- Update `toggleTheme()` to cycle through: zen → zen-light → system → zen
- Update context provider value to include new properties
- Ensure Uniwind synchronization with user preferences

### 4. Update User Preferences Store

**File**: `apps/native/stores/useUserPreferenceStore.ts`

- Update theme type to: `'zen' | 'zen-light' | 'system'`
- Set "zen" as the default theme
- Update default accent color to `#F44A22`
- Update theme validation to include new themes
- Ensure proper persistence of theme selection

### 5. Create Theme Utilities

**File**: `apps/native/utils/theme-utils.ts` (new file)

- Import HeroUI Native's `useThemeColor` hook for theme access
- Create helper functions that work with HeroUI Native's theming system
- Include semantic color mappings (background, foreground, accent, etc.)
- Provide type-safe theme-aware utilities

### 6. Update Core Components

#### High Priority Components

1. **Onboarding Screen** (`apps/native/app/(auth)/onboarding.tsx`)
   - Replace hard-coded blue colors with semantic classes
   - Update theme selection UI to include zen and zen-light options
   - Use HeroUI Native's theme-aware color system
   - Apply HeroUI Native component styling patterns

2. **Theme Toggle Component** (`apps/native/components/theme-toggle.tsx`)
   - Add support for zen/zen-light/system theme switching
   - Use HeroUI Native's `withUniwind` HOC for components
   - Update icon selection to reflect theme states
   - Ensure smooth transitions using HeroUI Native animations

#### Medium Priority Components

- All components using `useThemeColor` hook for dynamic theming
- HeroUI Native components to ensure proper theme inheritance
- Replace remaining hard-coded colors with semantic classes
- Update any components using legacy color variables

### 7. Migration Strategy

#### Phase 1: Foundation

- Configure metro.config.js to register zen and zen-light themes
- Add complete HeroUI Native compatible CSS variables to global.css
- Set "zen" as default theme in user preferences
- Delete old uniwind-types.d.ts to force regeneration
- Restart Metro bundler to generate new type definitions

#### Phase 2: Component Updates

- Update theme context to handle new theme structure
- Update onboarding screen with new theme options
- Replace hard-coded colors with semantic HeroUI Native classes
- Update theme toggle functionality

#### Phase 3: Integration & Polish

- Test theme switching animations with HeroUI Native transitions
- Verify HeroUI Native components render properly with new themes
- Ensure accessibility (contrast ratios) for both zen themes
- Test persistence across app restarts

## Technical Details

### CSS Variable Structure (HeroUI Native Compatible)

```css
@import 'tailwindcss';
@import 'uniwind';
@import 'heroui-native/styles';

@source './node_modules/heroui-native/lib';

@layer theme {
  :root {
    @variant zen {
      /* Base theme variables required by HeroUI Native */
      --background: #161616;
      --foreground: #FEF8E8;
      --surface: #1E1E1E;
      --overlay: #2A2A2A;
      --muted: #A8AAAC;
      --accent: #F44A22;
      --default: #1E1E1E;

      /* Status colors */
      --success: #22B4C4;
      --warning: #F44A22;
      --danger: #EF4444;

      /* Form field colors */
      --field-background: #1E1E1E;
      --field-foreground: #FEF8E8;
      --field-border: transparent;

      /* Utility colors */
      --border: #2A2A2A;
      --divider: #2A2A2A;
      --link: #22B4C4;
    }

    @variant zen-light {
      /* Complementary light theme variables */
      --background: #FEF8E8;
      --foreground: #161616;
      --surface: #FFFFFF;
      --overlay: #FFFFFF;
      --muted: #A8AAAC;
      --accent: #F44A22;
      --default: #FFFFFF;

      /* Status colors (same across themes) */
      --success: #22B4C4;
      --warning: #F44A22;
      --danger: #EF4444;

      /* Form field colors */
      --field-background: #FFFFFF;
      --field-foreground: #161616;
      --field-border: transparent;

      /* Utility colors */
      --border: #E4E2E3;
      --divider: #E4E2E3;
      --link: #22B4C4;
    }
  }
}
```

### Theme Switching Order

The theme toggle will cycle through: zen → zen-light → system → (repeat)

### HeroUI Native Integration

- Use `useThemeColor('accent')` instead of hard-coded colors
- Apply `withUniwind()` HOC to components that need theme awareness
- Utilize HeroUI Native's built-in component theming system
- Leverage calculated variables like `--color-accent-hover` and `--color-accent-soft`

### Backward Compatibility

- System theme functionality preserved
- HeroUI Native component compatibility maintained
- No breaking changes to existing APIs
- Gradual migration path for existing components

## Files to Modify

1. `apps/native/metro.config.js` - Register zen and zen-light themes
2. `apps/native/global.css` - Add complete HeroUI Native CSS variables
3. `apps/native/uniwind-types.d.ts` - Auto-regenerated (delete old file)
4. `apps/native/contexts/app-theme-context.tsx` - Update context for new themes
5. `apps/native/stores/useUserPreferenceStore.ts` - Update theme types and defaults
6. `apps/native/app/(auth)/onboarding.tsx` - Update theme selection and colors
7. `apps/native/components/theme-toggle.tsx` - Add zen theme support with HOCs
8. `apps/native/utils/theme-utils.ts` - HeroUI Native compatible theme helpers (new)

## Testing Checklist

- [ ] Theme cycles correctly: zen → zen-light → system
- [ ] Zen theme displays as default on fresh install
- [ ] All colors match the extracted zen palette
- [ ] Contrast ratios meet accessibility standards (WCAG AA)
- [ ] Theme persists across app restarts
- [ ] System theme changes work correctly
- [ ] HeroUI Native components render properly with new themes
- [ ] `useThemeColor` hook returns correct hex values
- [ ] `withUniwind` HOC properly wraps components
- [ ] Calculated CSS variables (hover, soft states) work correctly
- [ ] Smooth transitions between theme switches

## Success Metrics

- Zen themes are the default experience
- All hard-coded colors replaced with HeroUI Native semantic classes
- Users can switch between zen/zen-light/system themes seamlessly
- Visual consistency across all components using HeroUI Native
- Improved visual identity with warm orange accent colors
- Full HeroUI Native component compatibility
- Enhanced developer experience with better theme utilities

## Additional Resources

- [HeroUI Native Theming Documentation](https://github.com/heroui-inc/heroui-native/blob/beta/src/styles/theme.md)
- [Uniwind Custom Themes Guide](https://docs.uniwind.dev/theming/custom-themes)
- [Uniwind Migration Guide](https://docs.uniwind.dev/migration-from-nativewind)
- [HeroUI Native useThemeColor Hook](https://github.com/heroui-inc/heroui-native/blob/beta/src/styles/theme.md#utilities)