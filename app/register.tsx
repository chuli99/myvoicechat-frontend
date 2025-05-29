import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedButton } from '@/components/ThemedButton';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);  const [formError, setFormError] = useState<string | null>(null);
  const { register, error, clearError } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      setFormError('All fields are required');
      return false;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Please enter a valid email');
      return false;
    }
    
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return false;
    }
    
    setFormError(null);
    return true;
  };
  
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await register(username, email, 'en', password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = formError || error;
  const clearDisplayError = () => {
    if (formError) {
      setFormError(null);
    } else {
      clearError();
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Stack.Screen options={{ title: 'Register', headerShown: false }} />
        <ThemedView style={styles.container}>
          <Image 
            source={require('../assets/images/react-logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          
          <ThemedText style={styles.title} type="title">Create Account</ThemedText>
          <ThemedText style={styles.subtitle} type="subtitle">Sign up to get started</ThemedText>          <ErrorMessage
            error={displayError}
            onDismiss={clearDisplayError}
          />
          
          <ThemedInput
            label="Username"
            placeholder="Choose a username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <ThemedInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <ThemedInput
            label="Password"
            placeholder="Create a password (min 8 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <ThemedInput
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          
          <ThemedButton
            title="Create Account"
            onPress={handleRegister}
            isLoading={isSubmitting}
            style={styles.button}
          />
          
          <ThemedView style={styles.footer}>
            <ThemedText>Already have an account? </ThemedText>
            <Link href="/login" style={{ color: tintColor }}>
              <ThemedText type="link">Login</ThemedText>
            </Link>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 30,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 30,
    opacity: 0.7,
  },
  button: {
    width: '100%',
    marginTop: 10,
  },
  footer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
