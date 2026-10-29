import axios from "axios";
import { getSession } from "./session";

const api = axios.create({
    baseURL:`${import.meta.env.VITE_API_URL}/api`
})

api.interceptors.request.use((config) => {
    const session = getSession()
    if (session?.token) {
        config.headers.authorization = 'Bearer ${session.token}'
    }
    return config;
})

export default api;