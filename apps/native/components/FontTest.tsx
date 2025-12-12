import { Text, View, ScrollView, Platform } from 'react-native';

/**
 * Font Test Component
 *
 * Tests both CSS class-based fonts (via UniWind/Tailwind)
 * and direct fontFamily styles to debug font loading.
 *
 * IMPORTANT: After configuring fonts in app.json with expo-font plugin,
 * you MUST rebuild the native app:
 *
 *   npx expo prebuild --clean
 *   npx expo run:android (or npx expo run:ios)
 *
 * Font naming convention:
 * - Android: Uses the file name (without extension) as fontFamily
 * - iOS: Uses the font's PostScript name from the file itself
 */
export default function FontTest() {
   // CSS class-based variants (for UniWind/Tailwind)
   const fontVariants = [
      { className: 'font-sans-light', label: 'Light (300)' },
      { className: 'font-sans', label: 'Regular (400)' },
      { className: 'font-sans-medium', label: 'Medium (500)' },
      { className: 'font-sans-semibold', label: 'SemiBold (600)' },
      { className: 'font-sans-bold', label: 'Bold (700)' },
      { className: 'font-sans-extrabold', label: 'ExtraBold (800)' },
   ];

   // Italic variants
   const italicVariants = [
      { className: 'font-sans-light-italic', label: 'Light Italic' },
      { className: 'font-sans-regular-italic italic', label: 'Regular Italic' },
      { className: 'font-sans-medium-italic', label: 'Medium Italic' },
      { className: 'font-sans-semibold-italic', label: 'SemiBold Italic' },
      { className: 'font-sans-bold-italic italic', label: 'Bold Italic' },
      { className: 'font-sans-extrabold-italic', label: 'ExtraBold Italic' },
   ];

   // Direct fontFamily testing (to verify fonts are embedded correctly)
   // These should work after prebuild/rebuild
   const directFontStyles = [
      { fontFamily: 'MerriweatherSans-Light', label: 'Direct: Light' },
      { fontFamily: 'MerriweatherSans-Regular', label: 'Direct: Regular' },
      { fontFamily: 'MerriweatherSans-Medium', label: 'Direct: Medium' },
      { fontFamily: 'MerriweatherSans-SemiBold', label: 'Direct: SemiBold' },
      { fontFamily: 'MerriweatherSans-Bold', label: 'Direct: Bold' },
      { fontFamily: 'MerriweatherSans-ExtraBold', label: 'Direct: ExtraBold' },
   ];

   return (
      <ScrollView className="flex-1 bg-background">
         <View className="pt-8 px-4 pb-4">
            {/* Header */}
            <Text className="text-2xl font-sans-bold mb-2 text-foreground">
               Merriweather Sans Font Test
            </Text>
            <Text className="text-sm text-muted mb-6">
               Platform: {Platform.OS} | If fonts show as system default, rebuild required
            </Text>

            {/* Section: CSS Classes (Normal) */}
            <Text className="text-lg font-sans-bold mb-3 text-foreground">
               CSS Classes (Normal)
            </Text>
            {fontVariants.map((variant) => (
               <View key={variant.className} className="mb-2">
                  <Text className={`${variant.className} text-base text-foreground`}>
                     {variant.label}: The quick brown fox
                  </Text>
               </View>
            ))}

            {/* Section: CSS Classes (Italic) */}
            <Text className="text-lg font-sans-bold mb-3 mt-6 text-foreground">
               CSS Classes (Italic)
            </Text>
            {italicVariants.map((variant) => (
               <View key={variant.className} className="mb-2">
                  <Text className={`${variant.className} text-base text-foreground`}>
                     {variant.label}: The quick brown fox
                  </Text>
               </View>
            ))}

            {/* Section: Direct fontFamily (Debug) */}
            <Text className="text-lg font-sans-bold mb-3 mt-6 text-foreground">
               Direct fontFamily (Debug)
            </Text>
            <Text className="text-xs text-muted mb-3">
               If these work but CSS classes don't, check global.css font variable names
            </Text>
            {directFontStyles.map((style) => (
               <View key={style.fontFamily} className="mb-2">
                  <Text
                     style={{ fontFamily: style.fontFamily, fontSize: 16 }}
                     className="text-foreground"
                  >
                     {style.label}: The quick brown fox
                  </Text>
               </View>
            ))}

            {/* Rebuild Instructions */}
            <View className="mt-8 p-4 bg-surface rounded-lg">
               <Text className="font-sans-bold text-foreground mb-2">
                  Troubleshooting
               </Text>
               <Text className="text-sm text-muted">
                  If fonts are not loading:{'\n'}
                  1. npx expo prebuild --clean{'\n'}
                  2. npx expo run:android (or run:ios){'\n'}
                  3. Restart the app completely
               </Text>
            </View>
         </View>
      </ScrollView>
   );
}
