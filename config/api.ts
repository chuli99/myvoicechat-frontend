import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 🔧 CONFIGURACIÓN MANUAL PARA ANDROID
// Cambia esto según tu entorno:
// - true: Para emulador Android (usa 10.0.2.2)
// - false: Para dispositivo físico Android (usa IP del host)
const FORCE_ANDROID_EMULATOR = true;

/**
 * Configuración automática de la URL base del backend según la plataforma
 */
export const getBaseURL = (): string => {
  // Para desarrollo web (npm run web)
  if (Platform.OS === 'web') {
    return 'http://localhost:8080';
  }
  
  // Para Android
  if (Platform.OS === 'android') {
    if (__DEV__) {
      // Obtener información del host desde Expo Constants
      const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
      
      console.log('🔍 ANDROID DEBUG - Debugger Host:', debuggerHost);
      console.log('🔍 ANDROID DEBUG - Expo Config hostUri:', Constants.expoConfig?.hostUri);
      console.log('🔍 ANDROID DEBUG - FORCE_ANDROID_EMULATOR:', FORCE_ANDROID_EMULATOR);
      
      // Usar configuración manual para decidir entre emulador y dispositivo físico
      if (FORCE_ANDROID_EMULATOR) {
        console.log('✅ ANDROID DEBUG - CONFIGURADO COMO EMULADOR, usando 10.0.2.2');
        return 'http://10.0.2.2:8080';
      } else {
        // Dispositivo físico - usar la IP del host de desarrollo
        const hostIP = debuggerHost || 'localhost';
        console.log('✅ ANDROID DEBUG - CONFIGURADO COMO DISPOSITIVO FÍSICO, usando IP:', hostIP);
        return `http://${hostIP}:8080`;
      }
    } else {
      // Producción - aquí pondrías tu URL de producción
      return 'https://tu-backend-produccion.com';
    }
  }
  
  // Para iOS (emulador o dispositivo físico)
  if (Platform.OS === 'ios') {
    if (__DEV__) {
      // En iOS, localhost funciona tanto en simulador como en dispositivo físico
      // cuando se usa con metro bundler
      const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
      
      if (debuggerHost && debuggerHost !== 'localhost' && debuggerHost !== '127.0.0.1') {
        // Dispositivo físico - usar la IP del host de desarrollo
        return `http://${debuggerHost}:8080`;
      } else {
        // Simulador iOS - localhost funciona
        return 'http://localhost:8080';
      }
    } else {
      // Producción
      return 'https://tu-backend-produccion.com';
    }
  }
  
  // Fallback por defecto
  return 'http://localhost:8080';
};

/**
 * Función para construir URLs de WebSocket
 */
export const getWebSocketURL = (path: string = ''): string => {
  const baseUrl = getBaseURL();
  const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  return `${wsUrl}${path}`;
};

/**
 * Función helper para construir URLs de API
 */
export const getAPIURL = (endpoint: string): string => {
  const baseUrl = getBaseURL();
  // Asegurar que el endpoint comience con /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}/api/v1${cleanEndpoint}`;
};

// Logs para debugging
console.log('🌐 Configuración de API:');
console.log('🌐 Platform:', Platform.OS);
console.log('🌐 __DEV__:', __DEV__);
console.log('🌐 Base URL:', getBaseURL());
console.log('🌐 WebSocket URL base:', getWebSocketURL());

// Exportar también como constante para uso directo
export const BASE_URL = getBaseURL();
export const WS_BASE_URL = getWebSocketURL();
