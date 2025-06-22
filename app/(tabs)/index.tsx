import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import CreateConversationModal from '@/components/CreateConversationModal';
import ReferenceAudioModal from '@/components/ReferenceAudioModal';
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
  const router = useRouter();  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchConversations = async () => {
    if (!authState.token) return;
    setLoading(true);
    setError(null);    try {
      const api = createAuthenticatedAPI(authState.token);
      const res = await api.get('/conversations');
      
      // Para cada conversación, obtener también los participantes
      const conversationsWithParticipants = await Promise.all(
        res.data.map(async (conv: any) => {
          try {
            const participantsRes = await api.get(`/participants/conversation/${conv.id}`);
            return {
              ...conv,
              participants: participantsRes.data
            };
          } catch (error) {
            console.error(`Error loading participants for conversation ${conv.id}:`, error);
            return {
              ...conv,
              participants: []
            };
          }
        })
      );
      
      setConversations(conversationsWithParticipants);
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

  useEffect(() => {
    fetchConversations();
  }, [authState.token]);

  const handleCloseAudioModal = () => {
    setShowAudioModal(false);
  };
  const handleShowAudioModalManually = () => {
    setShowAudioModal(true);
  };

  const handleShowCreateModal = () => {
    setShowCreateModal(true);
  };
  const handleConversationCreatedOrJoined = () => {
    // Refrescar la lista de conversaciones
    fetchConversations();
  };const handleEnterConversation = (id: number) => {
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

  // Función para generar el nombre de la conversación
  const getConversationName = (conversation: any) => {
    if (!conversation.participants || conversation.participants.length === 0) {
      return `Conversación #${conversation.id}`;
    }
    
    // Filtrar participantes que no sean el usuario actual
    const otherParticipants = conversation.participants.filter(
      (p: any) => p.user.id !== authState.userId
    );
    
    if (otherParticipants.length === 0) {
      return `Conversación #${conversation.id} (Solo yo)`;
    }
    
    // Crear nombres con idioma si está disponible
    const participantNames = otherParticipants.map((p: any) => {
      const name = p.user.username;
      const lang = p.user.primary_language;
      return lang ? `${name} (${lang})` : name;
    });
    
    return participantNames.join(', ');
  };  const handleLogout = async () => {
    try {
      console.log('🔐 Iniciando proceso de cierre de sesión...');
      
      // Limpiar datos de sesión
      await logout();
      
      // Forzar navegación al login
      console.log('📱 Redirigiendo al login...');
      router.replace('/login');
      
      console.log('✅ Sesión cerrada exitosamente');
      
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      // En caso de error, forzar navegación de todas formas
      router.replace('/login');
    }
  };
  return (
    <ThemedView style={styles.container}>      {/* Modal de audio de referencia */}
      <ReferenceAudioModal
        visible={showAudioModal}
        onClose={handleCloseAudioModal}
        token={authState.token || ''}
      />

      {/* Modal para crear conversación */}
      <CreateConversationModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConversationCreated={handleConversationCreatedOrJoined}        token={authState.token || ''}
      />

      {/* Header MyVoice Chat */}
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>MyVoice Chat</ThemedText>
        <View style={styles.headerButtons}>
          {/* Botón para subir audio de referencia */}          <TouchableOpacity 
            style={styles.audioButton} 
            onPress={handleShowAudioModalManually}
          >
            <ThemedText style={styles.audioButtonText}>
              🎙️ Audio de Referencia
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <ThemedText style={styles.logoutButtonText}>Cerrar sesión</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
      
      {/* Content */}
      <ThemedView style={styles.content}>        <ThemedView style={styles.titleContainer}>
          <ThemedText style={styles.conversationsTitle}>Mis Conversaciones</ThemedText>
          <View style={styles.conversationButtons}>
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={handleShowCreateModal}
              disabled={loading}
            >
              <Text style={styles.createButtonText}>+ Crear</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
        {error && <Text style={{ color: '#e84118', marginBottom: 10 }}>{error}</Text>}
        {loading ? (
          <ActivityIndicator size="large" color={tintColor} style={{ marginVertical: 30 }} />
        ) : (        <FlatList
            data={conversations}
            keyExtractor={item => item.id.toString()}
            ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 30 }}>No tienes conversaciones aún.</Text>}
            renderItem={({ item }) => (
              <View style={convStyles.item}>
                <View style={convStyles.conversationInfo}>
                  <Text style={convStyles.title}>{getConversationName(item)}</Text>
                  <Text style={convStyles.conversationId}>ID: {item.id}</Text>
                </View>
                <TouchableOpacity style={convStyles.enterBtn} onPress={() => handleEnterConversation(item.id)}>
                  <Text style={{ color: '#fff' }}>Entrar</Text>
                </TouchableOpacity>
              </View>
            )}
            style={{ marginTop: 20 }}
          />
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },  header: {
    backgroundColor: '#273c75',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conversationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#273c75',
  },headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  audioButton: {
    backgroundColor: '#00a8ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  audioButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: '#e84118',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  conversationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButton: {
    backgroundColor: '#00a8ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',    fontSize: 12,
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
  conversationInfo: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    color: '#273c75',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  conversationId: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  enterBtn: {
    backgroundColor: '#273c75',
    borderRadius: 5,
    paddingVertical: 7,
    paddingHorizontal: 18,
  },
});
