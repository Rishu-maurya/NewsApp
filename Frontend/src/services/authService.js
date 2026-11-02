import { DEFAULT_ROLE, SELECTABLE_ROLES } from "../data/roles";
import api from "./axiosInstance";

const API_URL = import.meta.env.VITE_API_URL;
const SESSION_KEY = 'news_session';
const REGISTERED_KEY = 'demo_registered_users';
const PROFILE_KEY = 'demo_profile_overrides';

export const isDemoMode = false;

function getErrorMessage(err, fallback) {
  if (!err.response) {
    return "Cannot reach the server. Check your connection and try again.";
  }
  return err.response.data?.message || fallback;
}

function getProfileOverrides() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
  } catch {
    return {};
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
    const saved = getProfileOverrides()[cleanEmail] || {};
    return {
      token: 'demo-token',
      user: {
        email: cleanEmail,
        name: saved.name || user.name,
        role: user.role,
        phone: saved.phone ?? user.phone ?? '',
      },
    };
  }
}

export async function register({ name, email, phone = '', password, role }) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();
  const safeRole = SELECTABLE_ROLES.includes(role) ? role : DEFAULT_ROLE;

  if (isDemoMode) {
    await wait();
    if (getDemoUsers()[cleanEmail]) {
      throw new Error('An account with this email already exists. Log in instead.');
    }
    const saved = JSON.parse(localStorage.getItem(REGISTERED_KEY) || '{}');
    saved[cleanEmail] = { name: name.trim(), role: safeRole, password, phone: cleanPhone };
    localStorage.setItem(REGISTERED_KEY, JSON.stringify(saved));
    return { message: 'Account created.' };
  }

  return apiPost(
    '/api/auth/register',
    { name: name.trim(), email: cleanEmail, phone: cleanPhone, password, role: safeRole },
    'Could not create the account. Try again.'
  );
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
  if (isDemoMode) {
    await wait();
    if (token === 'expired') {
      throw new Error('This reset link has expired. Request a new one.');
    }
    return { message: 'Password updated.' };
  }

  return apiPost(
    '/api/auth/reset-password',
    { token, password },
    'This reset link is invalid or has expired. Request a new one.'
  );
}

export async function updateProfile(session, { name, phone }) {
  const cleanName = name.trim();
  const cleanPhone = phone.trim();

  if (isDemoMode) {
    await wait(400);
    const overrides = getProfileOverrides();
    overrides[session.user.email] = { name: cleanName, phone: cleanPhone };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(overrides));
    return { ...session, user: { ...session.user, name: cleanName, phone: cleanPhone } };
  }

  try {
    const { data } = await axios.put(
      `${API_URL}/api/users/profile`,
      { fullName: cleanName, phone: cleanPhone },
      { headers: { Authorization: `Bearer ${session.token}` } }
    );
    const saved = data?.data || {};
    return {
      ...session,
      user: { ...session.user, name: saved.fullName || cleanName, phone: saved.phone ?? cleanPhone },
    };
  } catch (err) {
    const message = err.response
      ? err.response.data?.message || 'Could not update your profile. Try again.'
      : 'Cannot reach the server. Check your connection and try again.';
    throw new Error(message);
  }
}

export function updateStoredSession(session) {
  const value = JSON.stringify(session);
  if (localStorage.getItem(SESSION_KEY)) localStorage.setItem(SESSION_KEY, value);
  if (sessionStorage.getItem(SESSION_KEY)) sessionStorage.setItem(SESSION_KEY, value);
}

export function saveSession(session, remember) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
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
