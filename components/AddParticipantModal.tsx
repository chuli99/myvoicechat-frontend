import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { BASE_URL } from '@/config/api';

interface AddParticipantModalProps {
  visible: boolean;
  onClose: () => void;
  onParticipantAdded: () => void;
  token: string;
  conversationId: string;
}

export default function AddParticipantModal({ 
  visible, 
  onClose, 
  onParticipantAdded, 
  token,
  conversationId 
}: AddParticipantModalProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setUsername('');
    setError(null);
    onClose();
  };

  const handleAddParticipant = async () => {
    if (!username.trim()) {
      setError('Por favor ingresa un nombre de usuario');
      return;
    }

    setLoading(true);
    setError(null);    try {
      // Buscar usuario por username usando la nueva ruta
      const searchResponse = await fetch(`${BASE_URL}/api/v1/users/search/${encodeURIComponent(username.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!searchResponse.ok) {
        if (searchResponse.status === 404) {
          throw new Error('Usuario no encontrado');
        }
        throw new Error('Error al buscar usuario');
      }

      const userData = await searchResponse.json();
      
      if (!userData || !userData.id) {
        throw new Error('Usuario no encontrado');
      }

      // Agregar el participante a la conversación
      const addResponse = await fetch(`${BASE_URL}/api/v1/participants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.id,
          conversation_id: parseInt(conversationId)
        }),
      });

      if (!addResponse.ok) {
        const errorText = await addResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Error desconocido' };
        }
        
        if (addResponse.status === 409) {
          throw new Error('El usuario ya es participante de esta conversación');
        }
        
        throw new Error(`Error ${addResponse.status}: ${errorData.detail || 'Error del servidor'}`);
      }

      const result = await addResponse.json();
      console.log('✅ Participant added:', result);

      // Mostrar mensaje de éxito
      Alert.alert(
        'Éxito', 
        `${userData.username} ha sido agregado a la conversación`
      );

      // Cerrar el modal y refrescar participantes
      handleClose();
      onParticipantAdded();
      
    } catch (error: any) {
      console.error('❌ Error adding participant:', error);
      setError(error.message || 'Error al agregar participante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={styles.modalContainer}>
          {/* Botón de cerrar */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <ThemedText style={styles.title}>
            Agregar Participante
          </ThemedText>
          
          <ThemedText style={styles.description}>
            Ingresa el nombre de usuario de la persona que deseas agregar a esta conversación:
          </ThemedText>

          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Nombre de usuario"
            placeholderTextColor="#888"
            editable={!loading}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleAddParticipant}
          />

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.addButton, loading && styles.disabledButton]} 
              onPress={handleAddParticipant}
              disabled={loading || !username.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.addButtonText}>Agregar</Text>
              )}
            </TouchableOpacity>
          </View>
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
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#273c75',
    paddingRight: 32,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  input: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#f1f2f6',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#00a8ff',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#bbb',
  },
});
