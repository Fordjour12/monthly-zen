import React, { useState } from 'react';
import { View, Text, Pressable, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSemanticColors } from '@/utils/theme-utils';

export default function SignInScreen() {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [isLoading, setIsLoading] = useState(false);

   // Theme utilities
   const colors = useSemanticColors();

   const { signIn, error, clearError } = useAuthStore();
   const router = useRouter();

   const handleSignIn = async () => {
      if (!email || !password) {
         Alert.alert('Error', 'Please fill in all fields');
         return;
      }

      setIsLoading(true);
      clearError();

      try {
         const success = await signIn(email, password);
         if (success) {
            console.log('📱 Sign-in successful, checking onboarding state');
            const { hasCompletedOnboarding } = useAuthStore.getState();

            if (!hasCompletedOnboarding) {
               console.log('📱 User needs onboarding, navigating to onboarding');
               router.replace('/onboarding');
            } else {
               console.log('📱 User completed onboarding, navigating to main app');
               router.replace('/(tabs)');
            }
         }
      } catch (err) {
         // Error is handled by the store
      } finally {
         setIsLoading(false);
      }
   };

   const handleGoogleSignIn = () => {
      Alert.alert('Coming Soon', 'Google Sign In will be available soon!');
   };

   return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
         <View className="absolute inset-0" style={{ backgroundColor: colors.background }} />

         {/* Curved Card Container */}
         <View className="flex-1 justify-center items-center px-5">
            <View
               className="rounded-3xl p-8 w-full max-w-md shadow-lg"
               style={{
                  backgroundColor: colors.surface,
                  shadowColor: 'rgba(0, 0, 0, 0.2)',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 8
               }}
            >
               {/* Header */}
               <View className="mb-6">
                  <Text className="text-3xl font-sans-bold mb-1" style={{ color: colors.foreground }}>Welcome</Text>
                  <Text className="text-sm font-sans" style={{ color: colors.muted }}>• Sign in to track your plans</Text>
               </View>

               {/* Google Sign In Button */}
               <Pressable
                  className="rounded-2xl py-3.5 px-5 flex-row items-center justify-center mb-5"
                  style={{ backgroundColor: colors.accent }}
                  onPress={handleGoogleSignIn}
                  android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
               >
                  <View
                     className="rounded-xl w-6 h-6 items-center justify-center mr-3"
                     style={{ backgroundColor: colors.background }}
                  >
                     <Ionicons name="logo-google" size={20} color={colors.accent} />
                  </View>
                  <Text className="text-base font-sans-semibold" style={{ color: colors.background }}>
                     Sign in with Google
                  </Text>
               </Pressable>

               {/* Divider */}
               <View className="flex-row items-center my-5">
                  <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
                  <Text className="text-xs px-3 font-sans" style={{ color: colors.muted }}>
                     or continue with email
                  </Text>
                  <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
               </View>

               {/* Email Input */}
               <View className="mb-4">
                  <Text className="text-sm font-sans-semibold mb-2" style={{ color: colors.foreground }}>Email</Text>
                  <TextInput
                     placeholder="your@email.com"
                     placeholderTextColor={colors.muted}
                     value={email}
                     onChangeText={setEmail}
                     keyboardType="email-address"
                     autoCapitalize="none"
                     autoCorrect={false}
                     editable={!isLoading}
                     style={{
                        backgroundColor: colors.fieldBackground,
                        color: colors.fieldForeground,
                        borderRadius: 12,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        fontSize: 16,
                        borderWidth: 0
                     }}
                  />
               </View>

               {/* Password Input */}
               <View className="mb-4">
                  <Text className="text-sm font-sans-semibold mb-2" style={{ color: colors.foreground }}>Password</Text>
                  <TextInput
                     placeholder="Enter your password"
                     placeholderTextColor={colors.muted}
                     value={password}
                     onChangeText={setPassword}
                     secureTextEntry
                     editable={!isLoading}
                     style={{
                        backgroundColor: colors.fieldBackground,
                        color: colors.fieldForeground,
                        borderRadius: 12,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        fontSize: 16,
                        borderWidth: 0
                     }}
                  />
               </View>

               {/* Error Message */}
               {error && (
                  <View
                     className="rounded-lg p-3 mb-4"
                     style={{ backgroundColor: colors.danger + '10' }}
                  >
                     <Text className="text-sm text-center" style={{ color: colors.danger }}>{error}</Text>
                  </View>
               )}

               {/* Sign In Button */}
               <Pressable
                  className="rounded-2xl py-4 items-center mt-2 mb-5"
                  style={{
                     backgroundColor: (isLoading || !email || !password) ? colors.border : colors.accent,
                     opacity: (isLoading || !email || !password) ? 0.5 : 1
                  }}
                  onPress={handleSignIn}
                  disabled={isLoading || !email || !password}
                  android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
               >
                  <Text className="text-base font-sans-bold" style={{ color: colors.background }}>
                     {isLoading ? 'Signing in...' : 'Sign in'}
                  </Text>
               </Pressable>

               {/* Sign Up Link */}
               <View className="flex-row justify-center items-center">
                  <Text className="text-sm font-sans" style={{ color: colors.muted }}>Don't have an account? </Text>
                  <Link href="/sign-up" asChild>
                     <Pressable>
                        <Text className="text-sm font-sans-bold underline" style={{ color: colors.accent }}>Sign up</Text>
                     </Pressable>
                  </Link>
               </View>
            </View>
         </View>
      </View>
   );
}

