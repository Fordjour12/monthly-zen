import React from "react";
import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSemanticColors } from "@/utils/theme-utils";
import { AuthGuard } from "@/components/auth-guard";
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Calendar01Icon, WindSurfIcon } from "@hugeicons/core-free-icons";



function LandingScreen() {
   const colors = useSemanticColors();

   return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
         <View className="flex-1 px-4 pt-4 pb-8 justify-between">
            {/* Header */}
            <View className="pt-6">
               <Text className="text-2xl font-sans-bold tracking-tight" style={{ color: colors.foreground }}>
                  Monthly Zen
               </Text>
            </View>


            <View className="justify-center space-y-4">

               <View className="space-y-2">
                  <View className="flex-row items-center">
                     <Text className="text-5xl font-sans-medium tracking-tight" style={{ color: colors.accent }}>
                        Plan
                     </Text>
                     <View
                        className="w-12 h-12 rounded-lg items-center justify-center mx-3"
                        style={{ backgroundColor: colors.accent + '20' }}
                     >
                        <HugeiconsIcon
                           icon={Calendar01Icon}
                           size={24}
                           color={colors.accent}
                           strokeWidth={1.5}
                        />
                     </View>
                     <Text className="text-5xl font-sans-medium tracking-tight" style={{ color: colors.foreground }}>
                        Months
                     </Text>
                  </View>

                  {/* Line 2: with the most Valuable [Icon] */}
                  <View className="flex-row items-center flex-wrap">
                     <Text className="text-5xl font-sans-medium tracking-tight" style={{ color: colors.muted }}>
                        with the most
                     </Text>
                     <Text className="text-5xl font-sans-semibold tracking-tight ml-2" style={{ color: colors.success }}>
                        Valuable
                     </Text>
                     <View
                        className="w-12 h-12 rounded-lg items-center justify-center ml-3"
                        style={{ backgroundColor: colors.success + '20' }}
                     >
                        <HugeiconsIcon
                           icon={WindSurfIcon}
                           size={24}
                           color={colors.success}
                           strokeWidth={1.5}
                        />
                     </View>
                  </View>
               </View>

               <View className="pt-3">
                  <Text className="text-lg font-sans" style={{ color: colors.muted }}>
                     **Stop organizing, start optimizing.** Use every month to its fullest potential.
                  </Text>
               </View>
            </View>

            {/* Action Buttons */}
            <View className="w-full space-y-4">
               <Link href="/(auth)/sign-up" asChild>
                  <Pressable
                     className="w-full py-4 rounded-2xl flex-row items-center justify-center mb-4"
                     style={{ backgroundColor: colors.foreground }}
                     android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
                  >
                     <Text className="text-lg font-sans-semibold" style={{ color: colors.background }}>
                        Create an account
                     </Text>
                  </Pressable>
               </Link>

               <Link href="/(auth)/sign-in" asChild>
                  <Pressable
                     className="w-full py-4 rounded-2xl items-center justify-center"
                     style={{ backgroundColor: colors.muted + '15' }}
                     android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                  >
                     <Text className="text-lg font-sans-semibold" style={{ color: colors.accent }}>
                        I have an account
                     </Text>
                  </Pressable>
               </Link>

               <Link href="/(auth)/onboarding" asChild>
                  <Pressable
                     className="w-full py-4 rounded-2xl items-center justify-center"
                     style={{ backgroundColor: colors.muted + '15' }}
                     android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                  >
                     <Text className="text-lg font-sans-semibold" style={{ color: colors.accent }}>
                        Onboarding
                     </Text>
                  </Pressable>
               </Link>


               <Text className="text-xs text-center mt-6 leading-5 px-4 font-sans" style={{ color: colors.muted }}>
                  By continuing you confirm that you agree to our{' '}
                  <Text className="font-sans" style={{ textDecorationLine: 'underline', color: colors.foreground }}>Terms of Service</Text>,{' '}
                  <Text className="font-sans" style={{ textDecorationLine: 'underline', color: colors.foreground }}>Privacy Policy</Text> and good behavior in chat with users (write to your loved ones more often ♥)
               </Text>
            </View>
         </View>
      </View>
   );
}

export default function Home() {
   return (
      <AuthGuard requireAuth={false} redirectTo="/(tabs)">
         <LandingScreen />
      </AuthGuard>
   );
}
