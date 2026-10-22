// src/services/apiClient.js
import axios from 'axios';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081').replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  // Default headers se Content-Type hata diya hai taaki FormData aur JSON dono aaram se handle ho sakein
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;