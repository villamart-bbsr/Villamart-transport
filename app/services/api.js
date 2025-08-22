import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL configuration - switch between localhost and production
const isDevelopment = __DEV__; // Expo's development flag
// const LOCALHOST_URL = 'http://10.175.241.226:5000/api'; // Your local IP
const PRODUCTION_URL = 'https://villamart-transport.onrender.com/api'; // Render URL

const BASE_URL = PRODUCTION_URL; // Always use production URL since localhost is commented out

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Add token to requests automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  userLogin: (name) => api.post('/auth/user', { name }),
  adminLogin: (key) => api.post('/auth/admin', { key }),
};

// Entry services
export const entryService = {
  createEntry: (entryData) => api.post('/entries', entryData),
  getEntries: (filters) => api.get('/entries', { params: filters }),
};
