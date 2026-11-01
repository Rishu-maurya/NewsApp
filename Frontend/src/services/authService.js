 feature/prema-publisher
import axios from 'axios';
import { DEFAULT_ROLE, SELECTABLE_ROLES } from '../data/roles';

const API_URL = import.meta.env.VITE_API_URL;
const SESSION_KEY = 'news_session';
const REGISTERED_KEY = 'demo_registered_users';

import api from "./axiosInstance";

export { saveSession, getSession, clearSession } from "./session";
 main

export const isDemoMode = false;

 feature/prema-publisher
export const isDemoMode = !API_URL;

const wait = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

function getDemoUsers() {
  try {
    const saved = JSON.parse(localStorage.getItem(REGISTERED_KEY) || '{}');
    return { ...DEMO_USERS, ...saved };
  } catch {
    return { ...DEMO_USERS };
  }
}

async function apiPost(path, body, fallbackMessage) {
  try {
    const { data } = await axios.post(`${API_URL}${path}`, body);
    return data;
  } catch (err) {
    const message = err.response
      ? err.response.data?.message || fallbackMessage
      : 'Cannot reach the server. Check your connection and try again.';
    throw new Error(message);
  }
}

export async function login({ email, password }) {
  const cleanEmail = email.trim().toLowerCase();

  if (isDemoMode) {
    await wait();
    const user = getDemoUsers()[cleanEmail];
    if (!user || user.password !== password) {
      throw new Error('Incorrect email or password. Check both and try again.');
    }
    return { token: 'demo-token', user: { email: cleanEmail, name: user.name, role: user.role } };
  }

  return apiPost(
    '/api/auth/login',
    { email: cleanEmail, password },
    'Incorrect email or password. Check both and try again.'
  );
}

export async function register({ name, email, password, role }) {
  const cleanEmail = email.trim().toLowerCase();
  const safeRole = SELECTABLE_ROLES.includes(role) ? role : DEFAULT_ROLE;

  if (isDemoMode) {
    await wait();
    if (getDemoUsers()[cleanEmail]) {
      throw new Error('An account with this email already exists. Log in instead.');
    }
    const saved = JSON.parse(localStorage.getItem(REGISTERED_KEY) || '{}');
    saved[cleanEmail] = { name: name.trim(), role: safeRole, password };
    localStorage.setItem(REGISTERED_KEY, JSON.stringify(saved));
    return { message: 'Account created.' };
  }

  return apiPost(
    '/api/auth/register',
    { name: name.trim(), email: cleanEmail, password, role: safeRole },
    'Could not create the account. Try again.'
  );
=======
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
 main
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