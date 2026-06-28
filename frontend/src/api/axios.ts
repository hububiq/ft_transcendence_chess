import axios from "axios";

// base connection
export const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor
// right before ANY request leaves the browse, this function
// intercepts it and slaps the JWT token onto the header automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// No more need to manually type headers: { Authorization: ... } in codebase ever again.
