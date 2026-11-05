import api from "./axiosInstance";
import { clearSession, getSession, saveSession } from "./session";

export { clearSession, getSession, saveSession };

const SESSION_KEY = "news_session";

export const isDemoMode = false;

function getErrorMessage(err, fallback) {
  if (err?.response) {
    return err.response.data?.message || fallback;
  }
  if (err?.isAxiosError) {
    return "Cannot reach the server. Check your connection and try again.";
  }
  return err?.message || fallback;
}

function createSession(response) {
  const data = response.data?.data;
  if (!data?.token || !data?._id) {
    throw new Error("The server returned an invalid authentication response.");
  }

  return {
    token: data.token,
    user: {
      id: data._id,
      email: data.email,
      name: data.fullName,
      phone: data.phone || "",
      role: data.role === "user" ? "reader" : data.role,
    },
  };
}

export async function login({ email, password }) {
  try {
    const response = await api.post("/auth/login", {
      email: email.trim().toLowerCase(),
      password,
    });
    return createSession(response);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Incorrect email or password."));
  }
}

export async function register({ name, email, phone = "", password, role = "reader"}) {
  const body = {
    fullName: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role,
  };
  if (phone.trim()) body.phone = phone.trim();

  try {
    const response = await api.post("/auth/register", body);
    return response.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not create the account. Try again."));
  }
}

export async function forgotPassword(email) {
  try {
    const response = await api.post("/auth/forgot-password", {
      email: email.trim().toLowerCase(),
    });
    return response.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not send the reset link. Try again."));
  }
}

export async function resetPassword(token, password) {
  try {
    const response = await api.post("/auth/reset-password", { token, password });
    return response.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "This reset link is invalid or has expired."));
  }
}

export async function updateProfile(session, { name, phone }) {
  try {
    const response = await api.put("/users/profile", {
      fullName: name.trim(),
      phone: phone.trim(),
    });
    const saved = response.data?.data || {};
    return {
      ...session,
      user: {
        ...session.user,
        name: saved.fullName || name.trim(),
        phone: saved.phone || "",
      },
    };
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not update your profile. Try again."));
  }
}

export function updateStoredSession(session) {
  const value = JSON.stringify(session);
  if (localStorage.getItem(SESSION_KEY)) localStorage.setItem(SESSION_KEY, value);
  if (sessionStorage.getItem(SESSION_KEY)) sessionStorage.setItem(SESSION_KEY, value);
}

export async function getMe() {
  const response = await api.get("/auth/me");
  const user = response.data?.data;
  return {
    ...user,
    id: user._id,
    name: user.fullName,
    role: user.role === "user" ? "reader" : user.role,
  };
}
