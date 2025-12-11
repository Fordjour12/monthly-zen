import React, { useState } from 'react';
import { View, Text, Pressable, Alert, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
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
    <View style={styles.container}>
      {/* Dark Background */}
      <View style={styles.background} />

      {/* Curved Card Container */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.welcomeText}>Create Account</Text>
              <Text style={styles.subtitleText}>• Join us to track your expenses</Text>
            </View>

            {/* Google Sign Up Button */}
            <Pressable
              style={styles.googleButton}
              onPress={handleGoogleSignUp}
              android_ripple={{ color: '#f0f0f0' }}
            >
              <View style={styles.googleIconContainer}>
                <Ionicons name="logo-google" size={20} color="#000" />
              </View>
              <Text style={styles.googleButtonText}>Sign up with Google</Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                placeholder="Enter your name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
                style={styles.input}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                placeholder="your@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                style={styles.input}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                placeholder="Create a password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                style={styles.input}
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isLoading}
                style={styles.input}
              />
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Sign Up Button */}
            <Pressable
              style={[
                styles.signUpButton,
                (isLoading || !name || !email || !password || !confirmPassword) && styles.signUpButtonDisabled
              ]}
              onPress={handleSignUp}
              disabled={isLoading || !name || !email || !password || !confirmPassword}
              android_ripple={{ color: '#333' }}
            >
              <Text style={styles.signUpButtonText}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Text>
            </Pressable>

            {/* Sign In Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable>
                  <Text style={styles.signInLink}>Sign in</Text>
                </Pressable>
              </Link>
            </View>

            {/* Terms */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  cardContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  googleButton: {
    backgroundColor: '#000',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  googleIconContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#999',
    fontSize: 12,
    paddingHorizontal: 12,
    fontWeight: '400',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#000',
    borderWidth: 0,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    textAlign: 'center',
  },
  signUpButton: {
    backgroundColor: '#000',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  signUpButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  signInLink: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  termsContainer: {
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#000',
    fontWeight: '600',
  },
});