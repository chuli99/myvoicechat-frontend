import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ProfileScreen() {
  const { authState, logout } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'My Profile' }} />
      
      <View style={styles.header}>
        <View style={[styles.avatarContainer, { borderColor: tintColor }]}>
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
          <ThemedText style={styles.infoLabel}>Username:</ThemedText>
          <ThemedText style={styles.infoValue}>{authState.username}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>User ID:</ThemedText>
          <ThemedText style={styles.infoValue}>{authState.userId}</ThemedText>
        </View>
      </View>
      
      <View style={styles.tokenSection}>
        <ThemedText style={styles.sectionTitle} type="subtitle">Authentication Token</ThemedText>
        <ThemedView 
          style={[styles.tokenContainer, { backgroundColor: colorScheme === 'dark' ? '#222' : '#f0f0f0' }]}
        >
          <ThemedText style={styles.tokenText} numberOfLines={3} ellipsizeMode="middle">
            {authState.token}
          </ThemedText>
        </ThemedView>
      </View>
      
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: tintColor }]}
        onPress={logout}
      >
        <ThemedText style={styles.logoutButtonText}>Sign Out</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  welcomeText: {
    marginBottom: 5,
  },
  infoContainer: {
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
  },
  tokenSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  tokenContainer: {
    padding: 15,
    borderRadius: 8,
  },
  tokenText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  logoutButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
