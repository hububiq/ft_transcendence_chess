export async function customFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const baseUrl = import.meta.env.VITE_BASE_API_URL;
  const token = localStorage.getItem("access_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const finalConfig: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> || {}),
    },
  };

  const response = await fetch(`${baseUrl}/${endpoint}`, finalConfig);

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/"; 
  }

  return response;
}