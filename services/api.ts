import axios from 'axios';
import { BASE_URL } from '../config/api';

const BASE_URL_AUTH = `${BASE_URL}/api/v1`;
const BASE_URL_USER = `${BASE_URL}/api/v1`;

// Create API instances
const authAPI = axios.create({
  baseURL: BASE_URL_AUTH,
  headers: {
    'Content-Type': 'application/json',
  },
});

const userAPI = axios.create({
  baseURL: BASE_URL_USER,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication services
export const AuthService = {
  login: async (username: string, password: string) => {
    console.log('🔐 LOGIN DEBUG - Intentando login con:');
    console.log('🔐 Username:', username);
    console.log('🔐 Base URL Auth:', BASE_URL_AUTH);
    console.log('🔐 Full URL que se usará:', `${BASE_URL_AUTH}/users/login`);
    
    try {
      const response = await authAPI.post('/users/login', { username, password });
      console.log('✅ LOGIN exitoso - respuesta recibida');
      return response.data;
    } catch (error: any) {
      console.error('❌ LOGIN falló - error:', error.message);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  },
  
  register: async (username: string, email: string, primaryLanguage: string, password: string) => {
    console.log('📝 REGISTER DEBUG - Intentando registro con:');
    console.log('📝 Username:', username);
    console.log('📝 Email:', email);
    console.log('📝 Language:', primaryLanguage);
    console.log('📝 Base URL User:', BASE_URL_USER);
    console.log('📝 Full URL que se usará:', `${BASE_URL_USER}/users/register`);
    
    try {
      const response = await userAPI.post('/users/register', {
        username,
        email,
        primary_language: primaryLanguage,
        password,
      });
      console.log('✅ REGISTER exitoso - respuesta recibida');
      return response.data;
    } catch (error: any) {
      console.error('❌ REGISTER falló - error:', error.message);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  },
};

// Add token to requests
export const setAuthToken = (token: string) => {
  if (token) {
    authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    userAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete authAPI.defaults.headers.common['Authorization'];
    delete userAPI.defaults.headers.common['Authorization'];
  }
};

// User services
export const UserService = {
  getProfile: async (token: string) => {
    const api = createAuthenticatedAPI(token);
    const response = await api.get('/users/profile');
    return response.data;
  },
};

// User API with authentication
export const createAuthenticatedAPI = (token: string) => {
  const api = axios.create({
    baseURL: BASE_URL_USER,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return api;
};

export default { AuthService, UserService, setAuthToken, createAuthenticatedAPI };
