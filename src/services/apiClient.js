// src/services/apiClient.js
import axios from 'axios';

// In production, relative URLs work through the same-origin reverse proxy (recommended).
// A separate API deployment can be configured with VITE_API_BASE_URL.
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  // Default headers se Content-Type hata diya hai taaki FormData aur JSON dono aaram se handle ho sakein
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
