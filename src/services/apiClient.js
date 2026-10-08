import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "") || "";

const apiClient = axios.create({
  ...(API_BASE_URL ? { baseURL: API_BASE_URL } : {}),
});

export default apiClient;
