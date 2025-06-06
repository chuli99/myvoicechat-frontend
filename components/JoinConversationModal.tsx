import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface JoinConversationModalProps {
  visible: boolean;
  onClose: () => void;
  onConversationJoined: () => void;
  token: string;
  userId: number;
}

interface Conversation {
  id: number;
  created_at: string;
  participants?: Array<{ user: { id: number; username: string; primary_language: string } }>;
}

export default function JoinConversationModal({ 
  visible, 
  onClose, 
  onConversationJoined, 
  token,
  userId 
}: JoinConversationModalProps) {
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState<number | null>(null);
  const [availableConversations, setAvailableConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Cargar todas las conversaciones y filtrar las disponibles
  useEffect(() => {
    const fetchAvailableConversations = async () => {
      if (!visible || !token) return;
      
      setLoading(true);
      setError(null);      try {        // Obtener todas las conversaciones
        const response = await fetch('http://localhost:8080/api/v1/conversations/all', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar conversaciones');
        }

        const allConversations = await response.json();
        
        // Para cada conversación, obtener participantes
        const conversationsWithParticipants = await Promise.all(
          allConversations.map(async (conv: Conversation) => {
            try {
              const participantsRes = await fetch(
                `http://localhost:8080/api/v1/participants/conversation/${conv.id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );
              
              if (participantsRes.ok) {
                const participants = await participantsRes.json();
                return {
                  ...conv,
                  participants
                };
              }
              
              return {
                ...conv,
                participants: []
              };
            } catch (error) {
              console.error(`Error loading participants for conversation ${conv.id}:`, error);
              return {
                ...conv,
                participants: []
              };
            }
          })
        );        // Mostrar TODAS las conversaciones (sin filtrar)
        setAvailableConversations(conversationsWithParticipants);
      } catch (e: any) {
        console.error('Error fetching available conversations:', e);
        setError(e.message || 'Error al cargar conversaciones disponibles');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableConversations();
  }, [visible, token, userId]);

  const handleJoinConversation = async (conversationId: number) => {
    setJoining(conversationId);
    try {
      const response = await fetch(`http://localhost:8080/api/v1/participants/conversation/${conversationId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Error desconocido' };
        }
        throw new Error(`Error ${response.status}: ${errorData.detail || 'Error del servidor'}`);
      }

      const result = await response.json();
      console.log('✅ Joined conversation:', result);

      // Cerrar el modal
      onClose();

      // Refrescar la lista de conversaciones
      onConversationJoined();

      // Mostrar mensaje de éxito
      Alert.alert(
        'Éxito', 
        `Te has unido a la conversación #${conversationId}`
      );
      
    } catch (error: any) {
      console.error('❌ Error joining conversation:', error);
      Alert.alert(
        'Error', 
        error.message || 'Error al unirse a la conversación'
      );
    } finally {
      setJoining(null);
    }
  };
  const getConversationName = (conversation: Conversation) => {
    if (!conversation.participants || conversation.participants.length === 0) {
      return `Conversación #${conversation.id} (Sin participantes)`;
    }
    
    const participantNames = conversation.participants.map((p) => {
      const name = p.user.username;
      const lang = p.user.primary_language;
      return lang ? `${name} (${lang})` : name;
    });
    
    return participantNames.length > 0 
      ? participantNames.join(', ') 
      : `Conversación #${conversation.id}`;
  };

  const isUserInConversation = (conversation: Conversation) => {
    return conversation.participants?.some((p) => p.user.id === userId) || false;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={styles.modalContainer}>
          {/* Botón de cerrar */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            disabled={loading || joining !== null}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <ThemedText style={styles.title}>
            Unirse a Conversación
          </ThemedText>
            <ThemedText style={styles.description}>
            Todas las conversaciones disponibles:
          </ThemedText>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#273c75" style={styles.loader} />
          ) : (
            <FlatList
              data={availableConversations}
              keyExtractor={item => item.id.toString()}
              style={styles.conversationsList}              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No hay conversaciones disponibles
                </Text>
              }              renderItem={({ item }) => {
                const userInConversation = isUserInConversation(item);
                return (
                  <View style={styles.conversationItem}>
                    <View style={styles.conversationInfo}>
                      <Text style={styles.conversationTitle}>
                        {getConversationName(item)}
                      </Text>
                      <Text style={styles.conversationId}>ID: {item.id}</Text>
                      <Text style={styles.participantCount}>
                        {item.participants?.length || 0} participante(s)
                      </Text>
                      {userInConversation && (
                        <Text style={styles.memberStatus}>
                          ✓ Ya eres miembro
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.joinButton, 
                        (joining === item.id || userInConversation) && styles.disabledButton
                      ]} 
                      onPress={() => handleJoinConversation(item.id)}
                      disabled={joining !== null || userInConversation}
                    >
                      {joining === item.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.joinButtonText}>
                          {userInConversation ? 'Miembro' : 'Unirse'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#273c75',
    marginTop: 15,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  errorText: {
    color: '#e84118',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  loader: {
    marginVertical: 30,
  },
  conversationsList: {
    maxHeight: 300,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
  },
  conversationItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  conversationInfo: {
    flex: 1,
    marginRight: 10,
  },
  conversationTitle: {
    color: '#273c75',
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
  },
  conversationId: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 2,
  },  participantCount: {
    color: '#888',
    fontSize: 11,
  },
  memberStatus: {
    color: '#27ae60',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: '#00a8ff',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    minWidth: 60,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  disabledButton: {
    backgroundColor: '#bbb',
  },
});
