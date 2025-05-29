import React from 'react';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link, Stack, router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedButton } from '@/components/ThemedButton';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  
  const navigateToLogin = () => {
    router.replace('/login');
  };
  
  const navigateToRegister = () => {
    router.replace('/register');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
        <Image 
        source={require('../assets/images/react-logo.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />
      
      <ThemedText style={styles.title} type="title">MyVoiceChat</ThemedText>
      <ThemedText style={styles.subtitle}>Your modern voice interface</ThemedText>
      
      <ThemedView style={styles.featureContainer}>
        <ThemedView style={styles.featureItem}>
          <ThemedText style={styles.featureTitle}>Simple</ThemedText>
          <ThemedText style={styles.featureDescription}>
            Intuitive interface designed for all users
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.featureItem}>
          <ThemedText style={styles.featureTitle}>Fast</ThemedText>
          <ThemedText style={styles.featureDescription}>
            Real-time voice communications
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.featureItem}>
          <ThemedText style={styles.featureTitle}>Secure</ThemedText>
          <ThemedText style={styles.featureDescription}>
            Your conversations are private and protected
          </ThemedText>
        </ThemedView>
      </ThemedView>
        <ThemedView style={styles.buttonContainer}>
        <ThemedButton
          title="Login"
          onPress={navigateToLogin}
          style={styles.primaryButton}
        />
        
        <ThemedButton
          title="Create Account"
          variant="outline"
          onPress={navigateToRegister}
          style={styles.secondaryButton}
        />
      </ThemedView>
      
      <ThemedText style={styles.footerText}>
        © 2025 MyVoiceChat - All rights reserved
      </ThemedText>
    </ThemedView>
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
    width: 120,
    height: 120,
    marginBottom: 40,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.7,
    marginBottom: 30,
    textAlign: 'center',
  },
  featureContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 30,
  },
  featureItem: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },  featureDescription: {
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 40,
  },
  primaryButton: {
    width: '100%',
    marginBottom: 16,
  },
  secondaryButton: {
    width: '100%',
  },
  footerText: {
    position: 'absolute',
    bottom: 20,
    opacity: 0.5,
    fontSize: 12,
  },
});
