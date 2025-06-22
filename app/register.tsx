import { Link, Stack } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { ErrorMessage } from '@/components/ErrorMessage';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('en');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Español', value: 'es' },
    { label: 'Chinese (中文)', value: 'zh' },
  ];

  const getSelectedLanguageLabel = () => {
    const selected = languageOptions.find(option => option.value === primaryLanguage);
    return selected ? selected.label : 'English';
  };

  const handleLanguageSelect = (value: string) => {
    setPrimaryLanguage(value);
    setShowLanguageModal(false);
  };const [formError, setFormError] = useState<string | null>(null);
  const { register, error, clearError } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      setFormError('Todos los campos son obligatorios');
      return false;
    }
    
    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Por favor ingresa un correo electrónico válido');
      return false;
    }
    
    if (password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    
    setFormError(null);
    return true;
  };
    const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await register(username, email, primaryLanguage, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = formError || error;
  const clearDisplayError = () => {
    if (formError) {
      setFormError(null);
    } else {
      clearError();
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Stack.Screen options={{ title: 'Register', headerShown: false }} />
        <ThemedView style={styles.container}>          <Image 
            source={require('../img/icons/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
            <ThemedText style={styles.title} type="title">Crear Cuenta</ThemedText>
          <ThemedText style={styles.subtitle} type="subtitle">Regístrate para comenzar</ThemedText><ErrorMessage
            error={displayError}
            onDismiss={clearDisplayError}
          />
            <ThemedInput
            label="Nombre de Usuario"
            placeholder="Elige un nombre de usuario"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
            <ThemedInput
            label="Correo Electrónico"
            placeholder="Ingresa tu correo electrónico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Language Selector */}
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Idioma Principal</ThemedText>
            <TouchableOpacity 
              style={styles.languageSelector}
              onPress={() => setShowLanguageModal(true)}
            >
              <ThemedText style={styles.languageSelectorText}>
                {getSelectedLanguageLabel()}
              </ThemedText>
              <ThemedText style={styles.dropdownArrow}>▼</ThemedText>
            </TouchableOpacity>
          </ThemedView>
            <ThemedInput
            label="Contraseña"
            placeholder="Crea una contraseña (mín. 8 caracteres)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <ThemedInput
            label="Confirmar Contraseña"
            placeholder="Confirma tu contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
            <ThemedButton
            title="Crear Cuenta"
            onPress={handleRegister}
            isLoading={isSubmitting}
            style={styles.button}
          />
          
          <ThemedView style={styles.footer}>
            <ThemedText>¿Ya tienes una cuenta? </ThemedText>
            <Link href="/login" style={{ color: tintColor }}>
              <ThemedText type="link">Iniciar Sesión</ThemedText></Link>
          </ThemedView>

          {/* Language Selection Modal */}
          <Modal
            visible={showLanguageModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowLanguageModal(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowLanguageModal(false)}
            >              <ThemedView style={styles.modalContent}>
                <ThemedText style={styles.modalTitle}>Selecciona Idioma Principal</ThemedText>
                <FlatList
                  data={languageOptions}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.languageOption,
                        primaryLanguage === item.value && styles.selectedLanguageOption
                      ]}
                      onPress={() => handleLanguageSelect(item.value)}
                    >
                      <ThemedText 
                        style={[
                          styles.languageOptionText,
                          primaryLanguage === item.value && styles.selectedLanguageOptionText
                        ]}
                      >
                        {item.label}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                />
              </ThemedView>
            </TouchableOpacity>
          </Modal>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },  logo: {
    width: 300,
    height: 300,
    marginBottom: 30,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 30,
    opacity: 0.7,
  },
  button: {
    width: '100%',
    marginTop: 10,
  },
  footer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Language selector styles
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
    color: '#000000',
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    minHeight: 48,
  },  languageSelectorText: {
    fontSize: 16,
    flex: 1,
    color: '#000000',
  },
  dropdownArrow: {
    fontSize: 12,
    opacity: 0.6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedLanguageOption: {
    backgroundColor: '#007AFF',
  },
  languageOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  selectedLanguageOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
