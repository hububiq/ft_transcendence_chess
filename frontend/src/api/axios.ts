import axios from "axios";

// base connection
export const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});