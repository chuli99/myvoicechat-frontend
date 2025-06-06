import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface CreateConversationModalProps {
  visible: boolean;
  onClose: () => void;
  onConversationCreated: () => void;
  token: string;
}

export default function CreateConversationModal({ 
  visible, 
  onClose, 
  onConversationCreated, 
  token 
}: CreateConversationModalProps) {
  const [creating, setCreating] = useState(false);

  const handleCreateConversation = async () => {
    setCreating(true);
    try {
      const response = await fetch('http://localhost:8080/api/v1/conversations', {
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
      console.log('✅ Conversation created:', result);

      // Cerrar el modal
      onClose();

      // Refrescar la lista de conversaciones
      onConversationCreated();

      // Mostrar mensaje de éxito
      Alert.alert(
        'Éxito', 
        `Conversación creada correctamente (ID: ${result.id})`
      );
      
    } catch (error: any) {
      console.error('❌ Error creating conversation:', error);
      Alert.alert(
        'Error', 
        error.message || 'Error al crear la conversación'
      );
    } finally {
      setCreating(false);
    }
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
            disabled={creating}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <ThemedText style={styles.title}>
            Crear Nueva Conversación
          </ThemedText>
          
          <ThemedText style={styles.description}>
            ¿Deseas crear una nueva conversación? Una vez creada, podrás invitar a otros usuarios a unirse.
          </ThemedText>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              disabled={creating}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.createButton, creating && styles.disabledButton]} 
              onPress={handleCreateConversation}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.createButtonText}>Crear</Text>
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
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 400,
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
    marginBottom: 20,
    color: '#273c75',
    marginTop: 15,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 25,
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#273c75',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#bbb',
  },
});
