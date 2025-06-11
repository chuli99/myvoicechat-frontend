// Test para verificar buildAudioUrl SIMPLIFICADO funciona correctamente

const buildAudioUrl = (mediaUrl) => {
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
    const fullUrl = `http://localhost:8080${cleanMediaUrl}`;
    console.log('✅ URL construida desde path del backend:', fullUrl);
    return fullUrl;
  }
  
  // Fallback: asumir que es una URL relativa del backend
  const fullUrl = `http://localhost:8080${cleanMediaUrl.startsWith('/') ? cleanMediaUrl : '/' + cleanMediaUrl}`;
  console.log('✅ URL construida como fallback:', fullUrl);
  return fullUrl;
};

// Casos de prueba SIMPLIFICADOS
console.log('\n=== PRUEBAS buildAudioUrl SIMPLIFICADO ===\n');

// Caso 1: URL completa del backend (ideal)
console.log('1. URL completa del backend:');
const result1 = buildAudioUrl('http://localhost:8080/api/v1/audio/message/audio123.mp3');
console.log('Resultado:', result1);
console.log();

// Caso 2: Path API relativo del backend
console.log('2. Path API del backend:');
const result2 = buildAudioUrl('/api/v1/audio/message/audio456.mp3');
console.log('Resultado:', result2);
console.log();

// Caso 3: Path relativo cualquiera
console.log('3. Path relativo:');
const result3 = buildAudioUrl('/uploads/audio/audio789.mp3');
console.log('Resultado:', result3);
console.log();

// Caso 4: Fallback sin /
console.log('4. Fallback sin slash:');
const result4 = buildAudioUrl('media/audio/test.mp3');
console.log('Resultado:', result4);
console.log();

console.log('=== FILOSOFÍA NUEVA ===');
console.log('✅ El backend es responsable de devolver URLs correctas');
console.log('✅ El frontend solo agrega dominio si es necesario');
console.log('✅ No más lógica compleja de construcción de URLs');
console.log('✅ Más robusto y fácil de mantener');
