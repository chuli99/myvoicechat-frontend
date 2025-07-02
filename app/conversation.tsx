import AddParticipantModal from '@/components/AddParticipantModal';
import MessageAudioModal from '@/components/MessageAudioModal';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthenticatedAPI } from '@/services/api';
import { BASE_URL, getWebSocketURL } from '@/config/api';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Actualiza la interfaz Message para incluir sender
interface Message {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  content_type?: string;
  media_url?: string | null;
  is_read?: boolean;
  conversation_id?: number;
  temp?: boolean; // Para mensajes optimistas
  sender?: {
    id: number;
    username: string;
    email?: string;
    primary_language?: string;
    created_at?: string;
    is_active?: boolean;
  };
  translatedContent?: string; // Contenido traducido cacheado
  isLoadingTranslation?: boolean; // Estado de carga de traducción
  // Propiedades para audio traducido
  translatedAudioUrl?: string; // URL del audio traducido cacheado
  isLoadingAudioTranslation?: boolean; // Estado de carga de traducción de audio
}

// Tipos de mensajes WebSocket
interface WebSocketMessage {
  type: 'new_message' | 'user_joined' | 'user_left' | 'typing' | 'message_read';
  data?: any;
  user_id?: number;
  is_typing?: boolean;
}

interface Participant {
  user: {
    id: number;
    username: string;
    primary_language?: string;
  };
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { authState } = useAuth();
  const insets = useSafeAreaInsets();
  
  console.log('ConversationScreen mounted with id:', id);
  console.log('Auth state:', authState.token ? 'authenticated' : 'not authenticated');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawMessagesResponse, setRawMessagesResponse] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
    // Refs
  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);  const heartbeatRef = useRef<number | null>(null);
  
  // WebSocket state
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
    // Estado para el modal de audio
  const [showAudioModal, setShowAudioModal] = useState(false);
    // Estado para reproducción de audio
  const [playingAudio, setPlayingAudio] = useState<{ [key: string]: boolean }>({});
  const [audioObjects, setAudioObjects] = useState<{ [key: string]: any }>({});
  // Estado para el switch de audio (original vs traducido)
  const [audioSwitchStates, setAudioSwitchStates] = useState<{ [key: number]: boolean }>({});
  // Estado para el switch de traducción de texto (original vs traducido)
  const [textSwitchStates, setTextSwitchStates] = useState<{ [key: number]: boolean }>({});
  // Función para refrescar participantes
  const fetchParticipants = async () => {
    if (!authState.token || !id) return;
    
    try {
      const api = createAuthenticatedAPI(authState.token);
      const response = await api.get(`/participants/conversation/${id}`);
      setParticipants(response.data);
      console.log('Participantes actualizados:', response.data);
    } catch (error) {
      console.error('Error al cargar participantes:', error);
    }
  };  // Manejar cuando se agrega un participante
  const handleParticipantAdded = () => {
    fetchParticipants(); // Refrescar la lista de participantes
    // También podríamos emitir un evento WebSocket para notificar a otros usuarios
  };  // Manejar cuando se envía un audio - Crear mensaje optimista
  const handleAudioSent = () => {
    // Crear mensaje optimista para audio
    const tempAudioMessage: Message = {
      id: Date.now(), // ID temporal
      sender_id: authState.userId!,
      content: 'Audio', // Texto placeholder
      content_type: 'audio',
      created_at: new Date().toISOString(),
      temp: true,
      sender: {
        id: authState.userId!,
        username: 'Tú'
      }
    };
    
    // Agregar mensaje optimista inmediatamente
    setMessages(prev => [...prev, tempAudioMessage]);
    
    // Scroll al final
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    
    console.log('✅ Mensaje de audio optimista creado - esperando mensaje real por WebSocket');
  };// Función para conectar WebSocket
  const connectWebSocket = () => {
    if (!authState.token || !id || wsRef.current?.readyState === WebSocket.OPEN) return;

    // Usar la misma URL que funciona en el HTML
    const wsUrl = getWebSocketURL(`/api/v1/ws/${id}?token=${encodeURIComponent(authState.token)}`);
    console.log('Conectando WebSocket a:', wsUrl);
    
    try {
      wsRef.current = new WebSocket(wsUrl);    wsRef.current.onopen = () => {
      console.log('WebSocket conectado');
      setIsConnected(true);
      setReconnectAttempts(0);
      startHeartbeat();
    };

    wsRef.current.onmessage = (event) => {
      if (event.data === 'pong') return; // Ignorar pongs
      
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('WebSocket mensaje recibido:', message);        switch (message.type) {          case 'new_message':
            if (message.data) {
              console.log('🔍 WEBSOCKET DEBUG - Nuevo mensaje recibido:');
              console.log('🔍 Message data completo:', JSON.stringify(message.data, null, 2));
              console.log('🔍 content_type:', message.data.content_type);
              console.log('🔍 media_url:', message.data.media_url);
              console.log('🔍 sender_id:', message.data.sender_id);
              console.log('🔍 message id:', message.data.id);
              
              // LOGGING ESPECÍFICO PARA AUDIOS
              if (message.data.content_type === 'audio' && message.data.media_url) {
                console.log('🎵 AUDIO MESSAGE DEBUG:');
                console.log('🎵 Raw media_url:', message.data.media_url);
                console.log('🎵 media_url includes uploads/audio/:', message.data.media_url.includes('uploads/audio/'));
                
                // Intentar construir la URL que se va a usar
                try {
                  const testUrl = buildAudioUrl(message.data.media_url);
                  console.log('🎵 URL que se construirá para reproducción:', testUrl);
                } catch (e) {
                  console.error('🎵 Error al construir URL:', e);
                }
              }
                setMessages(prev => {
                // Verificar si el mensaje ya existe para evitar duplicados
                const exists = prev.find(m => m.id === message.data.id && !m.temp);
                if (exists) {
                  console.log('Mensaje duplicado ignorado:', message.data.id);
                  return prev;
                }
                
                console.log('✅ Procesando nuevo mensaje:', message.data.id);
                  // Remover cualquier mensaje temporal del mismo usuario con contenido similar
                // Esto es especialmente importante para mensajes de texto
                const filteredMessages = prev.filter(m => {
                  // Si es un mensaje temporal del mismo usuario
                  if (m.temp && m.sender_id === message.data.sender_id) {
                    console.log('🔍 Evaluando mensaje temporal:', m.id, 'content:', m.content, 'type:', m.content_type);
                    
                    // Para mensajes de texto, comparar contenido
                    if (message.data.content_type === 'text' && m.content_type === 'text') {
                      // Si el contenido es similar, es probable que sea el mismo mensaje
                      if (m.content && message.data.content && m.content.trim() === message.data.content.trim()) {
                        console.log('🗑️ Removiendo mensaje temporal de texto duplicado:', m.id, 'contenido:', m.content);
                        return false; // Remover este mensaje temporal
                      }
                    }
                    // Para mensajes de audio, remover el temporal más reciente del mismo usuario
                    else if (message.data.content_type === 'audio' && m.content_type === 'audio') {
                      console.log('🗑️ Removiendo mensaje de audio temporal:', m.id);
                      return false; // Remover este mensaje temporal
                    }
                  }
                  return true; // Mantener todos los demás mensajes
                });
                
                // Agregar el nuevo mensaje real
                console.log('✅ Agregando nuevo mensaje real a la lista:', message.data.id);
                return [...filteredMessages, message.data];
              });
              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
            break;
            
          case 'typing':
            if (message.user_id !== authState.userId) {
              const participant = participants.find(p => p.user.id === message.user_id);
              const username = participant?.user.username || 'Usuario';
              
              if (message.is_typing) {
                setTypingUsers(prev => [...new Set([...prev, username])]);
              } else {
                setTypingUsers(prev => prev.filter(u => u !== username));
              }
            }
            break;
            
          case 'user_joined':
          case 'user_left':
            // Recargar participantes si es necesario
            break;
        }
      } catch (error) {
        console.error('Error al procesar mensaje WebSocket:', error);
      }
    };    wsRef.current.onclose = (event) => {
      console.log('WebSocket desconectado:', event.code, event.reason);
      setIsConnected(false);
      stopHeartbeat();
      
      // Reconectar automáticamente si no fue intencional
      if (event.code !== 1000 && event.code !== 4001 && event.code !== 4003 && reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`Reintentando conexión en ${delay}ms (intento ${reconnectAttempts + 1})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connectWebSocket();
        }, delay);
      } else if (event.code === 4001) {
        console.error('Token inválido - problema de autenticación');
        setError('Sesión expirada. Por favor vuelve a iniciar sesión.');
      } else if (event.code === 4003) {
        console.error('Sin acceso a la conversación');
        setError('No tienes acceso a esta conversación.');
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('Error WebSocket:', error);
      setIsConnected(false);
    };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      // Intentar reconectar después de un error
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connectWebSocket();
        }, delay);
      }
    }
  };

  // Función para desconectar WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Desconexión intencional');
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    stopHeartbeat();
    setIsConnected(false);
  };
  // Sistema de heartbeat para mantener la conexión viva
  const startHeartbeat = () => {
    heartbeatRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping'); // Enviar como string simple, igual que el HTML
      }
    }, 30000); // Ping cada 30 segundos
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };  // Cargar datos iniciales y conectar WebSocket
  useEffect(() => {
    if (!authState.token || !id) return;
    
    // Limpiar conexión anterior si existe
    disconnectWebSocket();
    
    const api = createAuthenticatedAPI(authState.token);
    setLoading(true);
      Promise.all([
      api.get(`${BASE_URL}/api/v1/participants/conversation/${id}`, {
        headers: { 'Authorization': 'Bearer ' + authState.token }
      }),
      api.get(`${BASE_URL}/api/v1/messages/conversation/${id}`, {
        headers: { 'Authorization': 'Bearer ' + authState.token }
      })
    ])
      .then(([pRes, mRes]) => {
        setParticipants(pRes.data);
        setMessages(Array.isArray(mRes.data) ? mRes.data : (mRes.data.messages || []));
        console.log('Respuesta de mensajes:', mRes.data);
        setRawMessagesResponse(mRes.data);
        
        // Conectar WebSocket después de cargar los datos
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 500);
      })
      .catch((e) => {
        setError('Error al cargar la conversación');
        console.log('Error al cargar mensajes:', e);
      })
      .finally(() => setLoading(false));    // Cleanup al desmontar
    return () => {
      disconnectWebSocket();
      // Pausar y limpiar todos los audios (incluidos los traducidos)
      Object.values(audioObjects).forEach(async (sound) => {
        if (sound) {
          try {
            await sound.pauseAsync();
            await sound.unloadAsync();
          } catch (e) {
            console.log('Error cleaning up audio:', e);
          }
        }
      });
      
      // Limpiar Blob URLs en web (incluidos los de audios traducidos)
      if (Platform.OS === 'web') {
        Object.values(audioObjects).forEach(async (sound) => {
          if (sound) {
            try {
              const status = await sound.getStatusAsync();
              if (status.uri && status.uri.startsWith('blob:')) {
                URL.revokeObjectURL(status.uri);
                console.log('🗑️ Blob URL limpiado en cleanup:', status.uri);
              }
            } catch (e) {
              console.log('Error cleaning up blob URL:', e);
            }
          }
        });
      }
      
      setAudioObjects({});
      setPlayingAudio({});
    };
  }, [authState.token, id]); // Agregar dependencias correctas

  useEffect(() => {
    console.log('ConversationScreen mounted. id param:', id);
  }, [id]);
  // Función para enviar indicador de typing
  const sendTypingStatus = (isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        is_typing: isTyping,
        user_id: authState.userId
      }));
    }
  };

  // Manejar cambios en el input (para typing indicators)
  const handleInputChange = (text: string) => {
    setInput(text);
    
    // Enviar indicador de typing
    sendTypingStatus(true);
    
    // Clear timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Detener typing después de 3 segundos de inactividad
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 3000);
  };

  const handleSend = async () => {
    if (!input.trim() || !authState.token) return;
    
    setSending(true);
    setError(null);
    
    // Detener typing indicator
    sendTypingStatus(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
      // Crear mensaje optimista
    const tempMessage: Message = {
      id: Date.now(), // ID temporal
      sender_id: authState.userId!,
      content: input.trim(),
      content_type: 'text', // Agregar content_type para mejor comparación
      created_at: new Date().toISOString(),
      temp: true,
      sender: {
        id: authState.userId!,
        username: 'Tú'
      }
    };
    
    // Agregar mensaje optimista inmediatamente
    setMessages(prev => [...prev, tempMessage]);
    const messageContent = input.trim();
    setInput('');
    
    // Scroll al final
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    
    try {
      const api = createAuthenticatedAPI(authState.token);
      const form = new FormData();
      form.append('conversation_id', id as string);
      form.append('content_type', 'text');
      form.append('content', messageContent);
        const res = await fetch(`${BASE_URL}/api/v1/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + authState.token
          // No poner Content-Type, fetch lo maneja con FormData
        },
        body: form
      });
        if (res.ok) {
        const data = await res.json();
        // No necesitamos hacer nada aquí - el WebSocket se encargará
        // El mensaje temporal se reemplazará automáticamente cuando llegue por WebSocket
        console.log('Mensaje enviado exitosamente:', data.id);
      } else {
        throw new Error('Error al enviar mensaje');
      }
      
      // No enviar por WebSocket aquí - el servidor se encarga de broadcast
      
    } catch (e) {
      // Remover mensaje temporal en caso de error
      setMessages(prev => prev.filter(msg => !(msg.temp && msg.id === tempMessage.id)));
      setError('No se pudo enviar el mensaje');
      setInput(messageContent); // Restaurar el texto
    } finally {
      setSending(false);
    }
  };
  // Cambia la función para usar el sender del mensaje si existe
  const getUsername = (item: Message) => {
    if (item.sender && item.sender.username) return item.sender.username;
    const p = participants.find(p => p.user.id === item.sender_id);
    return p ? p.user.username : 'Usuario';
  };
  // Función para obtener traducción del mensaje
  const getTranslation = async (messageId: number) => {
    if (!authState.token) return;

    try {
      // Marcar como cargando
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isLoadingTranslation: true }
          : msg
      ));

      const response = await fetch(`${BASE_URL}/api/v1/translations/message/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Actualizar el mensaje con la traducción
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                translatedContent: data.translated_content,
                isLoadingTranslation: false 
              }
            : msg
        ));
      } else {
        throw new Error('Error al obtener traducción');
      }
    } catch (error) {
      console.error('Error al obtener traducción:', error);
      // Quitar estado de carga en caso de error
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isLoadingTranslation: false }
          : msg
      ));    }
  };  // Función para obtener traducción de audio
  const getAudioTranslation = async (messageId: number) => {
    console.log('🎵 INICIANDO TRADUCCIÓN DE AUDIO');
    console.log('🎵 Message ID:', messageId);
    console.log('🎵 Auth token available:', !!authState.token);
    
    if (!authState.token) {
      console.error('❌ No hay token de autenticación');
      return;
    }

    try {      // Marcar como cargando
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isLoadingAudioTranslation: true }
          : msg
      ));      const response = await fetch(`${BASE_URL}/api/v1/translations/message/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      });

      console.log('🔍 AUDIO TRANSLATION DEBUG - Response status:', response.status);
      console.log('🔍 AUDIO TRANSLATION DEBUG - Response headers:', Object.fromEntries(response.headers.entries()));      if (response.ok) {
        const data = await response.json();
        console.log('🔍 AUDIO TRANSLATION DEBUG - Respuesta completa del backend:');
        console.log('🔍 Raw response data:', JSON.stringify(data, null, 2));
        console.log('🔍 Tipo de data:', typeof data);
        console.log('🔍 Propiedades de data:', Object.keys(data));
          // Buscar el audio traducido en diferentes posibles estructuras de respuesta
        let translatedAudioData = null;
        let translatedAudioUrl: string | null = null;
        
        // Opción 1: La respuesta directa tiene content_type y media_url
        if (data && data.content_type === 'AUDIO' && data.media_url) {
          console.log('✅ Estructura directa encontrada');
          translatedAudioData = data;
        }
        // Opción 2: Hay un campo translated_message
        else if (data.translated_message && data.translated_message.content_type === 'audio' && data.translated_message.media_url) {
          console.log('✅ Estructura con translated_message encontrada');
          translatedAudioData = data.translated_message;
        }
        // Opción 3: content_type en minúsculas
        else if (data && data.content_type === 'audio' && data.media_url) {
          console.log('✅ Estructura directa con content_type en minúsculas encontrada');
          translatedAudioData = data;
        }
        // Opción 4: Intentar buscar cualquier campo que contenga audio
        else {
          console.log('🔍 Buscando audio traducido en estructura alternativa...');
          // Revisar si hay algún campo que contenga media_url
          for (const [key, value] of Object.entries(data)) {
            if (value && typeof value === 'object' && (value as any).media_url) {
              console.log(`🔍 Campo ${key} contiene media_url:`, value);
              translatedAudioData = value;
              break;
            }
          }
        }
        
        if (translatedAudioData && translatedAudioData.media_url) {
          console.log('✅ Datos de audio traducido encontrados:', translatedAudioData);
          
          const mediaUrl = translatedAudioData.media_url;
          console.log('🔍 Media URL del audio traducido:', mediaUrl);
            // Construir la URL completa directamente con buildAudioUrl
          try {
            translatedAudioUrl = buildAudioUrl(mediaUrl);
            console.log('🔍 URL final construida para descarga:', translatedAudioUrl);
            
            // Actualizar el mensaje con la URL del audio traducido
            setMessages(prev => prev.map(msg => 
              msg.id === messageId 
                ? { 
                    ...msg, 
                    translatedAudioUrl: translatedAudioUrl!,
                    isLoadingAudioTranslation: false 
                  }
                : msg
            ));
            
            console.log('✅ Estado actualizado con URL de audio traducido');
          } catch (urlError) {
            console.error('❌ Error construyendo URL del audio traducido:', urlError);
            throw new Error('No se pudo construir la URL del audio traducido');
          }
        } else {
          console.error('❌ No se encontró audio traducido válido en la respuesta:');
          console.error('❌ Estructura completa recibida:', JSON.stringify(data, null, 2));
          throw new Error('No se encontró audio traducido válido en la respuesta del servidor');
        }} else {
        console.error('❌ Response no OK. Status:', response.status);
        console.error('❌ Response statusText:', response.statusText);
        
        // Intentar leer el contenido del error si es posible
        try {
          const errorText = await response.text();
          console.error('❌ Response body:', errorText);
        } catch (e) {
          console.error('❌ No se pudo leer el body de la respuesta de error');
        }
        
        throw new Error(`Error al obtener traducción de audio: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ ERROR COMPLETO en getAudioTranslation:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
      // Quitar estado de carga en caso de error
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isLoadingAudioTranslation: false }
          : msg
      ));
      Alert.alert('Error', 'No se pudo obtener la traducción del audio');
    }
  };
  // Función helper para construir URL de audio - SIMPLIFICADA
  const buildAudioUrl = (mediaUrl: string): string => {
    console.log('🔍 buildAudioUrl input:', mediaUrl);
    
    // Validar que mediaUrl no sea null, undefined o vacío
    if (!mediaUrl || mediaUrl.trim() === '') {
      console.error('❌ mediaUrl está vacío o no definido:', mediaUrl);
      throw new Error('URL de audio no válida: mediaUrl está vacío');
    }
    
    const cleanMediaUrl = mediaUrl.trim();
    
    // Si ya es una URL completa, usarla tal como está
    if (cleanMediaUrl.startsWith('http://') || cleanMediaUrl.startsWith('https://')) {
      console.log('✅ URL completa del backend:', cleanMediaUrl);
      return cleanMediaUrl;
    }
    
    // Si es un path relativo, agregar el dominio base
    if (cleanMediaUrl.startsWith('/api/')) {
      const fullUrl = `${BASE_URL}${cleanMediaUrl}`;
      console.log('✅ URL construida desde path del backend:', fullUrl);
      return fullUrl;
    }
    
    // Fallback: asumir que es una URL relativa del backend
    const fullUrl = `${BASE_URL}${cleanMediaUrl.startsWith('/') ? cleanMediaUrl : '/' + cleanMediaUrl}`;
    console.log('✅ URL construida como fallback:', fullUrl);
    return fullUrl;
  };// Función para reproducir audio
  const playAudio = async (messageId: number, mediaUrl: string) => {
    try {
      // Si ya está reproduciendo, pausar
      if (playingAudio[messageId]) {
        if (audioObjects[messageId]) {
          await audioObjects[messageId].pauseAsync();
          setPlayingAudio(prev => ({ ...prev, [messageId]: false }));
        }
        return;
      }

      // Detener otros audios que estén reproduciéndose
      for (const [id, isPlaying] of Object.entries(playingAudio)) {
        if (isPlaying && audioObjects[parseInt(id)]) {
          await audioObjects[parseInt(id)].pauseAsync();
        }
      }
      setPlayingAudio({});

      // Construir la URL completa del audio usando el endpoint GET
      const audioUrl = buildAudioUrl(mediaUrl);
      console.log('🔊 Reproduciendo audio desde:', audioUrl);
      console.log('🔍 Media URL original:', mediaUrl);
      console.log('🌐 Platform:', Platform.OS);

      // Configurar modo de audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      let sound = audioObjects[messageId];
      
      if (!sound) {
        let audioSource: any;
        
        if (Platform.OS === 'web') {
          // Para web: usar Blob URL para evitar problemas de CORS con headers
          console.log('🌐 Creando Blob URL para web...');
          try {
            const response = await fetch(audioUrl, {
              headers: {
                'Authorization': `Bearer ${authState.token}`,
              },
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const audioBlob = await response.blob();
            const blobUrl = URL.createObjectURL(audioBlob);
            
            console.log('✅ Blob URL creado:', blobUrl);
            audioSource = { uri: blobUrl };
              } catch (fetchError) {
            console.error('❌ Error fetching audio for blob:', fetchError);
            const errorMessage = fetchError instanceof Error ? fetchError.message : 'Error desconocido';
            throw new Error(`No se pudo descargar el audio: ${errorMessage}`);
          }
        } else {
          // Para mobile: usar headers de autenticación directamente
          audioSource = {
            uri: audioUrl,
            headers: {
              'Authorization': `Bearer ${authState.token}`,
            },
          };
        }

        console.log('🎵 Creando objeto de audio...');
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          audioSource,
          { shouldPlay: false }
        );
        sound = newSound;
        
        // Configurar callback para cuando termine la reproducción
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setPlayingAudio(prev => ({ ...prev, [messageId]: false }));
            
            // Limpiar Blob URL si es web
            if (Platform.OS === 'web' && audioSource.uri && audioSource.uri.startsWith('blob:')) {
              URL.revokeObjectURL(audioSource.uri);
              console.log('🗑️ Blob URL limpiado');
            }
          }
        });

        setAudioObjects(prev => ({ ...prev, [messageId]: sound }));
        
        // CRÍTICO: Esperar a que el audio se cargue completamente antes de reproducir
        console.log('🔄 Esperando que el audio se cargue...');
        let status = await sound.getStatusAsync();
        
        // Esperar hasta que el audio esté cargado con timeout
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos máximo
        
        while ((!status.isLoaded) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
          status = await sound.getStatusAsync();
          attempts++;
          console.log(`🔄 Intento ${attempts}: Audio loaded = ${status.isLoaded}`);
        }
        
        if (!status.isLoaded) {
          // Limpiar Blob URL en caso de error
          if (Platform.OS === 'web' && audioSource.uri && audioSource.uri.startsWith('blob:')) {
            URL.revokeObjectURL(audioSource.uri);
          }
          throw new Error('El audio no se pudo cargar después de 5 segundos');
        }
        
        console.log('✅ Audio cargado exitosamente, procediendo a reproducir');
      } else {
        // Si ya existe el sound object, verificar que esté cargado
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          console.log('⚠️ Audio object existente no está cargado, recreando...');
          // Remover el audio object corrupto
          setAudioObjects(prev => {
            const updated = { ...prev };
            delete updated[messageId];
            return updated;
          });
          
          // Recursively call playAudio to recreate the sound object
          return playAudio(messageId, mediaUrl);
        }
      }

      // Reproducir audio solo después de confirmar que está cargado
      console.log('▶️ Iniciando reproducción del audio');
      await sound.playAsync();
      setPlayingAudio(prev => ({ ...prev, [messageId]: true }));

    } catch (error) {
      console.error('❌ Error reproduciendo audio:', error);
      console.error('Error details:', error);
      
      // Limpiar el objeto de audio problemático
      setAudioObjects(prev => {
        const updated = { ...prev };
        delete updated[messageId];
        return updated;
      });
        Alert.alert('Error', `No se pudo reproducir el audio: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setPlayingAudio(prev => ({ ...prev, [messageId]: false }));
    }
  };

  // Función para reproducir audio traducido
  const playTranslatedAudio = async (messageId: number, translatedAudioUrl: string) => {
    try {
      // Si ya está reproduciendo, pausar
      if (playingAudio[`translated_${messageId}`]) {
        if (audioObjects[`translated_${messageId}`]) {
          await audioObjects[`translated_${messageId}`].pauseAsync();
          setPlayingAudio(prev => ({ ...prev, [`translated_${messageId}`]: false }));
        }
        return;
      }

      // Detener otros audios que estén reproduciéndose
      for (const [id, isPlaying] of Object.entries(playingAudio)) {
        if (isPlaying && (audioObjects[parseInt(id)] || audioObjects[id])) {
          const audioKey = isNaN(parseInt(id)) ? id : parseInt(id);
          if (audioObjects[audioKey]) {
            await audioObjects[audioKey].pauseAsync();
          }
        }
      }
      setPlayingAudio({});

      console.log('🔊 Reproduciendo audio traducido desde:', translatedAudioUrl);

      // Configurar modo de audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      let sound = audioObjects[`translated_${messageId}`];
      
      if (!sound) {
        let audioSource: any;
        
        if (Platform.OS === 'web') {
          // Para web: usar Blob URL para evitar problemas de CORS con headers
          console.log('🌐 Creando Blob URL para audio traducido en web...');
          try {
            const response = await fetch(translatedAudioUrl, {
              headers: {
                'Authorization': `Bearer ${authState.token}`,
              },
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const audioBlob = await response.blob();
            const blobUrl = URL.createObjectURL(audioBlob);
            
            console.log('✅ Blob URL creado para audio traducido:', blobUrl);
            audioSource = { uri: blobUrl };
          } catch (fetchError) {
            console.error('❌ Error fetching translated audio for blob:', fetchError);
            const errorMessage = fetchError instanceof Error ? fetchError.message : 'Error desconocido';
            throw new Error(`No se pudo descargar el audio traducido: ${errorMessage}`);
          }
        } else {
          // Para mobile: usar headers de autenticación directamente
          audioSource = {
            uri: translatedAudioUrl,
            headers: {
              'Authorization': `Bearer ${authState.token}`,
            },
          };
        }

        console.log('🎵 Creando objeto de audio traducido...');
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          audioSource,
          { shouldPlay: false }
        );
        sound = newSound;
        
        // Configurar callback para cuando termine la reproducción
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setPlayingAudio(prev => ({ ...prev, [`translated_${messageId}`]: false }));
            
            // Limpiar Blob URL si es web
            if (Platform.OS === 'web' && audioSource.uri && audioSource.uri.startsWith('blob:')) {
              URL.revokeObjectURL(audioSource.uri);
              console.log('🗑️ Blob URL del audio traducido limpiado');
            }
          }
        });

        setAudioObjects(prev => ({ ...prev, [`translated_${messageId}`]: sound }));
        
        // Esperar a que el audio se cargue completamente antes de reproducir
        console.log('🔄 Esperando que el audio traducido se cargue...');
        let status = await sound.getStatusAsync();
        
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos máximo
        
        while ((!status.isLoaded) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          status = await sound.getStatusAsync();
          attempts++;
          console.log(`🔄 Intento ${attempts}: Audio traducido loaded = ${status.isLoaded}`);
        }
        
        if (!status.isLoaded) {
          // Limpiar Blob URL en caso de error
          if (Platform.OS === 'web' && audioSource.uri && audioSource.uri.startsWith('blob:')) {
            URL.revokeObjectURL(audioSource.uri);
          }
          throw new Error('El audio traducido no se pudo cargar después de 5 segundos');
        }
        
        console.log('✅ Audio traducido cargado exitosamente, procediendo a reproducir');
      } else {
        // Si ya existe el sound object, verificar que esté cargado
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          console.log('⚠️ Audio traducido existente no está cargado, recreando...');
          // Remover el audio object corrupto
          setAudioObjects(prev => {
            const updated = { ...prev };
            delete updated[`translated_${messageId}`];
            return updated;
          });
          
          // Recursively call playTranslatedAudio to recreate the sound object
          return playTranslatedAudio(messageId, translatedAudioUrl);
        }
      }

      // Reproducir audio solo después de confirmar que está cargado
      console.log('▶️ Iniciando reproducción del audio traducido');
      await sound.playAsync();
      setPlayingAudio(prev => ({ ...prev, [`translated_${messageId}`]: true }));

    } catch (error) {
      console.error('❌ Error reproduciendo audio traducido:', error);
      
      // Limpiar el objeto de audio problemático
      setAudioObjects(prev => {
        const updated = { ...prev };
        delete updated[`translated_${messageId}`];
        return updated;
      });
      
      Alert.alert('Error', `No se pudo reproducir el audio traducido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setPlayingAudio(prev => ({ ...prev, [`translated_${messageId}`]: false }));
    }
  };

  // Función para alternar entre audio original y traducido
  const toggleAudioSwitch = async (messageId: number) => {
    const isCurrentlyTranslated = audioSwitchStates[messageId] || false;
    
    // Pausar cualquier audio que esté reproduciéndose
    for (const [id, isPlaying] of Object.entries(playingAudio)) {
      if (isPlaying) {
        const audioKey = isNaN(parseInt(id)) ? id : parseInt(id);
        if (audioObjects[audioKey]) {
          await audioObjects[audioKey].pauseAsync();
        }
      }
    }
    setPlayingAudio({});
    
    // Cambiar el estado del switch
    setAudioSwitchStates(prev => ({
      ...prev,
      [messageId]: !isCurrentlyTranslated
    }));
    
    // Si no está traducido y necesitamos obtener la traducción
    if (!isCurrentlyTranslated) {
      const message = messages.find(m => m.id === messageId);
      if (message && !message.translatedAudioUrl && !message.isLoadingAudioTranslation) {
        await getAudioTranslation(messageId);
      }
    }
  };

  // Función para reproducir audio según el estado del switch
  const playAudioBySwitch = async (messageId: number, originalMediaUrl: string, translatedAudioUrl?: string) => {
    const isTranslatedMode = audioSwitchStates[messageId] || false;
    
    if (isTranslatedMode && translatedAudioUrl) {
      await playTranslatedAudio(messageId, translatedAudioUrl);
    } else {
      await playAudio(messageId, originalMediaUrl);
    }
  };

  // Función para alternar entre texto original y traducido
  const toggleTextSwitch = async (messageId: number) => {
    const isCurrentlyTranslated = textSwitchStates[messageId] || false;
    
    // Cambiar el estado del switch
    setTextSwitchStates(prev => ({
      ...prev,
      [messageId]: !isCurrentlyTranslated
    }));
    
    // Si no está traducido y necesitamos obtener la traducción
    if (!isCurrentlyTranslated) {
      const message = messages.find(m => m.id === messageId);
      if (message && !message.translatedContent && !message.isLoadingTranslation) {
        await getTranslation(messageId);
      }
    }
  };

  const renderItem = ({ item, index }: { item: Message, index: number }) => {
    const isMe = item.sender_id === authState.userId;
    const showUsername = !isMe && (index === 0 || messages[index-1]?.sender_id !== item.sender_id);
    const isAudioMessage = item.content_type === 'audio';
    
    return (
      <View style={[styles.messageContainer, isMe ? styles.meContainer : styles.otherContainer]}>
        {showUsername && (
          <Text style={styles.username}>{getUsername(item)}</Text>
        )}
        <View style={[styles.messageColumn, isMe ? styles.meColumn : styles.otherColumn]}>
          <View style={[
            styles.bubble, 
            isMe ? styles.meBubble : styles.otherBubble,
            item.temp && styles.tempMessage,
            isAudioMessage && styles.audioBubble,
            // Cambiar color si está en modo traducido
            (isAudioMessage && audioSwitchStates[item.id] && item.translatedAudioUrl) && styles.translatedBubble,
            (!isAudioMessage && textSwitchStates[item.id] && item.translatedContent) && styles.translatedBubble
          ]}>            {isAudioMessage ? (
              <View style={styles.audioMessageContainer}>
                <View style={styles.audioMainRow}>
                  <Image 
                    source={require('../img/icons/audio_icon.png')} 
                    style={{ width: 25, height: 25, marginRight: 8 }}
                  />
                  <Text style={[styles.messageText, { fontStyle: 'italic' }]}>
                    Audio
                  </Text>
                  {item.media_url && !item.temp && (
                    <TouchableOpacity 
                      style={styles.playButton}
                      onPress={() => {
                        console.log('🔍 AUDIO DEBUG - Reproductor presionado:');
                        console.log('🔍 Message ID:', item.id);
                        console.log('🔍 Switch state:', audioSwitchStates[item.id]);
                        console.log('🔍 Has translated URL:', !!item.translatedAudioUrl);
                        playAudioBySwitch(item.id, item.media_url!, item.translatedAudioUrl);
                      }}
                    >
                      {(playingAudio[item.id] && !audioSwitchStates[item.id]) || (playingAudio[`translated_${item.id}`] && audioSwitchStates[item.id]) ? (
                        <Image 
                          source={require('../img/icons/pause.png')} 
                          style={{width: 25, height: 25}}
                        />
                      ) : (
                        <Image 
                          source={require('../img/icons/play_icon.png')} 
                          style={{width: 25, height: 25}}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Switch de traducción */}
                {!item.temp && (
                  <View style={styles.audioSwitchContainer}>
                    <Text style={styles.switchLabel}>Original</Text>
                    <TouchableOpacity
                      style={[
                        styles.audioSwitch,
                        audioSwitchStates[item.id] && styles.audioSwitchActive
                      ]}
                      onPress={() => toggleAudioSwitch(item.id)}
                      disabled={item.isLoadingAudioTranslation}
                    >
                      <View style={[
                        styles.audioSwitchThumb,
                        audioSwitchStates[item.id] && styles.audioSwitchThumbActive
                      ]} />
                    </TouchableOpacity>
                    <Text style={styles.switchLabel}>Traducido</Text>
                    {item.isLoadingAudioTranslation && (
                      <Text style={styles.loadingTranslation}>Cargando...</Text>
                    )}
                  </View>
                )}

                {item.temp && (
                  <Text style={styles.sendingIndicator}>Enviando...</Text>
                )}
              </View>
            ) : (
              <View style={styles.textMessageContainer}>
                <Text style={[styles.messageText, item.temp && styles.tempText]}>
                  {textSwitchStates[item.id] && item.translatedContent 
                    ? item.translatedContent 
                    : (item.content || '[Sin texto]')
                  }
                </Text>
                
                {/* Switch de traducción para texto */}
                {!item.temp && (
                  <View style={styles.textSwitchContainer}>
                    <Text style={styles.switchLabel}>Original</Text>
                    <TouchableOpacity
                      style={[
                        styles.textSwitch,
                        textSwitchStates[item.id] && styles.textSwitchActive
                      ]}
                      onPress={() => toggleTextSwitch(item.id)}
                      disabled={item.isLoadingTranslation}
                    >
                      <View style={[
                        styles.textSwitchThumb,
                        textSwitchStates[item.id] && styles.textSwitchThumbActive
                      ]} />
                    </TouchableOpacity>
                    <Text style={styles.switchLabel}>Traducido</Text>
                    {item.isLoadingTranslation && (
                      <Text style={styles.loadingTranslation}>Cargando...</Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {item.temp && (
              <Text style={styles.sendingIndicator}>Enviando...</Text>
            )}
          </View>
          <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  // Componente para mostrar usuarios escribiendo
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    const typingText = typingUsers.length === 1 
      ? `${typingUsers[0]} está escribiendo...`
      : `${typingUsers.slice(0, -1).join(', ')} y ${typingUsers[typingUsers.length - 1]} están escribiendo...`;
    
    return (
      <View style={styles.typingIndicator}>
        <Text style={styles.typingText}>{typingText}</Text>
        <View style={styles.typingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
    );
  };  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#eaf0fb' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Modal para agregar participante */}
      <AddParticipantModal
        visible={showAddParticipantModal}
        onClose={() => setShowAddParticipantModal(false)}
        onParticipantAdded={handleParticipantAdded}
        token={authState.token || ''}
        conversationId={id as string}
      />
{/* Modal para enviar audio */}
      <MessageAudioModal
        visible={showAudioModal}
        onClose={() => setShowAudioModal(false)}
        onAudioSent={handleAudioSent}
        token={authState.token || ''}
        conversationId={id as string}
      />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
          <Text style={{ color: '#273c75', fontSize: 18 }}>← Volver</Text>
        </TouchableOpacity>
        
        {/* Mostrar solo el username del otro usuario */}
        <View style={styles.otherUserInfo}>
          {participants
            .filter(p => p.user.id !== authState.userId)
            .map(participant => (
              <Text key={participant.user.id} style={styles.otherUsername}>
                {participant.user.username}
              </Text>
            ))}
        </View>
        
        {/* Botón para agregar participante - solo si no hay otros participantes */}
        {participants.filter(p => p.user.id !== authState.userId).length === 0 && (
          <TouchableOpacity 
            style={styles.addParticipantButton} 
            onPress={() => setShowAddParticipantModal(true)}
          >
            <Text style={styles.addParticipantText}>+👤</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? <ActivityIndicator size="large" color="#273c75" style={{ marginTop: 40 }} /> : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => `${item.id}-${item.temp ? 'temp' : 'real'}`}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 10 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 30 }}>No hay mensajes en esta conversación.</Text>}
          />
          {renderTypingIndicator()}
        </>
      )}      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={handleInputChange}
          placeholder="Escribe un mensaje..."
          editable={!sending}
          onSubmitEditing={handleSend}
          onBlur={() => sendTypingStatus(false)}
        />        <TouchableOpacity 
          style={styles.audioBtn} 
          onPress={() => setShowAudioModal(true)}
          disabled={sending}
        >
          <Image 
            source={require('../img/icons/micro_icon.png')} 
            style={{ width: 30, height: 30 }}
          />
        </TouchableOpacity>        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending || !input.trim()}>
          <Image 
            source={require('../img/icons/msg_icon.png')} 
            style={{ width: 30, height: 30 }}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingBottom: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#e1e4ed',
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: '#dfe6e9',
  },
  participant: {
    backgroundColor: '#dff9fb',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginRight: 6,
    marginLeft: 2,
  },
  otherUserInfo: {
    flex: 1,
    marginLeft: 10,
  },
  otherUsername: {
    color: '#273c75',
    fontSize: 16,
    fontWeight: 'bold',
  },  error: {
    color: '#e84118',
    textAlign: 'center',
    marginVertical: 10,
  },
  messageContainer: {
    marginBottom: 10,
    maxWidth: '100%',
  },
  meContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '100%',
  },
  messageColumn: {
    flexDirection: 'column',
    maxWidth: '100%',
  },
  meRow: {
    justifyContent: 'flex-end',
  },
  meColumn: {
    alignItems: 'flex-end',
  },
  otherRow: {
    justifyContent: 'flex-start',
  },
  otherColumn: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginHorizontal: 6,
  },
  meBubble: {
    backgroundColor: '#273c75',
    borderTopRightRadius: 4,
    alignSelf: 'flex-end',
  },
  otherBubble: {
    backgroundColor: '#66a6ff',
    borderTopLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  translatedBubble: {
    backgroundColor: '#8e44ad',
  },
  tempMessage: {
    opacity: 0.7,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  tempText: {
    fontStyle: 'italic',
  },
  sendingIndicator: {
    color: '#fff',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },  username: {
    fontSize: 13,
    color: '#273c75',
    fontWeight: 'bold',
    marginBottom: 4,
    marginLeft: 6,
  },
  time: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMe: {
    alignSelf: 'flex-end',
  },
  timeOther: {
    alignSelf: 'flex-start',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e1e4ed',
  },
  typingText: {
    color: '#6c757d',
    fontSize: 14,
    fontStyle: 'italic',
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6c757d',
    marginHorizontal: 1,
  },
  dot1: {
    animationDelay: '0s',
  },
  dot2: {
    animationDelay: '0.2s',
  },
  dot3: {
    animationDelay: '0.4s',
  },
  addParticipantButton: {
    backgroundColor: '#00a8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  addParticipantText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e1e4ed',
  },  audioBtn: {
    backgroundColor: '#f1f2f6',
    borderRadius: 50,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#dcdde1',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f2f6',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dcdde1',
  },sendBtn: {
  
    backgroundColor: '#f1f2f6',
    borderRadius: 50,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#dcdde1',
  },
  translationSection: {
    marginTop: 8,
  },
  translateButton: {
    marginTop: 4,
  },  translateText: {
    color: '#4A90E2',
    fontSize: 12,
    textDecorationLine: 'underline',
    opacity: 1,
    fontWeight: '500',
  },
  loadingTranslation: {
    color: '#fff',
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
    marginTop: 4,
  },  translatedText: {
    color: '#E8F4FD',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 4,
  },
  audioBubble: {
    minWidth: 150,
  },
  textMessageContainer: {
    flexDirection: 'column',
    width: '100%',
  },
  textSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  textSwitch: {
    width: 40,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  textSwitchActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  textSwitchThumb: {
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  textSwitchThumbActive: {
    alignSelf: 'flex-end',
  },
  audioMessageContainer: {
    flexDirection: 'column',
    width: '100%',
  },
  audioMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  audioSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  switchLabel: {
    color: '#E8F4FD',
    fontSize: 11,
    marginHorizontal: 8,
    opacity: 0.8,
  },
  audioSwitch: {
    width: 40,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  audioSwitchActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  audioSwitchThumb: {
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  audioSwitchThumbActive: {
    alignSelf: 'flex-end',
  },
  audioIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  playButtonTranslated: {
    backgroundColor: '#8e44ad',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  translatedAudioContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  translatedAudioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  translatedAudioLabel: {
    color: '#E8F4FD',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  translatedPlayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
