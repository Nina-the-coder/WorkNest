import axios from "axios";
import { clearStoredSession, readToken } from "../modules/auth/auth.session";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = readToken();
    if (token && !config.skipAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    const requestToken = error.config?.headers?.Authorization;
    if (status === 401 && !error.config?.skipAuth &&
        requestToken && requestToken === `Bearer ${readToken()}`) {
      // React guards redirect to the existing '/' login route. An old request
      // cannot sign out a newer session; 403 errors remain with the caller.
      clearStoredSession();
    }

    return Promise.reject(error);
  }
);

export default api;
