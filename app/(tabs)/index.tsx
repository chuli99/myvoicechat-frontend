import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { createAuthenticatedAPI } from '@/services/api';

export default function HomeScreen() {
  const { authState, logout } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const router = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!authState.token) return;
      setLoading(true);
      setError(null);
      try {
        const api = createAuthenticatedAPI(authState.token);
        const res = await api.get('/conversations');
        setConversations(res.data);
      } catch (e: any) {
        if (e.response?.status === 401) {
          logout();
        } else {
          setError(e.response?.data?.detail || 'Error al cargar conversaciones');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [authState.token]);  const handleEnterConversation = (id: number) => {
    console.log('handleEnterConversation called with id:', id);
    console.log('Current auth state:', authState.token ? 'authenticated' : 'not authenticated');
    
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    try {
      console.log('Attempting navigation to conversation with id:', id);
      // Use replace to completely navigate away from tabs
      router.replace(`/conversation?id=${id}`);
      console.log('Navigation call completed');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Mis Conversaciones</ThemedText>
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: '#e84118', marginLeft: 12 }]} onPress={logout}>
          <ThemedText style={styles.logoutButtonText}>Cerrar sesión</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      {error && <Text style={{ color: '#e84118', marginBottom: 10 }}>{error}</Text>}
      {loading ? (
        <ActivityIndicator size="large" color={tintColor} style={{ marginVertical: 30 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 30 }}>No tienes conversaciones aún.</Text>}
          renderItem={({ item }) => (
            <View style={convStyles.item}>
              <Text style={convStyles.title}>Conversación #{item.id}</Text>
              <TouchableOpacity style={convStyles.enterBtn} onPress={() => handleEnterConversation(item.id)}>
                <Text style={{ color: '#fff' }}>Entrar</Text>
              </TouchableOpacity>
            </View>
          )}
          style={{ marginTop: 20 }}
        />
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  logoutButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

const convStyles = StyleSheet.create({
  item: {
    backgroundColor: '#f1f2f6',
    borderRadius: 8,
    marginBottom: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#273c75',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    color: '#273c75',
    fontWeight: '600',
    fontSize: 16,
  },
  enterBtn: {
    backgroundColor: '#273c75',
    borderRadius: 5,
    paddingVertical: 7,
    paddingHorizontal: 18,
  },
});
