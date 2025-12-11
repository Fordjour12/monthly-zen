import React, { useState } from 'react';
import { View, Text, Pressable, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        router.replace('/(tabs)');
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
    <View className="flex-1 bg-black">
      {/* Dark Background */}
      <View className="absolute inset-0 bg-black" />

      {/* Curved Card Container */}
      <View className="flex-1 justify-center items-center px-5">
        <View className="bg-gray-50 rounded-3xl p-8 w-full max-w-md shadow-lg shadow-black/20">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-black mb-1">Welcome</Text>
            <Text className="text-sm text-gray-500 font-normal">• Sign in to track your expenses</Text>
          </View>

          {/* Google Sign In Button */}
          <Pressable
            className="bg-black rounded-2xl py-3.5 px-5 flex-row items-center justify-center mb-5"
            onPress={handleGoogleSignIn}
            android_ripple={{ color: '#f0f0f0' }}
          >
            <View className="bg-white rounded-xl w-6 h-6 items-center justify-center mr-3">
              <Ionicons name="logo-google" size={20} color="#000" />
            </View>
            <Text className="text-white text-base font-semibold">Sign in with Google</Text>
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center my-5">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="text-gray-400 text-xs px-3 font-normal">or continue with email</Text>
            <View className="flex-1 h-px bg-gray-300" />
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
              placeholder="Enter your password"
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

          {/* Sign In Button */}
          <Pressable
            className={`bg-black rounded-2xl py-4 items-center mt-2 mb-5 ${(isLoading || !email || !password) ? 'bg-gray-500 opacity-50' : ''}`}
            onPress={handleSignIn}
            disabled={isLoading || !email || !password}
            android_ripple={{ color: '#333' }}
          >
            <Text className="text-white text-base font-bold">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Text>
          </Pressable>

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-gray-500">Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text className="text-sm text-black font-bold underline">Sign up</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}

