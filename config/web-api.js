/**
 * Configuración de API para templates HTML/JavaScript vanilla
 * Este archivo debe ser incluido en los templates HTML que necesiten acceso al backend
 */

// Función para detectar la URL base del backend según el entorno
function getBaseURL() {
  // En desarrollo web, siempre usar localhost
  // En producción, usar la URL de producción
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Desarrollo local
    return 'http://localhost:8080';
  } else {
    // Producción - cambiar por tu URL de producción
    return 'https://tu-backend-produccion.com';
  }
}

// Función para construir URLs de WebSocket
function getWebSocketURL(path = '') {
  const baseUrl = getBaseURL();
  const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  return `${wsUrl}${path}`;
}

// Función helper para construir URLs de API
function getAPIURL(endpoint) {
  const baseUrl = getBaseURL();
  // Asegurar que el endpoint comience con /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}/api/v1${cleanEndpoint}`;
}

// Exportar como variables globales para uso en templates
window.API_CONFIG = {
  BASE_URL: getBaseURL(),
  WS_BASE_URL: getWebSocketURL(),
  getAPIURL: getAPIURL,
  getWebSocketURL: getWebSocketURL
};

console.log('🌐 Configuración de API para templates web:');
console.log('🌐 Base URL:', window.API_CONFIG.BASE_URL);
console.log('🌐 WebSocket URL base:', window.API_CONFIG.WS_BASE_URL);
