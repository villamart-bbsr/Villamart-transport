import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
