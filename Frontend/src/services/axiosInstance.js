import axios from "axios";
import { clearSession, getSession } from "./session";

const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

const api = axios.create({
  baseURL: apiUrl ? `${apiUrl}/api` : "/api",
});

api.interceptors.request.use((config) => {
  const session = getSession();
  if (session?.token) {
    config.headers.authorization = `Bearer ${session.token}`;
  }
  return config;
});

// A 401 on a request that carried a token means the session expired or the
// user was removed. Clear it and tell the app so it can show the login page.
// (A wrong password at login is also 401, but that request has no token.)
export const SESSION_EXPIRED_EVENT = "news:session-expired";

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = Boolean(error.config?.headers?.authorization);
    if (error.response?.status === 401 && sentToken) {
      clearSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default api;