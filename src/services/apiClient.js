import axios from 'axios';

const apiClient = axios.create({
<<<<<<< HEAD
  baseURL: 'http://localhost:8081', // Root backend URL (without /api)
=======
  baseURL: import.meta.env.VITE_API_BASE_URL,
>>>>>>> 4afdc3a04f572a55a38db1c02ab7722cf0022a81
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;