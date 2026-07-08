import axios from "axios";

// Base connection
export const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  const public_endpoints = ["/register/", "/login/"];

  if (config.url) {
    const is_public_route = public_endpoints.some((endpoint) =>
      config.url?.includes(endpoint),
    );

    if (!is_public_route && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
