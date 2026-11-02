import axios from "axios";
import { getSession } from "./session";

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

export default api;