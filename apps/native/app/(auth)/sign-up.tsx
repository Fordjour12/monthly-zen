import React, { useState } from 'react';
import { View, Text, Pressable, Alert, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSemanticColors } from '@/utils/theme-utils';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Theme utilities
  const colors = useSemanticColors();

  const { signUp, error, clearError } = useAuthStore();
  const router = useRouter();

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const success = await signUp(email.trim(), password, name.trim());
      if (success) {
        router.replace('/(tabs)');
      }
    } catch (err) {
      // Error is handled by the store
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    Alert.alert('Coming Soon', 'Google Sign Up will be available soon!');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="absolute inset-0" style={{ backgroundColor: colors.background }} />

      {/* Curved Card Container */}
      <ScrollView
        contentContainerClassName="flex-grow justify-center py-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center px-5">
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
              <Text className="text-3xl font-sans-bold mb-1" style={{ color: colors.foreground }}>Create Account</Text>
              <Text className="text-sm font-sans" style={{ color: colors.muted }}>• Join us to track your expenses</Text>
            </View>

            {/* Google Sign Up Button */}
            <Pressable
              className="rounded-2xl py-3.5 px-5 flex-row items-center justify-center mb-5"
              style={{ backgroundColor: colors.accent }}
              onPress={handleGoogleSignUp}
              android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
              <View
                className="rounded-xl w-6 h-6 items-center justify-center mr-3"
                style={{ backgroundColor: colors.background }}
              >
                <Ionicons name="logo-google" size={20} color={colors.accent} />
              </View>
              <Text className="text-base font-sans-semibold" style={{ color: colors.background }}>
                Sign up with Google
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

            {/* Name Input */}
            <View className="mb-4">
              <Text className="text-sm font-sans-semibold mb-2" style={{ color: colors.foreground }}>Full Name</Text>
              <TextInput
                placeholder="Enter your name"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
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
                placeholder="Create a password"
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

            {/* Sign Up Button */}
            <Pressable
              className="rounded-2xl py-4 items-center mt-2 mb-5"
              style={{
                backgroundColor: (isLoading || !name || !email || !password) ? colors.border : colors.accent,
                opacity: (isLoading || !name || !email || !password) ? 0.5 : 1
              }}
              onPress={handleSignUp}
              disabled={isLoading || !name || !email || !password }
              android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
              <Text className="text-base font-sans-bold" style={{ color: colors.background }}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Text>
            </Pressable>

            {/* Sign In Link */}
            <View className="flex-row justify-center items-center mb-4">
              <Text className="text-sm font-sans" style={{ color: colors.muted }}>Already have an account? </Text>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable>
                  <Text className="text-sm font-sans-bold underline" style={{ color: colors.accent }}>Sign in</Text>
                </Pressable>
              </Link>
            </View>

            {/* Terms */}
            <View className="px-2">
              <Text className="text-xs text-center leading-relaxed font-sans" style={{ color: colors.muted }}>
                By creating an account, you agree to our{' '}
                <Text className="font-sans-semibold" style={{ color: colors.foreground }}>Terms</Text> and{' '}
                <Text className="font-sans-semibold" style={{ color: colors.foreground }}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
