import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#ffffff', dark: '#ffffff' }}
      headerImage={
        <View style={styles.headerContainer}>
          <Image 
            source={require('../../img/icons/logo.png')} 
            style={styles.headerLogo} 
            resizeMode="contain"
          />
        </View>
      }>
      <ThemedView lightColor="#ffffff" darkColor="#ffffff" style={[styles.titleContainer, { backgroundColor: '#ffffff' }]}>
        <ThemedText type="title" style={{ color: '#273c75' }}>Instrucciones</ThemedText>
      </ThemedView>
      <ThemedView lightColor="#ffffff" darkColor="#ffffff" style={{ backgroundColor: '#ffffff', padding: 16 }}>
        <ThemedText style={{ color: '#333' }}>
          Bienvenido a <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>MyVoiceChat</ThemedText>, una aplicación de chat con traducción automática de audio y texto.
        </ThemedText>
      
      <Collapsible title="🏠 Página Principal">
        <ThemedText style={{ color: '#333' }}>
          En la pantalla principal encontrarás todas tus conversaciones existentes. Puedes:
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Crear una nueva conversación</ThemedText> presionando el botón "+ Crear"
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Entrar a una conversación existente</ThemedText> presionando "Entrar"
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Configurar tu audio de referencia</ThemedText> para mejorar la calidad de traducción
        </ThemedText>
      </Collapsible>

      <Collapsible title="💬 Chat y Mensajes">
        <ThemedText style={{ color: '#333' }}>
          Dentro de una conversación puedes enviar mensajes de texto y audio:
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Mensajes de texto:</ThemedText> Escribe en el campo de texto y presiona enviar
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Mensajes de audio:</ThemedText> Presiona el ícono del micrófono para grabar
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Agregar participantes:</ThemedText> Usa el botón +👤 si no hay otros usuarios en la conversación
        </ThemedText>
      </Collapsible>

      <Collapsible title="🔄 Sistema de Traducción">
        <ThemedText style={{ color: '#333' }}>
          Cada mensaje tiene un switch para alternar entre el contenido original y traducido:
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Switch "Original/Traducido":</ThemedText> Cambia entre versiones del mensaje
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Color violeta:</ThemedText> Indica que estás viendo la versión traducida
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Traducción automática:</ThemedText> Se genera al activar el switch por primera vez
        </ThemedText>
      </Collapsible>

      <Collapsible title="🎵 Audio y Reproducción">
        <ThemedText style={{ color: '#333' }}>
          Los mensajes de audio incluyen funciones especiales:
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Botón play/pause:</ThemedText> Controla la reproducción del audio
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Audio original:</ThemedText> El audio grabado por el usuario
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Audio traducido:</ThemedText> Versión traducida con síntesis de voz
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Switch automático:</ThemedText> Reproduce el audio según el estado del switch
        </ThemedText>
      </Collapsible>

      <Collapsible title="👤 Perfil de Usuario">
        <ThemedText style={{ color: '#333' }}>
          En tu perfil puedes ver tu información personal:
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Nombre de usuario</ThemedText> y datos básicos
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Idioma configurado:</ThemedText> Español (predeterminado)
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Avatar personalizado</ThemedText> con tu inicial
        </ThemedText>
      </Collapsible>

      <Collapsible title="🎙️ Audio de Referencia">
        <ThemedText style={{ color: '#333' }}>
          Para mejorar la calidad de traducción, puedes configurar un audio de referencia:
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Graba una muestra de tu voz</ThemedText> desde la pantalla principal
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Mejora la precisión</ThemedText> del reconocimiento de voz
        </ThemedText>
        <ThemedText style={{ color: '#333' }}>
          • <ThemedText type="defaultSemiBold" style={{ color: '#273c75' }}>Personaliza la experiencia</ThemedText> de traducción
        </ThemedText>
      </Collapsible>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  headerLogo: {
    width: 160,
    height: 160,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    backgroundColor: '#ffffff',
  },
});
