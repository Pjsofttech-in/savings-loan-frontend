
import axios from 'axios';

const apiClient = axios.create({
<<<<<<< Updated upstream
  baseURL: 'http://localhost:8081',
=======
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081',
>>>>>>> Stashed changes
  headers: {
    'Content-Type': 'application/json',
  },
});

<<<<<<< Updated upstream
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
=======
export default apiClient;
>>>>>>> Stashed changes
