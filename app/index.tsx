import { router } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
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
  };  return (
    <ThemedView style={styles.container}>
      
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>MyVoice Chat</ThemedText>
      </ThemedView>
      
      
        
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
  },  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    zIndex: 10,
    backgroundColor: '#273c75',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 120, // Para hacer espacio para el header más grande
    width: '100%',
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
