// src/services/apiClient.js
import axios from 'axios';

// Safely detect if running in Node.js (SSR / build time) vs any browser
const isServer = typeof window === 'undefined' || import.meta.env?.SSR;

const apiClient = axios.create({
  // Use relative '/api' in all browsers so it routes through Vite's proxy seamlessly
  baseURL: isServer ? 'http://localhost:8081/api' : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;