// src/services/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // Correct: Routes through Vite proxy
  // baseURL: 'http://localhost:8081/api', // Incorrect: Bypasses proxy and triggers Chrome network block
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;