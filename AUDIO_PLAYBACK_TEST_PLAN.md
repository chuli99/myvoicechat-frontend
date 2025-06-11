# Test Plan - Audio Playback Fix

## Pasos de Prueba Detallados

### Pre-requisitos
1. Tener el servidor backend ejecutándose en localhost:8080
2. Tener al menos una conversación con mensajes de audio
3. Estar autenticado en la aplicación
4. Tener permisos de audio habilitados

### Prueba 1: Reproducción de Audio Nueva
**Objetivo**: Verificar que el audio se carga y reproduce correctamente la primera vez

**Pasos**:
1. Navegar a una conversación con mensajes de audio
2. Hacer clic en el botón de play (▶️) de un mensaje de audio
3. Observar los logs en la consola

**Resultado Esperado**:
- Logs muestran: "Creando objeto de audio con autenticación"
- Logs muestran: "Esperando que el audio se cargue..."
- Logs muestran varios intentos de carga: "Intento X: Audio loaded = false"
- Logs muestran: "Audio cargado exitosamente, procediendo a reproducir"
- Logs muestran: "Iniciando reproducción del audio"
- El botón cambia a pausa (⏸️)
- El audio se reproduce correctamente

### Prueba 2: Pausa de Audio
**Objetivo**: Verificar que el audio se puede pausar correctamente

**Pasos**:
1. Con un audio reproduciéndose (del Prueba 1)
2. Hacer clic en el botón de pausa (⏸️)

**Resultado Esperado**:
- El audio se detiene inmediatamente
- El botón cambia a play (▶️)
- No hay errores en la consola

### Prueba 3: Reproducción de Audio Existente
**Objetivo**: Verificar que objetos de audio existentes se reutilizan correctamente

**Pasos**:
1. Reproducir un audio (Prueba 1)
2. Pausarlo (Prueba 2)
3. Reproducirlo nuevamente

**Resultado Esperado**:
- El audio se reproduce inmediatamente (sin proceso de carga)
- Los logs no muestran "Creando objeto de audio"
- El audio inicia desde el principio

### Prueba 4: Múltiples Audios
**Objetivo**: Verificar que solo un audio se reproduce a la vez

**Pasos**:
1. Reproducir un audio
2. Mientras se reproduce, hacer clic en otro mensaje de audio

**Resultado Esperado**:
- El primer audio se pausa automáticamente
- El segundo audio comienza el proceso de carga y reproducción
- Solo se escucha el segundo audio

### Prueba 5: Manejo de Errores de Red
**Objetivo**: Verificar el manejo de errores cuando el audio no se puede cargar

**Pasos**:
1. Desconectar internet o detener el servidor backend
2. Intentar reproducir un audio

**Resultado Esperado**:
- Los logs muestran intentos de carga fallidos
- Después de 5 segundos (50 intentos), se muestra error
- Alert con mensaje: "No se pudo reproducir el audio. Verifica la conexión."
- El objeto de audio corrupto se limpia

### Prueba 6: Audio Object Corrupto
**Objetivo**: Verificar que objetos de audio corruptos se manejan correctamente

**Pasos**:
1. Reproducir un audio exitosamente
2. Simular corrupción (cambiar estado interno del objeto)
3. Intentar reproducir el mismo audio nuevamente

**Resultado Esperado**:
- El sistema detecta que el objeto no está cargado
- Logs muestran: "Audio object existente no está cargado, recreando..."
- Se recrea el objeto de audio automáticamente
- El audio se reproduce correctamente

## Verificación de Logs

### Logs Normales (Éxito):
```
🔊 Reproduciendo audio desde: http://localhost:8080/api/v1/audio/message/filename.mp3
🔍 Media URL original: filename.mp3
🎵 Creando objeto de audio con autenticación
🔄 Esperando que el audio se cargue...
🔄 Intento 1: Audio loaded = false
🔄 Intento 2: Audio loaded = false
...
🔄 Intento X: Audio loaded = true
✅ Audio cargado exitosamente, procediendo a reproducir
▶️ Iniciando reproducción del audio
```

### Logs de Error (Fallo de Red):
```
🔊 Reproduciendo audio desde: http://localhost:8080/api/v1/audio/message/filename.mp3
🔍 Media URL original: filename.mp3
🎵 Creando objeto de audio con autenticación
🔄 Esperando que el audio se cargue...
🔄 Intento 1: Audio loaded = false
...
🔄 Intento 50: Audio loaded = false
❌ Error reproduciendo audio: Error: El audio no se pudo cargar después de 5 segundos
```

### Logs de Reutilización:
```
🔊 Reproduciendo audio desde: http://localhost:8080/api/v1/audio/message/filename.mp3
🔍 Media URL original: filename.mp3
▶️ Iniciando reproducción del audio
```

## Criterios de Éxito

✅ **Todos los audios se reproducen sin error "Cannot complete operation because sound is not loaded"**
✅ **Los objetos de audio se reutilizan correctamente**
✅ **Los errores de red se manejan apropiadamente**
✅ **Solo un audio se reproduce a la vez**
✅ **Los objetos corruptos se limpian y recrean automáticamente**
✅ **La interfaz de usuario responde correctamente (botones play/pause)**

## Posibles Problemas y Soluciones

### Problema: Audio no se carga después de 5 segundos
**Causa**: Problemas de red o archivo de audio corrupto
**Solución**: Verificar conexión, revisar logs del servidor, verificar archivo de audio

### Problema: Memory leak con múltiples objetos de audio
**Causa**: Objetos de audio no se limpian correctamente
**Solución**: Revisar cleanup en useEffect, asegurar que unloadAsync se llama

### Problema: Audio se reproduce múltiples veces simultáneamente  
**Causa**: Lógica de pausa de otros audios no funciona
**Solución**: Revisar bucle de pausa en playAudio function

### Problema: Botones de play/pause no se actualizan
**Causa**: Estado de playingAudio no se actualiza correctamente
**Solución**: Revisar todas las llamadas a setPlayingAudio
