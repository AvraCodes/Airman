import axios from "axios";

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Auto-detect Vercel multi-service relative path prefix in production
  if (typeof window !== "undefined" && 
      window.location.hostname !== "localhost" && 
      window.location.hostname !== "127.0.0.1") {
    return "/_/backend";
  }
  return "http://127.0.0.1:8000";
};

const BASE_URL = getBaseUrl();

export const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach Bearer token ─────────────────────────────────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — handle 401 globally ────────────────────────────────
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("skynet_user");
      // Redirect to login without reloading React state
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
