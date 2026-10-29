import axios from 'axios';

export {getSession, clearSession} from './session'

const API_URL = import.meta.env.VITE_API_URL || '';

const REGISTERED_KEY = 'demo_registered_users';

const DEMO_USERS = {
  'reader@news.com': { name: 'Riya', role: 'reader', password: 'password123' },
  'journalist@news.com': { name: 'Jay', role: 'journalist', password: 'password123' },
  'editor@news.com': { name: 'Esha', role: 'editor', password: 'password123' },
  'admin@news.com': { name: 'Arun', role: 'admin', password: 'password123' },
};

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

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
    const { data } = await axios.post(`${API_URL.replace(/\/$/, '')}${path}`, body);
    return data;
  } catch (err) {
    const message = err.response
      ? err.response.data?.message || fallbackMessage
      : 'Cannot reach the server. Check your connection and try again.';
    throw new Error(message);
  }
}

function createSession(response) {
  const authData = response?.data ?? response;
  const name = authData?.fullName || authData?.name;
  const role = authData?.role === 'user' ? 'reader' : authData?.role;

  if (!authData?.token || !authData.email || !name || !role) {
    throw new Error('The server returned an invalid authentication response.');
  }

  return {
    token: authData.token,
    user: {
      id: authData._id,
      email: authData.email,
      name,
      role,
    },
  };
}

export async function login({ email, password }) {
  const cleanEmail = email.trim().toLowerCase();

  if (isDemoMode) {
    await wait();
    const user = getDemoUsers()[cleanEmail];
    if (!user || user.password !== password) {
      throw new Error('Incorrect email or password. Check both and try again.');
    }
    return createSession({
      token: 'demo-token',
      email: cleanEmail,
      name: user.name,
      role: user.role,
    });
  }

  const response = await apiPost(
    '/api/auth/login',
    { email: cleanEmail, password },
    'Incorrect email or password. Check both and try again.'
  );
  return createSession(response);
}

export async function register({ name, email, password }) {
  const cleanEmail = email.trim().toLowerCase();

  if (isDemoMode) {
    await wait();
    if (getDemoUsers()[cleanEmail]) {
      throw new Error('An account with this email already exists. Log in instead.');
    }
    const saved = JSON.parse(localStorage.getItem(REGISTERED_KEY) || '{}');
    saved[cleanEmail] = { name: name.trim(), role: 'reader', password };
    localStorage.setItem(REGISTERED_KEY, JSON.stringify(saved));
    return createSession({
      token: 'demo-token',
      email: cleanEmail,
      name: name.trim(),
      role: 'reader',
    });
  }

  const response = await apiPost(
    '/api/auth/register',
    { fullName: name.trim(), email: cleanEmail, password },
    'Could not create the account. Try again.'
  );
  return createSession(response);
}

export async function forgotPassword(email) {
  const cleanEmail = email.trim().toLowerCase();

  if (isDemoMode) {
    await wait();
    return { message: 'Reset link sent.' };
  }

  return apiPost(
    '/api/auth/forgot-password',
    { email: cleanEmail },
    'Could not send the reset link. Try again.'
  );
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

export function saveSession(session, remember) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}