import React, { useState } from 'react';
import { View, Text, Pressable, Alert, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    <View className="flex-1 bg-black">
      {/* Dark Background */}
      <View className="absolute inset-0 bg-black" />

      {/* Curved Card Container */}
      <ScrollView
        contentContainerClassName="flex-grow justify-center py-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center px-5">
          <View className="bg-gray-50 rounded-3xl p-8 w-full max-w-md shadow-lg shadow-black/20">
            {/* Header */}
            <View className="mb-6">
              <Text className="text-3xl font-bold text-black mb-1">Create Account</Text>
              <Text className="text-sm text-gray-500 font-normal">• Join us to track your expenses</Text>
            </View>

            {/* Google Sign Up Button */}
            <Pressable
              className="bg-black rounded-2xl py-3.5 px-5 flex-row items-center justify-center mb-5"
              onPress={handleGoogleSignUp}
              android_ripple={{ color: '#f0f0f0' }}
            >
              <View className="bg-white rounded-xl w-6 h-6 items-center justify-center mr-3">
                <Ionicons name="logo-google" size={20} color="#000" />
              </View>
              <Text className="text-white text-base font-semibold">Sign up with Google</Text>
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="text-gray-400 text-xs px-3 font-normal">or continue with email</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Name Input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-black mb-2">Full Name</Text>
              <TextInput
                placeholder="Enter your name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
                className="bg-gray-100 rounded-xl py-3.5 px-4 text-base text-black border-0"
              />
            </View>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-black mb-2">Email</Text>
              <TextInput
                placeholder="your@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                className="bg-gray-100 rounded-xl py-3.5 px-4 text-base text-black border-0"
              />
            </View>

            {/* Password Input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-black mb-2">Password</Text>
              <TextInput
                placeholder="Create a password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                className="bg-gray-100 rounded-xl py-3.5 px-4 text-base text-black border-0"
              />
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-50 rounded-lg p-3 mb-4">
                <Text className="text-red-600 text-sm text-center">{error}</Text>
              </View>
            )}

            {/* Sign Up Button */}
            <Pressable
              className={`bg-black rounded-2xl py-4 items-center mt-2 mb-5 ${(isLoading || !name || !email || !password ) ? 'bg-gray-500 opacity-50' : ''}`}
              onPress={handleSignUp}
              disabled={isLoading || !name || !email || !password }
              android_ripple={{ color: '#333' }}
            >
              <Text className="text-white text-base font-bold">
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Text>
            </Pressable>

            {/* Sign In Link */}
            <View className="flex-row justify-center items-center mb-4">
              <Text className="text-sm text-gray-500">Already have an account? </Text>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable>
                  <Text className="text-sm text-black font-bold underline">Sign in</Text>
                </Pressable>
              </Link>
            </View>

            {/* Terms */}
            <View className="px-2">
              <Text className="text-xs text-gray-400 text-center leading-relaxed">
                By creating an account, you agree to our{' '}
                <Text className="text-black font-semibold">Terms</Text> and{' '}
                <Text className="text-black font-semibold">Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
