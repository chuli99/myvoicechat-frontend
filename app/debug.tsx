import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { BASE_URL, getAPIURL, getWebSocketURL } from '@/config/api';

export default function DebugScreen() {
  const debugInfo = {
    platform: Platform.OS,
    isDev: __DEV__,
    baseURL: BASE_URL,
    apiLoginURL: getAPIURL('/users/login'),
    apiRegisterURL: getAPIURL('/users/register'),
    wsURL: getWebSocketURL('/api/v1/ws/123'),
    expoConfig: Constants.expoConfig?.hostUri,
    debuggerHost: Constants.expoConfig?.hostUri?.split(':').shift(),
    // Leer la configuración manual de Android
    forceAndroidEmulator: Platform.OS === 'android' ? 'Ver logs en consola' : 'No aplica (no es Android)',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug de Configuración de API</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de Plataforma</Text>
        <Text style={styles.item}>Platform: {debugInfo.platform}</Text>
        <Text style={styles.item}>Desarrollo: {debugInfo.isDev ? 'Sí' : 'No'}</Text>
        <Text style={styles.item}>Expo Host URI: {debugInfo.expoConfig || 'No disponible'}</Text>
        <Text style={styles.item}>Debugger Host: {debugInfo.debuggerHost || 'No detectado'}</Text>
        <Text style={styles.item}>Config Android Emulator: {debugInfo.forceAndroidEmulator}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>URLs Generadas</Text>
        <Text style={styles.item}>Base URL: {debugInfo.baseURL}</Text>
        <Text style={styles.item}>Login URL: {debugInfo.apiLoginURL}</Text>
        <Text style={styles.item}>Register URL: {debugInfo.apiRegisterURL}</Text>
        <Text style={styles.item}>WebSocket URL: {debugInfo.wsURL}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración Esperada</Text>
        <Text style={styles.item}>
          <Text style={styles.bold}>Web:</Text> http://localhost:8080
        </Text>
        <Text style={styles.item}>
          <Text style={styles.bold}>Android Emulator:</Text> http://10.0.2.2:8080
        </Text>
        <Text style={styles.item}>
          <Text style={styles.bold}>Android/iOS Físico:</Text> http://[IP_HOST]:8080
        </Text>
        <Text style={styles.item}>
          <Text style={styles.bold}>Configuración actual:</Text> {debugInfo.baseURL}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instrucciones para Android</Text>
        <Text style={styles.item}>
          Para cambiar entre emulador y dispositivo físico, edita el archivo:
        </Text>
        <Text style={styles.rawText}>
          config/api.ts
        </Text>
        <Text style={styles.item}>
          Cambia la variable FORCE_ANDROID_EMULATOR:
        </Text>
        <Text style={styles.item}>
          • <Text style={styles.bold}>true</Text>: Para emulador (10.0.2.2:8080)
        </Text>
        <Text style={styles.item}>
          • <Text style={styles.bold}>false</Text>: Para dispositivo físico ([IP]:8080)
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Raw</Text>
        <Text style={styles.rawText}>
          {JSON.stringify(debugInfo, null, 2)}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#273c75',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#273c75',
    marginBottom: 10,
  },
  item: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
  },
  rawText: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    color: '#666',
  },
});
