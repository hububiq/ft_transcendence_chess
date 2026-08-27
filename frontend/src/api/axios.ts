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

    if (
      !is_public_route &&
      token &&
      token !== "undefined" &&
      token !== "null"
    ) {
      config.headers.set("Authorization", `Bearer ${token}`);
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
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      //If this is the login route, DO NOT try to refresh the token!
      // Just instantly reject the promise so the Login component gets the real error.
      if (originalRequest.url?.includes("/login/")) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token found");
        }
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_BASE_API_URL}/api/token/refresh/`,
          { refresh: refreshToken },
        );

        const newAccessToken = refreshResponse.data.access;
        localStorage.setItem("access_token", newAccessToken);

        if (refreshResponse.data.refresh) {
          localStorage.setItem("refresh_token", refreshResponse.data.refresh);
        }

        originalRequest.headers.set(
          "Authorization",
          `Bearer ${newAccessToken}`,
        );

        return api(originalRequest);
      } catch (refreshError) {
        console.warn("Refresh token expired or invalid. Logging out...");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
