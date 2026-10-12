import axios from 'axios';

const isServer = typeof window === 'undefined' || import.meta.env?.SSR;

const apiClient = axios.create({
  baseURL: isServer ? 'http://localhost:8081/api' : '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
