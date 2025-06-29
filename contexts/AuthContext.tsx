import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { AuthService, setAuthToken } from '@/services/api';

// Define the auth state interface
interface AuthState {
  token: string | null;
  isLoading: boolean;
  userId: number | null;
  username: string | null;
}

// Define the auth context interface
interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, primaryLanguage: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    isLoading: true,
    userId: null,
    username: null,
  });
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');
        const username = await AsyncStorage.getItem('username');
        
        if (token && userId && username) {
          // Set token for authenticated requests
          setAuthToken(token);
          
          setAuthState({
            token,
            isLoading: false,
            userId: parseInt(userId),
            username,
          });
        } else {
          setAuthState({
            token: null,
            isLoading: false,
            userId: null,
            username: null,
          });
        }
      } catch (e) {
        console.log('Error loading auth state', e);
        setAuthState({
          token: null,
          isLoading: false,
          userId: null,
          username: null,
        });
      }
    };

    loadToken();
  }, []);

  const login = async (username: string, password: string) => {
    console.log('🔐 AuthContext: Iniciando proceso de login...');
    setError(null); // Limpiar errores previos
    
    try {
      console.log('🔐 AuthContext: Llamando a AuthService.login...');
      const responseData = await AuthService.login(username, password);
      console.log('🔐 AuthContext: Login exitoso, procesando respuesta...');
      
      const { access_token, user_id, username: user_username } = responseData;
      
      // Set token for authenticated requests
      setAuthToken(access_token);
      
      // Save auth data to storage
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('userId', user_id.toString());
      await AsyncStorage.setItem('username', user_username);
      
      // Update state
      setAuthState({
        token: access_token,
        isLoading: false,
        userId: user_id,
        username: user_username,
      });

      console.log('✅ AuthContext: Login completado exitosamente, navegando...');
      // Navigate to home screen
      router.replace('/(tabs)');
    } catch (e: any) {
      console.error('❌ AuthContext: Login falló:', e);
      console.error('❌ Error completo:', e.response?.data || e.message);
      setError(e.response?.data?.detail || 'Failed to login. Please check your credentials.');
    }
  };

  const register = async (username: string, email: string, primaryLanguage: string, password: string) => {
    console.log('📝 AuthContext: Iniciando proceso de registro...');
    setError(null); // Limpiar errores previos
    
    try {
      console.log('📝 AuthContext: Llamando a AuthService.register...');
      await AuthService.register(username, email, primaryLanguage, password);
      console.log('📝 AuthContext: Registro exitoso, iniciando auto-login...');
      
      // Auto login after successful registration
      await login(username, password);
    } catch (e: any) {
      console.error('❌ AuthContext: Registro falló:', e);
      console.error('❌ Error completo:', e.response?.data || e.message);
      setError(e.response?.data?.detail || 'Registration failed. Please try again.');
    }
  };  const logout = async () => {
    console.log('Logout called - limpiando datos de sesión...');
    
    // Clear storage
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('username');
    
    // Clear auth token from API instance
    setAuthToken('');
    
    // Update state
    setAuthState({
      token: null,
      isLoading: false,
      userId: null,
      username: null,
    });
    
    // NO hacer navegación automática - dejar que el componente la controle
    console.log('Estado de autenticación limpiado exitosamente');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ authState, login, register, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
