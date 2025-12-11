import React, { useState } from 'react';
import { View, Text, Pressable, Alert, TextInput, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      {/* Dark Background */}
      <View style={styles.background} />

      {/* Curved Card Container */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.subtitleText}>• Sign in to track your expenses</Text>
          </View>

          {/* Google Sign In Button */}
          <Pressable
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            android_ripple={{ color: '#f0f0f0' }}
          >
            <View style={styles.googleIconContainer}>
              <Ionicons name="logo-google" size={20} color="#000" />
            </View>
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with email</Text>
            <View style={styles.dividerLine} />
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
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
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

          {/* Sign In Button */}
          <Pressable
            style={[
              styles.signInButton,
              (isLoading || !email || !password) && styles.signInButtonDisabled
            ]}
            onPress={handleSignIn}
            disabled={isLoading || !email || !password}
            android_ripple={{ color: '#333' }}
          >
            <Text style={styles.signInButtonText}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Text>
          </Pressable>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text style={styles.signUpLink}>Sign up</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
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
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
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
  signInButton: {
    backgroundColor: '#000',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  signInButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  signUpLink: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});