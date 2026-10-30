import api from "./axiosInstance";

export { saveSession, getSession, clearSession } from "./session";

export const isDemoMode = false;

function getErrorMessage(err, fallback) {
  if (!err.response) return "Cannot reach the server. Check your connection and try again.";
  return err.response.data?.message || fallback;
}

function createSession(response) {
  const data = response.data.data;
  return {
    token: data.token,
    user: {
      id: data._id,
      email: data.email,
      name: data.fullName,
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

export async function register({ name, email, password }) {
  try {
    const response = await api.post("/auth/register", {
      fullName: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    return createSession(response);
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

export async function getMe() {
  const response = await api.get("/auth/me");
  return response.data.data;
}