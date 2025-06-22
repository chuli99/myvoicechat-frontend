import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedButton } from '@/components/ThemedButton';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);  const [formError, setFormError] = useState<string | null>(null);
  const { login, error, clearError } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  const validateForm = () => {
    if (!username.trim()) {
      setFormError('Username is required');
      return false;
    }
    
    if (!password) {
      setFormError('Password is required');
      return false;
    }
    
    setFormError(null);
    return true;
  };
  
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
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
        <Stack.Screen options={{ title: 'Login', headerShown: false }} />
        <ThemedView style={styles.container}>          <Image 
            source={require('../img/icons/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          
          <ErrorMessage
            error={displayError}
            onDismiss={clearDisplayError}
          />
          
          <ThemedInput
            label="Nombre de usuario"
            placeholder="Ingrese nombre de usuario"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
          />
          
          <ThemedInput
            label="Contraseña"
            placeholder="Ingrese contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          
          <ThemedButton
            title="Iniciar sesión"
            onPress={handleLogin}
            isLoading={isSubmitting}
            style={styles.button}
          />
          
          <ThemedView style={styles.footer}>
            <ThemedText>No tienes cuenta?  </ThemedText>
            <Link href="/register" style={{ color: tintColor }}>
              <ThemedText type="link">Registrarse</ThemedText>
            </Link>
          </ThemedView>
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
    marginBottom: 40,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 30,
    opacity: 0.7,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
