import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface MessageAudioModalProps {
  visible: boolean;
  onClose: () => void;
  token: string;
  conversationId: string;
  onAudioSent: () => void;
}

export default function MessageAudioModal({ 
  visible, 
  onClose, 
  token, 
  conversationId, 
  onAudioSent 
}: MessageAudioModalProps) {
  const [selectedAudio, setSelectedAudio] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  const handleSelectAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Para web, expo-document-picker puede devolver un File object
        if (Platform.OS === 'web' && (asset as any).file) {
          setSelectedAudio({
            ...asset,
            file: (asset as any).file // Guardar referencia al File object para web
          });
        } else {
          setSelectedAudio(asset);
        }
        
        setRecordingUri(null); // Clear any recorded audio
        console.log('🔍 Archivo de audio seleccionado:', {
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType,
          uri: asset.uri,
          hasFile: !!(asset as any).file
        });
      }
    } catch (error) {
      console.error('Error selecting audio:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo de audio');
    }
  };

  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording..');
    if (!recording) return;

    setIsRecording(false);
    setRecording(null);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);
    setRecordingUri(uri);
    setSelectedAudio(null); // Clear any selected file
  };

  const handleSendAudio = async () => {
    if (!selectedAudio && !recordingUri) {
      Alert.alert('Error', 'Por favor selecciona un archivo de audio o graba uno primero');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      
      // Agregar el conversation_id
      formData.append('conversation_id', conversationId);
      formData.append('content_type', 'audio');
      
      if (recordingUri) {
        if (Platform.OS === 'web') {
          // Para web, necesitamos crear un Blob desde el URI
          try {
            const response = await fetch(recordingUri);
            const blob = await response.blob();
            formData.append('audio_file', blob, 'message_audio_recorded.m4a');
          } catch (blobError) {
            console.error('Error creating blob from recording:', blobError);
            Alert.alert('Error', 'No se pudo procesar la grabación');
            return;
          }
        } else {
          // React Native nativo
          formData.append('audio_file', {
            uri: recordingUri,
            type: 'audio/m4a',
            name: 'message_audio_recorded.m4a',
          } as any);
        }
      } else if (selectedAudio) {
        // Validar que sea un archivo de audio
        if (selectedAudio.mimeType && !selectedAudio.mimeType.startsWith('audio/')) {
          Alert.alert('Error', 'Por favor selecciona un archivo de audio válido');
          return;
        }
        
        if (Platform.OS === 'web') {
          // Para web, el selectedAudio ya debería ser un File object
          if (selectedAudio.file) {
            formData.append('audio_file', selectedAudio.file, selectedAudio.name || 'message_audio.mp3');
          } else {
            // Fallback: crear blob desde URI
            try {
              const response = await fetch(selectedAudio.uri);
              const blob = await response.blob();
              formData.append('audio_file', blob, selectedAudio.name || 'message_audio.mp3');
            } catch (blobError) {
              console.error('Error creating blob from selected file:', blobError);
              Alert.alert('Error', 'No se pudo procesar el archivo seleccionado');
              return;
            }
          }
        } else {
          // React Native nativo
          formData.append('audio_file', {
            uri: selectedAudio.uri,
            type: selectedAudio.mimeType || 'audio/mpeg',
            name: selectedAudio.name || 'message_audio.mp3',
          } as any);
        }
      }

      console.log('🔍 Enviando FormData de audio de mensaje con:');
      console.log('Platform:', Platform.OS);
      console.log('Token:', token ? 'Presente' : 'Faltante');
      console.log('Conversation ID:', conversationId);
      console.log('URL:', 'http://localhost:8080/api/v1/audio/upload-message-audio');

      const response = await fetch('http://localhost:8080/api/v1/audio/upload-message-audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // React Native maneja Content-Type automáticamente para FormData
        },
        body: formData,
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Error desconocido' };
        }
        
        throw new Error(`Error ${response.status}: ${errorData.detail || 'Error del servidor'}`);
      }

      const result = await response.json();
      console.log('✅ Audio message upload successful:', result);

      // Cerrar el modal inmediatamente después del éxito
      onClose();
      
      // Notificar que se envió el audio
      onAudioSent();

      // Limpiar estado
      setSelectedAudio(null);
      setRecordingUri(null);

      // Mostrar mensaje de éxito después de cerrar el modal
      Alert.alert(
        'Éxito', 
        'Audio enviado correctamente'
      );
      
    } catch (error: any) {
      console.error('❌ Error uploading audio message:', error);
      Alert.alert(
        'Error', 
        error.message || 'Error al enviar el audio'
      );
    } finally {
      setUploading(false);
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
            disabled={uploading}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <ThemedText style={styles.title}>
            Enviar Audio
          </ThemedText>
          
          <ThemedText style={[styles.description, styles.blueText]}>
            Puedes grabar un audio directamente o seleccionar un archivo existente.
          </ThemedText>

          <ThemedText style={styles.instruction}>
            El audio se enviará como mensaje en la conversación.
          </ThemedText>

          {/* Recording Section */}
          <View style={styles.recordingSection}>
            <TouchableOpacity 
              style={[styles.recordButton, isRecording && styles.recordingActive]} 
              onPress={isRecording ? stopRecording : startRecording}
              disabled={uploading}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? '🔴 Detener Grabación' : '🎤 Grabar Audio'}
              </Text>
            </TouchableOpacity>
            
            {recordingUri && (
              <View style={styles.selectedFileContainer}>
                <ThemedText style={styles.selectedFileText}>
                  🎵 Grabación completada
                </ThemedText>
              </View>
            )}
          </View>

          {/* File Selection Section */}
          <View style={styles.divider}>
            <Text style={styles.dividerText}>O</Text>
          </View>

          {selectedAudio && (
            <View style={styles.selectedFileContainer}>
              <ThemedText style={styles.selectedFileText}>
                📎 {selectedAudio.name}
              </ThemedText>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.selectButton} 
              onPress={handleSelectAudio}
              disabled={uploading}
            >
              <Text style={styles.selectButtonText}>
                {selectedAudio ? 'Cambiar Audio' : 'Seleccionar Audio'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.uploadButton, ((!selectedAudio && !recordingUri) || uploading) && styles.disabledButton]} 
              onPress={handleSendAudio}
              disabled={(!selectedAudio && !recordingUri) || uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.uploadButtonText}>Enviar</Text>
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
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#273c75',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  selectedFileContainer: {
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 6,
    marginBottom: 20,
  },
  selectedFileText: {
    fontSize: 14,
    color: '#2d5a2d',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  selectButton: {
    flex: 1,
    backgroundColor: '#6c5ce7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#00b894',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#ddd',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  blueText: {
    color: '#273c75',
  },
  recordingSection: {
    marginBottom: 20,
  },
  recordButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  recordingActive: {
    backgroundColor: '#c0392b',
  },
  recordButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerText: {
    color: '#999',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
