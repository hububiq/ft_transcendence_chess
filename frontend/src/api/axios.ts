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

  // console.log(`[Axios] Requesting: ${config.url}`);
  // console.log(`[Axios] Token in storage:`, token ? "YES" : "NO");

  if (config.url) {
    const is_public_route = public_endpoints.some((endpoint) =>
      config.url?.includes(endpoint),
    );

    // console.log(`[Axios] Is public route:`, is_public_route);

    if (
      !is_public_route &&
      token &&
      token !== "undefined" &&
      token !== "null"
    ) {
      config.headers.set("Authorization", `Bearer ${token}`);
      // console.log(`[Axios] Attached Bearer token successfully!`);
    } else if (!is_public_route) {
      console.error(
        `[Axios] FAILED TO ATTACH: Route requires token, but token is invalid or missing.`,
      );
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Token expired or invalid. Logging out...");
      localStorage.removeItem("access_token");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
