import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ProfileScreen() {
  const { authState, logout, fetchUserData } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  useEffect(() => {
    console.log('📱 ProfileScreen: useEffect ejecutándose...');
    console.log('📱 ProfileScreen: authState.token:', authState.token ? 'Token presente' : 'Sin token');
    // Fetch user data when component mounts
    fetchUserData();
  }, [fetchUserData]);

  // Debug log del estado actual
  useEffect(() => {
    console.log('📱 ProfileScreen: Estado actual del perfil:', {
      username: authState.username,
      email: authState.email,
      primaryLanguage: authState.primaryLanguage,
      createdAt: authState.createdAt,
    });
  }, [authState.email, authState.primaryLanguage, authState.createdAt]);

  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Perfil' }} />
      
      <View style={styles.header}>      <View style={[styles.avatarContainer]}>
        <ThemedText style={styles.avatarText}>
            {authState.username?.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <ThemedText style={styles.welcomeText} type="title">
          {authState.username}
        </ThemedText>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Nombre de usuario:</ThemedText>
          <ThemedText style={styles.infoValue}>{authState.username}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Email:</ThemedText>
          <ThemedText style={styles.infoValue}>{authState.email || 'No disponible'}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>User ID:</ThemedText>
          <ThemedText style={styles.infoValue}>{authState.userId}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Idioma:</ThemedText>
          <ThemedText style={styles.infoValue}>{authState.primaryLanguage || 'Español'}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Fecha de creación:</ThemedText>
          <ThemedText style={styles.infoValue}>{formatDate(authState.createdAt)}</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#273c75',
    backgroundColor: '#273c75',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeText: {
    marginBottom: 5,
    color: '#273c75',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#273c75',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#273c75',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
});
