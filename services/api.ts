import axios from 'axios';

const BASE_URL_AUTH = 'http://127.0.0.1:8080/api/v1';
const BASE_URL_USER = 'http://127.0.0.1:8080/api/v1';

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
    const response = await authAPI.post('/users/login', { username, password });
    return response.data;
  },
  
  register: async (username: string, email: string, primaryLanguage: string, password: string) => {
    const response = await userAPI.post('/users/register', {
      username,
      email,
      primary_language: primaryLanguage,
      password,
    });
    return response.data;
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

export default { AuthService, setAuthToken, createAuthenticatedAPI };
