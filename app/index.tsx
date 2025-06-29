import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Image } from 'react-native';

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
      {/* Logo principal */}
      <Image 
        source={require('../img/icons/logo.png')} 
        style={styles.mainLogo} 
        resizeMode="contain"
      />
      
      <ThemedText style={styles.subtitle}>Tu interfaz de voz moderna</ThemedText>
        
        <ThemedView style={styles.featureContainer}>
          <ThemedView style={styles.featureItem}>
            <ThemedText style={styles.featureTitle}>Simple</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Interfaz intuitiva diseñada para todos los usuarios
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.featureItem}>
            <ThemedText style={styles.featureTitle}>Rápido</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Comunicaciones de voz en tiempo real
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.featureItem}>
            <ThemedText style={styles.featureTitle}>Multilenguaje</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Inglés, Chino y Español
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.buttonContainer}>
          <ThemedButton
            title="Iniciar Sesión"
            onPress={navigateToLogin}
            style={styles.primaryButton}
          />
          
          <ThemedButton
            title="Crear Cuenta"
            variant="outline"
            onPress={navigateToRegister}
            style={styles.secondaryButton}
          />
        </ThemedView>
          <ThemedText style={styles.footerText}>
          © 2025 MyVoiceChat - Todos los derechos reservados
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
  mainLogo: {
    width: 240,
    height: 240,
    marginBottom: 30,
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
  },
  featureDescription: {
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
